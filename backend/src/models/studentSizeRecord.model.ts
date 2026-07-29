import {
  model,
  Schema,
  type HydratedDocument,
  type InferSchemaType
} from "mongoose";

import {
  STUDENT_GENDERS,
  STUDENT_SIZE_RECORD_STATUSES
} from "../types/studentSizeRecord.types.js";

const studentSizeItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    variantId: {
      type: Schema.Types.ObjectId,
      required: true
    },

    productName: {
      type: String,
      required: true,
      trim: true
    },

    productCode: {
      type: String,
      required: true,
      trim: true
    },

    gender: {
      type: String,
      enum: STUDENT_GENDERS,
      required: true
    },

    size: {
      type: String,
      required: true,
      trim: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },

    additionalDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ""
    }
  },
  {
    _id: true,
    versionKey: false
  }
);

const studentSizeRecordSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true
    },

    schoolName: {
      type: String,
      required: true,
      trim: true
    },

    schoolCode: {
      type: String,
      required: true,
      trim: true
    },

    studentName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
      index: true
    },

    admissionNumber: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
      index: true
    },

    className: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true
    },

    section: {
      type: String,
      trim: true,
      maxlength: 50,
      default: ""
    },

    gender: {
      type: String,
      enum: STUDENT_GENDERS,
      required: true
    },

    parentName: {
      type: String,
      trim: true,
      maxlength: 150,
      default: ""
    },

    contactNumber: {
      type: String,
      trim: true,
      maxlength: 30,
      default: ""
    },

    recordDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },

    items: {
      type: [studentSizeItemSchema],
      validate: {
        validator: (items: unknown[]) =>
          Array.isArray(items) &&
          items.length > 0,

        message:
          "At least one product and size is required."
      }
    },

    generalRemarks: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ""
    },

    status: {
      type: String,
      enum: STUDENT_SIZE_RECORD_STATUSES,
      default: "ACTIVE",
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

studentSizeRecordSchema.index({
  schoolId: 1,
  recordDate: -1
});

studentSizeRecordSchema.index({
  schoolId: 1,
  className: 1,
  section: 1
});

studentSizeRecordSchema.index({
  studentName: "text",
  admissionNumber: "text",
  className: "text"
});

export type StudentSizeRecord =
  InferSchemaType<
    typeof studentSizeRecordSchema
  >;

export type StudentSizeRecordDocument =
  HydratedDocument<StudentSizeRecord>;

export const StudentSizeRecordModel =
  model<StudentSizeRecord>(
    "StudentSizeRecord",
    studentSizeRecordSchema
  );