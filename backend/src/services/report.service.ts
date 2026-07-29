import ExcelJS from "exceljs";
import {
  Types,
  type PipelineStage
} from "mongoose";

import { InvoiceModel } from
  "../models/invoice.model.js";

import type {
  GeneratedReport,
  ReportColumn,
  ReportFilters,
  ReportSummary,
  ReportType
} from "../types/report.types.js";

interface InvoiceSummaryResult {
  totalInvoices: number;
  totalQuantity: number;
  taxableAmount: number;
  totalGstAmount: number;
  grandTotal: number;
  paidAmount: number;
  pendingAmount: number;
}

const emptySummary: ReportSummary = {
  totalInvoices: 0,
  totalQuantity: 0,
  taxableAmount: 0,
  totalGstAmount: 0,
  grandTotal: 0,
  paidAmount: 0,
  pendingAmount: 0
};

const reportTitles: Record<ReportType, string> = {
  SCHOOL_WISE_SALES:
    "School-wise Sales Report",

  DATE_WISE_SALES:
    "Date-wise Sales Report",

  STUDENT_PURCHASE:
    "Student-wise Purchase Report",

  CLASS_WISE_SALES:
    "Class-wise Sales Report",

  PRODUCT_WISE_SALES:
    "Product-wise Sales Report",

  GENDER_WISE_SALES:
    "Gender-wise Sales Report",

  SIZE_WISE_QUANTITY:
    "Size-wise Quantity Report",

  GST_REPORT:
    "GST Report",

  PAYMENT_MODE_REPORT:
    "Payment Mode Report",

  PRODUCTION_REQUIREMENT:
    "Production Requirement Report",

  PRODUCTION_PENDING:
    "Production Pending Report",

  CANCELLED_INVOICES:
    "Cancelled Invoice Report",

  DAILY_COLLECTION:
    "Daily Collection Report",

  MONTHLY_SALES:
    "Monthly Sales Report"
};

function roundCurrency(value: number): number {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
}

function parseStartDate(value: string): Date {
  const date = new Date(
    `${value}T00:00:00.000`
  );

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid start date.");
  }

  return date;
}

function parseEndDate(value: string): Date {
  const date = new Date(
    `${value}T23:59:59.999`
  );

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid end date.");
  }

  return date;
}

function validateSchoolId(
  schoolId: string
): Types.ObjectId {
  if (!Types.ObjectId.isValid(schoolId)) {
    throw new Error("Invalid school ID.");
  }

  return new Types.ObjectId(schoolId);
}

function buildInvoiceMatch(
  filters: ReportFilters,
  reportType: ReportType
): Record<string, unknown> {
  const match: Record<string, unknown> = {
    schoolId: validateSchoolId(
      filters.schoolId
    )
  };

  if (reportType === "CANCELLED_INVOICES") {
    match.invoiceStatus = "CANCELLED";
  } else {
    match.invoiceStatus = "COMPLETED";
  }

  if (filters.dateFrom || filters.dateTo) {
    const invoiceDate: {
      $gte?: Date;
      $lte?: Date;
    } = {};

    if (filters.dateFrom) {
      invoiceDate.$gte =
        parseStartDate(filters.dateFrom);
    }

    if (filters.dateTo) {
      invoiceDate.$lte =
        parseEndDate(filters.dateTo);
    }

    match.invoiceDate = invoiceDate;
  }

  if (filters.studentName) {
    match.studentName = {
      $regex: filters.studentName,
      $options: "i"
    };
  }

  if (filters.className) {
    match.className = {
      $regex: filters.className,
      $options: "i"
    };
  }

  if (filters.paymentMode) {
    match.paymentMode =
      filters.paymentMode;
  }

  return match;
}

function buildItemMatch(
  filters: ReportFilters
): Record<string, unknown> {
  const match: Record<string, unknown> = {};

  if (filters.productId) {
    if (
      !Types.ObjectId.isValid(
        filters.productId
      )
    ) {
      throw new Error(
        "Invalid product ID."
      );
    }

    match["items.productId"] =
      new Types.ObjectId(
        filters.productId
      );
  }

  if (filters.gender) {
    match["items.gender"] =
      filters.gender;
  }

  if (filters.size) {
    match["items.size"] =
      filters.size;
  }

  return match;
}

function sumInvoiceQuantityExpression() {
  return {
    $sum: {
      $map: {
        input: "$items",
        as: "item",
        in: "$$item.quantity"
      }
    }
  };
}

async function getReportSummary(
  filters: ReportFilters,
  reportType: ReportType
): Promise<ReportSummary> {
  const match = buildInvoiceMatch(
    filters,
    reportType
  );

  const result =
    await InvoiceModel.aggregate<
      InvoiceSummaryResult
    >([
      {
        $match: match
      },
      {
        $group: {
          _id: null,

          totalInvoices: {
            $sum: 1
          },

          totalQuantity: {
            $sum:
              sumInvoiceQuantityExpression()
          },

          taxableAmount: {
            $sum: "$taxableAmount"
          },

          totalGstAmount: {
            $sum: "$totalGstAmount"
          },

          grandTotal: {
            $sum: "$grandTotal"
          },

          paidAmount: {
            $sum: "$paidAmount"
          },

          pendingAmount: {
            $sum: {
              $max: [
                {
                  $subtract: [
                    "$grandTotal",
                    "$paidAmount"
                  ]
                },
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalInvoices: 1,
          totalQuantity: 1,
          taxableAmount: 1,
          totalGstAmount: 1,
          grandTotal: 1,
          paidAmount: 1,
          pendingAmount: 1
        }
      }
    ]);

  const summary = result[0];

  if (!summary) {
    return {
      ...emptySummary
    };
  }

  return {
    totalInvoices:
      summary.totalInvoices ?? 0,

    totalQuantity:
      summary.totalQuantity ?? 0,

    taxableAmount:
      roundCurrency(
        summary.taxableAmount ?? 0
      ),

    totalGstAmount:
      roundCurrency(
        summary.totalGstAmount ?? 0
      ),

    grandTotal:
      roundCurrency(
        summary.grandTotal ?? 0
      ),

    paidAmount:
      roundCurrency(
        summary.paidAmount ?? 0
      ),

    pendingAmount:
      roundCurrency(
        summary.pendingAmount ?? 0
      )
  };
}

function getSchoolWiseColumns():
  ReportColumn[] {
  return [
    {
      header: "School",
      key: "schoolName",
      width: 30
    },
    {
      header: "School Code",
      key: "schoolCode",
      width: 16
    },
    {
      header: "Invoice Count",
      key: "invoiceCount",
      width: 16
    },
    {
      header: "Quantity",
      key: "quantity",
      width: 14
    },
    {
      header: "Taxable Amount",
      key: "taxableAmount",
      width: 18
    },
    {
      header: "GST",
      key: "gstAmount",
      width: 16
    },
    {
      header: "Grand Total",
      key: "grandTotal",
      width: 18
    },
    {
      header: "Paid",
      key: "paidAmount",
      width: 18
    },
    {
      header: "Balance",
      key: "balanceAmount",
      width: 18
    }
  ];
}

async function getSchoolWiseSales(
  filters: ReportFilters
) {
  const match = buildInvoiceMatch(
    filters,
    "SCHOOL_WISE_SALES"
  );

  return InvoiceModel.aggregate([
    {
      $match: match
    },
    {
      $group: {
        _id: {
          schoolId: "$schoolId",
          schoolName: "$schoolName",
          schoolCode: "$schoolCode"
        },

        invoiceCount: {
          $sum: 1
        },

        quantity: {
          $sum:
            sumInvoiceQuantityExpression()
        },

        taxableAmount: {
          $sum: "$taxableAmount"
        },

        gstAmount: {
          $sum: "$totalGstAmount"
        },

        grandTotal: {
          $sum: "$grandTotal"
        },

        paidAmount: {
          $sum: "$paidAmount"
        }
      }
    },
    {
      $project: {
        _id: 0,
        schoolName:
          "$_id.schoolName",
        schoolCode:
          "$_id.schoolCode",
        invoiceCount: 1,
        quantity: 1,
        taxableAmount: 1,
        gstAmount: 1,
        grandTotal: 1,
        paidAmount: 1,
        balanceAmount: {
          $max: [
            {
              $subtract: [
                "$grandTotal",
                "$paidAmount"
              ]
            },
            0
          ]
        }
      }
    },
    {
      $sort: {
        schoolName: 1
      }
    }
  ]);
}

async function getDateWiseSales(
  filters: ReportFilters
) {
  const match = buildInvoiceMatch(
    filters,
    "DATE_WISE_SALES"
  );

  return InvoiceModel.aggregate([
    {
      $match: match
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$invoiceDate",
            timezone: "Asia/Kolkata"
          }
        },

        invoiceCount: {
          $sum: 1
        },

        quantity: {
          $sum:
            sumInvoiceQuantityExpression()
        },

        taxableAmount: {
          $sum: "$taxableAmount"
        },

        gstAmount: {
          $sum: "$totalGstAmount"
        },

        grandTotal: {
          $sum: "$grandTotal"
        },

        paidAmount: {
          $sum: "$paidAmount"
        }
      }
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        invoiceCount: 1,
        quantity: 1,
        taxableAmount: 1,
        gstAmount: 1,
        grandTotal: 1,
        paidAmount: 1,
        balanceAmount: {
          $max: [
            {
              $subtract: [
                "$grandTotal",
                "$paidAmount"
              ]
            },
            0
          ]
        }
      }
    },
    {
      $sort: {
        date: 1
      }
    }
  ]);
}

async function getStudentPurchase(
  filters: ReportFilters
) {
  const match = buildInvoiceMatch(
    filters,
    "STUDENT_PURCHASE"
  );

  const itemMatch =
    buildItemMatch(filters);

  const pipeline: PipelineStage[] = [
    {
      $match: match
    },
    {
      $unwind: "$items"
    }
  ];

  if (
    Object.keys(itemMatch).length > 0
  ) {
    pipeline.push({
      $match: itemMatch
    });
  }

  pipeline.push(
    {
      $project: {
        _id: 0,

        invoiceNumber: 1,

        date: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$invoiceDate",
            timezone: "Asia/Kolkata"
          }
        },

        studentName: 1,
        className: 1,
        parentName: 1,
        contactNumber: 1,

        productName:
          "$items.productName",

        gender:
          "$items.gender",

        size:
          "$items.size",

        quantity:
          "$items.quantity",

        unitPrice:
          "$items.unitPrice",

        gstPercentage:
          "$items.gstPercentage",

        totalAmount:
          "$items.totalAmount"
      }
    },
    {
      $sort: {
        studentName: 1,
        invoiceNumber: 1,
        productName: 1
      }
    }
  );

  return InvoiceModel.aggregate(
    pipeline
  );
}

async function getClassWiseSales(
  filters: ReportFilters
) {
  const match = buildInvoiceMatch(
    filters,
    "CLASS_WISE_SALES"
  );

  return InvoiceModel.aggregate([
    {
      $match: match
    },
    {
      $group: {
        _id: "$className",

        invoiceCount: {
          $sum: 1
        },

        students: {
          $addToSet: "$studentName"
        },

        quantity: {
          $sum:
            sumInvoiceQuantityExpression()
        },

        taxableAmount: {
          $sum: "$taxableAmount"
        },

        gstAmount: {
          $sum: "$totalGstAmount"
        },

        grandTotal: {
          $sum: "$grandTotal"
        }
      }
    },
    {
      $project: {
        _id: 0,
        className: "$_id",
        invoiceCount: 1,
        studentCount: {
          $size: "$students"
        },
        quantity: 1,
        taxableAmount: 1,
        gstAmount: 1,
        grandTotal: 1
      }
    },
    {
      $sort: {
        className: 1
      }
    }
  ]);
}

async function getProductWiseSales(
  filters: ReportFilters
) {
  const match = buildInvoiceMatch(
    filters,
    "PRODUCT_WISE_SALES"
  );

  const itemMatch =
    buildItemMatch(filters);

  const pipeline: PipelineStage[] = [
    {
      $match: match
    },
    {
      $unwind: "$items"
    }
  ];

  if (
    Object.keys(itemMatch).length > 0
  ) {
    pipeline.push({
      $match: itemMatch
    });
  }

  pipeline.push(
    {
      $group: {
        _id: {
          productId:
            "$items.productId",

          productName:
            "$items.productName",

          productCode:
            "$items.productCode",

          gender:
            "$items.gender"
        },

        invoices: {
          $addToSet: "$_id"
        },

        quantity: {
          $sum: "$items.quantity"
        },

        taxableAmount: {
          $sum:
            "$items.taxableAmount"
        },

        gstAmount: {
          $sum: "$items.gstAmount"
        },

        totalAmount: {
          $sum: "$items.totalAmount"
        }
      }
    },
    {
      $project: {
        _id: 0,

        productName:
          "$_id.productName",

        productCode:
          "$_id.productCode",

        gender:
          "$_id.gender",

        invoiceCount: {
          $size: "$invoices"
        },

        quantity: 1,
        taxableAmount: 1,
        gstAmount: 1,
        totalAmount: 1
      }
    },
    {
      $sort: {
        productName: 1,
        gender: 1
      }
    }
  );

  return InvoiceModel.aggregate(
    pipeline
  );
}

async function getGenderWiseSales(
  filters: ReportFilters
) {
  const match = buildInvoiceMatch(
    filters,
    "GENDER_WISE_SALES"
  );

  const itemMatch =
    buildItemMatch(filters);

  const pipeline: PipelineStage[] = [
    {
      $match: match
    },
    {
      $unwind: "$items"
    }
  ];

  if (
    Object.keys(itemMatch).length > 0
  ) {
    pipeline.push({
      $match: itemMatch
    });
  }

  pipeline.push(
    {
      $group: {
        _id: "$items.gender",

        products: {
          $addToSet:
            "$items.productId"
        },

        quantity: {
          $sum: "$items.quantity"
        },

        taxableAmount: {
          $sum:
            "$items.taxableAmount"
        },

        gstAmount: {
          $sum: "$items.gstAmount"
        },

        totalAmount: {
          $sum: "$items.totalAmount"
        }
      }
    },
    {
      $project: {
        _id: 0,
        gender: "$_id",
        productCount: {
          $size: "$products"
        },
        quantity: 1,
        taxableAmount: 1,
        gstAmount: 1,
        totalAmount: 1
      }
    },
    {
      $sort: {
        gender: 1
      }
    }
  );

  return InvoiceModel.aggregate(
    pipeline
  );
}

async function getSizeWiseQuantity(
  filters: ReportFilters
) {
  const match = buildInvoiceMatch(
    filters,
    "SIZE_WISE_QUANTITY"
  );

  const itemMatch =
    buildItemMatch(filters);

  const pipeline: PipelineStage[] = [
    {
      $match: match
    },
    {
      $unwind: "$items"
    }
  ];

  if (
    Object.keys(itemMatch).length > 0
  ) {
    pipeline.push({
      $match: itemMatch
    });
  }

  pipeline.push(
    {
      $group: {
        _id: {
          productId:
            "$items.productId",

          productName:
            "$items.productName",

          productCode:
            "$items.productCode",

          gender:
            "$items.gender",

          size:
            "$items.size"
        },

        quantity: {
          $sum: "$items.quantity"
        }
      }
    },
    {
      $project: {
        _id: 0,

        productName:
          "$_id.productName",

        productCode:
          "$_id.productCode",

        gender:
          "$_id.gender",

        size:
          "$_id.size",

        quantity: 1
      }
    },
    {
      $sort: {
        productName: 1,
        gender: 1,
        size: 1
      }
    }
  );

  return InvoiceModel.aggregate(
    pipeline
  );
}

async function getGstReport(
  filters: ReportFilters
) {
  const match = buildInvoiceMatch(
    filters,
    "GST_REPORT"
  );

  return InvoiceModel.aggregate([
    {
      $match: match
    },
    {
      $project: {
        _id: 0,

        invoiceNumber: 1,

        date: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$invoiceDate",
            timezone: "Asia/Kolkata"
          }
        },

        studentName: 1,
        className: 1,
        taxableAmount: 1,
        cgstAmount: 1,
        sgstAmount: 1,
        igstAmount: 1,
        totalGstAmount: 1,
        grandTotal: 1
      }
    },
    {
      $sort: {
        date: 1,
        invoiceNumber: 1
      }
    }
  ]);
}

async function getPaymentModeReport(
  filters: ReportFilters
) {
  const match = buildInvoiceMatch(
    filters,
    "PAYMENT_MODE_REPORT"
  );

  return InvoiceModel.aggregate([
    {
      $match: match
    },
    {
      $group: {
        _id: "$paymentMode",

        invoiceCount: {
          $sum: 1
        },

        grandTotal: {
          $sum: "$grandTotal"
        },

        paidAmount: {
          $sum: "$paidAmount"
        }
      }
    },
    {
      $project: {
        _id: 0,
        paymentMode: "$_id",
        invoiceCount: 1,
        grandTotal: 1,
        paidAmount: 1,
        pendingAmount: {
          $max: [
            {
              $subtract: [
                "$grandTotal",
                "$paidAmount"
              ]
            },
            0
          ]
        }
      }
    },
    {
      $sort: {
        paymentMode: 1
      }
    }
  ]);
}

async function getProductionRequirement(
  filters: ReportFilters
) {
  const match = buildInvoiceMatch(
    filters,
    "PRODUCTION_REQUIREMENT"
  );

  const itemMatch =
    buildItemMatch(filters);

  const pipeline: PipelineStage[] = [
    {
      $match: match
    },
    {
      $unwind: "$items"
    }
  ];

  if (
    Object.keys(itemMatch).length > 0
  ) {
    pipeline.push({
      $match: itemMatch
    });
  }

  pipeline.push(
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$invoiceDate",
              timezone: "Asia/Kolkata"
            }
          },

          schoolName:
            "$schoolName",

          schoolCode:
            "$schoolCode",

          productName:
            "$items.productName",

          productCode:
            "$items.productCode",

          gender:
            "$items.gender",

          size:
            "$items.size"
        },

        requiredQuantity: {
          $sum: "$items.quantity"
        }
      }
    },
    {
      $project: {
        _id: 0,

        date:
          "$_id.date",

        schoolName:
          "$_id.schoolName",

        schoolCode:
          "$_id.schoolCode",

        productName:
          "$_id.productName",

        productCode:
          "$_id.productCode",

        gender:
          "$_id.gender",

        size:
          "$_id.size",

        requiredQuantity: 1
      }
    },
    {
      $sort: {
        date: 1,
        productName: 1,
        size: 1
      }
    }
  );

  return InvoiceModel.aggregate(
    pipeline
  );
}

async function getProductionPending(
  filters: ReportFilters
) {
  const match = buildInvoiceMatch(
    filters,
    "PRODUCTION_PENDING"
  );

  const itemMatch =
    buildItemMatch(filters);

  const pipeline: PipelineStage[] = [
    {
      $match: match
    },
    {
      $unwind: "$items"
    },
    {
      $match: {
        "items.pendingQuantity": {
          $gt: 0
        },

        ...itemMatch
      }
    },
    {
      $project: {
        _id: 0,

        invoiceNumber: 1,

        date: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$invoiceDate",
            timezone: "Asia/Kolkata"
          }
        },

        studentName: 1,
        className: 1,
        contactNumber: 1,

        productName:
          "$items.productName",

        gender:
          "$items.gender",

        size:
          "$items.size",

        orderedQuantity:
          "$items.quantity",

        deliveredQuantity: {
          $ifNull: [
            "$items.deliveredQuantity",
            0
          ]
        },

        pendingQuantity: {
          $ifNull: [
            "$items.pendingQuantity",
            "$items.quantity"
          ]
        },

        pendingReason: {
          $ifNull: [
            "$items.pendingReason",
            ""
          ]
        },

        pendingReasonRemarks: {
          $ifNull: [
            "$items.pendingReasonRemarks",
            ""
          ]
        }
      }
    },
    {
      $sort: {
        date: 1,
        studentName: 1,
        productName: 1
      }
    }
  ];

  return InvoiceModel.aggregate(
    pipeline
  );
}

async function getCancelledInvoices(
  filters: ReportFilters
) {
  const match = buildInvoiceMatch(
    filters,
    "CANCELLED_INVOICES"
  );

  return InvoiceModel.aggregate([
    {
      $match: match
    },
    {
      $project: {
        _id: 0,

        invoiceNumber: 1,

        invoiceDate: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$invoiceDate",
            timezone: "Asia/Kolkata"
          }
        },

        studentName: 1,
        className: 1,
        parentName: 1,
        contactNumber: 1,
        grandTotal: 1,
        cancellationReason: 1,

        cancelledAt: {
          $cond: [
            {
              $ne: [
                "$cancelledAt",
                null
              ]
            },
            {
              $dateToString: {
                format:
                  "%Y-%m-%d %H:%M",

                date:
                  "$cancelledAt",

                timezone:
                  "Asia/Kolkata"
              }
            },
            ""
          ]
        }
      }
    },
    {
      $sort: {
        invoiceDate: 1,
        invoiceNumber: 1
      }
    }
  ]);
}

async function getDailyCollection(
  filters: ReportFilters
) {
  const match = buildInvoiceMatch(
    filters,
    "DAILY_COLLECTION"
  );

  return InvoiceModel.aggregate([
    {
      $match: match
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$invoiceDate",
              timezone: "Asia/Kolkata"
            }
          },

          paymentMode:
            "$paymentMode"
        },

        collection: {
          $sum: "$paidAmount"
        },

        invoices: {
          $addToSet: "$_id"
        }
      }
    },
    {
      $group: {
        _id: "$_id.date",

        cash: {
          $sum: {
            $cond: [
              {
                $eq: [
                  "$_id.paymentMode",
                  "CASH"
                ]
              },
              "$collection",
              0
            ]
          }
        },

        card: {
          $sum: {
            $cond: [
              {
                $eq: [
                  "$_id.paymentMode",
                  "CARD"
                ]
              },
              "$collection",
              0
            ]
          }
        },

        online: {
          $sum: {
            $cond: [
              {
                $eq: [
                  "$_id.paymentMode",
                  "ONLINE"
                ]
              },
              "$collection",
              0
            ]
          }
        },

        invoiceGroups: {
          $push: "$invoices"
        }
      }
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        cash: 1,
        card: 1,
        online: 1,

        totalCollection: {
          $add: [
            "$cash",
            "$card",
            "$online"
          ]
        },

        invoiceCount: {
          $size: {
            $reduce: {
              input:
                "$invoiceGroups",

              initialValue: [],

              in: {
                $setUnion: [
                  "$$value",
                  "$$this"
                ]
              }
            }
          }
        }
      }
    },
    {
      $sort: {
        date: 1
      }
    }
  ]);
}

async function getMonthlySales(
  filters: ReportFilters
) {
  const match = buildInvoiceMatch(
    filters,
    "MONTHLY_SALES"
  );

  return InvoiceModel.aggregate([
    {
      $match: match
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$invoiceDate",
            timezone: "Asia/Kolkata"
          }
        },

        invoiceCount: {
          $sum: 1
        },

        quantity: {
          $sum:
            sumInvoiceQuantityExpression()
        },

        taxableAmount: {
          $sum: "$taxableAmount"
        },

        gstAmount: {
          $sum: "$totalGstAmount"
        },

        grandTotal: {
          $sum: "$grandTotal"
        },

        paidAmount: {
          $sum: "$paidAmount"
        }
      }
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        invoiceCount: 1,
        quantity: 1,
        taxableAmount: 1,
        gstAmount: 1,
        grandTotal: 1,
        paidAmount: 1,

        pendingAmount: {
          $max: [
            {
              $subtract: [
                "$grandTotal",
                "$paidAmount"
              ]
            },
            0
          ]
        }
      }
    },
    {
      $sort: {
        month: 1
      }
    }
  ]);
}

function getColumns(
  reportType: ReportType
): ReportColumn[] {
  switch (reportType) {
    case "SCHOOL_WISE_SALES":
      return getSchoolWiseColumns();

    case "DATE_WISE_SALES":
      return [
        {
          header: "Date",
          key: "date",
          width: 16
        },
        {
          header: "Invoice Count",
          key: "invoiceCount",
          width: 16
        },
        {
          header: "Quantity",
          key: "quantity",
          width: 14
        },
        {
          header: "Taxable Amount",
          key: "taxableAmount",
          width: 18
        },
        {
          header: "GST",
          key: "gstAmount",
          width: 16
        },
        {
          header: "Grand Total",
          key: "grandTotal",
          width: 18
        },
        {
          header: "Collection",
          key: "paidAmount",
          width: 18
        },
        {
          header: "Balance",
          key: "balanceAmount",
          width: 18
        }
      ];

    case "STUDENT_PURCHASE":
      return [
        {
          header: "Invoice",
          key: "invoiceNumber",
          width: 24
        },
        {
          header: "Date",
          key: "date",
          width: 16
        },
        {
          header: "Student",
          key: "studentName",
          width: 24
        },
        {
          header: "Class",
          key: "className",
          width: 16
        },
        {
          header: "Parent",
          key: "parentName",
          width: 24
        },
        {
          header: "Contact",
          key: "contactNumber",
          width: 18
        },
        {
          header: "Product",
          key: "productName",
          width: 24
        },
        {
          header: "Gender",
          key: "gender",
          width: 14
        },
        {
          header: "Size",
          key: "size",
          width: 12
        },
        {
          header: "Quantity",
          key: "quantity",
          width: 12
        },
        {
          header: "Unit Price",
          key: "unitPrice",
          width: 16
        },
        {
          header: "GST %",
          key: "gstPercentage",
          width: 12
        },
        {
          header: "Amount",
          key: "totalAmount",
          width: 18
        }
      ];

    case "CLASS_WISE_SALES":
      return [
        {
          header: "Class",
          key: "className",
          width: 20
        },
        {
          header: "Invoice Count",
          key: "invoiceCount",
          width: 16
        },
        {
          header: "Students",
          key: "studentCount",
          width: 14
        },
        {
          header: "Quantity",
          key: "quantity",
          width: 14
        },
        {
          header: "Taxable Amount",
          key: "taxableAmount",
          width: 18
        },
        {
          header: "GST",
          key: "gstAmount",
          width: 16
        },
        {
          header: "Sales Amount",
          key: "grandTotal",
          width: 18
        }
      ];

    case "PRODUCT_WISE_SALES":
      return [
        {
          header: "Product",
          key: "productName",
          width: 26
        },
        {
          header: "Code",
          key: "productCode",
          width: 16
        },
        {
          header: "Gender",
          key: "gender",
          width: 14
        },
        {
          header: "Invoice Count",
          key: "invoiceCount",
          width: 16
        },
        {
          header: "Quantity",
          key: "quantity",
          width: 14
        },
        {
          header: "Taxable Amount",
          key: "taxableAmount",
          width: 18
        },
        {
          header: "GST",
          key: "gstAmount",
          width: 16
        },
        {
          header: "Total",
          key: "totalAmount",
          width: 18
        }
      ];

    case "GENDER_WISE_SALES":
      return [
        {
          header: "Gender",
          key: "gender",
          width: 16
        },
        {
          header: "Products",
          key: "productCount",
          width: 14
        },
        {
          header: "Quantity",
          key: "quantity",
          width: 14
        },
        {
          header: "Taxable Amount",
          key: "taxableAmount",
          width: 18
        },
        {
          header: "GST",
          key: "gstAmount",
          width: 16
        },
        {
          header: "Total",
          key: "totalAmount",
          width: 18
        }
      ];

    case "SIZE_WISE_QUANTITY":
      return [
        {
          header: "Product",
          key: "productName",
          width: 26
        },
        {
          header: "Code",
          key: "productCode",
          width: 16
        },
        {
          header: "Gender",
          key: "gender",
          width: 14
        },
        {
          header: "Size",
          key: "size",
          width: 12
        },
        {
          header: "Quantity",
          key: "quantity",
          width: 14
        }
      ];

    case "GST_REPORT":
      return [
        {
          header: "Invoice",
          key: "invoiceNumber",
          width: 24
        },
        {
          header: "Date",
          key: "date",
          width: 16
        },
        {
          header: "Student",
          key: "studentName",
          width: 24
        },
        {
          header: "Class",
          key: "className",
          width: 16
        },
        {
          header: "Taxable Amount",
          key: "taxableAmount",
          width: 18
        },
        {
          header: "CGST",
          key: "cgstAmount",
          width: 16
        },
        {
          header: "SGST",
          key: "sgstAmount",
          width: 16
        },
        {
          header: "IGST",
          key: "igstAmount",
          width: 16
        },
        {
          header: "Total GST",
          key: "totalGstAmount",
          width: 16
        },
        {
          header: "Grand Total",
          key: "grandTotal",
          width: 18
        }
      ];

    case "PAYMENT_MODE_REPORT":
      return [
        {
          header: "Payment Mode",
          key: "paymentMode",
          width: 20
        },
        {
          header: "Invoice Count",
          key: "invoiceCount",
          width: 16
        },
        {
          header: "Total Sales",
          key: "grandTotal",
          width: 18
        },
        {
          header: "Paid Amount",
          key: "paidAmount",
          width: 18
        },
        {
          header: "Pending Amount",
          key: "pendingAmount",
          width: 18
        }
      ];

    case "PRODUCTION_REQUIREMENT":
      return [
        {
          header: "Date",
          key: "date",
          width: 16
        },
        {
          header: "School",
          key: "schoolName",
          width: 28
        },
        {
          header: "School Code",
          key: "schoolCode",
          width: 16
        },
        {
          header: "Product",
          key: "productName",
          width: 26
        },
        {
          header: "Code",
          key: "productCode",
          width: 16
        },
        {
          header: "Gender",
          key: "gender",
          width: 14
        },
        {
          header: "Size",
          key: "size",
          width: 12
        },
        {
          header: "Required Quantity",
          key: "requiredQuantity",
          width: 18
        }
      ];

    case "PRODUCTION_PENDING":
      return [
        {
          header: "Invoice",
          key: "invoiceNumber",
          width: 24
        },
        {
          header: "Date",
          key: "date",
          width: 16
        },
        {
          header: "Student",
          key: "studentName",
          width: 24
        },
        {
          header: "Class",
          key: "className",
          width: 16
        },
        {
          header: "Contact",
          key: "contactNumber",
          width: 18
        },
        {
          header: "Product",
          key: "productName",
          width: 26
        },
        {
          header: "Gender",
          key: "gender",
          width: 14
        },
        {
          header: "Size",
          key: "size",
          width: 12
        },
        {
          header: "Ordered",
          key: "orderedQuantity",
          width: 14
        },
        {
          header: "Delivered",
          key: "deliveredQuantity",
          width: 14
        },
        {
          header: "Pending",
          key: "pendingQuantity",
          width: 14
        },
        {
          header: "Reason",
          key: "pendingReason",
          width: 24
        },
        {
          header: "Remarks",
          key: "pendingReasonRemarks",
          width: 30
        }
      ];

    case "CANCELLED_INVOICES":
      return [
        {
          header: "Invoice",
          key: "invoiceNumber",
          width: 24
        },
        {
          header: "Invoice Date",
          key: "invoiceDate",
          width: 16
        },
        {
          header: "Student",
          key: "studentName",
          width: 24
        },
        {
          header: "Class",
          key: "className",
          width: 16
        },
        {
          header: "Parent",
          key: "parentName",
          width: 24
        },
        {
          header: "Contact",
          key: "contactNumber",
          width: 18
        },
        {
          header: "Total",
          key: "grandTotal",
          width: 18
        },
        {
          header: "Cancellation Reason",
          key: "cancellationReason",
          width: 35
        },
        {
          header: "Cancelled At",
          key: "cancelledAt",
          width: 20
        }
      ];

    case "DAILY_COLLECTION":
      return [
        {
          header: "Date",
          key: "date",
          width: 16
        },
        {
          header: "Cash",
          key: "cash",
          width: 16
        },
        {
          header: "Card",
          key: "card",
          width: 16
        },
        {
          header: "Online",
          key: "online",
          width: 16
        },
        {
          header: "Total Collection",
          key: "totalCollection",
          width: 20
        },
        {
          header: "Invoice Count",
          key: "invoiceCount",
          width: 16
        }
      ];

    case "MONTHLY_SALES":
      return [
        {
          header: "Month",
          key: "month",
          width: 16
        },
        {
          header: "Invoice Count",
          key: "invoiceCount",
          width: 16
        },
        {
          header: "Quantity",
          key: "quantity",
          width: 14
        },
        {
          header: "Taxable Amount",
          key: "taxableAmount",
          width: 18
        },
        {
          header: "GST",
          key: "gstAmount",
          width: 16
        },
        {
          header: "Grand Total",
          key: "grandTotal",
          width: 18
        },
        {
          header: "Paid",
          key: "paidAmount",
          width: 18
        },
        {
          header: "Pending",
          key: "pendingAmount",
          width: 18
        }
      ];
  }
}

async function getRows(
  reportType: ReportType,
  filters: ReportFilters
): Promise<Record<string, unknown>[]> {
  switch (reportType) {
    case "SCHOOL_WISE_SALES":
      return getSchoolWiseSales(filters);

    case "DATE_WISE_SALES":
      return getDateWiseSales(filters);

    case "STUDENT_PURCHASE":
      return getStudentPurchase(filters);

    case "CLASS_WISE_SALES":
      return getClassWiseSales(filters);

    case "PRODUCT_WISE_SALES":
      return getProductWiseSales(filters);

    case "GENDER_WISE_SALES":
      return getGenderWiseSales(filters);

    case "SIZE_WISE_QUANTITY":
      return getSizeWiseQuantity(filters);

    case "GST_REPORT":
      return getGstReport(filters);

    case "PAYMENT_MODE_REPORT":
      return getPaymentModeReport(filters);

    case "PRODUCTION_REQUIREMENT":
      return getProductionRequirement(filters);

    case "PRODUCTION_PENDING":
      return getProductionPending(filters);

    case "CANCELLED_INVOICES":
      return getCancelledInvoices(filters);

    case "DAILY_COLLECTION":
      return getDailyCollection(filters);

    case "MONTHLY_SALES":
      return getMonthlySales(filters);
  }
}

export async function generateReport(
  reportType: ReportType,
  filters: ReportFilters
): Promise<GeneratedReport> {
  const [rows, summary] =
    await Promise.all([
      getRows(reportType, filters),

      getReportSummary(
        filters,
        reportType
      )
    ]);

  return {
    reportType,
    title: reportTitles[reportType],
    columns: getColumns(reportType),
    rows,
    summary
  };
}

function applyHeaderStyle(
  row: ExcelJS.Row
): void {
  row.height = 26;

  row.font = {
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF432387"
    }
  };

  row.alignment = {
    horizontal: "center",
    vertical: "middle"
  };
}

function applyBorders(
  sheet: ExcelJS.Worksheet
): void {
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: {
          style: "thin",
          color: {
            argb: "FFD1D5DB"
          }
        },
        left: {
          style: "thin",
          color: {
            argb: "FFD1D5DB"
          }
        },
        right: {
          style: "thin",
          color: {
            argb: "FFD1D5DB"
          }
        },
        bottom: {
          style: "thin",
          color: {
            argb: "FFD1D5DB"
          }
        }
      };

      cell.alignment = {
        vertical: "middle"
      };
    });
  });
}

async function getItemSizeDetails(
  reportType: ReportType,
  filters: ReportFilters
): Promise<Record<string, unknown>[]> {
  const match = buildInvoiceMatch(
    filters,
    reportType
  );

  const itemMatch =
    buildItemMatch(filters);

  const pipeline: PipelineStage[] = [
    {
      $match: match
    },
    {
      $unwind: "$items"
    }
  ];

  if (
    Object.keys(itemMatch).length > 0
  ) {
    pipeline.push({
      $match: itemMatch
    });
  }

  pipeline.push(
    {
      $project: {
        _id: 0,

        invoiceNumber: 1,

        invoiceDate: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$invoiceDate",
            timezone: "Asia/Kolkata"
          }
        },

        schoolName: 1,
        schoolCode: 1,

        studentName: 1,
        className: 1,
        section: 1,

        item:
          "$items.productName",

        productCode:
          "$items.productCode",

        gender:
          "$items.gender",

        size:
          "$items.size",

        quantity:
          "$items.quantity",

        unitPrice:
          "$items.unitPrice",

        taxableAmount:
          "$items.taxableAmount",

        gstPercentage:
          "$items.gstPercentage",

        gstAmount:
          "$items.gstAmount",

        totalAmount:
          "$items.totalAmount",

        deliveredQuantity: {
          $ifNull: [
            "$items.deliveredQuantity",
            0
          ]
        },

        pendingQuantity: {
          $ifNull: [
            "$items.pendingQuantity",
            "$items.quantity"
          ]
        },

        pendingReason: {
          $ifNull: [
            "$items.pendingReason",
            ""
          ]
        },

        invoiceStatus: 1,
        paymentMode: 1,
        paidAmount: 1,
        grandTotal: 1
      }
    },
    {
      $sort: {
        invoiceDate: 1,
        invoiceNumber: 1,
        studentName: 1,
        item: 1,
        size: 1
      }
    }
  );

  return InvoiceModel.aggregate(
    pipeline
  );
}

function createItemSizeDetailSheet(
  workbook: ExcelJS.Workbook,
  rows: Record<string, unknown>[]
): void {
  const sheet =
    workbook.addWorksheet(
      "Item Size Details"
    );

  sheet.columns = [
    {
      header: "S.No.",
      key: "serialNumber",
      width: 10
    },
    {
      header: "Invoice",
      key: "invoiceNumber",
      width: 22
    },
    {
      header: "Invoice Date",
      key: "invoiceDate",
      width: 16
    },
    {
      header: "School",
      key: "schoolName",
      width: 28
    },
    {
      header: "School Code",
      key: "schoolCode",
      width: 15
    },
    {
      header: "Student",
      key: "studentName",
      width: 24
    },
    {
      header: "Class",
      key: "className",
      width: 15
    },
    {
      header: "Section",
      key: "section",
      width: 12
    },
    {
      header: "Item",
      key: "item",
      width: 28
    },
    {
      header: "Product Code",
      key: "productCode",
      width: 16
    },
    {
      header: "Gender",
      key: "gender",
      width: 14
    },
    {
      header: "Size",
      key: "size",
      width: 12
    },
    {
      header: "Quantity",
      key: "quantity",
      width: 12
    },
    {
      header: "Unit Price",
      key: "unitPrice",
      width: 15
    },
    {
      header: "Taxable Amount",
      key: "taxableAmount",
      width: 18
    },
    {
      header: "GST %",
      key: "gstPercentage",
      width: 12
    },
    {
      header: "GST Amount",
      key: "gstAmount",
      width: 16
    },
    {
      header: "Total Amount",
      key: "totalAmount",
      width: 18
    },
    {
      header: "Delivered Quantity",
      key: "deliveredQuantity",
      width: 18
    },
    {
      header: "Pending Quantity",
      key: "pendingQuantity",
      width: 18
    },
    {
      header: "Pending Reason",
      key: "pendingReason",
      width: 24
    },
    {
      header: "Payment Mode",
      key: "paymentMode",
      width: 16
    },
    {
      header: "Invoice Status",
      key: "invoiceStatus",
      width: 16
    }
  ];

  applyHeaderStyle(
    sheet.getRow(1)
  );

  rows.forEach(
    (row, index) => {
      sheet.addRow({
        serialNumber:
          index + 1,

        invoiceNumber:
          row.invoiceNumber ?? "",

        invoiceDate:
          row.invoiceDate ?? "",

        schoolName:
          row.schoolName ?? "",

        schoolCode:
          row.schoolCode ?? "",

        studentName:
          row.studentName ?? "",

        className:
          row.className ?? "",

        section:
          row.section ?? "",

        item:
          row.item ?? "",

        productCode:
          row.productCode ?? "",

        gender:
          row.gender ?? "",

        size:
          row.size ?? "",

        quantity:
          row.quantity ?? 0,

        unitPrice:
          row.unitPrice ?? 0,

        taxableAmount:
          row.taxableAmount ?? 0,

        gstPercentage:
          row.gstPercentage ?? 0,

        gstAmount:
          row.gstAmount ?? 0,

        totalAmount:
          row.totalAmount ?? 0,

        deliveredQuantity:
          row.deliveredQuantity ?? 0,

        pendingQuantity:
          row.pendingQuantity ?? 0,

        pendingReason:
          row.pendingReason ?? "",

        paymentMode:
          row.paymentMode ?? "",

        invoiceStatus:
          row.invoiceStatus ?? ""
      });
    }
  );

  const currencyColumnKeys = [
    "unitPrice",
    "taxableAmount",
    "gstAmount",
    "totalAmount"
  ];

  for (
    const columnKey of
    currencyColumnKeys
  ) {
    const column =
      sheet.getColumn(columnKey);

    column.numFmt =
      "₹#,##0.00";
  }

  applyBorders(sheet);

  sheet.views = [
    {
      state: "frozen",
      ySplit: 1
    }
  ];

  sheet.autoFilter = {
    from: {
      row: 1,
      column: 1
    },
    to: {
      row: 1,
      column:
        sheet.columns.length
    }
  };
}

export async function generateReportExcel(
  reportType: ReportType,
  filters: ReportFilters
): Promise<Buffer> {
  const [
  report,
  itemSizeDetails
] = await Promise.all([
  generateReport(
    reportType,
    filters
  ),

  getItemSizeDetails(
    reportType,
    filters
  )
]);

  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    "Schoolay Technologies Pvt. Ltd.";

  workbook.created =
    new Date();

  const sheet =
    workbook.addWorksheet(
      report.title.slice(0, 31)
    );

  sheet.mergeCells(
    1,
    1,
    1,
    report.columns.length
  );

  const titleCell =
    sheet.getCell(1, 1);

  titleCell.value = report.title;

  titleCell.font = {
    bold: true,
    size: 16,
    color: {
      argb: "FF432387"
    }
  };

  titleCell.alignment = {
    horizontal: "center"
  };

  sheet.mergeCells(
    2,
    1,
    2,
    report.columns.length
  );

  sheet.getCell(2, 1).value =
    [
      filters.dateFrom
        ? `From: ${filters.dateFrom}`
        : "",

      filters.dateTo
        ? `To: ${filters.dateTo}`
        : ""
    ]
      .filter(Boolean)
      .join(" | ");

  sheet.getCell(2, 1).alignment = {
    horizontal: "center"
  };

  const headerRowNumber = 4;

  const headerRow =
    sheet.getRow(headerRowNumber);

  report.columns.forEach(
    (column, index) => {
      const cell =
        headerRow.getCell(index + 1);

      cell.value = column.header;

      sheet.getColumn(index + 1).width =
        column.width ?? 18;
    }
  );

  applyHeaderStyle(headerRow);

  for (const reportRow of report.rows) {
    const row = sheet.addRow(
      report.columns.map(
        (column) =>
          reportRow[column.key] ?? ""
      )
    );

    row.eachCell((cell) => {
      if (
        typeof cell.value === "number"
      ) {
        cell.numFmt = "#,##0.00";
      }
    });
  }

  const summaryStart =
    sheet.rowCount + 2;

  sheet.getCell(
    summaryStart,
    1
  ).value = "Report Summary";

  sheet.getCell(
    summaryStart,
    1
  ).font = {
    bold: true,
    size: 13
  };

  const summaryRows: Array<
    [string, number]
  > = [
    [
      "Total Invoices",
      report.summary.totalInvoices
    ],
    [
      "Total Quantity",
      report.summary.totalQuantity
    ],
    [
      "Taxable Amount",
      report.summary.taxableAmount
    ],
    [
      "Total GST",
      report.summary.totalGstAmount
    ],
    [
      "Grand Total",
      report.summary.grandTotal
    ],
    [
      "Paid Amount",
      report.summary.paidAmount
    ],
    [
      "Pending Amount",
      report.summary.pendingAmount
    ]
  ];

  for (
    const [
      index,
      summaryRow
    ] of summaryRows.entries()
  ) {
    const rowNumber =
      summaryStart + index + 1;

    sheet.getCell(
      rowNumber,
      1
    ).value = summaryRow[0];

    sheet.getCell(
      rowNumber,
      2
    ).value = summaryRow[1];

    sheet.getCell(
      rowNumber,
      1
    ).font = {
      bold: true
    };

    sheet.getCell(
      rowNumber,
      2
    ).numFmt = "#,##0.00";
  }

  applyBorders(sheet);

  sheet.views = [
    {
      state: "frozen",
      ySplit: headerRowNumber
    }
  ];

  sheet.autoFilter = {
    from: {
      row: headerRowNumber,
      column: 1
    },
    to: {
      row: headerRowNumber,
      column: report.columns.length
    }
  };

  createItemSizeDetailSheet(
  workbook,
  itemSizeDetails
);

  const buffer =
    await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}