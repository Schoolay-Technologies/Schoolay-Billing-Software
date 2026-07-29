import type {
  NextFunction,
  Request,
  RequestHandler,
  Response
} from "express";

import {
  generateReport,
  generateReportExcel
} from "../services/report.service.js";

import type {
  ReportFilters,
  ReportGender,
  ReportPaymentMode,
  ReportType
} from "../types/report.types.js";

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

function getReportType(
  request: Request
): ReportType {
  return request.params.reportType as ReportType;
}

function getReportFilters(
  request: Request
): ReportFilters {
  const schoolId = getStringQuery(
    request,
    "schoolId"
  );

  if (!schoolId) {
    throw new Error("School is required.");
  }

  const rawGender = getStringQuery(
    request,
    "gender"
  );

  const gender: ReportGender | undefined =
    rawGender === "MALE" ||
    rawGender === "FEMALE" ||
    rawGender === "UNISEX"
      ? rawGender
      : undefined;

  const rawPaymentMode = getStringQuery(
    request,
    "paymentMode"
  );

  const paymentMode:
    | ReportPaymentMode
    | undefined =
    rawPaymentMode === "CASH" ||
    rawPaymentMode === "CARD" ||
    rawPaymentMode === "ONLINE"
      ? rawPaymentMode
      : undefined;

  return {
    schoolId,

    dateFrom: getStringQuery(
      request,
      "dateFrom"
    ),

    dateTo: getStringQuery(
      request,
      "dateTo"
    ),

    studentName: getStringQuery(
      request,
      "studentName"
    ),

    className: getStringQuery(
      request,
      "className"
    ),

    productId: getStringQuery(
      request,
      "productId"
    ),

    gender,

    size: getStringQuery(
      request,
      "size"
    ),

    paymentMode
  };
}

export const getReportController: RequestHandler =
  async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const report = await generateReport(
        getReportType(request),
        getReportFilters(request)
      );

      response.status(200).json({
        success: true,
        title: report.title,
        reportType: report.reportType,
        columns: report.columns,
        data: report.rows,
        summary: report.summary
      });
    } catch (error) {
      next(error);
    }
  };

export const downloadReportExcelController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const reportType =
        getReportType(request);

      const buffer =
        await generateReportExcel(
          reportType,
          getReportFilters(request)
        );

      const currentDate = new Date()
        .toISOString()
        .slice(0, 10);

      const reportFileName = reportType
        .toLowerCase()
        .replaceAll("_", "-");

      response.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      response.setHeader(
        "Content-Disposition",
        `attachment; filename="${reportFileName}-${currentDate}.xlsx"`
      );

      response.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  };