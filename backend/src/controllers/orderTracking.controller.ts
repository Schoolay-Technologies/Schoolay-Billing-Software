import type {
  NextFunction,
  Request,
  Response
} from "express";

import type {
  UpdateDistributionInput
  // REMOVED: UpdateExchangeStatusInput
} from "../schemas/orderTracking.schema.js";

import {
  getOrderTrackingByInvoiceId,
  getOrderTrackingList,
  updateDistribution
  // REMOVED: updateExchangeStatus
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
      fulfilmentStatus,
      placeOfOrder,
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

// REMOVED: updateExchangeStatusController