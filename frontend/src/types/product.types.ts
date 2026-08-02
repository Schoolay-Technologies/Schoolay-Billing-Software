import type {
  Pagination,
  School
} from "./school.types";

export type ProductGender =
  | "MALE"
  | "FEMALE"
  | "UNISEX";

export type ProductStatus =
  | "ACTIVE"
  | "INACTIVE";

export interface ProductVariant {
  _id: string;
  size: string;
  unitPrice: number;
  gstPercentage: number;
  gstAmount: number;
  sellingPrice: number;
  sku: string;
  status: ProductStatus;
}

export interface Product {
  _id: string;
  schoolId: Pick<
    School,
    "_id" | "schoolName" | "schoolCode" | "status"
  >;
  productName: string;
  productCode: string;
  gender: ProductGender;
  variants: ProductVariant[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariantInput {
  size: string;
  unitPrice: number;
  gstPercentage: number;
  status: ProductStatus;
}

export interface CreateProductInput {
  schoolId: string;
  productName: string;
  gender: ProductGender;
  variants: ProductVariantInput[];
  status: ProductStatus;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: Pagination;
}

export interface ProductResponse {
  success: boolean;
  message?: string;
  data: Product;
}