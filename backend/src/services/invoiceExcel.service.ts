import ExcelJS from "exceljs";

import {
  InvoiceModel
} from "../models/invoice.model.js";

function parseStartDate(
  value: string
): Date {
  const date = new Date(
    `${value}T00:00:00.000Z`
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    throw new Error(
      "Invalid From date."
    );
  }

  return date;
}

function parseEndDate(
  value: string
): Date {
  const date = new Date(
    `${value}T23:59:59.999Z`
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    throw new Error(
      "Invalid To date."
    );
  }

  return date;
}

function formatDate(
  value: Date | string
): string {
  return new Date(value)
    .toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Kolkata"
      }
    );
}

function formatLabel(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return "";
  }

  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

export async function generateInvoicesExcel(
  fromDate: string,
  toDate: string
): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  if (!fromDate || !toDate) {
    throw new Error(
      "From date and To date are required."
    );
  }

  const startDate =
    parseStartDate(fromDate);

  const endDate =
    parseEndDate(toDate);

  if (endDate < startDate) {
    throw new Error(
      "To date cannot be before From date."
    );
  }

  const invoices =
    await InvoiceModel.find({
      invoiceDate: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .sort({
        invoiceDate: 1,
        invoiceNumber: 1
      })
      .lean();

  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    "Schoolay Technologies Pvt. Ltd.";

  const worksheet =
    workbook.addWorksheet(
      "Invoices"
    );

  worksheet.columns = [
    {
      header: "S.No.",
      key: "serialNumber",
      width: 9
    },
    {
      header: "Invoice Number",
      key: "invoiceNumber",
      width: 26
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
      width: 14
    },
    {
      header: "Student Name",
      key: "studentName",
      width: 24
    },
    {
      header: "Class",
      key: "className",
      width: 12
    },
    {
      header: "Section",
      key: "section",
      width: 12
    },
    {
      header: "Parent Name",
      key: "parentName",
      width: 24
    },
    {
      header: "Contact Number",
      key: "contactNumber",
      width: 18
    },
    {
      header: "Place of Order",
      key: "placeOfOrder",
      width: 24
    },
    {
      header: "Payment Mode",
      key: "paymentMode",
      width: 18
    },
    {
      header: "Payment Status",
      key: "paymentStatus",
      width: 20
    },
    {
      header: "Invoice Status",
      key: "invoiceStatus",
      width: 18
    },
    {
      header: "Item",
      key: "productName",
      width: 26
    },
    {
      header: "Product Code",
      key: "productCode",
      width: 18
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
      header: "GST %",
      key: "gstPercentage",
      width: 12
    },
    {
      header: "Item Total",
      key: "itemTotal",
      width: 16
    },
    {
      header: "Invoice Total",
      key: "grandTotal",
      width: 17
    },
    {
      header: "Paid Amount",
      key: "paidAmount",
      width: 16
    },
    {
      header: "Pending Amount",
      key: "pendingAmount",
      width: 18
    },
    {
      header: "Fulfilment Status",
      key: "fulfilmentStatus",
      width: 22
    },
    {
      header: "Remarks",
      key: "remarks",
      width: 35
    }
  ];

  const headerRow =
    worksheet.getRow(1);

  headerRow.font = {
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF432387"
    }
  };

  headerRow.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };

  headerRow.height = 30;

  let serialNumber = 1;

  for (const invoice of invoices) {
    const pendingAmount =
      Math.max(
        Number(
          invoice.grandTotal ?? 0
        ) -
          Number(
            invoice.paidAmount ?? 0
          ),
        0
      );

    for (const item of invoice.items) {
      worksheet.addRow({
        serialNumber,
        invoiceNumber:
          invoice.invoiceNumber,
        invoiceDate:
          formatDate(
            invoice.invoiceDate
          ),
        schoolName:
          invoice.schoolName,
        schoolCode:
          invoice.schoolCode,
        studentName:
          invoice.studentName,
        className:
          invoice.className,
        section:
          invoice.section ?? "",
        parentName:
          invoice.parentName ?? "",
        contactNumber:
          invoice.contactNumber ?? "",
        placeOfOrder:
          formatLabel(
            invoice.placeOfOrder
          ),
        paymentMode:
          formatLabel(
            invoice.paymentMode
          ),
        paymentStatus:
          formatLabel(
            invoice.paymentStatus
          ),
        invoiceStatus:
          formatLabel(
            invoice.invoiceStatus
          ),
        productName:
          item.productName,
        productCode:
          item.productCode,
        gender:
          formatLabel(
            item.gender
          ),
        size:
          item.size,
        quantity:
          item.quantity,
        unitPrice:
          item.unitPrice,
        gstPercentage:
          item.gstPercentage,
        itemTotal:
          item.totalAmount,
        grandTotal:
          invoice.grandTotal,
        paidAmount:
          invoice.paidAmount,
        pendingAmount,
        fulfilmentStatus:
          formatLabel(
            invoice.fulfilmentStatus
          ),
        remarks:
          invoice.remarks ?? ""
      });

      serialNumber += 1;
    }
  }

  worksheet.getColumn(
    "unitPrice"
  ).numFmt = "₹#,##0.00";

  worksheet.getColumn(
    "itemTotal"
  ).numFmt = "₹#,##0.00";

  worksheet.getColumn(
    "grandTotal"
  ).numFmt = "₹#,##0.00";

  worksheet.getColumn(
    "paidAmount"
  ).numFmt = "₹#,##0.00";

  worksheet.getColumn(
    "pendingAmount"
  ).numFmt = "₹#,##0.00";

  worksheet.eachRow(
    (row) => {
      row.eachCell(
        {
          includeEmpty: true
        },
        (cell) => {
          cell.border = {
            top: {
              style: "thin",
              color: {
                argb:
                  "FFD0D5DD"
              }
            },
            left: {
              style: "thin",
              color: {
                argb:
                  "FFD0D5DD"
              }
            },
            right: {
              style: "thin",
              color: {
                argb:
                  "FFD0D5DD"
              }
            },
            bottom: {
              style: "thin",
              color: {
                argb:
                  "FFD0D5DD"
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

  const result =
    await workbook.xlsx.writeBuffer();

  return {
    buffer:
      Buffer.from(result),

    filename:
      `Invoices-${fromDate}-to-${toDate}.xlsx`
  };
}