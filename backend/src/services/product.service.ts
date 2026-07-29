import { Types } from "mongoose";

import { ProductModel } from "../models/product.model.js";
import { SchoolModel } from "../models/school.model.js";

import type {
  CreateProductInput,
  UpdateProductInput
} from "../schemas/product.schema.js";

import {
  calculateGstAmount,
  calculateSellingPrice,
  cleanCodePart
} from "../utils/product.util.js";

interface ProductVariantInput {
  size: string;
  unitPrice: number;
  gstPercentage: number;
  status?: "ACTIVE" | "INACTIVE";
}

function generateProductCode(
  schoolCode: string,
  productName: string,
  gender: string
): string {
  const productPart = cleanCodePart(productName).slice(0, 6);
  const genderPart = gender.slice(0, 1);

  return `${schoolCode}-${productPart}-${genderPart}`;
}

function generateSku(
  schoolCode: string,
  productName: string,
  gender: string,
  size: string
): string {
  const productPart = cleanCodePart(productName).slice(0, 6);
  const sizePart = cleanCodePart(size).slice(0, 8);
  const genderPart = gender.slice(0, 1);

  return `${schoolCode}-${productPart}-${genderPart}-${sizePart}`;
}

function prepareVariants(
  variants: ProductVariantInput[],
  schoolCode: string,
  productName: string,
  gender: string
) {
  const normalizedSizes = new Set<string>();

  return variants.map((variant) => {
    const normalizedSize = variant.size.trim().toUpperCase();

    if (normalizedSizes.has(normalizedSize)) {
      throw new Error(
        `Duplicate size "${normalizedSize}" is not allowed.`
      );
    }

    normalizedSizes.add(normalizedSize);

    const gstAmount = calculateGstAmount(
      variant.unitPrice,
      variant.gstPercentage
    );

    const sellingPrice = calculateSellingPrice(
      variant.unitPrice,
      variant.gstPercentage
    );

    return {
      size: normalizedSize,
      unitPrice: variant.unitPrice,
      gstPercentage: variant.gstPercentage,
      gstAmount,
      sellingPrice,
      sku: generateSku(
        schoolCode,
        productName,
        gender,
        normalizedSize
      ),
      status: variant.status ?? "ACTIVE"
    };
  });
}

async function ensureSkuIsUnique(
  skus: string[],
  excludedProductId?: string
): Promise<void> {
  const filter: Record<string, unknown> = {
    "variants.sku": {
      $in: skus
    }
  };

  if (excludedProductId) {
    filter._id = {
      $ne: excludedProductId
    };
  }

  const duplicateProduct = await ProductModel.findOne(filter);

  if (duplicateProduct) {
    throw new Error(
      "One or more generated SKUs already exist. Change the product name, gender, or size."
    );
  }
}

export async function createProduct(
  input: CreateProductInput
) {
  if (!Types.ObjectId.isValid(input.schoolId)) {
    throw new Error("Invalid school ID.");
  }

  const school = await SchoolModel.findById(input.schoolId);

  if (!school) {
    throw new Error("School not found.");
  }

  if (school.status !== "ACTIVE") {
    throw new Error(
      "Products cannot be created under an inactive school."
    );
  }

  const existingProduct = await ProductModel.findOne({
    schoolId: input.schoolId,
    productName: {
      $regex: `^${escapeRegex(input.productName.trim())}$`,
      $options: "i"
    },
    gender: input.gender
  });

  if (existingProduct) {
    throw new Error(
      "A product with the same name and gender already exists for this school."
    );
  }

  const variants = prepareVariants(
    input.variants,
    school.schoolCode,
    input.productName,
    input.gender
  );

  await ensureSkuIsUnique(
    variants.map((variant) => variant.sku)
  );

  const productCode = generateProductCode(
    school.schoolCode,
    input.productName,
    input.gender
  );

  return ProductModel.create({
    schoolId: input.schoolId,
    productName: input.productName.trim(),
    productCode,
    gender: input.gender,
    variants,
    status: input.status
  });
}

export async function getProducts(options: {
  schoolId?: string;
  search?: string;
  gender?: "MALE" | "FEMALE" | "UNISEX";
  status?: "ACTIVE" | "INACTIVE";
  page?: number;
  limit?: number;
}) {
  const page = Math.max(options.page ?? 1, 1);
  const limit = Math.min(
    Math.max(options.limit ?? 10, 1),
    100
  );

  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (options.schoolId) {
    if (!Types.ObjectId.isValid(options.schoolId)) {
      throw new Error("Invalid school ID.");
    }

    filter.schoolId = options.schoolId;
  }

  if (options.gender) {
    filter.gender = options.gender;
  }

  if (options.status) {
    filter.status = options.status;
  }

  if (options.search) {
    filter.$or = [
      {
        productName: {
          $regex: options.search,
          $options: "i"
        }
      },
      {
        productCode: {
          $regex: options.search,
          $options: "i"
        }
      },
      {
        "variants.sku": {
          $regex: options.search,
          $options: "i"
        }
      }
    ];
  }

  const [products, total] = await Promise.all([
    ProductModel.find(filter)
      .populate({
        path: "schoolId",
        select: "schoolName schoolCode status"
      })
      .sort({
        createdAt: -1
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    ProductModel.countDocuments(filter)
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getProductById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid product ID.");
  }

  const product = await ProductModel.findById(id)
    .populate({
      path: "schoolId",
      select: "schoolName schoolCode status"
    })
    .lean();

  if (!product) {
    throw new Error("Product not found.");
  }

  return product;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput
) {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid product ID.");
  }

  const existingProduct = await ProductModel.findById(id);

  if (!existingProduct) {
    throw new Error("Product not found.");
  }

  const school = await SchoolModel.findById(
    existingProduct.schoolId
  );

  if (!school) {
    throw new Error("Product school not found.");
  }

  const productName =
    input.productName ?? existingProduct.productName;

  const gender =
    input.gender ?? existingProduct.gender;

  const duplicateProduct = await ProductModel.findOne({
    _id: {
      $ne: id
    },
    schoolId: existingProduct.schoolId,
    productName: {
      $regex: `^${escapeRegex(productName.trim())}$`,
      $options: "i"
    },
    gender
  });

  if (duplicateProduct) {
    throw new Error(
      "Another product with the same name and gender already exists."
    );
  }

  let variants = existingProduct.variants;

  if (input.variants) {
    const preparedVariants = prepareVariants(
      input.variants,
      school.schoolCode,
      productName,
      gender
    );

    await ensureSkuIsUnique(
      preparedVariants.map((variant) => variant.sku),
      id
    );

    variants = preparedVariants as typeof existingProduct.variants;
  }

  existingProduct.productName = productName.trim();
  existingProduct.gender = gender;

  existingProduct.productCode = generateProductCode(
    school.schoolCode,
    productName,
    gender
  );

  existingProduct.variants = variants;

  if (input.status) {
    existingProduct.status = input.status;
  }

  await existingProduct.save();

  return existingProduct;
}

export async function changeProductStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE"
) {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid product ID.");
  }

  const product = await ProductModel.findByIdAndUpdate(
    id,
    {
      status
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!product) {
    throw new Error("Product not found.");
  }

  return product;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}