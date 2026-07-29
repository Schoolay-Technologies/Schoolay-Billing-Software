import ExcelJS from "exceljs";
import { Types } from "mongoose";

import {
  StudentSizeRecordModel
} from "../models/studentSizeRecord.model.js";

import {
  ProductModel
} from "../models/product.model.js";

import {
  SchoolModel
} from "../models/school.model.js";

import type {
  CreateStudentSizeRecordInput,
  UpdateStudentSizeRecordInput
} from "../schemas/studentSizeRecord.schema.js";

interface PreparedStudentSizeItem {
  productId: Types.ObjectId;
  variantId: Types.ObjectId;
  productName: string;
  productCode: string;
  gender:
    | "MALE"
    | "FEMALE"
    | "UNISEX";
  size: string;
  quantity: number;
  additionalDescription: string;
}

interface GetStudentSizeRecordsOptions {
  schoolId?: string;
  search?: string;
  className?: string;
  section?: string;
  gender?:
    | "MALE"
    | "FEMALE"
    | "UNISEX";
  status?: "ACTIVE" | "INACTIVE";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

interface StudentSizeReportFilters {
  schoolId: string;
  dateFrom?: string;
  dateTo?: string;
  className?: string;
  section?: string;
  gender?:
    | "MALE"
    | "FEMALE"
    | "UNISEX";
  productId?: string;
}

function parseStartDate(
  value: string
): Date {
  const date = new Date(
    `${value}T00:00:00.000`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "Invalid start date."
    );
  }

  return date;
}

function parseEndDate(
  value: string
): Date {
  const date = new Date(
    `${value}T23:59:59.999`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "Invalid end date."
    );
  }

  return date;
}

async function prepareItems(
  schoolId: string,
  items:
    CreateStudentSizeRecordInput["items"]
): Promise<
  PreparedStudentSizeItem[]
> {
  const preparedItems:
    PreparedStudentSizeItem[] = [];

  for (const item of items) {
    if (
      !Types.ObjectId.isValid(
        item.productId
      )
    ) {
      throw new Error(
        "Invalid product ID."
      );
    }

    if (
      !Types.ObjectId.isValid(
        item.variantId
      )
    ) {
      throw new Error(
        "Invalid product size ID."
      );
    }

    const product =
      await ProductModel.findOne({
        _id: item.productId,
        schoolId,
        status: "ACTIVE"
      });

    if (!product) {
      throw new Error(
        "The selected product does not belong to the selected school or is inactive."
      );
    }

    const variant =
      product.variants.id(
        item.variantId
      );

    if (!variant) {
      throw new Error(
        `The selected size was not found for ${product.productName}.`
      );
    }

    if (
      variant.status !== "ACTIVE"
    ) {
      throw new Error(
        `${product.productName}, size ${variant.size}, is inactive.`
      );
    }

    preparedItems.push({
      productId:
        product._id,

      variantId:
        variant._id,

      productName:
        product.productName,

      productCode:
        product.productCode,

      gender:
        product.gender,

      size:
        variant.size,

      quantity:
        item.quantity,

      additionalDescription:
        item.additionalDescription.trim()
    });
  }

  return preparedItems;
}

async function getActiveSchool(
  schoolId: string
) {
  if (
    !Types.ObjectId.isValid(
      schoolId
    )
  ) {
    throw new Error(
      "Invalid school ID."
    );
  }

  const school =
    await SchoolModel.findById(
      schoolId
    );

  if (!school) {
    throw new Error(
      "School not found."
    );
  }

  if (
    school.status !== "ACTIVE"
  ) {
    throw new Error(
      "Student size records cannot be created for an inactive school."
    );
  }

  return school;
}

export async function createStudentSizeRecord(
  input: CreateStudentSizeRecordInput
) {
  const school =
    await getActiveSchool(
      input.schoolId
    );

  const preparedItems =
    await prepareItems(
      input.schoolId,
      input.items
    );

  return StudentSizeRecordModel.create({
    schoolId:
      school._id,

    schoolName:
      school.schoolName,

    schoolCode:
      school.schoolCode,

    studentName:
      input.studentName.trim(),

    admissionNumber:
      input.admissionNumber.trim(),

    className:
      input.className.trim(),

    section:
      input.section.trim(),

    gender:
      input.gender,

    parentName:
      input.parentName.trim(),

    contactNumber:
      input.contactNumber.trim(),

    recordDate:
      input.recordDate,

    items:
      preparedItems,

    generalRemarks:
      input.generalRemarks.trim(),

    status:
      input.status
  });
}

export async function updateStudentSizeRecord(
  id: string,
  input: UpdateStudentSizeRecordInput
) {
  if (
    !Types.ObjectId.isValid(id)
  ) {
    throw new Error(
      "Invalid student size record ID."
    );
  }

  const record =
    await StudentSizeRecordModel.findById(
      id
    );

  if (!record) {
    throw new Error(
      "Student size record not found."
    );
  }

  const school =
    await getActiveSchool(
      input.schoolId
    );

  const preparedItems =
    await prepareItems(
      input.schoolId,
      input.items
    );

  record.schoolId =
    school._id;

  record.schoolName =
    school.schoolName;

  record.schoolCode =
    school.schoolCode;

  record.studentName =
    input.studentName.trim();

  record.admissionNumber =
    input.admissionNumber.trim();

  record.className =
    input.className.trim();

  record.section =
    input.section.trim();

  record.gender =
    input.gender;

  record.parentName =
    input.parentName.trim();

  record.contactNumber =
    input.contactNumber.trim();

  record.recordDate =
    input.recordDate;

  record.items =
    preparedItems as typeof record.items;

  record.generalRemarks =
    input.generalRemarks.trim();

  record.status =
    input.status;

  await record.save();

  return record;
}

export async function getStudentSizeRecords(
  options:
    GetStudentSizeRecordsOptions
) {
  const page = Math.max(
    options.page ?? 1,
    1
  );

  const limit = Math.min(
    Math.max(
      options.limit ?? 10,
      1
    ),
    100
  );

  const filter:
    Record<string, unknown> = {};

  if (options.schoolId) {
    if (
      !Types.ObjectId.isValid(
        options.schoolId
      )
    ) {
      throw new Error(
        "Invalid school ID."
      );
    }

    filter.schoolId =
      new Types.ObjectId(
        options.schoolId
      );
  }

  if (options.className) {
    filter.className = {
      $regex:
        options.className,
      $options: "i"
    };
  }

  if (options.section) {
    filter.section = {
      $regex:
        options.section,
      $options: "i"
    };
  }

  if (options.gender) {
    filter.gender =
      options.gender;
  }

  if (options.status) {
    filter.status =
      options.status;
  }

  if (options.search) {
    filter.$or = [
      {
        studentName: {
          $regex:
            options.search,
          $options: "i"
        }
      },
      {
        admissionNumber: {
          $regex:
            options.search,
          $options: "i"
        }
      },
      {
        contactNumber: {
          $regex:
            options.search,
          $options: "i"
        }
      },
      {
        schoolName: {
          $regex:
            options.search,
          $options: "i"
        }
      }
    ];
  }

  if (
    options.dateFrom ||
    options.dateTo
  ) {
    const dateFilter: {
      $gte?: Date;
      $lte?: Date;
    } = {};

    if (options.dateFrom) {
      dateFilter.$gte =
        parseStartDate(
          options.dateFrom
        );
    }

    if (options.dateTo) {
      dateFilter.$lte =
        parseEndDate(
          options.dateTo
        );
    }

    filter.recordDate =
      dateFilter;
  }

  const skip =
    (page - 1) * limit;

  const [records, total] =
    await Promise.all([
      StudentSizeRecordModel.find(
        filter
      )
        .sort({
          recordDate: -1,
          createdAt: -1
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      StudentSizeRecordModel.countDocuments(
        filter
      )
    ]);

  return {
    records,

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

export async function getStudentSizeRecordById(
  id: string
) {
  if (
    !Types.ObjectId.isValid(id)
  ) {
    throw new Error(
      "Invalid student size record ID."
    );
  }

  const record =
    await StudentSizeRecordModel.findById(
      id
    ).lean();

  if (!record) {
    throw new Error(
      "Student size record not found."
    );
  }

  return record;
}

export async function deleteStudentSizeRecord(
  id: string
) {
  if (
    !Types.ObjectId.isValid(id)
  ) {
    throw new Error(
      "Invalid student size record ID."
    );
  }

  const record =
    await StudentSizeRecordModel.findByIdAndDelete(
      id
    );

  if (!record) {
    throw new Error(
      "Student size record not found."
    );
  }

  return record;
}

function buildReportFilter(
  filters:
    StudentSizeReportFilters
): Record<string, unknown> {
  if (
    !Types.ObjectId.isValid(
      filters.schoolId
    )
  ) {
    throw new Error(
      "Invalid school ID."
    );
  }

  const match:
    Record<string, unknown> = {
      schoolId:
        new Types.ObjectId(
          filters.schoolId
        ),

      status: "ACTIVE"
    };

  if (
    filters.dateFrom ||
    filters.dateTo
  ) {
    const recordDate: {
      $gte?: Date;
      $lte?: Date;
    } = {};

    if (filters.dateFrom) {
      recordDate.$gte =
        parseStartDate(
          filters.dateFrom
        );
    }

    if (filters.dateTo) {
      recordDate.$lte =
        parseEndDate(
          filters.dateTo
        );
    }

    match.recordDate =
      recordDate;
  }

  if (filters.className) {
    match.className = {
      $regex:
        filters.className,
      $options: "i"
    };
  }

  if (filters.section) {
    match.section = {
      $regex:
        filters.section,
      $options: "i"
    };
  }

  if (filters.gender) {
    match.gender =
      filters.gender;
  }

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

  return match;
}

export async function getStudentSizeReportData(
  filters:
    StudentSizeReportFilters
) {
  const records =
    await StudentSizeRecordModel.find(
      buildReportFilter(filters)
    )
      .sort({
        className: 1,
        section: 1,
        studentName: 1
      })
      .lean();

  return records;
}

function cleanSheetName(
  value: string
): string {
  const cleaned = value
    .replace(
      /[\\/?*[\]:]/g,
      ""
    )
    .trim();

  return (
    cleaned.slice(0, 31) ||
    "Product"
  );
}

function applyHeaderStyle(
  row: ExcelJS.Row
): void {
  row.height = 25;

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
  worksheet:
    ExcelJS.Worksheet
): void {
  worksheet.eachRow(
    (row) => {
      row.eachCell(
        (cell) => {
          cell.border = {
            top: {
              style: "thin",
              color: {
                argb:
                  "FFD1D5DB"
              }
            },
            left: {
              style: "thin",
              color: {
                argb:
                  "FFD1D5DB"
              }
            },
            right: {
              style: "thin",
              color: {
                argb:
                  "FFD1D5DB"
              }
            },
            bottom: {
              style: "thin",
              color: {
                argb:
                  "FFD1D5DB"
              }
            }
          };

          cell.alignment = {
            vertical: "middle",
            wrapText: true
          };
        }
      );
    }
  );
}

export async function generateStudentSizeExcel(
  filters:
    StudentSizeReportFilters
): Promise<Buffer> {
  const records =
    await getStudentSizeReportData(
      filters
    );

  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    "Schoolay Technologies Pvt. Ltd.";

  workbook.created =
    new Date();

  const summarySheet =
    workbook.addWorksheet(
      "Student Summary"
    );

 summarySheet.columns = [
  {
    header: "S.No.",
    key: "serialNumber",
    width: 10
  },
  {
    header: "Student Name",
    key: "studentName",
    width: 25
  },
  {
    header: "Admission No.",
    key: "admissionNumber",
    width: 18
  },
  {
    header: "Class",
    key: "className",
    width: 16
  },
  {
    header: "Section",
    key: "section",
    width: 12
  },
  {
    header: "Gender",
    key: "gender",
    width: 14
  },
  {
    header: "Parent Name",
    key: "parentName",
    width: 25
  },
  {
    header: "Contact Number",
    key: "contactNumber",
    width: 18
  },
  {
    header: "Record Date",
    key: "recordDate",
    width: 16
  },
  {
    header: "Item",
    key: "item",
    width: 28
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
    header: "Additional Description",
    key: "additionalDescription",
    width: 40
  },
  {
    header: "General Remarks",
    key: "generalRemarks",
    width: 35
  }
];

  applyHeaderStyle(
    summarySheet.getRow(1)
  );

  let summarySerialNumber = 1;

for (const record of records) {
  for (const item of record.items) {
    summarySheet.addRow({
      serialNumber:
        summarySerialNumber,

      studentName:
        record.studentName,

      admissionNumber:
        record.admissionNumber,

      className:
        record.className,

      section:
        record.section,

      gender:
        record.gender,

      parentName:
        record.parentName,

      contactNumber:
        record.contactNumber,

      recordDate:
        new Date(
          record.recordDate
        ).toLocaleDateString(
          "en-IN"
        ),

      item:
        item.productName,

      size:
        item.size,

      quantity:
        item.quantity,

      additionalDescription:
        item.additionalDescription,

      generalRemarks:
        record.generalRemarks
    });

    summarySerialNumber += 1;
  }
}

  const productMap =
    new Map<
      string,
      {
        productName: string;
        productCode: string;
        rows: Array<{
          studentName: string;
          admissionNumber: string;
          className: string;
          section: string;
          gender: string;
          size: string;
          quantity: number;
          additionalDescription: string;
          recordDate: string;
        }>;
      }
    >();

  for (const record of records) {
    for (const item of record.items) {
      const productId =
        item.productId.toString();

      const existing =
        productMap.get(productId);

      const row = {
        studentName:
          record.studentName,

        admissionNumber:
          record.admissionNumber,

        className:
          record.className,

        section:
          record.section,

        gender:
          record.gender,

        size:
          item.size,

        quantity:
          item.quantity,

        additionalDescription:
          item.additionalDescription,

        recordDate:
          new Date(
            record.recordDate
          ).toLocaleDateString(
            "en-IN"
          )
      };

      if (existing) {
        existing.rows.push(row);
      } else {
        productMap.set(
          productId,
          {
            productName:
              item.productName,

            productCode:
              item.productCode,

            rows: [row]
          }
        );
      }
    }
  }

  for (
    const product of
    productMap.values()
  ) {
    let sheetName =
      cleanSheetName(
        product.productName
      );

    let counter = 1;

    while (
      workbook.getWorksheet(
        sheetName
      )
    ) {
      const suffix =
        `-${counter}`;

      sheetName =
        cleanSheetName(
          product.productName
        ).slice(
          0,
          31 - suffix.length
        ) + suffix;

      counter += 1;
    }

    const worksheet =
      workbook.addWorksheet(
        sheetName
      );

    worksheet.columns = [
      {
        header: "S.No.",
        key: "serialNumber",
        width: 10
      },
      {
        header: "Student Name",
        key: "studentName",
        width: 25
      },
      {
        header: "Admission No.",
        key: "admissionNumber",
        width: 18
      },
      {
        header: "Class",
        key: "className",
        width: 16
      },
      {
        header: "Section",
        key: "section",
        width: 12
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
        header: "Additional Description",
        key: "additionalDescription",
        width: 45
      },
      {
        header: "Record Date",
        key: "recordDate",
        width: 16
      }
    ];

    applyHeaderStyle(
      worksheet.getRow(1)
    );

    product.rows.forEach(
      (row, index) => {
        worksheet.addRow({
          serialNumber:
            index + 1,

          ...row
        });
      }
    );

    applyBorders(
      worksheet
    );

    worksheet.views = [
      {
        state: "frozen",
        ySplit: 1
      }
    ];

    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1
      },
      to: {
        row: 1,
        column:
          worksheet.columns.length
      }
    };
  }

  applyBorders(
    summarySheet
  );

  summarySheet.views = [
    {
      state: "frozen",
      ySplit: 1
    }
  ];

  summarySheet.autoFilter = {
    from: {
      row: 1,
      column: 1
    },
    to: {
      row: 1,
      column:
        summarySheet.columns.length
    }
  };

  const buffer =
    await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}