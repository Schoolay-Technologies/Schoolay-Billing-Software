import { model, Schema } from "mongoose";

const invoiceSequenceSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true
    },

    financialYear: {
      type: String,
      required: true,
      trim: true
    },

    currentNumber: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

invoiceSequenceSchema.index(
  {
    schoolId: 1,
    financialYear: 1
  },
  {
    unique: true
  }
);

export const InvoiceSequenceModel = model(
  "InvoiceSequence",
  invoiceSequenceSchema
);