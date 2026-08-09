import type {
  NextFunction,
  Request,
  RequestHandler,
  Response
} from "express";

import {
  createStoreReport,
  generateStoreReportsExcel,
  getStoreMtdSummary,
  getStoreReportById,
  getStoreReports
} from "../services/storeReport.service.js";

import type {
  CreateStoreReportInput
} from "../schemas/storeReport.schema.js";

import type {
  StoreName
} from "../types/storeReport.types.js";

export const createStoreReportController:
  RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const report =
        await createStoreReport(
          request.body as
            CreateStoreReportInput
        );

      response
        .status(201)
        .json({
          success: true,

          message:
            "Store report submitted successfully.",

          data: report
        });
    } catch (error) {
      next(error);
    }
  };

export const getStoreReportsController:
  RequestHandler = async (
    request,
    response,
    next
  ): Promise<void> => {
    try {
      const storeName =
        typeof request.query
          .storeName ===
        "string"
          ? request.query
              .storeName as
              StoreName
          : undefined;

      const result =
        await getStoreReports({
          storeName,

          fromDate:
            typeof request
              .query
              .fromDate ===
            "string"
              ? request
                  .query
                  .fromDate
              : undefined,

          toDate:
            typeof request
              .query
              .toDate ===
            "string"
              ? request
                  .query
                  .toDate
              : undefined,

          page:
            Number(
              request.query.page
            ) || 1,

          limit:
            Number(
              request.query.limit
            ) || 10
        });

      response.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  };

export const getStoreReportByIdController:
  RequestHandler = async (
    request,
    response,
    next
  ): Promise<void> => {
    try {
      const report =
        await getStoreReportById(
          request.params.id as
            string
        );

      response.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  };

export const getStoreMtdController:
  RequestHandler = async (
    request,
    response,
    next
  ): Promise<void> => {
    try {
      const storeName =
        request.query
          .storeName as
          StoreName;

      const fromDate =
        request.query
          .fromDate as string;

      const toDate =
        request.query
          .toDate as string;

      if (
        !storeName ||
        !fromDate ||
        !toDate
      ) {
        throw new Error(
          "Store, From Date and To Date are required."
        );
      }

      const data =
        await getStoreMtdSummary(
          storeName,
          fromDate,
          toDate
        );

      response.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  };

export const downloadStoreReportsExcelController:
  RequestHandler = async (
    request,
    response,
    next
  ): Promise<void> => {
    try {
      const fromDate =
        request.query
          .fromDate as string;

      const toDate =
        request.query
          .toDate as string;

      const storeName =
        typeof request
          .query
          .storeName ===
        "string"
          ? request
              .query
              .storeName as
              StoreName
          : undefined;

      if (
        !fromDate ||
        !toDate
      ) {
        throw new Error(
          "From Date and To Date are required."
        );
      }

      const {
        buffer,
        filename
      } =
        await generateStoreReportsExcel({
          storeName,
          fromDate,
          toDate
        });

      response.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      response.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      response.send(buffer);
    } catch (error) {
      next(error);
    }
  };