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