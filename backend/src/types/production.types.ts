export const PRODUCTION_GROUPS = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "ENTIRE_SEASON"
] as const;

export type ProductionGroup =
  (typeof PRODUCTION_GROUPS)[number];

export const PRODUCTION_GENDERS = [
  "MALE",
  "FEMALE",
  "UNISEX"
] as const;

export type ProductionGender =
  (typeof PRODUCTION_GENDERS)[number];

export interface ProductionFilters {
  dateFrom?: string;
  dateTo?: string;
  schoolId?: string;
  productId?: string;
  gender?: ProductionGender;
  size?: string;
  className?: string;
  groupBy?: ProductionGroup;
}