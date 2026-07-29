import {
  model,
  Schema,
  type HydratedDocument,
  type InferSchemaType
} from "mongoose";

const productVariantSchema = new Schema(
  {
    size: {
      type: String,
      required: [true, "Size is required."],
      trim: true
    },

    unitPrice: {
      type: Number,
      required: [true, "Unit price is required."],
      min: [0, "Unit price cannot be negative."]
    },

    gstPercentage: {
      type: Number,
      required: [true, "GST percentage is required."],
      min: [0, "GST percentage cannot be negative."],
      max: [100, "GST percentage cannot exceed 100."]
    },

    gstAmount: {
      type: Number,
      required: true,
      min: 0
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },

   sku: {
  type: String,
  required: true,
  trim: true,
  uppercase: true
},

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE"
    }
  },
  {
    _id: true,
    versionKey: false
  }
);

const productSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School is required."],
      index: true
    },

    productName: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      maxlength: 150
    },

    productCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "UNISEX"],
      required: [true, "Gender is required."]
    },

    variants: {
      type: [productVariantSchema],
      validate: {
        validator: (variants: unknown[]) => variants.length > 0,
        message: "At least one product size is required."
      }
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

productSchema.index(
  {
    schoolId: 1,
    productName: 1,
    gender: 1
  },
  {
    unique: true
  }
);

productSchema.index({
  schoolId: 1,
  status: 1
});

export type Product = InferSchemaType<typeof productSchema>;
export type ProductDocument = HydratedDocument<Product>;

export const ProductModel = model<Product>(
  "Product",
  productSchema
);