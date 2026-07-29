import ExcelJS from "exceljs";
import {
  Types,
  type PipelineStage
} from "mongoose";

import { InvoiceModel } from
  "../models/invoice.model.js";

import type {
  ProductionFilters,
  ProductionGroup
} from "../types/production.types.js";

interface ProductionRow {
  period: string;
  date: Date;
  schoolId: Types.ObjectId;
  schoolName: string;
  schoolCode: string;
  productId: Types.ObjectId;
  productName: string;
  productCode: string;
  gender: "MALE" | "FEMALE" | "UNISEX";
  size: string;
  className: string;
  totalQuantity: number;
}

interface ProductionMatrixRow {
  productId: string;
  productName: string;
  productCode: string;
  gender: string;
  sizes: Record<string, number>;
  total: number;
}

function parseDateStart(
  value: string
): Date {
  const date = new Date(
    `${value}T00:00:00.000`
  );

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      "Invalid start date."
    );
  }

  return date;
}

function parseDateEnd(
  value: string
): Date {
  const date = new Date(
    `${value}T23:59:59.999`
  );

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      "Invalid end date."
    );
  }

  return date;
}

type ProductionPeriodExpression =
  | string
  | Record<string, unknown>;

function getPeriodExpression(
  groupBy: ProductionGroup | undefined
): ProductionPeriodExpression {
  if (groupBy === "DAILY") {
    return {
      $dateToString: {
        format: "%Y-%m-%d",
        date: "$invoiceDate",
        timezone: "Asia/Kolkata"
      }
    };
  }

  if (groupBy === "WEEKLY") {
    return {
      $concat: [
        {
          $toString: {
            $isoWeekYear: "$invoiceDate"
          }
        },
        "-W",
        {
          $toString: {
            $isoWeek: "$invoiceDate"
          }
        }
      ]
    };
  }

  if (groupBy === "MONTHLY") {
    return {
      $dateToString: {
        format: "%Y-%m",
        date: "$invoiceDate",
        timezone: "Asia/Kolkata"
      }
    };
  }

  return "ENTIRE_SEASON";
}

function buildMatchFilter(
  filters: ProductionFilters
): Record<string, unknown> {
  const match: Record<string, unknown> = {
    invoiceStatus: "COMPLETED"
  };

  if (filters.schoolId) {
    if (
      !Types.ObjectId.isValid(
        filters.schoolId
      )
    ) {
      throw new Error(
        "Invalid school ID."
      );
    }

    match.schoolId =
      new Types.ObjectId(
        filters.schoolId
      );
  }

  if (
    filters.dateFrom ||
    filters.dateTo
  ) {
    const invoiceDate: {
      $gte?: Date;
      $lte?: Date;
    } = {};

    if (filters.dateFrom) {
      invoiceDate.$gte =
        parseDateStart(
          filters.dateFrom
        );
    }

    if (filters.dateTo) {
      invoiceDate.$lte =
        parseDateEnd(
          filters.dateTo
        );
    }

    match.invoiceDate =
      invoiceDate;
  }

  if (filters.className) {
    match.className = {
      $regex: filters.className,
      $options: "i"
    };
  }

  return match;
}

function buildItemMatch(
  filters: ProductionFilters
): Record<string, unknown> {
  const itemMatch:
    Record<string, unknown> = {};

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

    itemMatch["items.productId"] =
      new Types.ObjectId(
        filters.productId
      );
  }

  if (filters.gender) {
    itemMatch["items.gender"] =
      filters.gender;
  }

  if (filters.size) {
    itemMatch["items.size"] =
      filters.size;
  }

  return itemMatch;
}

function buildProductionPipeline(
  filters: ProductionFilters
): PipelineStage[] {
  const match =
    buildMatchFilter(filters);

  const itemMatch =
    buildItemMatch(filters);

  const periodExpression =
    getPeriodExpression(
      filters.groupBy
    );

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
          period:
            periodExpression,

          schoolId:
            "$schoolId",

          schoolName:
            "$schoolName",

          schoolCode:
            "$schoolCode",

          productId:
            "$items.productId",

          productName:
            "$items.productName",

          productCode:
            "$items.productCode",

          gender:
            "$items.gender",

          size:
            "$items.size",

          className:
            "$className"
        },

        date: {
          $min: "$invoiceDate"
        },

        totalQuantity: {
          $sum:
            "$items.quantity"
        }
      }
    },
    {
      $project: {
        _id: 0,

        period:
          "$_id.period",

        date: 1,

        schoolId:
          "$_id.schoolId",

        schoolName:
          "$_id.schoolName",

        schoolCode:
          "$_id.schoolCode",

        productId:
          "$_id.productId",

        productName:
          "$_id.productName",

        productCode:
          "$_id.productCode",

        gender:
          "$_id.gender",

        size:
          "$_id.size",

        className:
          "$_id.className",

        totalQuantity: 1
      }
    },
    {
      $sort: {
        date: 1,
        schoolName: 1,
        productName: 1,
        gender: 1,
        size: 1,
        className: 1
      }
    }
  );

  return pipeline;
}

export async function getProductionData(
  filters: ProductionFilters
) {
  const rows =
    await InvoiceModel.aggregate<
      ProductionRow
    >(
      buildProductionPipeline(
        filters
      )
    );

  const totalQuantity =
    rows.reduce(
      (total, row) =>
        total +
        row.totalQuantity,
      0
    );

  const uniqueSchools =
    new Set(
      rows.map((row) =>
        row.schoolId.toString()
      )
    ).size;

  const uniqueProducts =
    new Set(
      rows.map((row) =>
        row.productId.toString()
      )
    ).size;

  const uniqueSizes =
    new Set(
      rows.map((row) =>
        row.size
      )
    ).size;

  return {
    rows,
    summary: {
      totalQuantity,
      totalRows: rows.length,
      uniqueSchools,
      uniqueProducts,
      uniqueSizes
    }
  };
}

export async function getProductionMatrix(
  filters: ProductionFilters
) {
  const productionData =
    await getProductionData(filters);

  const matrixMap =
    new Map<
      string,
      ProductionMatrixRow
    >();

  const sizeSet =
    new Set<string>();

  for (
    const row of
    productionData.rows
  ) {
    sizeSet.add(row.size);

    const key = [
      row.schoolId.toString(),
      row.productId.toString(),
      row.gender
    ].join("-");

    const existing =
      matrixMap.get(key);

    if (existing) {
      existing.sizes[row.size] =
        (existing.sizes[
          row.size
        ] ?? 0) +
        row.totalQuantity;

      existing.total +=
        row.totalQuantity;

      continue;
    }

    matrixMap.set(key, {
      productId:
        row.productId.toString(),

      productName:
        row.productName,

      productCode:
        row.productCode,

      gender:
        row.gender,

      sizes: {
        [row.size]:
          row.totalQuantity
      },

      total:
        row.totalQuantity
    });
  }

  const sizes =
    Array.from(sizeSet).sort(
      (first, second) => {
        const firstNumber =
          Number(first);

        const secondNumber =
          Number(second);

        if (
          Number.isFinite(
            firstNumber
          ) &&
          Number.isFinite(
            secondNumber
          )
        ) {
          return (
            firstNumber -
            secondNumber
          );
        }

        return first.localeCompare(
          second,
          undefined,
          {
            numeric: true
          }
        );
      }
    );

  const rows =
    Array.from(
      matrixMap.values()
    ).sort((first, second) =>
      first.productName.localeCompare(
        second.productName
      )
    );

  return {
    sizes,
    rows,
    summary:
      productionData.summary
  };
}

function formatDate(
  date: Date
): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Kolkata"
    }
  ).format(date);
}

function applyHeaderStyle(
  row: ExcelJS.Row
): void {
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

  row.height = 24;
}

function applyBorders(
  worksheet: ExcelJS.Worksheet
): void {
  worksheet.eachRow((row) => {
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
        bottom: {
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
        }
      };

      cell.alignment = {
        vertical: "middle"
      };
    });
  });
}

export async function generateProductionExcel(
  filters: ProductionFilters
): Promise<Buffer> {
  const [dataReport, matrixReport] =
    await Promise.all([
      getProductionData(filters),
      getProductionMatrix(filters)
    ]);

  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    "Schoolay Technologies Pvt. Ltd.";

  workbook.created =
    new Date();

  const dataSheet =
    workbook.addWorksheet(
      "Production Data"
    );

  dataSheet.columns = [
    {
      header: "Date / Period",
      key: "date",
      width: 18
    },
    {
      header: "School",
      key: "school",
      width: 28
    },
    {
      header: "School Code",
      key: "schoolCode",
      width: 16
    },
    {
      header: "Product",
      key: "product",
      width: 28
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
      header: "Class",
      key: "className",
      width: 18
    },
    {
      header: "Total Quantity",
      key: "totalQuantity",
      width: 18
    }
  ];

  applyHeaderStyle(
    dataSheet.getRow(1)
  );

  for (
    const row of
    dataReport.rows
  ) {
    dataSheet.addRow({
      date:
        filters.groupBy ===
        "ENTIRE_SEASON"
          ? formatDate(row.date)
          : row.period,

      school:
        row.schoolName,

      schoolCode:
        row.schoolCode,

      product:
        row.productName,

      gender:
        row.gender,

      size:
        row.size,

      className:
        row.className,

      totalQuantity:
        row.totalQuantity
    });
  }

  const totalRow =
    dataSheet.addRow({
      product:
        "Grand Total",

      totalQuantity:
        dataReport.summary
          .totalQuantity
    });

  totalRow.font = {
    bold: true
  };

  const matrixSheet =
    workbook.addWorksheet(
      "Production Matrix"
    );

  matrixSheet.columns = [
    {
      header: "Product",
      key: "productName",
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

    ...matrixReport.sizes.map(
      (size) => ({
        header: size,
        key: `size_${size}`,
        width: 10
      })
    ),

    {
      header: "Total",
      key: "total",
      width: 14
    }
  ];

  applyHeaderStyle(
    matrixSheet.getRow(1)
  );

  for (
    const row of
    matrixReport.rows
  ) {
    const excelRow:
      Record<string, string | number> = {
        productName:
          row.productName,

        productCode:
          row.productCode,

        gender:
          row.gender,

        total:
          row.total
      };

    for (
      const size of
      matrixReport.sizes
    ) {
      excelRow[
        `size_${size}`
      ] =
        row.sizes[size] ?? 0;
    }

    matrixSheet.addRow(
      excelRow
    );
  }

  applyBorders(dataSheet);
  applyBorders(matrixSheet);

  dataSheet.views = [
    {
      state: "frozen",
      ySplit: 1
    }
  ];

  matrixSheet.views = [
    {
      state: "frozen",
      xSplit: 3,
      ySplit: 1
    }
  ];

  const buffer =
    await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}