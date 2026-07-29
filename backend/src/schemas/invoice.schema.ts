import { z } from "zod";

import {
  INVOICE_STATUSES,
  PAYMENT_MODES,
  PAYMENT_STATUSES
} from "../types/invoice.types.js";

import {
  ORDER_PLACES
} from "../types/orderTracking.types.js";

const invoiceItemInputSchema = z.object({
  productId: z
    .string()
    .trim()
    .min(1, "Product is required."),

  variantId: z
    .string()
    .trim()
    .min(1, "Product size is required."),

  quantity: z.coerce
    .number()
    .int()
    .min(1, "Quantity must be at least 1.")
});

export const createInvoiceSchema = z.object({
  body: z
    .object({
      schoolId: z.string().trim().min(1),

      studentName: z.string().trim().min(2),
      className: z.string().trim().min(1),

      section: z.string().trim().optional().default(""),
      parentName: z.string().trim().optional().default(""),
      contactNumber: z.string().trim().optional().default(""),

      email: z
        .union([
          z.email("Enter a valid email address."),
          z.literal("")
        ])
        .optional()
        .default(""),

      placeOfOrder: z
        .enum(ORDER_PLACES)
        .optional()
        .default("SCHOOL_CAMP"),  // Added default

      specializedStoreName: z
        .string()
        .trim()
        .max(150)
        .optional()
        .default(""),

      paymentMode: z.enum(PAYMENT_MODES),

      paymentReference: z
        .string()
        .trim()
        .optional()
        .default(""),

      paymentStatus: z
        .enum(PAYMENT_STATUSES)
        .optional()
        .default("PENDING"),

      paidAmount: z.coerce
        .number()
        .min(0)
        .optional()
        .default(0),

      invoiceStatus: z
        .enum(["DRAFT", "COMPLETED"])
        .optional()
        .default("DRAFT"),

      items: z
        .array(invoiceItemInputSchema)
        .min(1),

      remarks: z
        .string()
        .trim()
        .optional()
        .default("")
    })
    .refine(
      (data) =>
        data.placeOfOrder !== "SPECIALIZED_SCHOOL_STORE" ||
        data.specializedStoreName.length > 0,
      {
        message: "Specialized school store name is required.",
        path: ["specializedStoreName"]
      }
    )
});

export const updateInvoiceSchema = z.object({
  body: z.object({
    schoolId: z
      .string()
      .trim()
      .min(1, "School is required."),

    studentName: z
      .string()
      .trim()
      .min(2, "Student name is required.")
      .max(150),

    placeOfOrder: z
      .enum(ORDER_PLACES)
      .optional()
      .default("SCHOOL_CAMP"),  // Added default

    specializedStoreName: z
      .string()
      .trim()
      .max(150)
      .optional()
      .default(""),

    className: z
      .string()
      .trim()
      .min(1, "Class is required.")
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
      .max(150)
      .optional()
      .default(""),

    contactNumber: z
      .string()
      .trim()
      .max(20)
      .optional()
      .default(""),

    email: z
      .union([
        z.email("Enter a valid email address."),
        z.literal("")
      ])
      .optional()
      .default(""),

    paymentMode: z.enum(PAYMENT_MODES),

    paymentReference: z
      .string()
      .trim()
      .max(100)
      .optional()
      .default(""),

    paidAmount: z.coerce
      .number()
      .min(0)
      .optional()
      .default(0),

    invoiceStatus: z
      .enum(["DRAFT", "COMPLETED"])
      .optional(),

    items: z
      .array(invoiceItemInputSchema)
      .min(1, "At least one invoice item is required."),

    remarks: z
      .string()
      .trim()
      .max(500)
      .optional()
      .default("")
  })
  .refine(
    (data) =>
      data.placeOfOrder !== "SPECIALIZED_SCHOOL_STORE" ||
      data.specializedStoreName.trim().length > 0,
    {
      message: "Specialized school store name is required.",
      path: ["specializedStoreName"]
    }
  )
});

export type UpdateInvoiceInput = z.infer<
  typeof updateInvoiceSchema
>["body"];

export const updateInvoiceStatusSchema = z.object({
  body: z.object({
    invoiceStatus: z.enum([
      "DRAFT",
      "COMPLETED"
    ])
  })
});

export const cancelInvoiceSchema = z.object({
  body: z.object({
    cancellationReason: z
      .string()
      .trim()
      .min(
        3,
        "Cancellation reason must contain at least 3 characters."
      )
      .max(500)
  })
});

export const updatePaymentSchema = z.object({
  body: z.object({
    paymentStatus: z.enum(PAYMENT_STATUSES),

    paidAmount: z.coerce
      .number()
      .min(0, "Paid amount cannot be negative."),

    paymentMode: z
      .enum(PAYMENT_MODES)
      .optional(),

    paymentReference: z
      .string()
      .trim()
      .max(100)
      .optional()
  })
});

export type CreateInvoiceInput = z.infer<
  typeof createInvoiceSchema
>["body"];