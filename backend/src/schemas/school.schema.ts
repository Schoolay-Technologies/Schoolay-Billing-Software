import { z } from "zod";

const optionalText = z.string().trim().max(250).optional().default("");

export const createSchoolSchema = z.object({
  body: z.object({
    schoolName: z
      .string()
      .trim()
      .min(2, "School name must contain at least 2 characters.")
      .max(150),

    schoolCode: z
      .string()
      .trim()
      .min(2, "School code must contain at least 2 characters.")
      .max(20)
      .transform((value) => value.toUpperCase()),

    address: z
      .object({
        addressLine1: optionalText,
        addressLine2: optionalText,
        city: z.string().trim().max(100).optional().default(""),
        state: z.string().trim().max(100).optional().default(""),
        postalCode: z.string().trim().max(10).optional().default("")
      })
      .optional(),

    contactPerson: z.string().trim().max(100).optional().default(""),

    contactNumber: z
      .string()
      .trim()
      .max(20)
      .optional()
      .default(""),

    email: z
      .union([z.email(), z.literal("")])
      .optional()
      .default(""),

    gstNumber: z
      .string()
      .trim()
      .max(15)
      .optional()
      .default("")
      .transform((value) => value.toUpperCase()),

    status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE")
  })
});

export const updateSchoolSchema = z.object({
  body: createSchoolSchema.shape.body.partial()
});

export type CreateSchoolInput = z.infer<
  typeof createSchoolSchema
>["body"];

export type UpdateSchoolInput = z.infer<
  typeof updateSchoolSchema
>["body"];