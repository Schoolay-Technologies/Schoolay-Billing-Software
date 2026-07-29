import { api } from "./axios";

import type {
  ProductionDataResponse,
  ProductionFilters,
  ProductionMatrixResponse
} from "../types/production.types";

function createProductionParams(
  filters: ProductionFilters
): Record<string, string> {
  const params: Record<string, string> = {
    groupBy: filters.groupBy
  };

  if (filters.dateFrom) {
    params.dateFrom = filters.dateFrom;
  }

  if (filters.dateTo) {
    params.dateTo = filters.dateTo;
  }

  if (filters.schoolId) {
    params.schoolId = filters.schoolId;
  }

  if (filters.productId) {
    params.productId = filters.productId;
  }

  if (filters.gender) {
    params.gender = filters.gender;
  }

  if (filters.size.trim()) {
    params.size = filters.size.trim();
  }

  if (filters.className.trim()) {
    params.className = filters.className.trim();
  }

  return params;
}

export async function getProductionData(
  filters: ProductionFilters
): Promise<ProductionDataResponse> {
  const response =
    await api.get<ProductionDataResponse>(
      "/production/data",
      {
        params:
          createProductionParams(filters)
      }
    );

  return response.data;
}

export async function getProductionMatrix(
  filters: ProductionFilters
): Promise<ProductionMatrixResponse> {
  const response =
    await api.get<ProductionMatrixResponse>(
      "/production/matrix",
      {
        params:
          createProductionParams(filters)
      }
    );

  return response.data;
}

export async function downloadProductionExcel(
  filters: ProductionFilters
): Promise<void> {
  const response = await api.get<Blob>(
    "/production/export/excel",
    {
      params:
        createProductionParams(filters),

      responseType: "blob"
    }
  );

  const blob = new Blob(
    [response.data],
    {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  );

  const url =
    window.URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  link.href = url;
  link.download =
    `Production-Report-${today}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}