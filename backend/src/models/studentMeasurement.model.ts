import {
  model,
  Schema,
  type HydratedDocument,
  type InferSchemaType
} from "mongoose";

import {
  MEASUREMENT_RECORD_STATUSES,
  SIZE_MODES,
  SIZE_SELECTION_MODES,
  STUDENT_GENDERS
} from "../types/studentMeasurement.types.js";

const studentPhotoSchema =
  new Schema(
    {
      url: {
        type: String,
        trim: true,
        default: ""
      },

      publicId: {
        type: String,
        trim: true,
        default: ""
      },

      width: {
        type: Number,
        min: 0,
        default: 0
      },

      height: {
        type: Number,
        min: 0,
        default: 0
      }
    },
    {
      _id: false,
      versionKey: false
    }
  );

const bodyMeasurementsSchema =
  new Schema(
    {
      height: {
        type: Number,
        min: 0,
        default: null
      },

      chest: {
        type: Number,
        min: 0,
        default: null
      },

      waist: {
        type: Number,
        min: 0,
        default: null
      },

      hip: {
        type: Number,
        min: 0,
        default: null
      },

      shoulder: {
        type: Number,
        min: 0,
        default: null
      },

      sleeve: {
        type: Number,
        min: 0,
        default: null
      },

      shirtLength: {
        type: Number,
        min: 0,
        default: null
      },

      pantLength: {
        type: Number,
        min: 0,
        default: null
      },

      inseam: {
        type: Number,
        min: 0,
        default: null
      },

      neck: {
        type: Number,
        min: 0,
        default: null
      }
    },
    {
      _id: false,
      versionKey: false
    }
  );

const uniformItemSchema =
  new Schema(
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
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

      productGender: {
        type: String,
        enum: STUDENT_GENDERS,
        required: true
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
      },

      sizeMode: {
        type: String,
        enum: SIZE_MODES,
        default: "STANDARD"
      },

      recommendedSize: {
        type: String,
        trim: true,
        default: ""
      },

      recommendationScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },

      sizeSelectionMode: {
        type: String,
        enum: SIZE_SELECTION_MODES,
        default: "RECOMMENDED"
      },

      manualOverrideSize: {
        type: String,
        trim: true,
        default: ""
      },

      finalSize: {
        type: String,
        required: true,
        trim: true
      },

      remarks: {
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

const studentMeasurementSchema =
  new Schema(
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

      studentId: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
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

      academicYear: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20,
        index: true
      },

      photo: {
        type: studentPhotoSchema,
        default: () => ({
          url: "",
          publicId: "",
          width: 0,
          height: 0
        })
      },

      measurements: {
        type: bodyMeasurementsSchema,
        default: () => ({})
      },

      recommendedSize: {
        type: String,
        trim: true,
        default: ""
      },

      recommendationScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },

      recommendationMatchedFields: {
        type: [String],
        default: []
      },

      measurementDate: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
      },

      items: {
        type: [uniformItemSchema],
        validate: {
          validator: (
            items: unknown[]
          ) =>
            Array.isArray(items) &&
            items.length > 0,

          message:
            "At least one uniform item is required."
        }
      },

      generalRemarks: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: ""
      },

      status: {
        type: String,
        enum:
          MEASUREMENT_RECORD_STATUSES,
        default: "ACTIVE",
        index: true
      }
    },
    {
      timestamps: true,
      versionKey: false
    }
  );

studentMeasurementSchema.index(
  {
    schoolId: 1,
    studentId: 1,
    academicYear: 1
  },
  {
    unique: true
  }
);

studentMeasurementSchema.index({
  schoolId: 1,
  measurementDate: -1
});

studentMeasurementSchema.index({
  studentName: "text",
  studentId: "text",
  className: "text"
});

export type StudentMeasurement =
  InferSchemaType<
    typeof studentMeasurementSchema
  >;

export type StudentMeasurementDocument =
  HydratedDocument<StudentMeasurement>;

export const StudentMeasurementModel =
  model<StudentMeasurement>(
    "StudentMeasurement",
    studentMeasurementSchema
  );