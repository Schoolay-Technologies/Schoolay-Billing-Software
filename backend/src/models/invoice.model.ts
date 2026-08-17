import {
  model,
  Schema,
  type HydratedDocument,
  type InferSchemaType
} from "mongoose";

import {
  INVOICE_STATUSES,
  PAYMENT_MODES,
  PAYMENT_STATUSES
} from "../types/invoice.types.js";

import {
  DISTRIBUTION_PLACES,
  FULFILMENT_STATUSES,
  ORDER_PLACES,
  PENDING_REASONS
} from "../types/orderTracking.types.js";

const invoiceItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    deliveredQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    pendingQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    fulfilmentStatus: {
      type: String,
      enum: FULFILMENT_STATUSES,
      default: "NOT_COMPLETED"
    },
    pendingReason: {
      type: String,
      enum: ["", ...PENDING_REASONS],
      default: ""
    },
    pendingReasonRemarks: {
      type: String,
      trim: true,
      default: ""
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
    sku: {
      type: String,
      required: true,
      trim: true
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "UNISEX"],
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
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    gstPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    taxableAmount: {
      type: Number,
      required: true,
      min: 0
    },
    gstAmount: {
      type: Number,
      required: true,
      min: 0
    },
    totalAmount: {
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



const distributionHistoryItemSchema = new Schema(
  {
    invoiceItemId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    size: {
      type: String,
      required: true,
      trim: true
    },
    deliveredNow: {
      type: Number,
      required: true,
      min: 0
    },
    pendingAfterUpdate: {
      type: Number,
      required: true,
      min: 0
    },
    pendingReason: {
      type: String,
      enum: ["", ...PENDING_REASONS],
      default: ""
    },
    pendingReasonRemarks: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    _id: false,
    versionKey: false
  }
);

const distributionHistorySchema = new Schema(
  {
    distributionDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    placeOfDistribution: {
      type: String,
      enum: DISTRIBUTION_PLACES,
      required: true
    },
    customDistributionPlace: {
      type: String,
      trim: true,
      default: ""
    },
    items: {
      type: [distributionHistoryItemSchema],
      default: []
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

const invoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    placeOfOrder: {
      type: String,
      enum: ORDER_PLACES,
      required: false,  // Changed from true to false
      default: "SCHOOL_CAMP"
    },
    specializedStoreName: {
      type: String,
      trim: true,
      default: ""
    },
    fulfilmentStatus: {
      type: String,
      enum: FULFILMENT_STATUSES,
      default: "NOT_COMPLETED",
      index: true
    },
    totalOrderedQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    totalDeliveredQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    totalPendingQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    distributionHistory: {
      type: [distributionHistorySchema],
      default: []
    },
    financialYear: {
      type: String,
      required: true,
      trim: true
    },
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
      maxlength: 150
    },
    className: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    section: {
      type: String,
      trim: true,
      default: ""
    },
    parentName: {
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
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    paymentMode: {
      type: String,
      enum: PAYMENT_MODES,
      required: true
    },
    paymentReference: {
      type: String,
      trim: true,
      default: ""
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "PENDING"
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    invoiceStatus: {
      type: String,
      enum: INVOICE_STATUSES,
      default: "DRAFT",
      index: true
    },
    items: {
      type: [invoiceItemSchema],
      validate: {
        validator: (items: unknown[]) =>
          Array.isArray(items) && items.length > 0,
        message: "At least one invoice item is required."
      }
    },
    taxableAmount: {
      type: Number,
      required: true,
      min: 0
    },
    cgstAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    sgstAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    igstAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    totalGstAmount: {
      type: Number,
      required: true,
      min: 0
    },
    roundOff: {
      type: Number,
      required: true,
      default: 0
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0
    },
    remarks: {
      type: String,
      trim: true,
      default: ""
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: ""
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    publicInvoiceToken: {
  type: String,
  trim: true,
  unique: true,
  sparse: true,
  index: true
},

invoiceLinkSmsSent: {
  type: Boolean,
  default: false
},

invoiceLinkSmsSentAt: {
  type: Date,
  default: null
},
  },
  {
    timestamps: true,
    versionKey: false
  }
);

invoiceSchema.index({
  schoolId: 1,
  invoiceDate: -1
});

invoiceSchema.index({
  studentName: "text",
  invoiceNumber: "text"
});

export type Invoice =
  InferSchemaType<typeof invoiceSchema>;

export type InvoiceDocument =
  HydratedDocument<Invoice>;

export const InvoiceModel = model<Invoice>(
  "Invoice",
  invoiceSchema
);

