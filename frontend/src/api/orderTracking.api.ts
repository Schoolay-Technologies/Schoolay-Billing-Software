import { api } from "./axios";

import type {
  ExchangeStatus,
  FulfilmentStatus,
  OrderTrackingListResponse,
  OrderTrackingResponse,
  UpdateDistributionInput
} from "../types/orderTracking.types";

interface GetTrackingParameters {
  schoolId?: string;
  invoiceNumber?: string;
  studentName?: string;
  search?: string;
  searchType?: "invoice" | "student" | "both";
  fromDate?: string;
  toDate?: string;
  fulfilmentStatus?:
    | FulfilmentStatus
    | "";
  placeOfOrder?: string;
  page?: number;
  limit?: number;
}

export async function getOrderTrackingList(
  parameters: GetTrackingParameters = {}
): Promise<OrderTrackingListResponse> {
  const response =
    await api.get<OrderTrackingListResponse>(
      "/order-tracking",
      {
        params: parameters
      }
    );

  return response.data;
}

export async function getOrderTrackingById(
  invoiceId: string
): Promise<OrderTrackingResponse> {
  const response =
    await api.get<OrderTrackingResponse>(
      `/order-tracking/${invoiceId}`
    );

  return response.data;
}

export async function updateOrderDistribution(
  invoiceId: string,
  input: UpdateDistributionInput
): Promise<OrderTrackingResponse> {
  const response =
    await api.patch<OrderTrackingResponse>(
      `/order-tracking/${invoiceId}/distribution`,
      input
    );

  return response.data;
}

export async function updateExchangeStatus(
  invoiceId: string,
  exchangeId: string,
  status: ExchangeStatus
): Promise<OrderTrackingResponse> {
  const response =
    await api.patch<OrderTrackingResponse>(
      `/order-tracking/${invoiceId}/exchanges/${exchangeId}`,
      {
        status
      }
    );

  return response.data;
}