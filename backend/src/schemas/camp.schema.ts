import { z } from "zod";

import {
  CAMP_STATUSES
} from "../types/camp.types.js";

const objectIdSchema =
  z
    .string()
    .trim()
    .regex(
      /^[a-f\d]{24}$/i,
      "Invalid MongoDB ID."
    );

const campVariantInputSchema =
  z.object({
    variantId:
      objectIdSchema
  });

const campProductInputSchema =
  z.object({
    productId:
      objectIdSchema,

    variants: z
      .array(
        campVariantInputSchema
      )
      .min(
        1,
        "Select at least one size for every product."
      )
  });

    const dateOnlySchema = z
  .string()
  .trim()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be in YYYY-MM-DD format."
  )
  .transform((value) => {
    const date = new Date(
      `${value}T00:00:00.000Z`
    );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      throw new Error(
        "Invalid date."
      );
    }

    return date;
  });

const campBodySchema =
  z
    .object({
      campName: z
        .string()
        .trim()
        .min(
          2,
          "Camp name is required."
        )
        .max(150),

      campCode: z
        .string()
        .trim()
        .min(
          2,
          "Camp code is required."
        )
        .max(50)
        .transform(
          (value) =>
            value.toUpperCase()
        ),

      schoolId:
        objectIdSchema,

      startDate:
  dateOnlySchema,

endDate:
  dateOnlySchema,

      status: z
        .enum(
          CAMP_STATUSES
        )
        .optional()
        .default("DRAFT"),

      products: z
        .array(
          campProductInputSchema
        )
        .min(
          1,
          "Select at least one product."
        ),

      instructions: z
        .string()
        .trim()
        .max(1000)
        .optional()
        .default("")
    })
    .superRefine(
      (
        data,
        context
      ) => {
        if (
          data.endDate <
          data.startDate
        ) {
          context.addIssue({
            code: "custom",
            message:
              "Camp end date cannot be before the start date.",
            path: [
              "endDate"
            ]
          });
        }

        const productIds =
          data.products.map(
            (product) =>
              product.productId
          );

        const uniqueProductIds =
          new Set(
            productIds
          );

        if (
          uniqueProductIds.size !==
          productIds.length
        ) {
          context.addIssue({
            code: "custom",
            message:
              "The same product cannot be added more than once.",
            path: [
              "products"
            ]
          });
        }

        data.products.forEach(
          (
            product,
            productIndex
          ) => {
            const variantIds =
              product.variants.map(
                (variant) =>
                  variant.variantId
              );

            const uniqueVariantIds =
              new Set(
                variantIds
              );

            if (
              uniqueVariantIds.size !==
              variantIds.length
            ) {
              context.addIssue({
                code:
                  "custom",

                message:
                  "The same size cannot be selected more than once for a product.",

                path: [
                  "products",
                  productIndex,
                  "variants"
                ]
              });
            }
          }
        );
      }
    );

export const createCampSchema =
  z.object({
    body:
      campBodySchema
  });

export const updateCampSchema =
  z.object({
    body:
      campBodySchema
  });

export const campIdSchema =
  z.object({
    params: z.object({
      id:
        objectIdSchema
    })
  });

export const campTokenSchema =
  z.object({
    params: z.object({
      token: z
        .string()
        .trim()
        .min(
          20,
          "Invalid camp token."
        )
    })
  });

export const publicCampOrderSchema =
  z.object({
    params: z.object({
      token: z
        .string()
        .trim()
        .min(
          20,
          "Invalid camp token."
        )
    }),

    body: z.object({
      studentName: z
        .string()
        .trim()
        .min(
          2,
          "Student name is required."
        )
        .max(150),

      className: z
        .string()
        .trim()
        .min(
          1,
          "Class is required."
        )
        .max(100),

      section: z
        .string()
        .trim()
        .max(50)
        .optional()
        .default(""),

      parentName: z
        .string()
        .trim()
        .min(
          2,
          "Parent name is required."
        )
        .max(150),

      contactNumber: z
        .string()
        .trim()
        .min(
          8,
          "Enter a valid contact number."
        )
        .max(20),

      email: z
        .union([
          z.email(
            "Enter a valid email address."
          ),
          z.literal("")
        ])
        .optional()
        .default(""),

      items: z
        .array(
          z.object({
            productId:
              objectIdSchema,

            variantId:
              objectIdSchema,

            quantity:
              z.coerce
                .number()
                .int()
                .min(
                  1,
                  "Quantity must be at least 1."
                )
                .max(
                  10,
                  "Quantity cannot exceed 10."
                )
          })
        )
        .min(
          1,
          "Select at least one uniform item."
        ),

      remarks: z
        .string()
        .trim()
        .max(500)
        .optional()
        .default("")
    })
  });

export type CreateCampInput =
  z.infer<
    typeof campBodySchema
  >;

export type UpdateCampInput =
  CreateCampInput;

export type PublicCampOrderInput =
  z.infer<
    typeof publicCampOrderSchema
  >["body"];

