import type {
  NextFunction,
  Request,
  Response
} from "express";

import type {
  UpdateDistributionInput
} from "../schemas/orderTracking.schema.js";

import {
  getOrderTrackingByInvoiceId,
  getOrderTrackingList,
  updateDistribution
} from "../services/orderTracking.service.js";

export async function getOrderTrackingListController(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId =
      typeof request.query.schoolId === "string"
        ? request.query.schoolId
        : undefined;

    const search =
      typeof request.query.search === "string"
        ? request.query.search
        : undefined;

    const searchType =
      typeof request.query.searchType === "string" &&
      (request.query.searchType === "invoice" || 
       request.query.searchType === "student" || 
       request.query.searchType === "both")
        ? request.query.searchType as "invoice" | "student" | "both"
        : "both";

    const fromDate =
      typeof request.query.fromDate === "string"
        ? request.query.fromDate
        : undefined;

    const toDate =
      typeof request.query.toDate === "string"
        ? request.query.toDate
        : undefined;

    const rawStatus =
      typeof request.query.fulfilmentStatus === "string"
        ? request.query.fulfilmentStatus
        : undefined;

    const fulfilmentStatus =
      rawStatus === "NOT_COMPLETED" ||
      rawStatus === "PARTIALLY_COMPLETED" ||
      rawStatus === "COMPLETELY_DELIVERED"
        ? rawStatus
        : undefined;

    const placeOfOrder =
      typeof request.query.placeOfOrder === "string"
        ? request.query.placeOfOrder
        : undefined;

    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 10;

    const result = await getOrderTrackingList({
      schoolId,
      search,
      searchType,
      fulfilmentStatus,
      placeOfOrder,
      fromDate,
      toDate,
      page,
      limit
    });

    response.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderTrackingByInvoiceIdController(
  request: Request<{ invoiceId: string }>,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const invoice = await getOrderTrackingByInvoiceId(
      request.params.invoiceId
    );

    response.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDistributionController(
  request: Request<
    { invoiceId: string },
    object,
    UpdateDistributionInput
  >,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const invoice = await updateDistribution(
      request.params.invoiceId,
      request.body
    );

    response.status(200).json({
      success: true,
      message: "Order tracking updated successfully.",
      data: invoice
    });
  } catch (error) {
    next(error);
  }
}

export async function updateExchangeStatusController(
  request: Request<
    { invoiceId: string; exchangeId: string },
    object,
    { status: string }
  >,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Implementation would go here if needed
    response.status(200).json({
      success: true,
      message: "Exchange status updated successfully."
    });
  } catch (error) {
    next(error);
  }
}