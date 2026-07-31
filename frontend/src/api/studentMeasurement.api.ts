import axios from "axios";

import {
  api
} from "./axios";

import type {
  CloudinaryUploadResponse,
  StudentMeasurementInput,
  StudentMeasurementListParameters,
  StudentMeasurementListResponse,
  StudentMeasurementReportFilters,
  StudentMeasurementResponse,
  StudentPhoto,
  StudentPhotoSignatureResponse
} from "../types/studentMeasurement.types";

function removeEmptyParameters<
  T extends object
>(
  values: T
): Record<
  string,
  string | number
> {
  const parameters: Record<
    string,
    string | number
  > = {};

  Object.entries(values).forEach(
    ([key, value]) => {
      if (
        typeof value === "string"
      ) {
        const trimmedValue =
          value.trim();

        if (trimmedValue) {
          parameters[key] =
            trimmedValue;
        }

        return;
      }

      if (
        typeof value === "number" &&
        Number.isFinite(value)
      ) {
        parameters[key] =
          value;
      }
    }
  );

  return parameters;
}

export async function getStudentMeasurements(
  parameters:
    StudentMeasurementListParameters = {}
): Promise<
  StudentMeasurementListResponse
> {
  const response =
    await api.get<
      StudentMeasurementListResponse
    >(
      "/student-measurements",
      {
        params:
          removeEmptyParameters(
            parameters
          )
      }
    );

  return response.data;
}

export async function getStudentMeasurementById(
  id: string
): Promise<
  StudentMeasurementResponse
> {
  const response =
    await api.get<
      StudentMeasurementResponse
    >(
      `/student-measurements/${id}`
    );

  return response.data;
}

export async function createStudentMeasurement(
  input:
    StudentMeasurementInput
): Promise<
  StudentMeasurementResponse
> {
  const response =
    await api.post<
      StudentMeasurementResponse
    >(
      "/student-measurements",
      input
    );

  return response.data;
}

export async function updateStudentMeasurement(
  id: string,
  input:
    StudentMeasurementInput
): Promise<
  StudentMeasurementResponse
> {
  const response =
    await api.patch<
      StudentMeasurementResponse
    >(
      `/student-measurements/${id}`,
      input
    );

  return response.data;
}

export async function deleteStudentMeasurement(
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
      `/student-measurements/${id}`
    );

  return response.data;
}

export async function getStudentPhotoSignature() {
  const response =
    await api.get<
      StudentPhotoSignatureResponse
    >(
      "/student-measurements/photo/signature"
    );

  return response.data.data;
}

export async function uploadStudentPhoto(
  file: File
): Promise<StudentPhoto> {
  const signature =
    await getStudentPhotoSignature();

  const uploadData =
    new FormData();

  uploadData.append(
    "file",
    file
  );

  uploadData.append(
    "api_key",
    signature.apiKey
  );

  uploadData.append(
    "timestamp",
    String(
      signature.timestamp
    )
  );

  uploadData.append(
    "signature",
    signature.signature
  );

  uploadData.append(
    "folder",
    signature.folder
  );

  const uploadUrl =
    `https://api.cloudinary.com/v1_1/` +
    `${encodeURIComponent(
      signature.cloudName
    )}/image/upload`;

  const response =
    await axios.post<
      CloudinaryUploadResponse
    >(
      uploadUrl,
      uploadData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data"
        }
      }
    );

  return {
    url:
      response.data.secure_url,

    publicId:
      response.data.public_id,

    width:
      response.data.width,

    height:
      response.data.height
  };
}

export async function getStudentMeasurementReportData(
  filters:
    StudentMeasurementReportFilters
): Promise<{
  success: boolean;
  data:
    StudentMeasurementResponse["data"][];
}> {
  const response =
    await api.get<{
      success: boolean;
      data:
        StudentMeasurementResponse["data"][];
    }>(
      "/student-measurements/reports/data",
      {
        params:
          removeEmptyParameters(
            filters
          )
      }
    );

  return response.data;
}

export async function downloadStudentMeasurementExcel(
  filters:
    StudentMeasurementReportFilters
): Promise<void> {
  const response =
    await api.get<Blob>(
      "/student-measurements/reports/excel",
      {
        params:
          removeEmptyParameters(
            filters
          ),

        responseType: "blob"
      }
    );

  const fileBlob =
    new Blob(
      [response.data],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    );

  const downloadUrl =
    window.URL.createObjectURL(
      fileBlob
    );

  const link =
    document.createElement("a");

  const currentDate =
    new Date()
      .toISOString()
      .slice(0, 10);

  link.href = downloadUrl;

  link.download =
    `Student-Measurement-Report-${currentDate}.xlsx`;

  document.body.appendChild(
    link
  );

  link.click();
  link.remove();

  window.URL.revokeObjectURL(
    downloadUrl
  );
}