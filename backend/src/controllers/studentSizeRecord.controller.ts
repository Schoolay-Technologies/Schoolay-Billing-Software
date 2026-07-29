import type {
  NextFunction,
  Request,
  RequestHandler,
  Response
} from "express";

import type {
  CreateStudentSizeRecordInput,
  UpdateStudentSizeRecordInput
} from "../schemas/studentSizeRecord.schema.js";

import {
  createStudentSizeRecord,
  deleteStudentSizeRecord,
  generateStudentSizeExcel,
  getStudentSizeRecordById,
  getStudentSizeRecords,
  getStudentSizeReportData,
  updateStudentSizeRecord
} from "../services/studentSizeRecord.service.js";

function getStringQuery(
  request: Request,
  field: string
): string | undefined {
  const value = request.query[field];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0
    ? trimmedValue
    : undefined;
}

function getGenderQuery(
  request: Request
): "MALE" | "FEMALE" | "UNISEX" | undefined {
  const value = getStringQuery(
    request,
    "gender"
  );

  if (
    value === "MALE" ||
    value === "FEMALE" ||
    value === "UNISEX"
  ) {
    return value;
  }

  return undefined;
}

function getStatusQuery(
  request: Request
): "ACTIVE" | "INACTIVE" | undefined {
  const value = getStringQuery(
    request,
    "status"
  );

  if (
    value === "ACTIVE" ||
    value === "INACTIVE"
  ) {
    return value;
  }

  return undefined;
}

function getPositiveNumberQuery(
  request: Request,
  field: string,
  defaultValue: number
): number {
  const value = getStringQuery(
    request,
    field
  );

  if (!value) {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 1
  ) {
    return defaultValue;
  }

  return Math.floor(parsedValue);
}

function getRecordId(
  request: Request
): string {
  const id = request.params.id;

  if (
    typeof id !== "string" ||
    id.trim().length === 0
  ) {
    throw new Error(
      "Student size record ID is required."
    );
  }

  return id.trim();
}

function getRequiredSchoolId(
  request: Request
): string {
  const schoolId = getStringQuery(
    request,
    "schoolId"
  );

  if (!schoolId) {
    throw new Error(
      "School is required."
    );
  }

  return schoolId;
}

export const createStudentSizeRecordController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input =
        request.body as CreateStudentSizeRecordInput;

      const record =
        await createStudentSizeRecord(
          input
        );

      response.status(201).json({
        success: true,
        message:
          "Student size record created successfully.",
        data: record
      });
    } catch (error) {
      next(error);
    }
  };

export const getStudentSizeRecordsController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await getStudentSizeRecords({
          schoolId:
            getStringQuery(
              request,
              "schoolId"
            ),

          search:
            getStringQuery(
              request,
              "search"
            ),

          className:
            getStringQuery(
              request,
              "className"
            ),

          section:
            getStringQuery(
              request,
              "section"
            ),

          gender:
            getGenderQuery(request),

          status:
            getStatusQuery(request),

          dateFrom:
            getStringQuery(
              request,
              "dateFrom"
            ),

          dateTo:
            getStringQuery(
              request,
              "dateTo"
            ),

          page:
            getPositiveNumberQuery(
              request,
              "page",
              1
            ),

          limit:
            getPositiveNumberQuery(
              request,
              "limit",
              10
            )
        });

      response.status(200).json({
        success: true,
        data: result.records,
        pagination:
          result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

export const getStudentSizeRecordByIdController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const record =
        await getStudentSizeRecordById(
          getRecordId(request)
        );

      response.status(200).json({
        success: true,
        data: record
      });
    } catch (error) {
      next(error);
    }
  };

export const updateStudentSizeRecordController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input =
        request.body as UpdateStudentSizeRecordInput;

      const record =
        await updateStudentSizeRecord(
          getRecordId(request),
          input
        );

      response.status(200).json({
        success: true,
        message:
          "Student size record updated successfully.",
        data: record
      });
    } catch (error) {
      next(error);
    }
  };

export const deleteStudentSizeRecordController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await deleteStudentSizeRecord(
        getRecordId(request)
      );

      response.status(200).json({
        success: true,
        message:
          "Student size record deleted successfully."
      });
    } catch (error) {
      next(error);
    }
  };

export const getStudentSizeReportController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data =
        await getStudentSizeReportData({
          schoolId:
            getRequiredSchoolId(
              request
            ),

          dateFrom:
            getStringQuery(
              request,
              "dateFrom"
            ),

          dateTo:
            getStringQuery(
              request,
              "dateTo"
            ),

          className:
            getStringQuery(
              request,
              "className"
            ),

          section:
            getStringQuery(
              request,
              "section"
            ),

          gender:
            getGenderQuery(request),

          productId:
            getStringQuery(
              request,
              "productId"
            )
        });

      response.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  };

export const downloadStudentSizeExcelController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const buffer =
        await generateStudentSizeExcel({
          schoolId:
            getRequiredSchoolId(
              request
            ),

          dateFrom:
            getStringQuery(
              request,
              "dateFrom"
            ),

          dateTo:
            getStringQuery(
              request,
              "dateTo"
            ),

          className:
            getStringQuery(
              request,
              "className"
            ),

          section:
            getStringQuery(
              request,
              "section"
            ),

          gender:
            getGenderQuery(request),

          productId:
            getStringQuery(
              request,
              "productId"
            )
        });

      const date = new Date()
        .toISOString()
        .slice(0, 10);

      response.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      response.setHeader(
        "Content-Disposition",
        `attachment; filename="Student-Size-Report-${date}.xlsx"`
      );

      response
        .status(200)
        .send(buffer);
    } catch (error) {
      next(error);
    }
  };