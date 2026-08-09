import { z } from "zod";

import {
  STORE_NAMES
} from "../types/storeReport.types.js";

const preOrderSchema = z.object({
  schoolId: z
    .string()
    .trim()
    .min(
      1,
      "School is required."
    ),

  quantity: z
    .number()
    .int()
    .min(
      1,
      "Pre-order quantity must be at least 1."
    ),

  amountCollected: z
    .number()
    .min(
      0,
      "Amount cannot be negative."
    )
});

export const createStoreReportSchema =
  z.object({
    body: z
      .object({
        storeName:
          z.enum(STORE_NAMES),

        reportDate: z
          .string()
          .trim()
          .min(
            1,
            "Report date is required."
          ),

        openingTime: z
          .string()
          .trim()
          .min(
            1,
            "Opening time is required."
          ),

        closingTime: z
          .string()
          .trim()
          .min(
            1,
            "Closing time is required."
          ),

        totalCustomers: z
          .number()
          .int()
          .min(0),

        preOrders: z
          .array(
            preOrderSchema
          )
          .default([]),

        directPurchaseQuantity:
          z
            .number()
            .int()
            .min(0),

        directPurchaseAmount:
          z
            .number()
            .min(0),

        directPurchaseOnlineAmount:
          z
            .number()
            .min(0),

        directPurchaseCashAmount:
          z
            .number()
            .min(0),

        exchangesRaised:
          z
            .number()
            .int()
            .min(0),

        exchangesFulfilled:
          z
            .number()
            .int()
            .min(0),

        exchangePendingReason:
          z
            .string()
            .trim()
            .default(""),

        remarks:
          z
            .string()
            .trim()
            .default("")
      })
      .superRefine(
        (data, context) => {
          const directTotal =
            Number(
              (
                data
                  .directPurchaseOnlineAmount +
                data
                  .directPurchaseCashAmount
              ).toFixed(2)
            );

          const enteredTotal =
            Number(
              data
                .directPurchaseAmount
                .toFixed(2)
            );

          if (
            directTotal !==
            enteredTotal
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode
                  .custom,

              path: [
                "directPurchaseAmount"
              ],

              message:
                "Online amount + Cash amount must equal Direct Purchase Amount."
            });
          }

          if (
            data.exchangesFulfilled >
            data.exchangesRaised
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode
                  .custom,

              path: [
                "exchangesFulfilled"
              ],

              message:
                "Fulfilled exchanges cannot exceed exchanges raised."
            });
          }

          if (
            data.exchangesRaised !==
              data
                .exchangesFulfilled &&
            !data.exchangePendingReason
              .trim()
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode
                  .custom,

              path: [
                "exchangePendingReason"
              ],

              message:
                "Reason is required when all exchanges are not fulfilled."
            });
          }
        }
      )
  });

export const updateStoreReportSchema =
  createStoreReportSchema;

export const storeReportIdSchema =
  z.object({
    params: z.object({
      id: z
        .string()
        .trim()
        .min(1)
    })
  });

export type CreateStoreReportInput =
  z.infer<
    typeof createStoreReportSchema
  >["body"];