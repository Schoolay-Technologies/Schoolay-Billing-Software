import {
  model,
  Schema,
  type HydratedDocument,
  type InferSchemaType
} from "mongoose";

import {
  CAMP_STATUSES
} from "../types/camp.types.js";

const campVariantSchema =
  new Schema(
    {
      variantId: {
        type:
          Schema.Types.ObjectId,
        required: true
      },

      size: {
        type: String,
        required: true,
        trim: true
      },

      sku: {
        type: String,
        required: true,
        trim: true
      }
    },
    {
      _id: false,
      versionKey: false
    }
  );

const campProductSchema =
  new Schema(
    {
      productId: {
        type:
          Schema.Types.ObjectId,
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

      gender: {
        type: String,
        enum: [
          "MALE",
          "FEMALE",
          "UNISEX"
        ],
        required: true
      },

      variants: {
        type: [
          campVariantSchema
        ],

        validate: {
          validator: (
            variants: unknown[]
          ) =>
            Array.isArray(
              variants
            ) &&
            variants.length > 0,

          message:
            "At least one size is required for each camp product."
        }
      }
    },
    {
      _id: false,
      versionKey: false
    }
  );

const campSchema =
  new Schema(
    {
      campName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
      },

      campCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        index: true
      },

      schoolId: {
        type:
          Schema.Types.ObjectId,
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

      publicToken: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
      },

      startDate: {
        type: Date,
        required: true,
        index: true
      },

      endDate: {
        type: Date,
        required: true,
        index: true
      },

      status: {
        type: String,
        enum:
          CAMP_STATUSES,
        default: "DRAFT",
        index: true
      },

      products: {
        type: [
          campProductSchema
        ],

        validate: {
          validator: (
            products: unknown[]
          ) =>
            Array.isArray(
              products
            ) &&
            products.length > 0,

          message:
            "At least one product is required for the camp."
        }
      },

      instructions: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ""
      },

      orderCount: {
        type: Number,
        min: 0,
        default: 0
      }
    },
    {
      timestamps: true,
      versionKey: false
    }
  );

campSchema.index({
  schoolId: 1,
  startDate: -1
});

campSchema.index({
  status: 1,
  startDate: 1,
  endDate: 1
});

campSchema.pre(
  "validate",
  function () {
    if (
      this.startDate &&
      this.endDate &&
      this.startDate >
        this.endDate
    ) {
      throw new Error(
        "Camp end date cannot be before the start date."
      );
    }
  }
);

export type Camp =
  InferSchemaType<
    typeof campSchema
  >;

export type CampDocument =
  HydratedDocument<Camp>;

export const CampModel =
  model<Camp>(
    "Camp",
    campSchema
  );