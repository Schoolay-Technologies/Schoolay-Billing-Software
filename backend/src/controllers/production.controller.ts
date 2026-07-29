import type {
  NextFunction,
  Request,
  RequestHandler,
  Response
} from "express";

import {
  generateProductionExcel,
  getProductionData,
  getProductionMatrix
} from "../services/production.service.js";

import type {
  ProductionFilters,
  ProductionGender,
  ProductionGroup
} from "../types/production.types.js";

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

function getProductionFilters(
  request: Request
): ProductionFilters {
  const rawGender = getStringQuery(
    request,
    "gender"
  );

  const gender:
    | ProductionGender
    | undefined =
    rawGender === "MALE" ||
    rawGender === "FEMALE" ||
    rawGender === "UNISEX"
      ? rawGender
      : undefined;

  const rawGroupBy = getStringQuery(
    request,
    "groupBy"
  );

  const groupBy:
    | ProductionGroup
    | undefined =
    rawGroupBy === "DAILY" ||
    rawGroupBy === "WEEKLY" ||
    rawGroupBy === "MONTHLY" ||
    rawGroupBy === "ENTIRE_SEASON"
      ? rawGroupBy
      : "ENTIRE_SEASON";

  return {
    dateFrom: getStringQuery(
      request,
      "dateFrom"
    ),

    dateTo: getStringQuery(
      request,
      "dateTo"
    ),

    schoolId: getStringQuery(
      request,
      "schoolId"
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

    className: getStringQuery(
      request,
      "className"
    ),

    groupBy
  };
}

export const getProductionDataController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await getProductionData(
          getProductionFilters(request)
        );

      response.status(200).json({
        success: true,
        data: result.rows,
        summary: result.summary
      });
    } catch (error) {
      next(error);
    }
  };

export const getProductionMatrixController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result =
        await getProductionMatrix(
          getProductionFilters(request)
        );

      response.status(200).json({
        success: true,
        data: result.rows,
        sizes: result.sizes,
        summary: result.summary
      });
    } catch (error) {
      next(error);
    }
  };

export const downloadProductionExcelController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const buffer =
        await generateProductionExcel(
          getProductionFilters(request)
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
        `attachment; filename="Production-Report-${currentDate}.xlsx"`
      );

      response.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  };