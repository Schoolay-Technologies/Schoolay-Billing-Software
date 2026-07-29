import { api } from "./axios";

import type {
  CreateSchoolInput,
  SchoolResponse,
  SchoolsResponse,
  SchoolStatus
} from "../types/school.types";

interface GetSchoolsParameters {
  search?: string;
  status?: SchoolStatus | "";
  page?: number;
  limit?: number;
}

export async function getSchools(
  parameters: GetSchoolsParameters = {}
): Promise<SchoolsResponse> {
  const response = await api.get<SchoolsResponse>("/schools", {
    params: parameters
  });

  return response.data;
}

export async function createSchool(
  input: CreateSchoolInput
): Promise<SchoolResponse> {
  const response = await api.post<SchoolResponse>(
    "/schools",
    input
  );

  return response.data;
}

export async function updateSchoolStatus(
  schoolId: string,
  status: SchoolStatus
): Promise<SchoolResponse> {
  const response = await api.patch<SchoolResponse>(
    `/schools/${schoolId}/status`,
    { status }
  );

  return response.data;
}