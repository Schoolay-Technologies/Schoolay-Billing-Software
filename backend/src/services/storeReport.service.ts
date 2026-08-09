import ExcelJS from "exceljs";

import {
  Types
} from "mongoose";

import {
  StoreReportModel
} from "../models/storeReport.model.js";

import {
  SchoolModel
} from "../models/school.model.js";

import type {
  CreateStoreReportInput
} from "../schemas/storeReport.schema.js";

import type {
  StoreName
} from "../types/storeReport.types.js";

function parseStartDate(
  value: string
): Date {
  return new Date(
    `${value}T00:00:00.000Z`
  );
}

function parseEndDate(
  value: string
): Date {
  return new Date(
    `${value}T23:59:59.999Z`
  );
}

function roundAmount(
  value: number
): number {
  return Math.round(
    (value +
      Number.EPSILON) *
      100
  ) / 100;
}

export async function createStoreReport(
  input:
    CreateStoreReportInput
) {
  const preparedPreOrders =
    [];

  for (
    const preOrder of
    input.preOrders
  ) {
    if (
      !Types.ObjectId.isValid(
        preOrder.schoolId
      )
    ) {
      throw new Error(
        "Invalid school."
      );
    }

    const school =
      await SchoolModel.findById(
        preOrder.schoolId
      );

    if (!school) {
      throw new Error(
        "Selected school not found."
      );
    }

    preparedPreOrders.push({
      schoolId:
        school._id,

      schoolName:
        school.schoolName,

      schoolCode:
        school.schoolCode,

      quantity:
        preOrder.quantity,

      amountCollected:
        roundAmount(
          preOrder
            .amountCollected
        )
    });
  }

  const totalPreOrderQuantity =
    preparedPreOrders.reduce(
      (
        total,
        preOrder
      ) =>
        total +
        preOrder.quantity,
      0
    );

  const totalPreOrderAmount =
    roundAmount(
      preparedPreOrders.reduce(
        (
          total,
          preOrder
        ) =>
          total +
          preOrder
            .amountCollected,
        0
      )
    );

  const exchangesPending =
    Math.max(
      input.exchangesRaised -
        input
          .exchangesFulfilled,
      0
    );

  const totalAmountCollected =
    roundAmount(
      totalPreOrderAmount +
        input
          .directPurchaseAmount
    );

  const reportDate =
    parseStartDate(
      input.reportDate
    );

  /*
   * Prevent accidental duplicate
   * daily report for same store/date.
   */
  const existingReport =
    await StoreReportModel.findOne({
      storeName:
        input.storeName,

      reportDate
    });

  if (existingReport) {
    throw new Error(
      "A report already exists for this store and date."
    );
  }

  return StoreReportModel.create({
    storeName:
      input.storeName,

    reportDate,

    openingTime:
      input.openingTime,

    closingTime:
      input.closingTime,

    totalCustomers:
      input.totalCustomers,

    preOrders:
      preparedPreOrders,

    totalPreOrderQuantity,

    totalPreOrderAmount,

    directPurchaseQuantity:
      input
        .directPurchaseQuantity,

    directPurchaseAmount:
      roundAmount(
        input
          .directPurchaseAmount
      ),

    directPurchaseOnlineAmount:
      roundAmount(
        input
          .directPurchaseOnlineAmount
      ),

    directPurchaseCashAmount:
      roundAmount(
        input
          .directPurchaseCashAmount
      ),

    exchangesRaised:
      input.exchangesRaised,

    exchangesFulfilled:
      input.exchangesFulfilled,

    exchangesPending,

    exchangePendingReason:
      exchangesPending > 0
        ? input
            .exchangePendingReason
            .trim()
        : "",

    totalAmountCollected,

    remarks:
      input.remarks.trim()
  });
}

export async function getStoreReports(
  options: {
    storeName?: StoreName;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }
) {
  const page =
    Math.max(
      options.page ?? 1,
      1
    );

  const limit =
    Math.min(
      Math.max(
        options.limit ?? 10,
        1
      ),
      100
    );

  const filter:
    Record<string, unknown> =
    {};

  if (options.storeName) {
    filter.storeName =
      options.storeName;
  }

  if (
    options.fromDate ||
    options.toDate
  ) {
    const reportDate: {
      $gte?: Date;
      $lte?: Date;
    } = {};

    if (options.fromDate) {
      reportDate.$gte =
        parseStartDate(
          options.fromDate
        );
    }

    if (options.toDate) {
      reportDate.$lte =
        parseEndDate(
          options.toDate
        );
    }

    filter.reportDate =
      reportDate;
  }

  const skip =
    (page - 1) *
    limit;

  const [
    data,
    total
  ] =
    await Promise.all([
      StoreReportModel
        .find(filter)
        .sort({
          reportDate: -1
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      StoreReportModel
        .countDocuments(
          filter
        )
    ]);

  return {
    data,

    pagination: {
      page,
      limit,
      total,

      totalPages:
        Math.ceil(
          total / limit
        )
    }
  };
}

export async function getStoreReportById(
  id: string
) {
  if (
    !Types.ObjectId.isValid(
      id
    )
  ) {
    throw new Error(
      "Invalid report ID."
    );
  }

  const report =
    await StoreReportModel
      .findById(id)
      .lean();

  if (!report) {
    throw new Error(
      "Store report not found."
    );
  }

  return report;
}

export async function getStoreMtdSummary(
  storeName: StoreName,
  fromDate: string,
  toDate: string
) {
  const result =
    await StoreReportModel.aggregate([
      {
        $match: {
          storeName,

          reportDate: {
            $gte:
              parseStartDate(
                fromDate
              ),

            $lte:
              parseEndDate(
                toDate
              )
          }
        }
      },

      {
        $group: {
          _id: null,

          totalAmountCollected: {
            $sum:
              "$totalAmountCollected"
          },

          totalCustomers: {
            $sum:
              "$totalCustomers"
          },

          totalPreOrders: {
            $sum:
              "$totalPreOrderQuantity"
          },

          totalDirectPurchases: {
            $sum:
              "$directPurchaseQuantity"
          },

          totalExchangesRaised: {
            $sum:
              "$exchangesRaised"
          },

          totalExchangesFulfilled: {
            $sum:
              "$exchangesFulfilled"
          }
        }
      }
    ]);

  return (
    result[0] ?? {
      totalAmountCollected:
        0,

      totalCustomers: 0,

      totalPreOrders: 0,

      totalDirectPurchases:
        0,

      totalExchangesRaised:
        0,

      totalExchangesFulfilled:
        0
    }
  );
}

export async function generateStoreReportsExcel(
  options: {
    storeName?: StoreName;
    fromDate: string;
    toDate: string;
  }
): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const filter:
    Record<string, unknown> =
    {
      reportDate: {
        $gte:
          parseStartDate(
            options.fromDate
          ),

        $lte:
          parseEndDate(
            options.toDate
          )
      }
    };

  if (options.storeName) {
    filter.storeName =
      options.storeName;
  }

  const reports =
    await StoreReportModel
      .find(filter)
      .sort({
        reportDate: 1,
        storeName: 1
      })
      .lean();

  const workbook =
    new ExcelJS.Workbook();

  const worksheet =
    workbook.addWorksheet(
      "Store Reports"
    );

  worksheet.columns = [
    {
      header: "Report Date",
      key: "reportDate",
      width: 15
    },
    {
      header: "Store",
      key: "storeName",
      width: 24
    },
    {
      header: "Opening Time",
      key: "openingTime",
      width: 15
    },
    {
      header: "Closing Time",
      key: "closingTime",
      width: 15
    },
    {
      header: "Customers",
      key: "customers",
      width: 13
    },
    {
      header: "School",
      key: "school",
      width: 28
    },
    {
      header:
        "Pre Order Qty",
      key: "preOrderQty",
      width: 16
    },
    {
      header:
        "Pre Order Amount",
      key: "preOrderAmount",
      width: 18
    },
    {
      header:
        "Total Pre Orders",
      key:
        "totalPreOrders",
      width: 17
    },
    {
      header:
        "Total Pre Order Amount",
      key:
        "totalPreOrderAmount",
      width: 22
    },
    {
      header:
        "Direct Purchase Qty",
      key:
        "directPurchaseQty",
      width: 20
    },
    {
      header:
        "Direct Purchase Amount",
      key:
        "directPurchaseAmount",
      width: 22
    },
    {
      header:
        "Online Amount",
      key: "onlineAmount",
      width: 17
    },
    {
      header:
        "Cash Amount",
      key: "cashAmount",
      width: 17
    },
    {
      header:
        "Exchanges Raised",
      key:
        "exchangesRaised",
      width: 18
    },
    {
      header:
        "Exchanges Fulfilled",
      key:
        "exchangesFulfilled",
      width: 20
    },
    {
      header:
        "Pending Exchanges",
      key:
        "pendingExchanges",
      width: 18
    },
    {
      header:
        "Pending Reason",
      key:
        "pendingReason",
      width: 35
    },
    {
      header:
        "Total Amount Collected",
      key:
        "totalAmountCollected",
      width: 23
    },
    {
      header: "Remarks",
      key: "remarks",
      width: 35
    }
  ];

  for (
    const report of reports
  ) {
    const preOrders =
      report.preOrders.length
        ? report.preOrders
        : [null];

    for (
      const preOrder of
      preOrders
    ) {
      worksheet.addRow({
        reportDate:
          new Date(
            report.reportDate
          ).toLocaleDateString(
            "en-IN"
          ),

        storeName:
          report.storeName
            .replaceAll(
              "_",
              " "
            ),

        openingTime:
          report.openingTime,

        closingTime:
          report.closingTime,

        customers:
          report.totalCustomers,

        school:
          preOrder
            ?.schoolName ??
          "",

        preOrderQty:
          preOrder?.quantity ??
          0,

        preOrderAmount:
          preOrder
            ?.amountCollected ??
          0,

        totalPreOrders:
          report
            .totalPreOrderQuantity,

        totalPreOrderAmount:
          report
            .totalPreOrderAmount,

        directPurchaseQty:
          report
            .directPurchaseQuantity,

        directPurchaseAmount:
          report
            .directPurchaseAmount,

        onlineAmount:
          report
            .directPurchaseOnlineAmount,

        cashAmount:
          report
            .directPurchaseCashAmount,

        exchangesRaised:
          report
            .exchangesRaised,

        exchangesFulfilled:
          report
            .exchangesFulfilled,

        pendingExchanges:
          report
            .exchangesPending,

        pendingReason:
          report
            .exchangePendingReason,

        totalAmountCollected:
          report
            .totalAmountCollected,

        remarks:
          report.remarks
      });
    }
  }

  const header =
    worksheet.getRow(1);

  header.font = {
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF432387"
    }
  };

  header.height = 28;

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1
    }
  ];

  const buffer =
    await workbook.xlsx.writeBuffer();

  return {
    buffer:
      Buffer.from(buffer),

    filename:
      `Store-Reports-${options.fromDate}-to-${options.toDate}.xlsx`
  };
}