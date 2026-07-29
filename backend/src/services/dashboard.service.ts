import { InvoiceModel } from "../models/invoice.model.js";
import { ProductModel } from "../models/product.model.js";
import { SchoolModel } from "../models/school.model.js";

function getTodayRange(): {
  start: Date;
  end: Date;
} {
  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return {
    start,
    end
  };
}

function getCurrentMonthRange(): {
  start: Date;
  end: Date;
} {
  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0
  );

  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  return {
    start,
    end
  };
}

export async function getDashboardData() {
  const todayRange = getTodayRange();
  const monthRange = getCurrentMonthRange();

  const [
    totalSchools,
    totalProducts,
    todaySummary,
    monthlySummary,
    paymentSummary,
    totalCancelledInvoices,
    sizeWiseProduction,
    productWiseProduction,
    schoolWiseSales,
    recentInvoices
  ] = await Promise.all([
    SchoolModel.countDocuments({}),

    ProductModel.countDocuments({}),

    InvoiceModel.aggregate<{
      todayInvoices: number;
      todaySales: number;
    }>([
      {
        $match: {
          invoiceStatus: "COMPLETED",

          invoiceDate: {
            $gte: todayRange.start,
            $lte: todayRange.end
          }
        }
      },
      {
        $group: {
          _id: null,

          todayInvoices: {
            $sum: 1
          },

          todaySales: {
            $sum: "$grandTotal"
          }
        }
      },
      {
        $project: {
          _id: 0,
          todayInvoices: 1,
          todaySales: 1
        }
      }
    ]),

    InvoiceModel.aggregate<{
      monthlySales: number;
    }>([
      {
        $match: {
          invoiceStatus: "COMPLETED",

          invoiceDate: {
            $gte: monthRange.start,
            $lte: monthRange.end
          }
        }
      },
      {
        $group: {
          _id: null,

          monthlySales: {
            $sum: "$grandTotal"
          }
        }
      },
      {
        $project: {
          _id: 0,
          monthlySales: 1
        }
      }
    ]),

    InvoiceModel.aggregate<{
      totalPaidAmount: number;
      totalPendingAmount: number;
    }>([
      {
        $match: {
          invoiceStatus: "COMPLETED"
        }
      },
      {
        $group: {
          _id: null,

          totalPaidAmount: {
            $sum: "$paidAmount"
          },

          totalPendingAmount: {
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
          totalPaidAmount: 1,
          totalPendingAmount: 1
        }
      }
    ]),

    InvoiceModel.countDocuments({
      invoiceStatus: "CANCELLED"
    }),

    InvoiceModel.aggregate<{
      size: string;
      totalQuantity: number;
    }>([
      {
        $match: {
          invoiceStatus: "COMPLETED"
        }
      },
      {
        $unwind: "$items"
      },
      {
        $group: {
          _id: "$items.size",

          totalQuantity: {
            $sum: "$items.quantity"
          }
        }
      },
      {
        $project: {
          _id: 0,
          size: "$_id",
          totalQuantity: 1
        }
      },
      {
        $sort: {
          size: 1
        }
      }
    ]),

    InvoiceModel.aggregate<{
      productId: string;
      productName: string;
      productCode: string;
      gender: "MALE" | "FEMALE" | "UNISEX";
      totalQuantity: number;
    }>([
      {
        $match: {
          invoiceStatus: "COMPLETED"
        }
      },
      {
        $unwind: "$items"
      },
      {
        $group: {
          _id: {
            productId: "$items.productId",
            productName: "$items.productName",
            productCode: "$items.productCode",
            gender: "$items.gender"
          },

          totalQuantity: {
            $sum: "$items.quantity"
          }
        }
      },
      {
        $project: {
          _id: 0,

          productId: {
            $toString: "$_id.productId"
          },

          productName: "$_id.productName",
          productCode: "$_id.productCode",
          gender: "$_id.gender",
          totalQuantity: 1
        }
      },
      {
        $sort: {
          totalQuantity: -1,
          productName: 1
        }
      },
      {
        $limit: 10
      }
    ]),

    InvoiceModel.aggregate<{
      schoolId: string;
      schoolName: string;
      schoolCode: string;
      invoiceCount: number;
      totalQuantity: number;
      totalSales: number;
      paidAmount: number;
      pendingAmount: number;
    }>([
      {
        $match: {
          invoiceStatus: "COMPLETED"
        }
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

          totalQuantity: {
            $sum: {
              $sum: "$items.quantity"
            }
          },

          totalSales: {
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

          schoolId: {
            $toString: "$_id.schoolId"
          },

          schoolName: "$_id.schoolName",
          schoolCode: "$_id.schoolCode",
          invoiceCount: 1,
          totalQuantity: 1,
          totalSales: 1,
          paidAmount: 1,
          pendingAmount: 1
        }
      },
      {
        $sort: {
          totalSales: -1
        }
      }
    ]),

    InvoiceModel.find({})
      .sort({
        createdAt: -1
      })
      .limit(10)
      .select({
        invoiceNumber: 1,
        invoiceDate: 1,
        schoolName: 1,
        schoolCode: 1,
        studentName: 1,
        className: 1,
        section: 1,
        grandTotal: 1,
        paidAmount: 1,
        paymentStatus: 1,
        invoiceStatus: 1,
        fulfilmentStatus: 1
      })
      .lean()
  ]);

  return {
    summary: {
      totalSchools,
      totalProducts,

      todayInvoices:
        todaySummary[0]?.todayInvoices ?? 0,

      todaySales:
        todaySummary[0]?.todaySales ?? 0,

      monthlySales:
        monthlySummary[0]?.monthlySales ?? 0,

      totalPaidAmount:
        paymentSummary[0]?.totalPaidAmount ?? 0,

      totalPendingAmount:
        paymentSummary[0]?.totalPendingAmount ?? 0,

      totalCancelledInvoices
    },

    sizeWiseProduction,
    productWiseProduction,
    schoolWiseSales,
    recentInvoices
  };
}