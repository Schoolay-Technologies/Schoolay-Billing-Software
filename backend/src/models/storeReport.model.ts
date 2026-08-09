import {
  model,
  Schema,
  type HydratedDocument,
  type InferSchemaType
} from "mongoose";

import {
  STORE_NAMES
} from "../types/storeReport.types.js";

const preOrderSchema =
  new Schema(
    {
      schoolId: {
        type:
          Schema.Types
            .ObjectId,
        ref: "School",
        required: true
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

      quantity: {
        type: Number,
        required: true,
        min: 1
      },

      amountCollected: {
        type: Number,
        required: true,
        min: 0
      }
    },
    {
      _id: true,
      versionKey: false
    }
  );

const storeReportSchema =
  new Schema(
    {
      storeName: {
        type: String,
        enum: STORE_NAMES,
        required: true,
        index: true
      },

      reportDate: {
        type: Date,
        required: true,
        index: true
      },

      openingTime: {
        type: String,
        required: true,
        trim: true
      },

      closingTime: {
        type: String,
        required: true,
        trim: true
      },

      totalCustomers: {
        type: Number,
        required: true,
        min: 0
      },

      preOrders: {
        type: [
          preOrderSchema
        ],
        default: []
      },

      totalPreOrderQuantity: {
        type: Number,
        required: true,
        default: 0
      },

      totalPreOrderAmount: {
        type: Number,
        required: true,
        default: 0
      },

      directPurchaseQuantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
      },

      directPurchaseAmount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
      },

      directPurchaseOnlineAmount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
      },

      directPurchaseCashAmount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
      },

      exchangesRaised: {
        type: Number,
        required: true,
        default: 0
      },

      exchangesFulfilled: {
        type: Number,
        required: true,
        default: 0
      },

      exchangesPending: {
        type: Number,
        required: true,
        default: 0
      },

      exchangePendingReason: {
        type: String,
        trim: true,
        default: ""
      },

      totalAmountCollected: {
        type: Number,
        required: true,
        default: 0
      },

      remarks: {
        type: String,
        trim: true,
        default: ""
      }
    },
    {
      timestamps: true,
      versionKey: false
    }
  );

storeReportSchema.index(
  {
    storeName: 1,
    reportDate: -1
  }
);

export type StoreReport =
  InferSchemaType<
    typeof storeReportSchema
  >;

export type StoreReportDocument =
  HydratedDocument<
    StoreReport
  >;

export const StoreReportModel =
  model<StoreReport>(
    "StoreReport",
    storeReportSchema
  );