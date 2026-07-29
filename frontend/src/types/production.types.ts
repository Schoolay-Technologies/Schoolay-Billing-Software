export type ProductionGender =
  | "MALE"
  | "FEMALE"
  | "UNISEX";

export type ProductionGroup =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "ENTIRE_SEASON";

export interface ProductionFilters {
  dateFrom: string;
  dateTo: string;
  schoolId: string;
  productId: string;
  gender: ProductionGender | "";
  size: string;
  className: string;
  groupBy: ProductionGroup;
}

export interface ProductionRow {
  period: string;
  date: string;

  schoolId: string;
  schoolName: string;
  schoolCode: string;

  productId: string;
  productName: string;
  productCode: string;

  gender: ProductionGender;
  size: string;
  className: string;

  totalQuantity: number;
}

export interface ProductionSummary {
  totalQuantity: number;
  totalRows: number;
  uniqueSchools: number;
  uniqueProducts: number;
  uniqueSizes: number;
}

export interface ProductionDataResponse {
  success: boolean;
  data: ProductionRow[];
  summary: ProductionSummary;
}

export interface ProductionMatrixRow {
  productId: string;
  productName: string;
  productCode: string;
  gender: ProductionGender;
  sizes: Record<string, number>;
  total: number;
}

export interface ProductionMatrixResponse {
  success: boolean;
  data: ProductionMatrixRow[];
  sizes: string[];
  summary: ProductionSummary;
}