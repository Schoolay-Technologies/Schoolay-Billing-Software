import { api } from "./axios";

import type {
  CreateInvoiceInput,
  InvoiceResponse,
  InvoicesResponse,
  InvoiceStatus,
  PaymentStatus
} from "../types/invoice.types";

interface GetInvoicesParameters {
  schoolId?: string;
  search?: string;
  invoiceStatus?: InvoiceStatus | "";
  paymentStatus?: PaymentStatus | "";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export async function createInvoice(
  input: CreateInvoiceInput
): Promise<InvoiceResponse> {
  const response =
    await api.post<InvoiceResponse>(
      "/invoices",
      input
    );

  return response.data;
}

export async function getInvoices(
  parameters: GetInvoicesParameters = {}
): Promise<InvoicesResponse> {
  const response =
    await api.get<InvoicesResponse>(
      "/invoices",
      {
        params: parameters
      }
    );

  return response.data;
}

export async function getInvoiceById(
  invoiceId: string
): Promise<InvoiceResponse> {
  const response =
    await api.get<InvoiceResponse>(
      `/invoices/${invoiceId}`
    );

  return response.data;
}

export async function changeInvoiceStatus(
  invoiceId: string,
  invoiceStatus:
    | "DRAFT"
    | "COMPLETED"
): Promise<InvoiceResponse> {
  const response =
    await api.patch<InvoiceResponse>(
      `/invoices/${invoiceId}/status`,
      {
        invoiceStatus
      }
    );

  return response.data;
}

export async function updateInvoice(
  invoiceId: string,
  input: CreateInvoiceInput
): Promise<InvoiceResponse> {
  const response =
    await api.patch<InvoiceResponse>(
      `/invoices/${invoiceId}`,
      input
    );

  return response.data;
}

export async function cancelInvoice(
  invoiceId: string,
  cancellationReason: string
): Promise<InvoiceResponse> {
  const response =
    await api.patch<InvoiceResponse>(
      `/invoices/${invoiceId}/cancel`,
      {
        cancellationReason
      }
    );

  return response.data;
}