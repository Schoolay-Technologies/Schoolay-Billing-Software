import { z } from "zod";

import {
  MEASUREMENT_RECORD_STATUSES,
  SIZE_MODES,
  SIZE_SELECTION_MODES,
  STUDENT_GENDERS
} from "../types/studentMeasurement.types.js";

const optionalMeasurement =
  z.preprocess(
    (value) => {
      if (
        value === "" ||
        value === null ||
        value === undefined
      ) {
        return undefined;
      }

      return value;
    },

    z.coerce
      .number()
      .positive()
      .optional()
  );

const photoSchema = z.object({
  url: z
    .string()
    .trim()
    .url()
    .optional()
    .default(""),

  publicId: z
    .string()
    .trim()
    .optional()
    .default(""),

  width: z.coerce
    .number()
    .nonnegative()
    .optional()
    .default(0),

  height: z.coerce
    .number()
    .nonnegative()
    .optional()
    .default(0)
});

const measurementsSchema = z.object({
  height: optionalMeasurement,
  chest: optionalMeasurement,
  waist: optionalMeasurement,
  hip: optionalMeasurement,
  shoulder: optionalMeasurement,
  sleeve: optionalMeasurement,
  shirtLength: optionalMeasurement,
  pantLength: optionalMeasurement,
  inseam: optionalMeasurement,
  neck: optionalMeasurement
});

const uniformItemSchema = z
  .object({
    productId: z
      .string()
      .trim()
      .min(
        1,
        "Product is required."
      ),

    quantity: z.coerce
      .number()
      .int()
      .min(1),

    sizeMode: z
      .enum(SIZE_MODES)
      .default("STANDARD"),

    sizeSelectionMode: z
      .enum(
        SIZE_SELECTION_MODES
      )
      .default("RECOMMENDED"),

    manualOverrideSize: z
      .string()
      .trim()
      .optional()
      .default(""),

    customSize: z
      .string()
      .trim()
      .optional()
      .default(""),

    remarks: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .default("")
  })
  .superRefine(
    (item, context) => {
      if (
        item.sizeSelectionMode ===
          "MANUAL_OVERRIDE" &&
        !item.manualOverrideSize
      ) {
        context.addIssue({
          code: "custom",
          message:
            "Manual size is required when overriding the recommendation.",
          path: [
            "manualOverrideSize"
          ]
        });
      }

      if (
        item.sizeMode ===
          "CUSTOM" &&
        !item.customSize
      ) {
        context.addIssue({
          code: "custom",
          message:
            "Custom size description is required.",
          path: ["customSize"]
        });
      }
    }
  );

export const studentMeasurementBodySchema =
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
      .min(2)
      .max(150),

    studentId: z
      .string()
      .trim()
      .min(
        1,
        "Student ID is required."
      )
      .max(100),

    mobileNumber: z
      .string()
      .trim()
      .regex(
        /^[6-9]\d{9}$/,
        "Enter a valid 10-digit mobile number"
      )
      .optional()
      .or(z.literal("")),

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

    gender:
      z.enum(STUDENT_GENDERS),

    academicYear: z
      .string()
      .trim()
      .min(
        1,
        "Academic year is required."
      )
      .max(20),

    photo: photoSchema
      .optional()
      .default({
        url: "",
        publicId: "",
        width: 0,
        height: 0
      }),

    measurements:
      measurementsSchema,

    measurementDate:
      z.coerce.date(),

    items: z
      .array(
        uniformItemSchema
      )
      .min(
        1,
        "At least one uniform item is required."
      ),

    generalRemarks: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .default(""),

    status: z
      .enum(
        MEASUREMENT_RECORD_STATUSES
      )
      .optional()
      .default("ACTIVE")
  });

export const createStudentMeasurementSchema =
  z.object({
    body:
      studentMeasurementBodySchema
  });

export const updateStudentMeasurementSchema =
  z.object({
    body:
      studentMeasurementBodySchema
  });

export const studentMeasurementIdSchema =
  z.object({
    params: z.object({
      id: z
        .string()
        .trim()
        .min(1)
    })
  });

export type StudentMeasurementInput =
  z.infer<
    typeof studentMeasurementBodySchema
  >;