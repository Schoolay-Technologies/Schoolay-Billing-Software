import { api } from "./axios";

import type {
  CreateStudentSizeRecordInput,
  StudentGender,
  StudentSizeRecordListResponse,
  StudentSizeRecordResponse,
  StudentSizeRecordStatus,
  StudentSizeReportFilters
} from "../types/studentSizeRecord.types";

interface GetStudentSizeRecordsParameters {
  schoolId?: string;
  search?: string;
  className?: string;
  section?: string;
  gender?: StudentGender | "";
  status?: StudentSizeRecordStatus | "";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

function removeEmptyParameters<T extends object>(
  parameters: T
): Record<string, string | number> {
  const cleanedParameters: Record<
    string,
    string | number
  > = {};

  Object.entries(parameters).forEach(
    ([key, value]) => {
      if (
        typeof value === "string" &&
        value.trim().length > 0
      ) {
        cleanedParameters[key] =
          value.trim();

        return;
      }

      if (
        typeof value === "number" &&
        Number.isFinite(value)
      ) {
        cleanedParameters[key] = value;
      }
    }
  );

  return cleanedParameters;
}

export async function getStudentSizeRecords(
  parameters: GetStudentSizeRecordsParameters = {}
): Promise<StudentSizeRecordListResponse> {
  const response =
    await api.get<StudentSizeRecordListResponse>(
      "/student-size-records",
      {
        params:
          removeEmptyParameters(
            parameters
          )
      }
    );

  return response.data;
}

export async function getStudentSizeRecordById(
  id: string
): Promise<StudentSizeRecordResponse> {
  const response =
    await api.get<StudentSizeRecordResponse>(
      `/student-size-records/${id}`
    );

  return response.data;
}

export async function createStudentSizeRecord(
  input: CreateStudentSizeRecordInput
): Promise<StudentSizeRecordResponse> {
  const response =
    await api.post<StudentSizeRecordResponse>(
      "/student-size-records",
      input
    );

  return response.data;
}

export async function updateStudentSizeRecord(
  id: string,
  input: CreateStudentSizeRecordInput
): Promise<StudentSizeRecordResponse> {
  const response =
    await api.patch<StudentSizeRecordResponse>(
      `/student-size-records/${id}`,
      input
    );

  return response.data;
}

export async function deleteStudentSizeRecord(
  id: string
): Promise<{
  success: boolean;
  message: string;
}> {
  const response =
    await api.delete<{
      success: boolean;
      message: string;
    }>(
      `/student-size-records/${id}`
    );

  return response.data;
}

export async function downloadStudentSizeExcel(
  filters: StudentSizeReportFilters
): Promise<void> {
  const response = await api.get<Blob>(
    "/student-size-records/reports/excel",
    {
      params:
        removeEmptyParameters(
          filters
        ),

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

  const currentDate =
    new Date()
      .toISOString()
      .slice(0, 10);

  link.href = url;

  link.download =
    `Student-Size-Report-${currentDate}.xlsx`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(url);
}