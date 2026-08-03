import type {
  NextFunction,
  Request,
  Response,
  RequestHandler
} from "express";

import {
  generateInvoicesExcel
} from "../services/invoiceExcel.service.js"

import type {
  CreateInvoiceInput,
  UpdateInvoiceInput
} from "../schemas/invoice.schema.js";

import {
  cancelInvoice,
  createInvoice,
  getInvoiceById,
  getInvoices,
  updateInvoice,
  updateInvoiceStatus
} from "../services/invoice.service.js";

export async function createInvoiceController(
  request: Request<
    Record<string, never>,
    unknown,
    CreateInvoiceInput
  >,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const invoice = await createInvoice(
      request.body
    );

    response.status(201).json({
      success: true,

      message:
        request.body.invoiceStatus === "DRAFT"
          ? "Invoice draft saved successfully."
          : "Invoice generated successfully.",

      data: invoice
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoicesController(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId =
      typeof request.query.schoolId ===
      "string"
        ? request.query.schoolId
        : undefined;

    const search =
      typeof request.query.search ===
      "string"
        ? request.query.search
        : undefined;

    const rawInvoiceStatus =
      typeof request.query
        .invoiceStatus === "string"
        ? request.query.invoiceStatus
        : undefined;

    const invoiceStatus =
      rawInvoiceStatus === "DRAFT" ||
      rawInvoiceStatus ===
        "COMPLETED" ||
      rawInvoiceStatus ===
        "CANCELLED"
        ? rawInvoiceStatus
        : undefined;

    const rawPaymentStatus =
      typeof request.query
        .paymentStatus === "string"
        ? request.query.paymentStatus
        : undefined;

    const paymentStatus =
      rawPaymentStatus ===
        "PENDING" ||
      rawPaymentStatus ===
        "PARTIALLY_PAID" ||
      rawPaymentStatus === "PAID"
        ? rawPaymentStatus
        : undefined;

    const dateFrom =
      typeof request.query.dateFrom ===
      "string"
        ? request.query.dateFrom
        : undefined;

    const dateTo =
      typeof request.query.dateTo ===
      "string"
        ? request.query.dateTo
        : undefined;

    const page =
      Number(request.query.page) || 1;

    const limit =
      Number(request.query.limit) || 10;

    const result =
      await getInvoices({
        schoolId,
        search,
        invoiceStatus,
        paymentStatus,
        dateFrom,
        dateTo,
        page,
        limit
      });

    response.status(200).json({
      success: true,
      data: result.invoices,
      pagination:
        result.pagination
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoiceByIdController(
  request: Request<{
    id: string;
  }>,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const invoice =
      await getInvoiceById(
        request.params.id
      );

    response.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
}

export async function updateInvoiceStatusController(
  request: Request<
    { id: string },
    object,
    {
      invoiceStatus:
        | "DRAFT"
        | "COMPLETED";
    }
  >,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const invoice =
      await updateInvoiceStatus(
        request.params.id,
        request.body.invoiceStatus
      );

    response.status(200).json({
      success: true,
      message:
        "Invoice status updated successfully.",
      data: invoice
    });
  } catch (error) {
    next(error);
  }
}

export async function updateInvoiceController(
  request: Request<
    { id: string },
    object,
    UpdateInvoiceInput
  >,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const invoice = await updateInvoice(
      request.params.id,
      request.body
    );

    response.status(200).json({
      success: true,
      message: "Invoice updated successfully.",
      data: invoice
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelInvoiceController(
  request: Request<
    { id: string },
    object,
    {
      cancellationReason: string;
    }
  >,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const invoice =
      await cancelInvoice(
        request.params.id,
        request.body
          .cancellationReason
      );

    response.status(200).json({
      success: true,
      message:
        "Invoice cancelled successfully.",
      data: invoice
    });
  } catch (error) {
    next(error);
  }
}

export const downloadInvoicesExcelController:
  RequestHandler = async (
    request,
    response,
    next
  ): Promise<void> => {
    try {
      const fromDate =
        typeof request.query.fromDate ===
        "string"
          ? request.query.fromDate
          : "";

      const toDate =
        typeof request.query.toDate ===
        "string"
          ? request.query.toDate
          : "";

      const {
        buffer,
        filename
      } =
        await generateInvoicesExcel(
          fromDate,
          toDate
        );

      response.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      response.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      response
        .status(200)
        .send(buffer);
    } catch (error) {
      next(error);
    }
  };