import {
  model,
  Schema,
  type HydratedDocument,
  type InferSchemaType
} from "mongoose";

const schoolSchema = new Schema(
  {
    schoolName: {
      type: String,
      required: [true, "School name is required."],
      trim: true,
      maxlength: 150
    },

    schoolCode: {
      type: String,
      required: [true, "School code is required."],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: 20
    },

    address: {
      addressLine1: {
        type: String,
        trim: true,
        default: ""
      },
      addressLine2: {
        type: String,
        trim: true,
        default: ""
      },
      city: {
        type: String,
        trim: true,
        default: ""
      },
      state: {
        type: String,
        trim: true,
        default: ""
      },
      postalCode: {
        type: String,
        trim: true,
        default: ""
      }
    },

    contactPerson: {
      type: String,
      trim: true,
      default: ""
    },

    contactNumber: {
      type: String,
      trim: true,
      default: ""
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    },

    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: ""
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE"
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

schoolSchema.index({ schoolName: 1 });
schoolSchema.index({ status: 1 });

export type School = InferSchemaType<typeof schoolSchema>;
export type SchoolDocument = HydratedDocument<School>;

export const SchoolModel = model<School>("School", schoolSchema);