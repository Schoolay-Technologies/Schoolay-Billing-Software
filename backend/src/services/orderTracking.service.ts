import { Types } from "mongoose";

import { InvoiceModel } from "../models/invoice.model.js";

import type {
  UpdateDistributionInput
} from "../schemas/orderTracking.schema.js";

import type {
  FulfilmentStatus
} from "../types/orderTracking.types.js";

function calculateItemStatus(
  orderedQuantity: number,
  deliveredQuantity: number
): FulfilmentStatus {
  if (deliveredQuantity === 0) {
    return "NOT_COMPLETED";
  }
  if (deliveredQuantity >= orderedQuantity) {
    return "COMPLETELY_DELIVERED";
  }
  return "PARTIALLY_COMPLETED";
}

function calculateInvoiceStatus(
  orderedQuantity: number,
  deliveredQuantity: number
): FulfilmentStatus {
  if (deliveredQuantity === 0) {
    return "NOT_COMPLETED";
  }
  if (deliveredQuantity >= orderedQuantity) {
    return "COMPLETELY_DELIVERED";
  }
  return "PARTIALLY_COMPLETED";
}

export async function getOrderTrackingList(options: {
  schoolId?: string;
  search?: string;
  searchType?: "invoice" | "student" | "both";
  fulfilmentStatus?: FulfilmentStatus;
  placeOfOrder?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(options.page ?? 1, 1);
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 100);

  const filter: Record<string, unknown> = {
    invoiceStatus: "COMPLETED"
  };

  // School filter
  if (options.schoolId) {
    if (!Types.ObjectId.isValid(options.schoolId)) {
      throw new Error("Invalid school ID.");
    }
    filter.schoolId = options.schoolId;
  }

  // Fulfilment status filter
  if (options.fulfilmentStatus) {
    filter.fulfilmentStatus = options.fulfilmentStatus;
  }

  // Place of order filter
  if (options.placeOfOrder) {
    filter.placeOfOrder = options.placeOfOrder;
  }

  // Search functionality - invoice number and/or student name
  if (options.search && options.search.trim()) {
    const searchRegex = {
      $regex: options.search,
      $options: "i"
    };

    const searchType = options.searchType || "both";

    if (searchType === "invoice") {
      filter.invoiceNumber = searchRegex;
    } else if (searchType === "student") {
      filter.studentName = searchRegex;
    } else {
      // "both" - search in both fields
      filter.$or = [
        { invoiceNumber: searchRegex },
        { studentName: searchRegex }
      ];
    }
  }

  // Date range filter
  if (options.fromDate || options.toDate) {
    const invoiceDate: {
      $gte?: Date;
      $lte?: Date;
    } = {};

    if (options.fromDate) {
      invoiceDate.$gte = new Date(`${options.fromDate}T00:00:00.000`);
    }

    if (options.toDate) {
      invoiceDate.$lte = new Date(`${options.toDate}T23:59:59.999`);
    }

    filter.invoiceDate = invoiceDate;
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    InvoiceModel.find(filter)
      .sort({
        invoiceDate: -1,
        createdAt: -1
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    InvoiceModel.countDocuments(filter)
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getOrderTrackingByInvoiceId(invoiceId: string) {
  if (!Types.ObjectId.isValid(invoiceId)) {
    throw new Error("Invalid invoice ID.");
  }

  const invoice = await InvoiceModel.findById(invoiceId).lean();

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  return invoice;
}

export async function updateDistribution(
  invoiceId: string,
  input: UpdateDistributionInput
) {
  if (!Types.ObjectId.isValid(invoiceId)) {
    throw new Error("Invalid invoice ID.");
  }

  const invoice = await InvoiceModel.findById(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  if (invoice.invoiceStatus === "CANCELLED") {
    throw new Error("A cancelled invoice cannot receive distribution updates.");
  }

  if (invoice.invoiceStatus === "DRAFT") {
    throw new Error("A draft invoice cannot receive distribution updates.");
  }

  const historyItems: Array<{
    invoiceItemId: Types.ObjectId;
    productName: string;
    size: string;
    deliveredNow: number;
    pendingAfterUpdate: number;
    pendingReason: string;
    pendingReasonRemarks: string;
  }> = [];

  for (const updateItem of input.items) {
    if (!Types.ObjectId.isValid(updateItem.invoiceItemId)) {
      throw new Error("Invalid invoice item ID.");
    }

    const invoiceItem = invoice.items.id(updateItem.invoiceItemId);

    if (!invoiceItem) {
      throw new Error("Invoice item was not found.");
    }

    const currentDelivered = invoiceItem.deliveredQuantity ?? 0;
    const newDelivered = currentDelivered + updateItem.deliveredNow;

    if (newDelivered > invoiceItem.quantity) {
      throw new Error(
        `${invoiceItem.productName}, size ${invoiceItem.size}: delivered quantity cannot exceed ordered quantity.`
      );
    }

    const newPending = invoiceItem.quantity - newDelivered;

    if (newPending > 0 && !updateItem.pendingReason) {
      throw new Error(
        `${invoiceItem.productName}, size ${invoiceItem.size}: select a pending reason.`
      );
    }

    invoiceItem.deliveredQuantity = newDelivered;
    invoiceItem.pendingQuantity = newPending;
    invoiceItem.fulfilmentStatus = calculateItemStatus(
      invoiceItem.quantity,
      newDelivered
    );

    if (newPending === 0) {
      invoiceItem.pendingReason = "";
      invoiceItem.pendingReasonRemarks = "";
    } else {
      invoiceItem.pendingReason = updateItem.pendingReason ?? "";
      invoiceItem.pendingReasonRemarks = updateItem.pendingReasonRemarks ?? "";
    }

    historyItems.push({
      invoiceItemId: invoiceItem._id,
      productName: invoiceItem.productName,
      size: invoiceItem.size,
      deliveredNow: updateItem.deliveredNow,
      pendingAfterUpdate: newPending,
      pendingReason: invoiceItem.pendingReason,
      pendingReasonRemarks: invoiceItem.pendingReasonRemarks
    });
  }

  const totalOrderedQuantity = invoice.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalDeliveredQuantity = invoice.items.reduce(
    (total, item) => total + (item.deliveredQuantity ?? 0),
    0
  );

  const totalPendingQuantity = totalOrderedQuantity - totalDeliveredQuantity;

  invoice.totalOrderedQuantity = totalOrderedQuantity;
  invoice.totalDeliveredQuantity = totalDeliveredQuantity;
  invoice.totalPendingQuantity = totalPendingQuantity;
  invoice.fulfilmentStatus = calculateInvoiceStatus(
    totalOrderedQuantity,
    totalDeliveredQuantity
  );

  invoice.distributionHistory.push({
    distributionDate: new Date(),
    placeOfDistribution: input.placeOfDistribution,
    customDistributionPlace: input.placeOfDistribution === "OTHER"
      ? input.customDistributionPlace
      : "",
    items: historyItems,
    remarks: input.remarks
  });

  await invoice.save();

  return invoice;
}