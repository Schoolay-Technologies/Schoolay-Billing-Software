import type {
  Pagination
} from "./school.types";

export type CampStatus =
  | "DRAFT"
  | "ACTIVE"
  | "CLOSED";

export type CampGender =
  | "MALE"
  | "FEMALE"
  | "UNISEX";

export interface CampVariant {
  variantId: string;
  size: string;
  sku: string;
}

export interface CampProduct {
  productId: string;
  productName: string;
  productCode: string;
  gender: CampGender;
  variants: CampVariant[];
}

export interface Camp {
  _id: string;

  campName: string;
  campCode: string;

  schoolId:
    | string
    | {
        _id: string;
      };

  schoolName: string;
  schoolCode: string;

  publicToken: string;

  startDate: string;
  endDate: string;

  status: CampStatus;

  products: CampProduct[];

  instructions: string;

  orderCount: number;

  createdAt: string;
  updatedAt: string;
}

export interface CampFormVariantInput {
  variantId: string;
}

export interface CampFormProductInput {
  productId: string;

  variants:
    CampFormVariantInput[];
}

export interface CampFormInput {
  campName: string;
  campCode: string;

  schoolId: string;

  startDate: string;
  endDate: string;

  status: CampStatus;

  products:
    CampFormProductInput[];

  instructions: string;
}

export interface CampResponse {
  success: boolean;
  message?: string;
  data: Camp;
}

export interface CampListResponse {
  success: boolean;
  data: Camp[];
  pagination: Pagination;
}

export interface CampQrData {
  campId: string;
  campName: string;
  campCode: string;
  publicUrl: string;
  qrCodeDataUrl: string;
}

export interface CampQrResponse {
  success: boolean;
  data: CampQrData;
}

export interface PublicCampVariant {
  variantId: string;
  size: string;
  sku: string;
}

export interface PublicCampProduct {
  productId: string;
  productName: string;
  productCode: string;

  gender:
    | "MALE"
    | "FEMALE"
    | "UNISEX";

  variants: PublicCampVariant[];
}

export interface PublicCamp {
  campName: string;
  campCode: string;

  schoolName: string;
  schoolCode: string;

  startDate: string;
  endDate: string;

  instructions: string;

  products: PublicCampProduct[];
}

export interface PublicCampResponse {
  success: boolean;
  data: PublicCamp;
}

export interface PublicCampOrderItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface PublicCampOrderInput {
  studentName: string;
  className: string;
  section: string;

  parentName: string;
  contactNumber: string;
  email: string;

  items: PublicCampOrderItemInput[];

  remarks: string;
}

export interface PublicCampOrderResult {
  invoiceId: string;
  invoiceNumber: string;

  studentName: string;
  schoolName: string;

  grandTotal: number;

  paymentStatus:
    | "PENDING"
    | "PARTIALLY_PAID"
    | "PAID";
}

export interface PublicCampOrderResponse {
  success: boolean;
  message: string;
  data: PublicCampOrderResult;
}