export const REPORT_TYPES = [
  "SCHOOL_WISE_SALES",
  "DATE_WISE_SALES",
  "STUDENT_PURCHASE",
  "CLASS_WISE_SALES",
  "PRODUCT_WISE_SALES",
  "GENDER_WISE_SALES",
  "SIZE_WISE_QUANTITY",
  "GST_REPORT",
  "PAYMENT_MODE_REPORT",
  "PRODUCTION_REQUIREMENT",
  "PRODUCTION_PENDING",
  "CANCELLED_INVOICES",
  "DAILY_COLLECTION",
  "MONTHLY_SALES"
] as const;

export type ReportType =
  (typeof REPORT_TYPES)[number];

export const REPORT_GENDERS = [
  "MALE",
  "FEMALE",
  "UNISEX"
] as const;

export type ReportGender =
  (typeof REPORT_GENDERS)[number];

export const REPORT_PAYMENT_MODES = [
  "CASH",
  "CARD",
  "ONLINE"
] as const;

export type ReportPaymentMode =
  (typeof REPORT_PAYMENT_MODES)[number];

export interface ReportFilters {
  schoolId: string;
  dateFrom?: string;
  dateTo?: string;

  studentName?: string;
  className?: string;
  productId?: string;
  gender?: ReportGender;
  size?: string;
  paymentMode?: ReportPaymentMode;
}

export interface ReportSummary {
  totalInvoices: number;
  totalQuantity: number;
  taxableAmount: number;
  totalGstAmount: number;
  grandTotal: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface GeneratedReport {
  reportType: ReportType;
  title: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  summary: ReportSummary;
}

export interface ReportColumn {
  header: string;
  key: string;
  width?: number;
}