import { api } from "./axios";

import type {
  ReportFilters,
  ReportResponse,
  ReportType
} from "../types/report.types";

function createReportParams(
  filters: ReportFilters
): Record<string, string> {
  const params: Record<string, string> = {
    schoolId: filters.schoolId
  };

  if (filters.dateFrom) {
    params.dateFrom = filters.dateFrom;
  }

  if (filters.dateTo) {
    params.dateTo = filters.dateTo;
  }

  if (filters.studentName.trim()) {
    params.studentName =
      filters.studentName.trim();
  }

  if (filters.className.trim()) {
    params.className =
      filters.className.trim();
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

  if (filters.paymentMode) {
    params.paymentMode =
      filters.paymentMode;
  }

  return params;
}

export async function getReport(
  reportType: ReportType,
  filters: ReportFilters
): Promise<ReportResponse> {
  const response =
    await api.get<ReportResponse>(
      `/reports/${reportType}`,
      {
        params: createReportParams(filters)
      }
    );

  return response.data;
}

export async function downloadReportExcel(
  reportType: ReportType,
  filters: ReportFilters
): Promise<void> {
  const response = await api.get<Blob>(
    `/reports/${reportType}/excel`,
    {
      params: createReportParams(filters),
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

  const currentDate = new Date()
    .toISOString()
    .slice(0, 10);

  const reportName = reportType
    .toLowerCase()
    .replaceAll("_", "-");

  link.href = url;
  link.download =
    `${reportName}-${currentDate}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}