import { z } from "zod";

import {
  STUDENT_GENDERS,
  STUDENT_SIZE_RECORD_STATUSES
} from "../types/studentSizeRecord.types.js";

const studentSizeItemInputSchema =
  z.object({
    productId: z
      .string()
      .trim()
      .min(
        1,
        "Product is required."
      ),

    variantId: z
      .string()
      .trim()
      .min(
        1,
        "Product size is required."
      ),

    quantity: z.coerce
      .number()
      .int()
      .min(
        1,
        "Quantity must be at least 1."
      )
      .default(1),

    additionalDescription: z
      .string()
      .trim()
      .max(
        1000,
        "Additional description cannot exceed 1000 characters."
      )
      .optional()
      .default("")
  });

const studentSizeRecordBodySchema =
  z.object({
    schoolId: z
      .string()
      .trim()
      .min(
        1,
        "School is required."
      ),

    studentName: z
      .string()
      .trim()
      .min(
        2,
        "Student name is required."
      )
      .max(150),

    admissionNumber: z
      .string()
      .trim()
      .max(100)
      .optional()
      .default(""),

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

    gender: z.enum(
      STUDENT_GENDERS
    ),

    parentName: z
      .string()
      .trim()
      .max(150)
      .optional()
      .default(""),

    contactNumber: z
      .string()
      .trim()
      .max(30)
      .optional()
      .default(""),

    recordDate: z.coerce
      .date()
      .optional()
      .default(() => new Date()),

    items: z
      .array(
        studentSizeItemInputSchema
      )
      .min(
        1,
        "At least one product and size is required."
      ),

    generalRemarks: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .default(""),

    status: z
      .enum(
        STUDENT_SIZE_RECORD_STATUSES
      )
      .optional()
      .default("ACTIVE")
  });

export const createStudentSizeRecordSchema =
  z.object({
    body:
      studentSizeRecordBodySchema
  });

export const updateStudentSizeRecordSchema =
  z.object({
    body:
      studentSizeRecordBodySchema
  });

export const studentSizeRecordIdSchema =
  z.object({
    params: z.object({
      id: z
        .string()
        .trim()
        .min(1)
    })
  });

export type CreateStudentSizeRecordInput =
  z.infer<
    typeof studentSizeRecordBodySchema
  >;

export type UpdateStudentSizeRecordInput =
  CreateStudentSizeRecordInput;