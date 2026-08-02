import crypto from "node:crypto";

import QRCode from "qrcode";

import {
  Types
} from "mongoose";

import {
  CampModel
} from "../models/camp.model.js";

import {
  InvoiceModel
} from "../models/invoice.model.js";

import {
  ProductModel
} from "../models/product.model.js";

import {
  SchoolModel
} from "../models/school.model.js";

import type {
  CreateCampInput,
  PublicCampOrderInput,
  UpdateCampInput
} from "../schemas/camp.schema.js";

import type {
  CampStatus
} from "../types/camp.types.js";

import {
  createInvoice
} from "./invoice.service.js";

interface GetCampsOptions {
  schoolId?: string;
  search?: string;
  status?: CampStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

interface PreparedCampVariant {
  variantId: Types.ObjectId;
  size: string;
  sku: string;
}

interface PreparedCampProduct {
  productId: Types.ObjectId;
  productName: string;
  productCode: string;
  gender:
    | "MALE"
    | "FEMALE"
    | "UNISEX";

  variants:
    PreparedCampVariant[];
}

function parseStartDate(
  value: string
): Date {
  const date = new Date(
    `${value}T00:00:00.000`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "Invalid From date."
    );
  }

  return date;
}

function parseEndDate(
  value: string
): Date {
  const date = new Date(
    `${value}T23:59:59.999`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "Invalid To date."
    );
  }

  return date;
}

function validateObjectId(
  value: string,
  fieldName: string
): void {
  if (
    !Types.ObjectId.isValid(
      value
    )
  ) {
    throw new Error(
      `Invalid ${fieldName}.`
    );
  }
}

function createPublicToken(): string {
  return crypto
    .randomBytes(32)
    .toString("hex");
}

function normalizeCampCode(
  value: string
): string {
  return value
    .trim()
    .toUpperCase()
    .replace(
      /[^A-Z0-9-]/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function getFrontendUrl(): string {
  const frontendUrl =
    process.env.FRONTEND_URL ??
    "http://localhost:5173";

  return frontendUrl.replace(
    /\/+$/,
    ""
  );
}

function getCampPublicUrl(
  publicToken: string
): string {
  return (
    `${getFrontendUrl()}/camp/` +
    encodeURIComponent(
      publicToken
    )
  );
}

function validateCampDates(
  startDate: Date,
  endDate: Date
): void {
  if (
    Number.isNaN(
      startDate.getTime()
    ) ||
    Number.isNaN(
      endDate.getTime()
    )
  ) {
    throw new Error(
      "Invalid camp dates."
    );
  }

  if (
    endDate < startDate
  ) {
    throw new Error(
      "Camp end date cannot be before the start date."
    );
  }
}

async function getActiveSchool(
  schoolId: string
) {
  validateObjectId(
    schoolId,
    "school ID"
  );

  const school =
    await SchoolModel.findById(
      schoolId
    );

  if (!school) {
    throw new Error(
      "School not found."
    );
  }

  if (
    school.status !== "ACTIVE"
  ) {
    throw new Error(
      "Camp cannot be created for an inactive school."
    );
  }

  return school;
}

async function prepareCampProducts(
  schoolId: string,
  inputProducts:
    CreateCampInput["products"]
): Promise<
  PreparedCampProduct[]
> {
  const preparedProducts:
    PreparedCampProduct[] = [];

  for (
    const inputProduct of
    inputProducts
  ) {
    validateObjectId(
      inputProduct.productId,
      "product ID"
    );

    const product =
      await ProductModel.findOne({
        _id:
          inputProduct.productId,

        schoolId,

        status: "ACTIVE"
      });

    if (!product) {
      throw new Error(
        "A selected product is inactive, invalid or does not belong to the selected school."
      );
    }

    const preparedVariants:
      PreparedCampVariant[] = [];

    for (
      const inputVariant of
      inputProduct.variants
    ) {
      validateObjectId(
        inputVariant.variantId,
        "product size ID"
      );

      const variant =
        product.variants.find(
          (currentVariant) =>
            currentVariant._id
              .toString() ===
            inputVariant.variantId
        );

      if (!variant) {
        throw new Error(
          `A selected size was not found for ${product.productName}.`
        );
      }

      if (
        variant.status !==
        "ACTIVE"
      ) {
        throw new Error(
          `${product.productName}, size ${variant.size}, is inactive.`
        );
      }

      preparedVariants.push({
        variantId:
          variant._id,

        size:
          variant.size,

        sku:
          variant.sku
      });
    }

    preparedProducts.push({
      productId:
        product._id,

      productName:
        product.productName,

      productCode:
        product.productCode,

      gender:
        product.gender,

      variants:
        preparedVariants
    });
  }

  return preparedProducts;
}

function ensureCampAcceptsOrders(
  camp: {
    status: CampStatus;
    startDate: Date;
    endDate: Date;
  }
): void {
  if (
    camp.status !== "ACTIVE"
  ) {
    throw new Error(
      "This camp is not currently accepting orders."
    );
  }

  const now =
    new Date();

  const startDate =
    new Date(
      camp.startDate
    );

  startDate.setHours(
    0,
    0,
    0,
    0
  );

  const endDate =
    new Date(
      camp.endDate
    );

  endDate.setHours(
    23,
    59,
    59,
    999
  );

  if (
    now < startDate
  ) {
    throw new Error(
      "This camp has not started yet."
    );
  }

  if (
    now > endDate
  ) {
    throw new Error(
      "This camp has already ended."
    );
  }
}

function validatePublicOrderItems(
  camp: {
    products: Array<{
      productId:
        Types.ObjectId;

      productName: string;

      variants: Array<{
        variantId:
          Types.ObjectId;

        size: string;
      }>;
    }>;
  },
  items:
    PublicCampOrderInput["items"]
): void {
  for (
    const item of items
  ) {
    validateObjectId(
      item.productId,
      "product ID"
    );

    validateObjectId(
      item.variantId,
      "product size ID"
    );

    const campProduct =
      camp.products.find(
        (product) =>
          product.productId
            .toString() ===
          item.productId
      );

    if (!campProduct) {
      throw new Error(
        "A selected product is not available in this camp."
      );
    }

    const campVariant =
      campProduct.variants.find(
        (variant) =>
          variant.variantId
            .toString() ===
          item.variantId
      );

    if (!campVariant) {
      throw new Error(
        `${campProduct.productName}: the selected size is not available in this camp.`
      );
    }
  }
}

async function checkDuplicateCampOrder(
  schoolId:
    Types.ObjectId,
  input:
    PublicCampOrderInput
): Promise<void> {
  const duplicateWindowStart =
    new Date(
      Date.now() -
        5 * 60 * 1000
    );

  const possibleDuplicate =
    await InvoiceModel.findOne({
      schoolId,

      invoiceDate: {
        $gte:
          duplicateWindowStart
      },

      studentName: {
        $regex:
          `^${escapeRegularExpression(
            input.studentName.trim()
          )}$`,

        $options: "i"
      },

      className: {
        $regex:
          `^${escapeRegularExpression(
            input.className.trim()
          )}$`,

        $options: "i"
      },

      contactNumber:
        input.contactNumber.trim(),

      placeOfOrder:
        "SCHOOL_CAMP",

      invoiceStatus: {
        $ne: "CANCELLED"
      }
    });

  if (possibleDuplicate) {
    throw new Error(
      "A similar order was submitted recently. Please check with the camp staff before submitting again."
    );
  }
}

function escapeRegularExpression(
  value: string
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

export async function createCamp(
  input: CreateCampInput
) {
  const school =
    await getActiveSchool(
      input.schoolId
    );

  validateCampDates(
    input.startDate,
    input.endDate
  );

  const campCode =
    normalizeCampCode(
      input.campCode
    );

  if (!campCode) {
    throw new Error(
      "Enter a valid camp code."
    );
  }

  const existingCamp =
    await CampModel.findOne({
      campCode
    });

  if (existingCamp) {
    throw new Error(
      "A camp with this code already exists."
    );
  }

  const preparedProducts =
    await prepareCampProducts(
      input.schoolId,
      input.products
    );

  const publicToken =
    createPublicToken();

  return CampModel.create({
    campName:
      input.campName.trim(),

    campCode,

    schoolId:
      school._id,

    schoolName:
      school.schoolName,

    schoolCode:
      school.schoolCode,

    publicToken,

    startDate:
      input.startDate,

    endDate:
      input.endDate,

    status:
      input.status,

    products:
      preparedProducts,

    instructions:
      input.instructions.trim(),

    orderCount: 0
  });
}

export async function getCamps(
  options:
    GetCampsOptions = {}
) {
  const page = Math.max(
    options.page ?? 1,
    1
  );

  const limit = Math.min(
    Math.max(
      options.limit ?? 10,
      1
    ),
    100
  );

  const filter:
    Record<string, unknown> = {};

  if (options.schoolId) {
    validateObjectId(
      options.schoolId,
      "school ID"
    );

    filter.schoolId =
      new Types.ObjectId(
        options.schoolId
      );
  }

  if (options.status) {
    filter.status =
      options.status;
  }

  if (options.search) {
    filter.$or = [
      {
        campName: {
          $regex:
            options.search,

          $options: "i"
        }
      },
      {
        campCode: {
          $regex:
            options.search,

          $options: "i"
        }
      },
      {
        schoolName: {
          $regex:
            options.search,

          $options: "i"
        }
      }
    ];
  }

  if (
    options.dateFrom ||
    options.dateTo
  ) {
    const startDateFilter: {
      $gte?: Date;
      $lte?: Date;
    } = {};

    if (
      options.dateFrom
    ) {
      startDateFilter.$gte =
        parseStartDate(
          options.dateFrom
        );
    }

    if (
      options.dateTo
    ) {
      startDateFilter.$lte =
        parseEndDate(
          options.dateTo
        );
    }

    filter.startDate =
      startDateFilter;
  }

  const skip =
    (page - 1) * limit;

  const [
    camps,
    total
  ] = await Promise.all([
    CampModel.find(filter)
      .sort({
        createdAt: -1
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    CampModel.countDocuments(
      filter
    )
  ]);

  return {
    camps,

    pagination: {
      page,
      limit,
      total,

      totalPages:
        Math.ceil(
          total / limit
        )
    }
  };
}

export async function getCampById(
  id: string
) {
  validateObjectId(
    id,
    "camp ID"
  );

  const camp =
    await CampModel.findById(
      id
    ).lean();

  if (!camp) {
    throw new Error(
      "Camp not found."
    );
  }

  return camp;
}

export async function updateCamp(
  id: string,
  input: UpdateCampInput
) {
  validateObjectId(
    id,
    "camp ID"
  );

  const camp =
    await CampModel.findById(
      id
    );

  if (!camp) {
    throw new Error(
      "Camp not found."
    );
  }

  if (
    camp.status === "CLOSED"
  ) {
    throw new Error(
      "A closed camp cannot be edited."
    );
  }

  const school =
    await getActiveSchool(
      input.schoolId
    );

  validateCampDates(
    input.startDate,
    input.endDate
  );

  const campCode =
    normalizeCampCode(
      input.campCode
    );

  const duplicateCamp =
    await CampModel.findOne({
      _id: {
        $ne:
          camp._id
      },

      campCode
    });

  if (duplicateCamp) {
    throw new Error(
      "A camp with this code already exists."
    );
  }

  const preparedProducts =
    await prepareCampProducts(
      input.schoolId,
      input.products
    );

  camp.campName =
    input.campName.trim();

  camp.campCode =
    campCode;

  camp.schoolId =
    school._id;

  camp.schoolName =
    school.schoolName;

  camp.schoolCode =
    school.schoolCode;

  camp.startDate =
    input.startDate;

  camp.endDate =
    input.endDate;

  camp.status =
    input.status;

  camp.products =
    preparedProducts as
      typeof camp.products;

  camp.instructions =
    input.instructions.trim();

  await camp.save();

  return camp;
}

export async function activateCamp(
  id: string
) {
  validateObjectId(
    id,
    "camp ID"
  );

  const camp =
    await CampModel.findById(
      id
    );

  if (!camp) {
    throw new Error(
      "Camp not found."
    );
  }

  if (
    camp.status === "CLOSED"
  ) {
    throw new Error(
      "A closed camp cannot be activated."
    );
  }

  if (
    camp.products.length ===
    0
  ) {
    throw new Error(
      "Add at least one product before activating the camp."
    );
  }

  camp.status =
    "ACTIVE";

  await camp.save();

  return camp;
}

export async function closeCamp(
  id: string
) {
  validateObjectId(
    id,
    "camp ID"
  );

  const camp =
    await CampModel.findById(
      id
    );

  if (!camp) {
    throw new Error(
      "Camp not found."
    );
  }

  camp.status =
    "CLOSED";

  await camp.save();

  return camp;
}

export async function deleteCamp(
  id: string
) {
  validateObjectId(
    id,
    "camp ID"
  );

  const camp =
    await CampModel.findById(
      id
    );

  if (!camp) {
    throw new Error(
      "Camp not found."
    );
  }

  if (
    camp.orderCount > 0
  ) {
    throw new Error(
      "A camp with submitted orders cannot be deleted. Close it instead."
    );
  }

  await camp.deleteOne();

  return camp;
}

export async function generateCampQrCode(
  id: string
) {
  const camp =
    await getCampById(id);

  const publicUrl =
    getCampPublicUrl(
      camp.publicToken
    );

  const qrCodeDataUrl =
    await QRCode.toDataURL(
      publicUrl,
      {
        errorCorrectionLevel:
          "H",

        margin: 2,

        width: 800
      }
    );

  return {
    campId:
      camp._id,

    campName:
      camp.campName,

    campCode:
      camp.campCode,

    publicUrl,

    qrCodeDataUrl
  };
}

export async function getPublicCamp(
  token: string
) {
  const camp =
    await CampModel.findOne({
      publicToken:
        token.trim()
    }).lean();

  if (!camp) {
    throw new Error(
      "Camp link is invalid."
    );
  }

  ensureCampAcceptsOrders(
    camp
  );

  return {
    campName:
      camp.campName,

    campCode:
      camp.campCode,

    schoolName:
      camp.schoolName,

    schoolCode:
      camp.schoolCode,

    startDate:
      camp.startDate,

    endDate:
      camp.endDate,

    instructions:
      camp.instructions,

    products:
      camp.products.map(
        (product) => ({
          productId:
            product.productId,

          productName:
            product.productName,

          productCode:
            product.productCode,

          gender:
            product.gender,

          variants:
            product.variants.map(
              (variant) => ({
                variantId:
                  variant.variantId,

                size:
                  variant.size,

                sku:
                  variant.sku
              })
            )
        })
      )
  };
}

export async function submitPublicCampOrder(
  token: string,
  input:
    PublicCampOrderInput
) {
  const camp =
    await CampModel.findOne({
      publicToken:
        token.trim()
    });

  if (!camp) {
    throw new Error(
      "Camp link is invalid."
    );
  }

  ensureCampAcceptsOrders(
    camp
  );

  validatePublicOrderItems(
    camp,
    input.items
  );

  await checkDuplicateCampOrder(
    camp.schoolId,
    input
  );

  const invoice =
    await createInvoice({
      schoolId:
        camp.schoolId
          .toString(),

      studentName:
        input.studentName.trim(),

      className:
        input.className.trim(),

      section:
        input.section.trim(),

      parentName:
        input.parentName.trim(),

      contactNumber:
        input.contactNumber.trim(),

      email:
        input.email.trim(),

      placeOfOrder:
        "SCHOOL_CAMP",

      specializedStoreName:
        "",

      paymentMode:
        "CASH",

      paymentReference:
        "",

      paymentStatus:
        "PENDING",

      paidAmount:
        0,

      invoiceStatus:
        "COMPLETED",

      items:
        input.items.map(
          (item) => ({
            productId:
              item.productId,

            variantId:
              item.variantId,

            quantity:
              item.quantity
          })
        ),

      remarks:
        input.remarks.trim()
          ? `Camp: ${camp.campName}\n${input.remarks.trim()}`
          : `Camp: ${camp.campName}`
    });

  camp.orderCount += 1;

  await camp.save();

  return {
    invoiceId:
      invoice._id,

    invoiceNumber:
      invoice.invoiceNumber,

    studentName:
      invoice.studentName,

    schoolName:
      invoice.schoolName,

    grandTotal:
      invoice.grandTotal,

    paymentStatus:
      invoice.paymentStatus
  };
}