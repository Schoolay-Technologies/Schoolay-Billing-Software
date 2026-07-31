import {
  Types
} from "mongoose";

import ExcelJS from "exceljs";

import {
  ProductModel
} from "../models/product.model.js";

import {
  SchoolModel
} from "../models/school.model.js";

import {
  StudentMeasurementModel
} from "../models/studentMeasurement.model.js";

import type {
  StudentMeasurementInput
} from "../schemas/studentMeasurement.schema.js";

import {
    recommendStudentSize
} from "../utils/recommendStudentSize.js";

import {
  deleteStudentPhoto
} from "./studentPhoto.service.js";


export interface StudentMeasurementReportFilters {
  schoolId: string;

  dateFrom?: string;
  dateTo?: string;

  className?: string;
  section?: string;

  gender?:
    | "MALE"
    | "FEMALE"
    | "UNISEX";

  academicYear?: string;

  productId?: string;
  size?: string;
}

function parseReportStartDate(
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
      "Invalid From date."
    );
  }

  return date;
}

function parseReportEndDate(
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
      "Invalid To date."
    );
  }

  return date;
}

function buildStudentMeasurementReportFilter(
  filters:
    StudentMeasurementReportFilters
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

  const query:
    Record<string, unknown> = {
      schoolId:
        new Types.ObjectId(
          filters.schoolId
        )
  };

  if (
    filters.dateFrom ||
    filters.dateTo
  ) {
    const measurementDate: {
      $gte?: Date;
      $lte?: Date;
    } = {};

    if (filters.dateFrom) {
      measurementDate.$gte =
        parseReportStartDate(
          filters.dateFrom
        );
    }

    if (filters.dateTo) {
      measurementDate.$lte =
        parseReportEndDate(
          filters.dateTo
        );
    }

    query.measurementDate =
      measurementDate;
  }

  if (filters.className) {
    query.className = {
      $regex:
        filters.className.trim(),
      $options: "i"
    };
  }

  if (filters.section) {
    query.section = {
      $regex:
        filters.section.trim(),
      $options: "i"
    };
  }

  if (filters.gender) {
    query.gender =
      filters.gender;
  }

  if (filters.academicYear) {
    query.academicYear = {
      $regex:
        filters.academicYear.trim(),
      $options: "i"
    };
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

    query["items.productId"] =
      new Types.ObjectId(
        filters.productId
      );
  }

  if (filters.size) {
    query["items.finalSize"] = {
      $regex:
        filters.size.trim(),
      $options: "i"
    };
  }

  return query;
}

function normalizeMeasurements(
  measurements:
    StudentMeasurementInput["measurements"]
) {
  return Object.fromEntries(
    Object.entries(
      measurements
    ).map(
      ([key, value]) => [
        key,
        value ?? null
      ]
    )
  );
}

async function prepareRecord(
  input: StudentMeasurementInput
) {
  if (
    !Types.ObjectId.isValid(
      input.schoolId
    )
  ) {
    throw new Error(
      "Invalid school ID."
    );
  }

  const school =
    await SchoolModel.findOne({
      _id: input.schoolId,
      status: "ACTIVE"
    });

  if (!school) {
    throw new Error(
      "Active school not found."
    );
  }

  const recommendation =
    recommendStudentSize(
      input.measurements
    );

  const preparedItems = [];

  for (const inputItem of input.items) {
    if (
      !Types.ObjectId.isValid(
        inputItem.productId
      )
    ) {
      throw new Error(
        "Invalid product ID."
      );
    }

    const product =
      await ProductModel.findOne({
        _id: inputItem.productId,
        schoolId: school._id,
        status: "ACTIVE"
      });

    if (!product) {
      throw new Error(
        "Selected product is invalid or does not belong to this school."
      );
    }

    let finalSize = "";

    if (
      inputItem.sizeMode ===
      "CUSTOM"
    ) {
      finalSize =
        inputItem.customSize;
    } else if (
      inputItem
        .sizeSelectionMode ===
      "MANUAL_OVERRIDE"
    ) {
      finalSize =
        inputItem
          .manualOverrideSize;
    } else {
      finalSize =
        recommendation
          .recommendedSize;
    }

    if (!finalSize.trim()) {
      throw new Error(
        `A size could not be selected for ${product.productName}. Enter a manual size.`
      );
    }

    preparedItems.push({
      productId:
        product._id,

      productName:
        product.productName,

      productCode:
        product.productCode,

      productGender:
        product.gender,

      quantity:
        inputItem.quantity,

      sizeMode:
        inputItem.sizeMode,

      recommendedSize:
        recommendation
          .recommendedSize,

      recommendationScore:
        recommendation.score,

      sizeSelectionMode:
        inputItem
          .sizeSelectionMode,

      manualOverrideSize:
        inputItem
          .manualOverrideSize,

      finalSize,

      remarks:
        inputItem.remarks
    });
  }

  return {
    school,
    recommendation,
    preparedItems
  };
}

export async function createStudentMeasurement(
  input: StudentMeasurementInput
) {
  const {
    school,
    recommendation,
    preparedItems
  } = await prepareRecord(input);

  return StudentMeasurementModel.create({
    schoolId: school._id,
    schoolName:
      school.schoolName,
    schoolCode:
      school.schoolCode,

    studentName:
      input.studentName,
    studentId:
      input.studentId,
    className:
      input.className,
    section:
      input.section,
    gender:
      input.gender,
    academicYear:
      input.academicYear,

    photo:
      input.photo,

    measurements:
      normalizeMeasurements(
        input.measurements
      ),

    recommendedSize:
      recommendation
        .recommendedSize,

    recommendationScore:
      recommendation.score,

    recommendationMatchedFields:
      recommendation
        .matchedFields,

    measurementDate:
      input.measurementDate,

    items:
      preparedItems,

    generalRemarks:
      input.generalRemarks,

    status:
      input.status
  });
}

export async function updateStudentMeasurement(
  id: string,
  input: StudentMeasurementInput
) {
  if (
    !Types.ObjectId.isValid(id)
  ) {
    throw new Error(
      "Invalid record ID."
    );
  }

  const record =
    await StudentMeasurementModel.findById(
      id
    );

  if (!record) {
    throw new Error(
      "Student measurement record not found."
    );
  }

  const previousPublicId =
    record.photo?.publicId ?? "";

  const {
    school,
    recommendation,
    preparedItems
  } = await prepareRecord(input);

  record.schoolId =
    school._id;
  record.schoolName =
    school.schoolName;
  record.schoolCode =
    school.schoolCode;

  record.studentName =
    input.studentName;
  record.studentId =
    input.studentId;
  record.className =
    input.className;
  record.section =
    input.section;
  record.gender =
    input.gender;
  record.academicYear =
    input.academicYear;

  record.photo =
    input.photo;

  record.measurements =
    normalizeMeasurements(
      input.measurements
    ) as typeof record.measurements;

  record.recommendedSize =
    recommendation
      .recommendedSize;

  record.recommendationScore =
    recommendation.score;

  record.recommendationMatchedFields =
    recommendation
      .matchedFields;

  record.measurementDate =
    input.measurementDate;

  record.items =
    preparedItems as typeof record.items;

  record.generalRemarks =
    input.generalRemarks;

  record.status =
    input.status;

  await record.save();

  if (
    previousPublicId &&
    previousPublicId !==
      input.photo.publicId
  ) {
    await deleteStudentPhoto(
      previousPublicId
    );
  }

  return record;
}

export async function deleteStudentMeasurement(
  id: string
) {
  if (
    !Types.ObjectId.isValid(id)
  ) {
    throw new Error(
      "Invalid record ID."
    );
  }

  const record =
    await StudentMeasurementModel.findByIdAndDelete(
      id
    );

  if (!record) {
    throw new Error(
      "Student measurement record not found."
    );
  }

  if (
    record.photo?.publicId
  ) {
    await deleteStudentPhoto(
      record.photo.publicId
    );
  }

  return record;
}

export async function getStudentMeasurements(
  options: any
) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;

  const records = await StudentMeasurementModel.find()
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({
      createdAt: -1
    });

  const total =
    await StudentMeasurementModel.countDocuments();

  return {
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getStudentMeasurementById(
  id: string
) {
  return StudentMeasurementModel.findById(id);
}

export async function getStudentMeasurementReportData(
  filters:
    StudentMeasurementReportFilters
) {
  const query =
    buildStudentMeasurementReportFilter(
      filters
    );

  const records =
    await StudentMeasurementModel.find(
      query
    )
      .sort({
        className: 1,
        section: 1,
        studentName: 1
      })
      .lean();

  return records;
}

function applyStudentReportHeaderStyle(
  row: ExcelJS.Row
): void {
  row.height = 28;

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
    vertical: "middle",
    wrapText: true
  };
}

function applyStudentReportBorders(
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

function formatReportDate(
  value:
    | Date
    | string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}

function getMeasurementValue(
  value:
    | number
    | null
    | undefined
): number | string {
  return typeof value === "number"
    ? value
    : "";
}

export async function generateStudentMeasurementExcel(
  filters:
    StudentMeasurementReportFilters
): Promise<Buffer> {
  const records =
    await getStudentMeasurementReportData(
      filters
    );

  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    "Schoolay Technologies Pvt. Ltd.";

  workbook.created =
    new Date();

  const worksheet =
    workbook.addWorksheet(
      "Student Measurements"
    );

  worksheet.columns = [
    {
      header: "S.No.",
      key: "serialNumber",
      width: 9
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
      header: "Student Photo URL",
      key: "photoUrl",
      width: 45
    },

    {
      header: "Student Name",
      key: "studentName",
      width: 25
    },

    {
      header: "Student ID",
      key: "studentId",
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
      header: "Academic Year",
      key: "academicYear",
      width: 16
    },

    {
      header: "Measurement Date",
      key: "measurementDate",
      width: 18
    },

    {
      header: "Height (cm)",
      key: "height",
      width: 14
    },

    {
      header: "Chest (inches)",
      key: "chest",
      width: 15
    },

    {
      header: "Waist (inches)",
      key: "waist",
      width: 15
    },

    {
      header: "Hip (inches)",
      key: "hip",
      width: 14
    },

    {
      header: "Shoulder (inches)",
      key: "shoulder",
      width: 17
    },

    {
      header: "Sleeve (inches)",
      key: "sleeve",
      width: 16
    },

    {
      header: "Shirt Length (inches)",
      key: "shirtLength",
      width: 20
    },

    {
      header: "Pant Length (inches)",
      key: "pantLength",
      width: 20
    },

    {
      header: "Inseam (inches)",
      key: "inseam",
      width: 16
    },

    {
      header: "Neck (inches)",
      key: "neck",
      width: 15
    },

    {
      header: "Overall Recommended Size",
      key: "overallRecommendedSize",
      width: 23
    },

    {
      header: "Recommendation Score",
      key: "overallRecommendationScore",
      width: 22
    },

    {
      header: "Item",
      key: "item",
      width: 28
    },

    {
      header: "Product Code",
      key: "productCode",
      width: 17
    },

    {
      header: "Product Gender",
      key: "productGender",
      width: 17
    },

    {
      header: "Quantity",
      key: "quantity",
      width: 12
    },

    {
      header: "Size Type",
      key: "sizeMode",
      width: 15
    },

    {
      header: "Item Recommended Size",
      key: "recommendedSize",
      width: 22
    },

    {
      header: "Item Recommendation Score",
      key: "itemRecommendationScore",
      width: 24
    },

    {
      header: "Size Selection",
      key: "sizeSelectionMode",
      width: 20
    },

    {
      header: "Manual Override Size",
      key: "manualOverrideSize",
      width: 21
    },

    {
      header: "Final Size",
      key: "finalSize",
      width: 17
    },

    {
      header: "Item Remarks",
      key: "itemRemarks",
      width: 35
    },

    {
      header: "General Remarks",
      key: "generalRemarks",
      width: 35
    },

    {
      header: "Record Status",
      key: "status",
      width: 15
    }
  ];

  applyStudentReportHeaderStyle(
    worksheet.getRow(1)
  );

  let serialNumber = 1;

  for (const record of records) {
    /*
     * One row is created for every uniform item.
     * Student and measurement information repeats so
     * Item and Final Size remain in separate columns.
     */
    for (const item of record.items) {
      /*
       * A product filter can match the document while
       * leaving other products in its items array.
       * Filter those items again before writing Excel.
       */
      if (
        filters.productId &&
        item.productId.toString() !==
          filters.productId
      ) {
        continue;
      }

      if (
        filters.size &&
        !item.finalSize
          .toLowerCase()
          .includes(
            filters.size
              .trim()
              .toLowerCase()
          )
      ) {
        continue;
      }

      const row =
        worksheet.addRow({
          serialNumber,

          schoolName:
            record.schoolName,

          schoolCode:
            record.schoolCode,

          photoUrl:
            record.photo?.url ??
            "",

          studentName:
            record.studentName,

          studentId:
            record.studentId,

          className:
            record.className,

          section:
            record.section ?? "",

          gender:
            record.gender,

          academicYear:
            record.academicYear,

          measurementDate:
            formatReportDate(
              record.measurementDate
            ),

          height:
            getMeasurementValue(
              record.measurements
                ?.height
            ),

          chest:
            getMeasurementValue(
              record.measurements
                ?.chest
            ),

          waist:
            getMeasurementValue(
              record.measurements
                ?.waist
            ),

          hip:
            getMeasurementValue(
              record.measurements
                ?.hip
            ),

          shoulder:
            getMeasurementValue(
              record.measurements
                ?.shoulder
            ),

          sleeve:
            getMeasurementValue(
              record.measurements
                ?.sleeve
            ),

          shirtLength:
            getMeasurementValue(
              record.measurements
                ?.shirtLength
            ),

          pantLength:
            getMeasurementValue(
              record.measurements
                ?.pantLength
            ),

          inseam:
            getMeasurementValue(
              record.measurements
                ?.inseam
            ),

          neck:
            getMeasurementValue(
              record.measurements
                ?.neck
            ),

          overallRecommendedSize:
            record.recommendedSize ??
            "",

          overallRecommendationScore:
            record.recommendationScore ??
            0,

          item:
            item.productName,

          productCode:
            item.productCode,

          productGender:
            item.productGender,

          quantity:
            item.quantity,

          sizeMode:
            item.sizeMode,

          recommendedSize:
            item.recommendedSize ??
            "",

          itemRecommendationScore:
            item.recommendationScore ??
            0,

          sizeSelectionMode:
            item.sizeSelectionMode,

          manualOverrideSize:
            item.manualOverrideSize ??
            "",

          finalSize:
            item.finalSize,

          itemRemarks:
            item.remarks ?? "",

          generalRemarks:
            record.generalRemarks ??
            "",

          status:
            record.status
        });

      /*
       * Make the Cloudinary URL clickable.
       */
      if (record.photo?.url) {
        const photoCell =
          row.getCell(
            "photoUrl"
          );

        photoCell.value = {
          text:
            record.photo.url,

          hyperlink:
            record.photo.url
        };

        photoCell.font = {
          color: {
            argb:
              "FF0000FF"
          },

          underline: true
        };
      }

      serialNumber += 1;
    }
  }

  applyStudentReportBorders(
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

  worksheet.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0
  };

  const buffer =
    await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}

