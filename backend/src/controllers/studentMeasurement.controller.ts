import type {
  NextFunction,
  Request,
  RequestHandler,
  Response
} from "express";

import type {
  StudentMeasurementInput
} from "../schemas/studentMeasurement.schema.js";

import {
  createStudentMeasurement,
  deleteStudentMeasurement,
  generateStudentMeasurementExcel,
  getStudentMeasurementById,
  getStudentMeasurementReportData,
  getStudentMeasurements,
  updateStudentMeasurement
} from "../services/studentMeasurement.service.js";

type StudentGender =
  | "MALE"
  | "FEMALE"
  | "UNISEX";

type MeasurementRecordStatus =
  | "ACTIVE"
  | "INACTIVE";

interface StudentMeasurementListOptions {
  schoolId?: string;
  search?: string;
  className?: string;
  section?: string;
  gender?: StudentGender;
  academicYear?: string;
  status?: MeasurementRecordStatus;
  dateFrom?: string;
  dateTo?: string;
  productId?: string;
  size?: string;
  page?: number;
  limit?: number;
}

interface StudentMeasurementReportFilters {
  schoolId: string;
  dateFrom?: string;
  dateTo?: string;
  className?: string;
  section?: string;
  gender?: StudentGender;
  academicYear?: string;
  productId?: string;
  size?: string;
}

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

function getPositiveIntegerQuery(
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

function getGenderQuery(
  request: Request
): StudentGender | undefined {
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
): MeasurementRecordStatus | undefined {
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

function getRecordId(
  request: Request
): string {
  const id = request.params.id;

  if (
    typeof id !== "string" ||
    id.trim().length === 0
  ) {
    throw new Error(
      "Student measurement record ID is required."
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

function getListOptions(
  request: Request
): StudentMeasurementListOptions {
  return {
    schoolId: getStringQuery(
      request,
      "schoolId"
    ),

    search: getStringQuery(
      request,
      "search"
    ),

    className: getStringQuery(
      request,
      "className"
    ),

    section: getStringQuery(
      request,
      "section"
    ),

    gender: getGenderQuery(request),

    academicYear: getStringQuery(
      request,
      "academicYear"
    ),

    status: getStatusQuery(request),

    dateFrom: getStringQuery(
      request,
      "dateFrom"
    ),

    dateTo: getStringQuery(
      request,
      "dateTo"
    ),

    productId: getStringQuery(
      request,
      "productId"
    ),

    size: getStringQuery(
      request,
      "size"
    ),

    page: getPositiveIntegerQuery(
      request,
      "page",
      1
    ),

    limit: getPositiveIntegerQuery(
      request,
      "limit",
      10
    )
  };
}

function getReportFilters(
  request: Request
): StudentMeasurementReportFilters {
  return {
    schoolId:
      getRequiredSchoolId(request),

    dateFrom: getStringQuery(
      request,
      "dateFrom"
    ),

    dateTo: getStringQuery(
      request,
      "dateTo"
    ),

    className: getStringQuery(
      request,
      "className"
    ),

    section: getStringQuery(
      request,
      "section"
    ),

    gender: getGenderQuery(request),

    academicYear: getStringQuery(
      request,
      "academicYear"
    ),

    productId: getStringQuery(
      request,
      "productId"
    ),

    size: getStringQuery(
      request,
      "size"
    )
  };
}

export const createStudentMeasurementController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input =
        request.body as StudentMeasurementInput;

      const record =
        await createStudentMeasurement(
          input
        );

      response.status(201).json({
        success: true,
        message:
          "Student measurement record created successfully.",
        data: record
      });
    } catch (error) {
      next(error);
    }
  };

export const getStudentMeasurementsController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await getStudentMeasurements(
          getListOptions(request)
        );

      /*
       * The service should return:
       * {
       *   records: StudentMeasurement[],
       *   pagination: {
       *     page,
       *     limit,
       *     total,
       *     totalPages
       *   }
       * }
       */
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

export const getStudentMeasurementByIdController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const record =
        await getStudentMeasurementById(
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

export const updateStudentMeasurementController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input =
        request.body as StudentMeasurementInput;

      const record =
        await updateStudentMeasurement(
          getRecordId(request),
          input
        );

      response.status(200).json({
        success: true,
        message:
          "Student measurement record updated successfully.",
        data: record
      });
    } catch (error) {
      next(error);
    }
  };

export const deleteStudentMeasurementController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await deleteStudentMeasurement(
        getRecordId(request)
      );

      response.status(200).json({
        success: true,
        message:
          "Student measurement record deleted successfully."
      });
    } catch (error) {
      next(error);
    }
  };

export const getStudentMeasurementReportController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data =
        await getStudentMeasurementReportData(
          getReportFilters(request)
        );

      response.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  };

export const downloadStudentMeasurementExcelController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters =
        getReportFilters(request);

      const buffer =
        await generateStudentMeasurementExcel(
          filters
        );

      const currentDate = new Date()
        .toISOString()
        .slice(0, 10);

      response.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      response.setHeader(
        "Content-Disposition",
        `attachment; filename="Student-Measurement-Report-${currentDate}.xlsx"`
      );

      response
        .status(200)
        .send(buffer);
    } catch (error) {
      next(error);
    }
  };