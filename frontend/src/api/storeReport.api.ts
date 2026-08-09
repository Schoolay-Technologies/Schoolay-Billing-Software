import {
  api
} from "./axios";

import type {
  CreateStoreReportInput,
  StoreMtdSummary,
  StoreName,
  StoreReport
} from "../types/storeReport.types";

export async function createStoreReport(
  input:
    CreateStoreReportInput
) {
  const response =
    await api.post<{
      success: boolean;
      message: string;
      data: StoreReport;
    }>(
      "/store-reports",
      input
    );

  return response.data;
}

export async function getStoreReports(
  params: {
    storeName?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }
) {
  const response =
    await api.get<{
      success: boolean;

      data:
        StoreReport[];

      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages:
          number;
      };
    }>(
      "/store-reports",
      {
        params
      }
    );

  return response.data;
}

export async function getStoreMtd(
  storeName:
    StoreName,
  fromDate: string,
  toDate: string
) {
  const response =
    await api.get<{
      success: boolean;
      data:
        StoreMtdSummary;
    }>(
      "/store-reports/mtd",
      {
        params: {
          storeName,
          fromDate,
          toDate
        }
      }
    );

  return response.data;
}

export async function downloadStoreReportsExcel(
  storeName: string,
  fromDate: string,
  toDate: string
): Promise<void> {
  const response =
    await api.get<Blob>(
      "/store-reports/export/excel",
      {
        params: {
          storeName:
            storeName ||
            undefined,

          fromDate,
          toDate
        },

        responseType:
          "blob"
      }
    );

  const url =
    window.URL
      .createObjectURL(
        response.data
      );

  const link =
    document
      .createElement(
        "a"
      );

  link.href = url;

  link.download =
    `Store-Reports-${fromDate}-to-${toDate}.xlsx`;

  document.body
    .appendChild(link);

  link.click();

  link.remove();

  window.URL
    .revokeObjectURL(
      url
    );
}