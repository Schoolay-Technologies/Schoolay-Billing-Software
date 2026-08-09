export type StoreName =
  | "MANDUR_STORE"
  | "TIPPASANDRA_STORE"
  | "BANASWADI_STORE";

export interface StorePreOrderInput {
  schoolId: string;
  quantity: number;
  amountCollected: number;
}

export interface CreateStoreReportInput {
  storeName:
    StoreName;

  reportDate:
    string;

  openingTime:
    string;

  closingTime:
    string;

  totalCustomers:
    number;

  preOrders:
    StorePreOrderInput[];

  directPurchaseQuantity:
    number;

  directPurchaseAmount:
    number;

  directPurchaseOnlineAmount:
    number;

  directPurchaseCashAmount:
    number;

  exchangesRaised:
    number;

  exchangesFulfilled:
    number;

  exchangePendingReason:
    string;

  remarks:
    string;
}

export interface StoreReportPreOrder {
  _id: string;

  schoolId: string;

  schoolName: string;

  schoolCode: string;

  quantity: number;

  amountCollected:
    number;
}

export interface StoreReport {
  _id: string;

  storeName:
    StoreName;

  reportDate:
    string;

  openingTime:
    string;

  closingTime:
    string;

  totalCustomers:
    number;

  preOrders:
    StoreReportPreOrder[];

  totalPreOrderQuantity:
    number;

  totalPreOrderAmount:
    number;

  directPurchaseQuantity:
    number;

  directPurchaseAmount:
    number;

  directPurchaseOnlineAmount:
    number;

  directPurchaseCashAmount:
    number;

  exchangesRaised:
    number;

  exchangesFulfilled:
    number;

  exchangesPending:
    number;

  exchangePendingReason:
    string;

  totalAmountCollected:
    number;

  remarks:
    string;

  createdAt: string;
  updatedAt: string;
}

export interface StoreMtdSummary {
  totalAmountCollected:
    number;

  totalCustomers:
    number;

  totalPreOrders:
    number;

  totalDirectPurchases:
    number;

  totalExchangesRaised:
    number;

  totalExchangesFulfilled:
    number;
}