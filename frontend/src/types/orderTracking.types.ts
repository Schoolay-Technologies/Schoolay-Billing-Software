import type {
  Invoice,
  InvoiceItem
} from "./invoice.types";

import type {
  Product
} from "./product.types";

import type {
  Pagination
} from "./school.types";

export type FulfilmentStatus =
  | "NOT_COMPLETED"
  | "PARTIALLY_COMPLETED"
  | "COMPLETELY_DELIVERED";

export type DistributionPlace =
  | "SCHOOL_CAMP"
  | "TIPPASANDRA_STORE"
  | "MANDUR_STORE"
  | "SARJAPUR_STORE"
  | "SPECIALIZED_SCHOOL_STORE"
  | "HOME_DELIVERY"
  | "SCHOOL_DELIVERY"
  | "COURIER"
  | "OTHER";

export type PendingReason =
  | "ITEM_NOT_AVAILABLE"
  | "EXCHANGE_RAISED"
  | "ALTERATION_REQUIRED"
  | "WRONG_SIZE_ORDERED"
  | "DAMAGED_ITEM"
  | "PRODUCTION_PENDING"
  | "STOCK_TRANSFER_PENDING"
  | "CUSTOMER_NOT_AVAILABLE"
  | "OTHER";

export type ExchangeStatus =
  | "REQUESTED"
  | "ITEM_COLLECTED"
  | "REPLACEMENT_PENDING"
  | "REPLACEMENT_READY"
  | "COMPLETED"
  | "CANCELLED";

export interface TrackedInvoiceItem
  extends InvoiceItem {
  deliveredQuantity?: number;
  pendingQuantity?: number;
  fulfilmentStatus?: FulfilmentStatus;
  pendingReason?: PendingReason | "";
  pendingReasonRemarks?: string;
}

export interface ExchangeRequest {
  _id: string;
  invoiceItemId: string;
  originalProductName: string;
  originalSize: string;
  exchangeQuantity: number;
  replacementProductName: string;
  replacementSize: string;
  reason: string;
  status: ExchangeStatus;
  raisedAt: string;
  completedAt?: string | null;
}

export interface DistributionHistoryItem {
  invoiceItemId: string;
  productName: string;
  size: string;
  deliveredNow: number;
  pendingAfterUpdate: number;
  pendingReason: PendingReason | "";
  pendingReasonRemarks: string;
}

export interface DistributionHistory {
  _id: string;
  distributionDate: string;
  placeOfDistribution: DistributionPlace;
  customDistributionPlace: string;
  items: DistributionHistoryItem[];
  remarks: string;
}

export interface TrackedInvoice
  extends Omit<Invoice, "items"> {
  items: TrackedInvoiceItem[];

  placeOfOrder?: Invoice["placeOfOrder"];
  specializedStoreName?: string;

  fulfilmentStatus?: FulfilmentStatus;

  totalOrderedQuantity?: number;
  totalDeliveredQuantity?: number;
  totalPendingQuantity?: number;

  distributionHistory:
    DistributionHistory[];

  exchangeRequests:
    ExchangeRequest[];
}

export interface OrderTrackingResponse {
  success: boolean;
  data: TrackedInvoice;
  message?: string;
}

export interface OrderTrackingListResponse {
  success: boolean;
  data: TrackedInvoice[];
  pagination: Pagination;
}

export interface DistributionItemInput {
  invoiceItemId: string;
  deliveredNow: number;
  pendingReason?: PendingReason;
  pendingReasonRemarks: string;

  exchangeQuantity?: number;
  replacementProductId?: string;
  replacementVariantId?: string;
  exchangeReason?: string;
}

export interface UpdateDistributionInput {
  placeOfDistribution: DistributionPlace;
  customDistributionPlace: string;
  items: DistributionItemInput[];
  remarks: string;
}

export interface TrackingProduct
  extends Product {}