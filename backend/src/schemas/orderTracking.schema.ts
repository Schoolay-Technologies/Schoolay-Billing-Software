import { z } from "zod";

import {
  DISTRIBUTION_PLACES,
  PENDING_REASONS
} from "../types/orderTracking.types.js";

const distributionItemSchema = z
  .object({
    invoiceItemId: z
      .string()
      .trim()
      .min(1, "Invoice item is required."),

    deliveredNow: z.coerce
      .number()
      .int()
      .min(0, "Delivered quantity cannot be negative."),

    pendingReason: z
      .enum(PENDING_REASONS)
      .optional(),

    pendingReasonRemarks: z
      .string()
      .trim()
      .max(500)
      .optional()
      .default("")
  });

export const updateDistributionSchema = z.object({
  body: z
    .object({
      placeOfDistribution: z.enum(
        DISTRIBUTION_PLACES
      ),

      customDistributionPlace: z
        .string()
        .trim()
        .max(150)
        .optional()
        .default(""),

      items: z
        .array(distributionItemSchema)
        .min(1, "At least one item is required."),

      remarks: z
        .string()
        .trim()
        .max(500)
        .optional()
        .default("")
    })
    .superRefine((data, context) => {
      if (
        data.placeOfDistribution === "OTHER" &&
        !data.customDistributionPlace
      ) {
        context.addIssue({
          code: "custom",
          message: "Custom distribution place is required.",
          path: ["customDistributionPlace"]
        });
      }

      data.items.forEach((item, index) => {
        if (
          item.pendingReason === "OTHER" &&
          !item.pendingReasonRemarks
        ) {
          context.addIssue({
            code: "custom",
            message: "Pending reason remarks are required.",
            path: ["items", index, "pendingReasonRemarks"]
          });
        }

        if (
          item.pendingReason === "ALTERATION_REQUIRED" &&
          !item.pendingReasonRemarks
        ) {
          context.addIssue({
            code: "custom",
            message: "Alteration details are required.",
            path: ["items", index, "pendingReasonRemarks"]
          });
        }
      });
    })
});

// REMOVED: updateExchangeStatusSchema

export type UpdateDistributionInput = z.infer<
  typeof updateDistributionSchema
>["body"];

// REMOVED: UpdateExchangeStatusInput