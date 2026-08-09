export const STORE_NAMES = [
  "MANDUR_STORE",
  "TIPPASANDRA_STORE",
  "BANASWADI_STORE"
] as const;

export type StoreName =
  (typeof STORE_NAMES)[number];

export interface StorePreOrderInput {
  schoolId: string;
  quantity: number;
  amountCollected: number;
}

export interface CreateStoreReportInput {
  storeName: StoreName;

  reportDate: string;

  openingTime: string;
  closingTime: string;

  totalCustomers: number;

  preOrders: StorePreOrderInput[];

  directPurchaseQuantity: number;

  directPurchaseAmount: number;

  directPurchaseOnlineAmount: number;

  directPurchaseCashAmount: number;

  exchangesRaised: number;

  exchangesFulfilled: number;

  exchangePendingReason: string;

  remarks: string;
}