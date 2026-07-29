import { Types } from "mongoose";

import { InvoiceModel } from "../models/invoice.model.js";
import { ProductModel } from "../models/product.model.js";
import { SchoolModel } from "../models/school.model.js";

import type {
  CreateInvoiceInput,
  UpdateInvoiceInput
} from "../schemas/invoice.schema.js";

import type {
  FulfilmentStatus
} from "../types/orderTracking.types.js";

import {
  calculateRoundOff,
  getFinancialYear,
  roundCurrency
} from "../utils/invoice.util.js";

import {
  generateInvoiceNumber
} from "./invoiceNumber.service.js";

interface PreparedInvoiceItem {
  productId: Types.ObjectId;
  variantId: Types.ObjectId;

  productName: string;
  productCode: string;
  sku: string;

  gender: "MALE" | "FEMALE" | "UNISEX";
  size: string;

  quantity: number;

  unitPrice: number;
  gstPercentage: number;

  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;

  deliveredQuantity: number;
  pendingQuantity: number;

  fulfilmentStatus: FulfilmentStatus;

  pendingReason: string;
  pendingReasonRemarks: string;
}

interface InvoiceTotals {
  taxableAmount: number;
  totalGstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff: number;
  grandTotal: number;
}

interface InvoiceQuantitySummary {
  totalOrderedQuantity: number;
  totalDeliveredQuantity: number;
  totalPendingQuantity: number;
  fulfilmentStatus: FulfilmentStatus;
}

type InvoiceListStatus =
  | "DRAFT"
  | "COMPLETED"
  | "CANCELLED";

type PaymentListStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID";

interface GetInvoicesOptions {
  schoolId?: string;
  search?: string;
  invoiceStatus?: InvoiceListStatus;
  paymentStatus?: PaymentListStatus;
  fulfilmentStatus?: FulfilmentStatus;
  placeOfOrder?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

function calculateItemFulfilmentStatus(
  orderedQuantity: number,
  deliveredQuantity: number
): FulfilmentStatus {
  if (deliveredQuantity <= 0) {
    return "NOT_COMPLETED";
  }

  if (deliveredQuantity >= orderedQuantity) {
    return "COMPLETELY_DELIVERED";
  }

  return "PARTIALLY_COMPLETED";
}

function calculateInvoiceFulfilmentStatus(
  orderedQuantity: number,
  deliveredQuantity: number
): FulfilmentStatus {
  if (deliveredQuantity <= 0) {
    return "NOT_COMPLETED";
  }

  if (deliveredQuantity >= orderedQuantity) {
    return "COMPLETELY_DELIVERED";
  }

  return "PARTIALLY_COMPLETED";
}

function calculateInvoiceQuantitySummary(
  items: PreparedInvoiceItem[]
): InvoiceQuantitySummary {
  const totalOrderedQuantity = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalDeliveredQuantity = items.reduce(
    (total, item) =>
      total + item.deliveredQuantity,
    0
  );

  const totalPendingQuantity =
    totalOrderedQuantity -
    totalDeliveredQuantity;

  const fulfilmentStatus =
    calculateInvoiceFulfilmentStatus(
      totalOrderedQuantity,
      totalDeliveredQuantity
    );

  return {
    totalOrderedQuantity,
    totalDeliveredQuantity,
    totalPendingQuantity,
    fulfilmentStatus
  };
}

function calculateInvoiceTotals(
  preparedItems: PreparedInvoiceItem[]
): InvoiceTotals {
  const taxableAmount = roundCurrency(
    preparedItems.reduce(
      (sum, item) =>
        sum + item.taxableAmount,
      0
    )
  );

  const totalGstAmount = roundCurrency(
    preparedItems.reduce(
      (sum, item) =>
        sum + item.gstAmount,
      0
    )
  );

  const unroundedGrandTotal =
    roundCurrency(
      taxableAmount +
        totalGstAmount
    );

  const {
    roundedTotal,
    roundOff
  } = calculateRoundOff(
    unroundedGrandTotal
  );

  const cgstAmount = roundCurrency(
    totalGstAmount / 2
  );

  const sgstAmount = roundCurrency(
    totalGstAmount -
      cgstAmount
  );

  return {
    taxableAmount,
    totalGstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount: 0,
    roundOff,
    grandTotal: roundedTotal
  };
}

function determinePaymentStatus(
  paidAmount: number,
  grandTotal: number
): PaymentListStatus {
  if (paidAmount <= 0) {
    return "PENDING";
  }

  if (paidAmount < grandTotal) {
    return "PARTIALLY_PAID";
  }

  return "PAID";
}

function validateSpecializedStore(
  placeOfOrder: string,
  specializedStoreName: string
): void {
  if (
    placeOfOrder ===
      "SPECIALIZED_SCHOOL_STORE" &&
    specializedStoreName.trim().length === 0
  ) {
    throw new Error(
      "Specialized school store name is required."
    );
  }
}

async function prepareInvoiceItems(
  input: Pick<
    CreateInvoiceInput,
    "schoolId" | "items"
  >
): Promise<PreparedInvoiceItem[]> {
  const preparedItems: PreparedInvoiceItem[] =
    [];

  for (const item of input.items) {
    if (
      !Types.ObjectId.isValid(
        item.productId
      )
    ) {
      throw new Error(
        "Invalid product ID."
      );
    }

    if (
      !Types.ObjectId.isValid(
        item.variantId
      )
    ) {
      throw new Error(
        "Invalid product variant ID."
      );
    }

    const product =
      await ProductModel.findOne({
        _id: item.productId,
        schoolId: input.schoolId,
        status: "ACTIVE"
      });

    if (!product) {
      throw new Error(
        "The selected product does not belong to the selected school or is inactive."
      );
    }

    const variant =
      product.variants.find(
        (currentVariant) =>
          currentVariant._id.toString() ===
          item.variantId
      );

    if (!variant) {
      throw new Error(
        `The selected size was not found for ${product.productName}.`
      );
    }

    if (
      variant.status !== "ACTIVE"
    ) {
      throw new Error(
        `${product.productName}, size ${variant.size}, is inactive.`
      );
    }

    const taxableAmount =
      roundCurrency(
        variant.unitPrice *
          item.quantity
      );

    const gstAmount =
      roundCurrency(
        taxableAmount *
          (variant.gstPercentage /
            100)
      );

    const totalAmount =
      roundCurrency(
        taxableAmount +
          gstAmount
      );

    preparedItems.push({
      productId: product._id,
      variantId: variant._id,

      productName:
        product.productName,

      productCode:
        product.productCode,

      sku: variant.sku,

      gender: product.gender,
      size: variant.size,

      quantity: item.quantity,

      unitPrice:
        variant.unitPrice,

      gstPercentage:
        variant.gstPercentage,

      taxableAmount,
      gstAmount,
      totalAmount,

      deliveredQuantity: 0,
      pendingQuantity:
        item.quantity,

      fulfilmentStatus:
        "NOT_COMPLETED",

      pendingReason: "",
      pendingReasonRemarks: ""
    });
  }

  return preparedItems;
}

function preserveTrackingDuringEdit(
  preparedItems: PreparedInvoiceItem[],
  existingItems: Array<{
    productId: Types.ObjectId;
    variantId: Types.ObjectId;
    quantity: number;
    deliveredQuantity?: number;
    pendingQuantity?: number;
    fulfilmentStatus?: FulfilmentStatus;
    pendingReason?: string;
    pendingReasonRemarks?: string;
    productName: string;
    size: string;
  }>
): void {
  const existingItemMap =
    new Map(
      existingItems.map((item) => [
        `${item.productId.toString()}-${item.variantId.toString()}`,
        item
      ])
    );

  for (
    const preparedItem of preparedItems
  ) {
    const key =
      `${preparedItem.productId.toString()}-` +
      preparedItem.variantId.toString();

    const existingItem =
      existingItemMap.get(key);

    if (!existingItem) {
      continue;
    }

    const deliveredQuantity =
      existingItem.deliveredQuantity ??
      0;

    if (
      preparedItem.quantity <
      deliveredQuantity
    ) {
      throw new Error(
        `${preparedItem.productName}, size ${preparedItem.size}: ordered quantity cannot be less than the already delivered quantity.`
      );
    }

    preparedItem.deliveredQuantity =
      deliveredQuantity;

    preparedItem.pendingQuantity =
      preparedItem.quantity -
      deliveredQuantity;

    preparedItem.fulfilmentStatus =
      calculateItemFulfilmentStatus(
        preparedItem.quantity,
        deliveredQuantity
      );

    preparedItem.pendingReason =
      preparedItem.pendingQuantity > 0
        ? existingItem.pendingReason ??
          ""
        : "";

    preparedItem.pendingReasonRemarks =
      preparedItem.pendingQuantity > 0
        ? existingItem.pendingReasonRemarks ??
          ""
        : "";
  }
}

export async function createInvoice(
  input: CreateInvoiceInput
) {
  if (
    !Types.ObjectId.isValid(
      input.schoolId
    )
  ) {
    throw new Error(
      "Invalid school ID."
    );
  }

  validateSpecializedStore(
    input.placeOfOrder,
    input.specializedStoreName
  );

  const school =
    await SchoolModel.findById(
      input.schoolId
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
      "An invoice cannot be created for an inactive school."
    );
  }

  const preparedItems =
    await prepareInvoiceItems({
      schoolId: input.schoolId,
      items: input.items
    });

  const totals =
    calculateInvoiceTotals(
      preparedItems
    );

  const quantitySummary =
    calculateInvoiceQuantitySummary(
      preparedItems
    );

  if (
    input.paidAmount >
    totals.grandTotal
  ) {
    throw new Error(
      "Paid amount cannot exceed the invoice total."
    );
  }

  const paymentStatus =
    determinePaymentStatus(
      input.paidAmount,
      totals.grandTotal
    );

  const invoiceDate =
    new Date();

  const financialYear =
    getFinancialYear(
      invoiceDate
    );

  const invoiceNumber =
    await generateInvoiceNumber(
      school._id,
      school.schoolCode,
      financialYear
    );

  return InvoiceModel.create({
    invoiceNumber,
    financialYear,

    schoolId: school._id,
    schoolName:
      school.schoolName,
    schoolCode:
      school.schoolCode,

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

    invoiceDate,

    placeOfOrder:
      input.placeOfOrder,

    specializedStoreName:
      input.placeOfOrder ===
      "SPECIALIZED_SCHOOL_STORE"
        ? input.specializedStoreName.trim()
        : "",

    paymentMode:
      input.paymentMode,

    paymentReference:
      input.paymentReference.trim(),

    paymentStatus,
    paidAmount:
      input.paidAmount,

    invoiceStatus:
      input.invoiceStatus,

    items: preparedItems,

    taxableAmount:
      totals.taxableAmount,

    cgstAmount:
      totals.cgstAmount,

    sgstAmount:
      totals.sgstAmount,

    igstAmount:
      totals.igstAmount,

    totalGstAmount:
      totals.totalGstAmount,

    roundOff:
      totals.roundOff,

    grandTotal:
      totals.grandTotal,

    fulfilmentStatus:
      quantitySummary.fulfilmentStatus,

    totalOrderedQuantity:
      quantitySummary.totalOrderedQuantity,

    totalDeliveredQuantity:
      quantitySummary.totalDeliveredQuantity,

    totalPendingQuantity:
      quantitySummary.totalPendingQuantity,

    distributionHistory: [],

    remarks:
      input.remarks.trim()
  });
}

export async function updateInvoice(
  id: string,
  input: UpdateInvoiceInput
) {
  if (
    !Types.ObjectId.isValid(id)
  ) {
    throw new Error(
      "Invalid invoice ID."
    );
  }

  if (
    !Types.ObjectId.isValid(
      input.schoolId
    )
  ) {
    throw new Error(
      "Invalid school ID."
    );
  }

  validateSpecializedStore(
    input.placeOfOrder,
    input.specializedStoreName
  );

  const invoice =
    await InvoiceModel.findById(id);

  if (!invoice) {
    throw new Error(
      "Invoice not found."
    );
  }

  if (
    invoice.invoiceStatus ===
    "CANCELLED"
  ) {
    throw new Error(
      "A cancelled invoice cannot be edited."
    );
  }

  const school =
    await SchoolModel.findById(
      input.schoolId
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
      "The selected school is inactive."
    );
  }

  const preparedItems =
    await prepareInvoiceItems({
      schoolId: input.schoolId,
      items: input.items
    });

  preserveTrackingDuringEdit(
    preparedItems,
    invoice.items
  );

  const totals =
    calculateInvoiceTotals(
      preparedItems
    );

  const quantitySummary =
    calculateInvoiceQuantitySummary(
      preparedItems
    );

  if (
    input.paidAmount >
    totals.grandTotal
  ) {
    throw new Error(
      "Paid amount cannot exceed the invoice total."
    );
  }

  const paymentStatus =
    determinePaymentStatus(
      input.paidAmount,
      totals.grandTotal
    );

  invoice.schoolId =
    school._id;

  invoice.schoolName =
    school.schoolName;

  invoice.schoolCode =
    school.schoolCode;

  invoice.studentName =
    input.studentName.trim();

  invoice.className =
    input.className.trim();

  invoice.section =
    input.section.trim();

  invoice.parentName =
    input.parentName.trim();

  invoice.contactNumber =
    input.contactNumber.trim();

  invoice.email =
    input.email.trim();

  invoice.placeOfOrder =
    input.placeOfOrder;

  invoice.specializedStoreName =
    input.placeOfOrder ===
    "SPECIALIZED_SCHOOL_STORE"
      ? input.specializedStoreName.trim()
      : "";

  invoice.paymentMode =
    input.paymentMode;

  invoice.paymentReference =
    input.paymentReference.trim();

  invoice.paidAmount =
    input.paidAmount;

  invoice.paymentStatus =
    paymentStatus;

  if (input.invoiceStatus) {
    invoice.invoiceStatus =
      input.invoiceStatus;
  }

  invoice.items =
    preparedItems as typeof invoice.items;

  invoice.taxableAmount =
    totals.taxableAmount;

  invoice.cgstAmount =
    totals.cgstAmount;

  invoice.sgstAmount =
    totals.sgstAmount;

  invoice.igstAmount =
    totals.igstAmount;

  invoice.totalGstAmount =
    totals.totalGstAmount;

  invoice.roundOff =
    totals.roundOff;

  invoice.grandTotal =
    totals.grandTotal;

  invoice.totalOrderedQuantity =
    quantitySummary.totalOrderedQuantity;

  invoice.totalDeliveredQuantity =
    quantitySummary.totalDeliveredQuantity;

  invoice.totalPendingQuantity =
    quantitySummary.totalPendingQuantity;

  invoice.fulfilmentStatus =
    quantitySummary.fulfilmentStatus;

  invoice.remarks =
    input.remarks.trim();

  await invoice.save();

  return invoice;
}

export async function getInvoices(
  options: GetInvoicesOptions
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

  const skip =
    (page - 1) * limit;

  const filter: Record<
    string,
    unknown
  > = {};

  if (options.schoolId) {
    if (
      !Types.ObjectId.isValid(
        options.schoolId
      )
    ) {
      throw new Error(
        "Invalid school ID."
      );
    }

    filter.schoolId =
      options.schoolId;
  }

  if (
    options.invoiceStatus
  ) {
    filter.invoiceStatus =
      options.invoiceStatus;
  }

  if (
    options.paymentStatus
  ) {
    filter.paymentStatus =
      options.paymentStatus;
  }

  if (
    options.fulfilmentStatus
  ) {
    filter.fulfilmentStatus =
      options.fulfilmentStatus;
  }

  if (
    options.placeOfOrder
  ) {
    filter.placeOfOrder =
      options.placeOfOrder;
  }

  if (options.search) {
    filter.$or = [
      {
        invoiceNumber: {
          $regex:
            options.search,
          $options: "i"
        }
      },
      {
        studentName: {
          $regex:
            options.search,
          $options: "i"
        }
      },
      {
        parentName: {
          $regex:
            options.search,
          $options: "i"
        }
      },
      {
        className: {
          $regex:
            options.search,
          $options: "i"
        }
      },
      {
        contactNumber: {
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
      },
      {
        schoolCode: {
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
    const invoiceDateFilter: {
      $gte?: Date;
      $lte?: Date;
    } = {};

    if (options.dateFrom) {
      const startDate =
        new Date(
          `${options.dateFrom}T00:00:00.000`
        );

      if (
        Number.isNaN(
          startDate.getTime()
        )
      ) {
        throw new Error(
          "Invalid start date."
        );
      }

      invoiceDateFilter.$gte =
        startDate;
    }

    if (options.dateTo) {
      const endDate =
        new Date(
          `${options.dateTo}T23:59:59.999`
        );

      if (
        Number.isNaN(
          endDate.getTime()
        )
      ) {
        throw new Error(
          "Invalid end date."
        );
      }

      invoiceDateFilter.$lte =
        endDate;
    }

    filter.invoiceDate =
      invoiceDateFilter;
  }

  const [invoices, total] =
    await Promise.all([
      InvoiceModel.find(filter)
        .sort({
          invoiceDate: -1,
          createdAt: -1
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      InvoiceModel.countDocuments(
        filter
      )
    ]);

  return {
    invoices,

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

export async function getInvoiceById(
  id: string
) {
  if (
    !Types.ObjectId.isValid(id)
  ) {
    throw new Error(
      "Invalid invoice ID."
    );
  }

  const invoice =
    await InvoiceModel.findById(id)
      .populate({
        path: "schoolId",
        select:
          "schoolName schoolCode address contactPerson contactNumber email gstNumber status"
      })
      .lean();

  if (!invoice) {
    throw new Error(
      "Invoice not found."
    );
  }

  return invoice;
}

export async function updateInvoiceStatus(
  id: string,
  invoiceStatus:
    | "DRAFT"
    | "COMPLETED"
) {
  if (
    !Types.ObjectId.isValid(id)
  ) {
    throw new Error(
      "Invalid invoice ID."
    );
  }

  const invoice =
    await InvoiceModel.findById(id);

  if (!invoice) {
    throw new Error(
      "Invoice not found."
    );
  }

  if (
    invoice.invoiceStatus ===
    "CANCELLED"
  ) {
    throw new Error(
      "A cancelled invoice cannot be modified."
    );
  }

  invoice.invoiceStatus =
    invoiceStatus;

  await invoice.save();

  return invoice;
}

export async function cancelInvoice(
  id: string,
  cancellationReason: string
) {
  if (
    !Types.ObjectId.isValid(id)
  ) {
    throw new Error(
      "Invalid invoice ID."
    );
  }

  const invoice =
    await InvoiceModel.findById(id);

  if (!invoice) {
    throw new Error(
      "Invoice not found."
    );
  }

  if (
    invoice.invoiceStatus ===
    "CANCELLED"
  ) {
    throw new Error(
      "Invoice is already cancelled."
    );
  }

  const trimmedReason =
    cancellationReason.trim();

  if (
    trimmedReason.length < 3
  ) {
    throw new Error(
      "Cancellation reason must contain at least 3 characters."
    );
  }

  invoice.invoiceStatus =
    "CANCELLED";

  invoice.cancellationReason =
    trimmedReason;

  invoice.cancelledAt =
    new Date();

  await invoice.save();

  return invoice;
}