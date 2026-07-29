import { z } from "zod";

import {
  REPORT_GENDERS,
  REPORT_PAYMENT_MODES,
  REPORT_TYPES
} from "../types/report.types.js";

export const reportQuerySchema = z.object({
  params: z.object({
    reportType: z.enum(REPORT_TYPES)
  }),

  query: z
    .object({
      schoolId: z
        .string()
        .trim()
        .min(
          1,
          "School is required."
        ),

      dateFrom: z
        .string()
        .trim()
        .optional(),

      dateTo: z
        .string()
        .trim()
        .optional(),

      studentName: z
        .string()
        .trim()
        .optional(),

      className: z
        .string()
        .trim()
        .optional(),

      productId: z
        .string()
        .trim()
        .optional(),

      gender: z
        .enum(REPORT_GENDERS)
        .optional(),

      size: z
        .string()
        .trim()
        .optional(),

      paymentMode: z
        .enum(REPORT_PAYMENT_MODES)
        .optional()
    })
    .superRefine(
      (data, context) => {
        if (
          !data.dateFrom ||
          !data.dateTo
        ) {
          return;
        }

        const startDate =
          new Date(
            `${data.dateFrom}T00:00:00`
          );

        const endDate =
          new Date(
            `${data.dateTo}T23:59:59`
          );

        if (
          Number.isNaN(
            startDate.getTime()
          ) ||
          Number.isNaN(
            endDate.getTime()
          )
        ) {
          context.addIssue({
            code: "custom",
            message:
              "Enter valid dates.",
            path: ["dateFrom"]
          });

          return;
        }

        if (
          startDate.getTime() >
          endDate.getTime()
        ) {
          context.addIssue({
            code: "custom",
            message:
              "Start date cannot be after end date.",
            path: ["dateTo"]
          });
        }
      }
    )
});

export type ReportQueryInput =
  z.infer<
    typeof reportQuerySchema
  >;