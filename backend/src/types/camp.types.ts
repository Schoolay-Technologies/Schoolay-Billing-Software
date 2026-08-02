export const CAMP_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "CLOSED"
] as const;

export type CampStatus =
  (typeof CAMP_STATUSES)[number];

export interface CampVariantInput {
  variantId: string;
}

export interface CampProductInput {
  productId: string;
  variants: CampVariantInput[];
}

export interface PublicCampOrderItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}