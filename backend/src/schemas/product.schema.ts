import { z } from "zod";

const productVariantSchema = z.object({
  size: z
    .string()
    .trim()
    .min(1, "Size is required.")
    .max(30),

  unitPrice: z.coerce
    .number()
    .min(0, "Unit price cannot be negative."),

  gstPercentage: z.coerce
    .number()
    .min(0, "GST percentage cannot be negative.")
    .max(100, "GST percentage cannot exceed 100."),

  status: z
    .enum(["ACTIVE", "INACTIVE"])
    .optional()
    .default("ACTIVE")
});

export const createProductSchema = z.object({
  body: z.object({
    schoolId: z
      .string()
      .trim()
      .min(1, "School is required."),

    productName: z
      .string()
      .trim()
      .min(2, "Product name must contain at least 2 characters.")
      .max(150),

    gender: z.enum(["MALE", "FEMALE", "UNISEX"]),

    variants: z
      .array(productVariantSchema)
      .min(1, "At least one size is required."),

    status: z
      .enum(["ACTIVE", "INACTIVE"])
      .optional()
      .default("ACTIVE")
  })
});

export const updateProductSchema = z.object({
  body: z.object({
    productName: z
      .string()
      .trim()
      .min(2)
      .max(150)
      .optional(),

    gender: z
      .enum(["MALE", "FEMALE", "UNISEX"])
      .optional(),

    variants: z
      .array(productVariantSchema)
      .min(1)
      .optional(),

    status: z
      .enum(["ACTIVE", "INACTIVE"])
      .optional()
  })
});

export const productStatusSchema = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE"])
  })
});

export type CreateProductInput = z.infer<
  typeof createProductSchema
>["body"];

export type UpdateProductInput = z.infer<
  typeof updateProductSchema
>["body"];