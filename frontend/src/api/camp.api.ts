import { api } from "./axios";

import type {
  Camp,
  CampFormInput,
  CampListResponse,
  CampQrResponse,
  CampResponse,
  CampStatus
} from "../types/camp.types";

export interface GetCampsParameters {
  schoolId?: string;
  search?: string;
  status?: CampStatus | "";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

function removeEmptyParameters<T extends object>(
  values: T
): Record<string, string | number> {
  const parameters: Record<
    string,
    string | number
  > = {};

  Object.entries(values).forEach(
    ([key, value]) => {
      if (
        typeof value === "string" &&
        value.trim()
      ) {
        parameters[key] =
          value.trim();

        return;
      }

      if (
        typeof value === "number" &&
        Number.isFinite(value)
      ) {
        parameters[key] = value;
      }
    }
  );

  return parameters;
}

export async function getCamps(
  parameters: GetCampsParameters = {}
): Promise<CampListResponse> {
  const response =
    await api.get<CampListResponse>(
      "/camps",
      {
        params:
          removeEmptyParameters(
            parameters
          )
      }
    );

  return response.data;
}

export async function getCampById(
  id: string
): Promise<CampResponse> {
  const response =
    await api.get<CampResponse>(
      `/camps/${id}`
    );

  return response.data;
}

export async function createCamp(
  input: CampFormInput
): Promise<CampResponse> {
  const response =
    await api.post<CampResponse>(
      "/camps",
      input
    );

  return response.data;
}

export async function updateCamp(
  id: string,
  input: CampFormInput
): Promise<CampResponse> {
  const response =
    await api.patch<CampResponse>(
      `/camps/${id}`,
      input
    );

  return response.data;
}

export async function activateCamp(
  id: string
): Promise<CampResponse> {
  const response =
    await api.patch<CampResponse>(
      `/camps/${id}/activate`
    );

  return response.data;
}

export async function closeCamp(
  id: string
): Promise<CampResponse> {
  const response =
    await api.patch<CampResponse>(
      `/camps/${id}/close`
    );

  return response.data;
}

export async function deleteCamp(
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
      `/camps/${id}`
    );

  return response.data;
}

export async function getCampQrCode(
  id: string
): Promise<CampQrResponse> {
  const response =
    await api.get<CampQrResponse>(
      `/camps/${id}/qr`
    );

  return response.data;
}

export async function downloadQrImage(
  qrCodeDataUrl: string,
  campCode: string
): Promise<void> {
  const link =
    document.createElement("a");

  link.href = qrCodeDataUrl;

  link.download =
    `${campCode}-QR.png`;

  document.body.appendChild(link);

  link.click();
  link.remove();
}

export async function copyPublicCampLink(
  publicUrl: string
): Promise<void> {
  if (
    navigator.clipboard &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(
      publicUrl
    );

    return;
  }

  const textArea =
    document.createElement(
      "textarea"
    );

  textArea.value = publicUrl;
  textArea.style.position =
    "fixed";
  textArea.style.opacity = "0";

  document.body.appendChild(
    textArea
  );

  textArea.select();

  document.execCommand("copy");

  textArea.remove();
}

export async function sharePublicCampLink(
  campName: string,
  publicUrl: string
): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  await navigator.share({
    title: campName,
    text:
      `Submit uniform requirements for ${campName}`,
    url: publicUrl
  });

  return true;
}