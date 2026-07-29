import { z } from "zod";

import {
  PRODUCTION_GENDERS,
  PRODUCTION_GROUPS
} from "../types/production.types.js";

export const productionReportQuerySchema = z.object({
  query: z
    .object({
      dateFrom: z
        .string()
        .trim()
        .optional(),

      dateTo: z
        .string()
        .trim()
        .optional(),

      schoolId: z
        .string()
        .trim()
        .optional(),

      productId: z
        .string()
        .trim()
        .optional(),

      gender: z
        .enum(PRODUCTION_GENDERS)
        .optional(),

      size: z
        .string()
        .trim()
        .optional(),

      className: z
        .string()
        .trim()
        .optional(),

      groupBy: z
        .enum(PRODUCTION_GROUPS)
        .optional()
        .default("ENTIRE_SEASON")
    })
    .refine(
      (data) => {
        if (!data.dateFrom || !data.dateTo) {
          return true;
        }

        return (
          new Date(data.dateFrom).getTime() <=
          new Date(data.dateTo).getTime()
        );
      },
      {
        message:
          "Start date cannot be after end date.",
        path: ["dateTo"]
      }
    )
});

export type ProductionReportQuery = z.infer<
  typeof productionReportQuerySchema
>["query"];