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

export type ReportGender =
  | "MALE"
  | "FEMALE"
  | "UNISEX";

export type ReportPaymentMode =
  | "CASH"
  | "CARD"
  | "ONLINE";

export interface ReportFilters {
  schoolId: string;
  dateFrom: string;
  dateTo: string;
  studentName: string;
  className: string;
  productId: string;
  gender: ReportGender | "";
  size: string;
  paymentMode: ReportPaymentMode | "";
}

export interface ReportColumn {
  header: string;
  key: string;
  width?: number;
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

export interface ReportResponse {
  success: boolean;
  title: string;
  reportType: ReportType;
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  summary: ReportSummary;
}

export interface ReportOption {
  value: ReportType;
  label: string;
}