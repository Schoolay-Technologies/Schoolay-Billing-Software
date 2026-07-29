export const PAYMENT_MODES = [
  "CASH",
  "CARD",
  "ONLINE"
] as const;

export type PaymentMode =
  (typeof PAYMENT_MODES)[number];

export const PAYMENT_STATUSES = [
  "PENDING",
  "PARTIALLY_PAID",
  "PAID"
] as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUSES)[number];

export const INVOICE_STATUSES = [
  "DRAFT",
  "COMPLETED",
  "CANCELLED"
] as const;

export type InvoiceStatus =
  (typeof INVOICE_STATUSES)[number];