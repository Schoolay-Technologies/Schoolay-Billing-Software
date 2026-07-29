export const ORDER_PLACES = [
  "SCHOOL_CAMP",
  "TIPPASANDRA_STORE",
  "MANDUR_STORE",
  "SARJAPUR_STORE",
  "SPECIALIZED_SCHOOL_STORE"
] as const;

export type OrderPlace =
  (typeof ORDER_PLACES)[number];

export const DISTRIBUTION_PLACES = [
  "SCHOOL_CAMP",
  "TIPPASANDRA_STORE",
  "MANDUR_STORE",
  "SARJAPUR_STORE",
  "SPECIALIZED_SCHOOL_STORE",
  "HOME_DELIVERY",
  "SCHOOL_DELIVERY",
  "COURIER",
  "OTHER"
] as const;

export type DistributionPlace =
  (typeof DISTRIBUTION_PLACES)[number];

export const FULFILMENT_STATUSES = [
  "NOT_COMPLETED",
  "PARTIALLY_COMPLETED",
  "COMPLETELY_DELIVERED"
] as const;

export type FulfilmentStatus =
  (typeof FULFILMENT_STATUSES)[number];

export const PENDING_REASONS = [
  "ITEM_NOT_AVAILABLE",
  "ALTERATION_REQUIRED",
  "WRONG_SIZE_ORDERED",
  "DAMAGED_ITEM",
  "PRODUCTION_PENDING",
  "STOCK_TRANSFER_PENDING",
  "CUSTOMER_NOT_AVAILABLE",
  "OTHER"
] as const;

export type PendingReason =
  (typeof PENDING_REASONS)[number];

// EXCHANGE_STATUSES and ExchangeStatus have been REMOVED