import type {
  Pagination
} from "./school.types";

import type {
  ProductGender
} from "./product.types";

export type PaymentMode =
  | "CASH"
  | "CARD"
  | "ONLINE";

export type PaymentStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID";

export type InvoiceStatus =
  | "DRAFT"
  | "COMPLETED"
  | "CANCELLED";

export interface InvoiceItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface CreateInvoiceInput {
  schoolId: string;
  studentName: string;
  className: string;
  section: string;
  parentName: string;
  contactNumber: string;
  email: string;
  paymentMode: PaymentMode;
  paymentReference: string;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  invoiceStatus:
    | "DRAFT"
    | "COMPLETED";
  items: InvoiceItemInput[];
  remarks: string;
  placeOfOrder: OrderPlace;
  specializedStoreName: string;
}

export interface InvoiceItem {
  _id: string;
  productId: string | PopulatedInvoiceProduct;
  variantId: string;
  productName: string;
  productCode: string;
  sku: string;
  gender: ProductGender;
  size: string;
  quantity: number;
  unitPrice: number;
  gstPercentage: number;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  financialYear: string;

  schoolId: string | PopulatedInvoiceSchool;

  schoolName: string;
  schoolCode: string;

  studentName: string;
  className: string;
  section: string;
  parentName: string;
  contactNumber: string;
  email: string;

  placeOfOrder: OrderPlace;
 specializedStoreName: string;

fulfilmentStatus:
  | "NOT_COMPLETED"
  | "PARTIALLY_COMPLETED"
  | "COMPLETELY_DELIVERED";

totalOrderedQuantity: number;
totalDeliveredQuantity: number;
totalPendingQuantity: number;

  invoiceDate: string;

  paymentMode: PaymentMode;
  paymentReference: string;
  paymentStatus: PaymentStatus;
  paidAmount: number;

  invoiceStatus: InvoiceStatus;

  items: InvoiceItem[];

  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  roundOff: number;
  grandTotal: number;

  remarks: string;
  cancellationReason: string;
  cancelledAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface InvoicesResponse {
  success: boolean;
  data: Invoice[];
  pagination: Pagination;
}

export interface InvoiceResponse {
  success: boolean;
  message?: string;
  data: Invoice;
}

export interface PopulatedInvoiceSchool {
  _id: string;
  schoolName: string;
  schoolCode: string;
  address?: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
  };
  contactNumber?: string;
  email?: string;
  gstNumber?: string;
}

export interface PopulatedInvoiceProduct {
  _id: string;
}

export type OrderPlace =
  | "SCHOOL_CAMP"
  | "TIPPASANDRA_STORE"
  | "MANDUR_STORE"
  | "SARJAPUR_STORE"
  | "SPECIALIZED_SCHOOL_STORE";