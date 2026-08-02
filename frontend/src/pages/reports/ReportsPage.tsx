import axios from "axios";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  downloadReportExcel,
  getReport
} from "../../api/report.api";

import {
  getProducts
} from "../../api/product.api";

import {
  getSchools
} from "../../api/school.api";

import Alert from
  "../../components/common/Alert";

import LoadingSpinner from
  "../../components/common/LoadingSpinner";

import type {
  Product
} from "../../types/product.types";

import type {
  ReportColumn,
  ReportFilters,
  ReportOption,
  ReportResponse,
  ReportType
} from "../../types/report.types";

import type {
  ApiErrorResponse,
  School
} from "../../types/school.types";

const reportOptions: ReportOption[] = [
  {
    value: "SCHOOL_WISE_SALES",
    label: "School-wise Sales Report"
  },
  {
    value: "DATE_WISE_SALES",
    label: "Date-wise Sales Report"
  },
  {
    value: "STUDENT_PURCHASE",
    label: "Student-wise Purchase Report"
  },
  {
    value: "CLASS_WISE_SALES",
    label: "Class-wise Sales Report"
  },
  {
    value: "PRODUCT_WISE_SALES",
    label: "Product-wise Sales Report"
  },
  {
    value: "GENDER_WISE_SALES",
    label: "Gender-wise Sales Report"
  },
  {
    value: "SIZE_WISE_QUANTITY",
    label: "Size-wise Quantity Report"
  },
  {
    value: "GST_REPORT",
    label: "GST Report"
  },
  {
    value: "PAYMENT_MODE_REPORT",
    label: "Payment Mode Report"
  },
  {
    value: "PRODUCTION_REQUIREMENT",
    label: "Production Requirement Report"
  },
  {
    value: "PRODUCTION_PENDING",
    label: "Production Pending Report"
  },
  {
    value: "CANCELLED_INVOICES",
    label: "Cancelled Invoice Report"
  },
  {
    value: "DAILY_COLLECTION",
    label: "Daily Collection Report"
  },
  {
    value: "MONTHLY_SALES",
    label: "Monthly Sales Report"
  }
];

const initialFilters: ReportFilters = {
  schoolId: "",
  dateFrom: "",
  dateTo: "",
  studentName: "",
  className: "",
  productId: "",
  gender: "",
  size: "",
  paymentMode: ""
};

function getErrorMessage(
  error: unknown
): string {
  if (
    axios.isAxiosError<
      ApiErrorResponse
    >(error)
  ) {
    const data =
      error.response?.data;

    if (data?.errors?.length) {
      return data.errors
        .map((item) => item.message)
        .join(", ");
    }

    return (
      data?.message ??
      "The request failed."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

function formatCurrency(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2
    }
  ).format(value);
}

function formatLabel(
  value: string
): string {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function escapeHtml(
  value: string
): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isCurrencyColumn(
  key: string
): boolean {
  const currencyKeys = [
    "taxableAmount",
    "gstAmount",
    "cgstAmount",
    "sgstAmount",
    "igstAmount",
    "totalGstAmount",
    "grandTotal",
    "totalAmount",
    "unitPrice",
    "paidAmount",
    "pendingAmount",
    "balanceAmount",
    "cash",
    "card",
    "online",
    "collection",
    "totalCollection"
  ];

  return currencyKeys.includes(key);
}

function formatCellValue(
  key: string,
  value: unknown
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (
    typeof value === "number" &&
    isCurrencyColumn(key)
  ) {
    return formatCurrency(value);
  }

  if (
    typeof value === "string" &&
    (
      key === "gender" ||
      key === "paymentMode" ||
      key === "pendingReason"
    )
  ) {
    return formatLabel(value);
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat(
      "en-IN"
    ).format(value);
  }

  return String(value);
}

function reportUsesStudentFilter(
  reportType: ReportType
): boolean {
  return reportType === "STUDENT_PURCHASE";
}

function reportUsesClassFilter(
  reportType: ReportType
): boolean {
  return [
    "STUDENT_PURCHASE",
    "CLASS_WISE_SALES",
    "PRODUCTION_PENDING"
  ].includes(reportType);
}

function reportUsesProductFilter(
  reportType: ReportType
): boolean {
  return [
    "STUDENT_PURCHASE",
    "PRODUCT_WISE_SALES",
    "GENDER_WISE_SALES",
    "SIZE_WISE_QUANTITY",
    "PRODUCTION_REQUIREMENT",
    "PRODUCTION_PENDING"
  ].includes(reportType);
}

function reportUsesGenderFilter(
  reportType: ReportType
): boolean {
  return [
    "STUDENT_PURCHASE",
    "PRODUCT_WISE_SALES",
    "GENDER_WISE_SALES",
    "SIZE_WISE_QUANTITY",
    "PRODUCTION_REQUIREMENT",
    "PRODUCTION_PENDING"
  ].includes(reportType);
}

function reportUsesSizeFilter(
  reportType: ReportType
): boolean {
  return [
    "STUDENT_PURCHASE",
    "SIZE_WISE_QUANTITY",
    "PRODUCTION_REQUIREMENT",
    "PRODUCTION_PENDING"
  ].includes(reportType);
}

function reportUsesPaymentModeFilter(
  reportType: ReportType
): boolean {
  return [
    "PAYMENT_MODE_REPORT",
    "DAILY_COLLECTION"
  ].includes(reportType);
}

export default function ReportsPage() {
  const [schools, setSchools] =
    useState<School[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [
    selectedReportType,
    setSelectedReportType
  ] = useState<ReportType>(
    "SCHOOL_WISE_SALES"
  );

  const [filters, setFilters] =
    useState<ReportFilters>({
      ...initialFilters
    });

  const [
    appliedFilters,
    setAppliedFilters
  ] = useState<ReportFilters | null>(
    null
  );

  const [
    report,
    setReport
  ] = useState<ReportResponse | null>(
    null
  );

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    isLoadingProducts,
    setIsLoadingProducts
  ] = useState(false);

  const [
    isDownloading,
    setIsDownloading
  ] = useState(false);

  const [
    notification,
    setNotification
  ] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadSchools =
    useCallback(async () => {
      try {
        const result =
          await getSchools({
            status: "ACTIVE",
            page: 1,
            limit: 100
          });

        setSchools(result.data);
      } catch (error) {
        setNotification({
          type: "error",
          message:
            getErrorMessage(error)
        });
      }
    }, []);

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  async function handleSchoolChange(
    schoolId: string
  ): Promise<void> {
    setFilters((current) => ({
      ...current,
      schoolId,
      productId: ""
    }));

    setProducts([]);

    if (!schoolId) {
      return;
    }

    try {
      setIsLoadingProducts(true);

      const result =
        await getProducts({
          schoolId,
          status: "ACTIVE",
          page: 1,
          limit: 100
        });

      setProducts(result.data);
    } catch (error) {
      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
      });
    } finally {
      setIsLoadingProducts(false);
    }
  }

  function handleReportTypeChange(
    reportType: ReportType
  ): void {
    setSelectedReportType(reportType);

    setFilters((current) => ({
      ...current,
      studentName: "",
      className: "",
      productId: "",
      gender: "",
      size: "",
      paymentMode: ""
    }));

    setReport(null);
    setAppliedFilters(null);
  }

  function validateFilters():
    string | null {
    if (!filters.schoolId) {
      return "Please select a school.";
    }

    if (
      filters.dateFrom &&
      filters.dateTo
    ) {
      const fromDate =
        new Date(filters.dateFrom);

      const toDate =
        new Date(filters.dateTo);

      if (
        fromDate.getTime() >
        toDate.getTime()
      ) {
        return (
          "From date cannot be after To date."
        );
      }
    }

    return null;
  }

  async function generateSelectedReport(
    event:
      FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    const validationError =
      validateFilters();

    if (validationError) {
      setNotification({
        type: "error",
        message: validationError
      });

      return;
    }

    try {
      setIsLoading(true);
      setNotification(null);

      const sanitizedFilters: ReportFilters = {
        ...filters,
        studentName:
          filters.studentName.trim(),
        className:
          filters.className.trim(),
        size:
          filters.size.trim()
      };

      const result = await getReport(
        selectedReportType,
        sanitizedFilters
      );

      setAppliedFilters(
        sanitizedFilters
      );

      setReport(result);
    } catch (error) {
      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExcelDownload():
    Promise<void> {
    if (!appliedFilters || !report) {
      setNotification({
        type: "error",
        message:
          "Generate the report before downloading Excel."
      });

      return;
    }

    try {
      setIsDownloading(true);
      setNotification(null);

      await downloadReportExcel(
        selectedReportType,
        appliedFilters
      );

      setNotification({
        type: "success",
        message:
          "Excel report downloaded successfully."
      });
    } catch (error) {
      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
      });
    } finally {
      setIsDownloading(false);
    }
  }

  function clearReport(): void {
    setFilters({
      ...initialFilters
    });

    setProducts([]);
    setAppliedFilters(null);
    setReport(null);
    setNotification(null);
  }

  const selectedSchool =
    useMemo(
      () =>
        schools.find(
          (school) =>
            school._id ===
            appliedFilters?.schoolId
        ),
      [
        schools,
        appliedFilters
      ]
    );

  function handlePrintReport(): void {
    if (!report || !appliedFilters) {
      setNotification({
        type: "error",
        message:
          "Generate the report before printing."
      });

      return;
    }

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1250,height=850"
      );

    if (!printWindow) {
      setNotification({
        type: "error",
        message:
          "Please allow pop-ups to print or save the report as PDF."
      });

      return;
    }

    const tableHeaders =
      report.columns
        .map(
          (column) =>
            `<th>${escapeHtml(
              column.header
            )}</th>`
        )
        .join("");

    const tableRows =
      report.data
        .map(
          (row, rowIndex) => {
            const cells =
              report.columns
                .map((column) => {
                  const value =
                    formatCellValue(
                      column.key,
                      row[column.key]
                    );

                  return `<td>${escapeHtml(
                    value
                  )}</td>`;
                })
                .join("");

            return `
              <tr>
                <td>${rowIndex + 1}</td>
                ${cells}
              </tr>
            `;
          }
        )
        .join("");

    const filterItems = [
      selectedSchool
        ? `School: ${selectedSchool.schoolName}`
        : "",

      appliedFilters.dateFrom
        ? `From: ${appliedFilters.dateFrom}`
        : "",

      appliedFilters.dateTo
        ? `To: ${appliedFilters.dateTo}`
        : "",

      appliedFilters.studentName
        ? `Student: ${appliedFilters.studentName}`
        : "",

      appliedFilters.className
        ? `Class: ${appliedFilters.className}`
        : "",

      appliedFilters.gender
        ? `Gender: ${formatLabel(
            appliedFilters.gender
          )}`
        : "",

      appliedFilters.size
        ? `Size: ${appliedFilters.size}`
        : "",

      appliedFilters.paymentMode
        ? `Payment Mode: ${formatLabel(
            appliedFilters.paymentMode
          )}`
        : ""
    ].filter(Boolean);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(
            report.title
          )}</title>

          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              color: #17202a;
              font-family: Arial, sans-serif;
            }

            .header {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              padding-bottom: 14px;
              border-bottom: 2px solid #432387;
            }

            h1 {
              margin: 0;
              color: #432387;
              font-size: 24px;
            }

            h2 {
              margin: 5px 0 0;
              font-size: 16px;
            }

            .generated-date {
              text-align: right;
              font-size: 11px;
            }

            .filters {
              margin: 14px 0;
              padding: 10px;
              border: 1px solid #d8dde3;
              background: #f8fafc;
            }

            .filters span {
              display: inline-block;
              margin: 3px 16px 3px 0;
              font-size: 11px;
            }

            .summary {
              display: grid;
              grid-template-columns:
                repeat(4, minmax(0, 1fr));
              gap: 10px;
              margin-bottom: 16px;
            }

            .summary div {
              padding: 10px;
              border: 1px solid #d8dde3;
              text-align: center;
            }

            .summary span,
            .summary strong {
              display: block;
            }

            .summary span {
              color: #667085;
              font-size: 10px;
            }

            .summary strong {
              margin-top: 5px;
              font-size: 15px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th,
            td {
              padding: 6px;
              border: 1px solid #d1d5db;
              font-size: 9px;
              text-align: left;
            }

            th {
              background: #432387;
              color: #ffffff;
            }

            .footer {
              margin-top: 14px;
              text-align: center;
              color: #667085;
              font-size: 9px;
            }
          </style>
        </head>

        <body>
          <div class="header">
            <div>
              <h1>SCHOOLAY</h1>
              <h2>${escapeHtml(
                report.title
              )}</h2>
            </div>

            <div class="generated-date">
              Generated:
              ${new Date().toLocaleString(
                "en-IN"
              )}
            </div>
          </div>

          <div class="filters">
            ${filterItems
              .map(
                (item) =>
                  `<span>${escapeHtml(
                    item
                  )}</span>`
              )
              .join("")}
          </div>

          <div class="summary">
            <div>
              <span>Total Invoices</span>
              <strong>
                ${report.summary.totalInvoices}
              </strong>
            </div>

            <div>
              <span>Total Quantity</span>
              <strong>
                ${report.summary.totalQuantity}
              </strong>
            </div>

            <div>
              <span>Grand Total</span>
              <strong>
                ${escapeHtml(
                  formatCurrency(
                    report.summary.grandTotal
                  )
                )}
              </strong>
            </div>

            <div>
              <span>Pending Amount</span>
              <strong>
                ${escapeHtml(
                  formatCurrency(
                    report.summary.pendingAmount
                  )
                )}
              </strong>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>S.No.</th>
                ${tableHeaders}
              </tr>
            </thead>

            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer">
            Generated by Schoolay Billing Software
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  const displayedColumns:
    ReportColumn[] =
    report?.columns ?? [];

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Reports</h1>

          <p>
            Generate school-wise reports for
            selected timelines
          </p>
        </div>

        <div className="page-heading-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={
              !report ||
              isLoading ||
              isDownloading
            }
            onClick={() =>
              void handleExcelDownload()
            }
          >
            {isDownloading
              ? "Downloading..."
              : "Download Excel"}
          </button>

          <button
            type="button"
            className="primary-button"
            disabled={!report || isLoading}
            onClick={handlePrintReport}
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() =>
            setNotification(null)
          }
        />
      )}

      <div className="content-card">
        <form
          className="report-filter-form"
          onSubmit={(event) =>
            void generateSelectedReport(
              event
            )
          }
        >
          <div className="form-field">
            <label htmlFor="reportSchool">
              School <span>*</span>
            </label>

            <select
              id="reportSchool"
              value={filters.schoolId}
              onChange={(event) =>
                void handleSchoolChange(
                  event.target.value
                )
              }
              required
            >
              <option value="">
                Select school
              </option>

              {schools.map((school) => (
                <option
                  key={school._id}
                  value={school._id}
                >
                  {school.schoolName} (
                  {school.schoolCode})
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="reportType">
              Report Type <span>*</span>
            </label>

            <select
              id="reportType"
              value={selectedReportType}
              onChange={(event) =>
                handleReportTypeChange(
                  event.target
                    .value as ReportType
                )
              }
            >
              {reportOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="reportDateFrom">
              From Date
            </label>

            <input
              id="reportDateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  dateFrom:
                    event.target.value
                }))
              }
            />
          </div>

          <div className="form-field">
            <label htmlFor="reportDateTo">
              To Date
            </label>

            <input
              id="reportDateTo"
              type="date"
              value={filters.dateTo}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  dateTo:
                    event.target.value
                }))
              }
            />
          </div>

          {reportUsesStudentFilter(
            selectedReportType
          ) && (
            <div className="form-field">
              <label htmlFor="reportStudent">
                Student Name
              </label>

              <input
                id="reportStudent"
                value={filters.studentName}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    studentName:
                      event.target.value
                  }))
                }
                placeholder="Search student"
              />
            </div>
          )}

          {reportUsesClassFilter(
            selectedReportType
          ) && (
            <div className="form-field">
              <label htmlFor="reportClass">
                Class
              </label>

              <input
                id="reportClass"
                value={filters.className}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    className:
                      event.target.value
                  }))
                }
                placeholder="Example: Grade 5"
              />
            </div>
          )}

          {reportUsesProductFilter(
            selectedReportType
          ) && (
            <div className="form-field">
              <label htmlFor="reportProduct">
                Product
              </label>

              <select
                id="reportProduct"
                value={filters.productId}
                disabled={
                  !filters.schoolId ||
                  isLoadingProducts
                }
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    productId:
                      event.target.value
                  }))
                }
              >
                <option value="">
                  {isLoadingProducts
                    ? "Loading..."
                    : "All products"}
                </option>

                {products.map((product) => (
                  <option
                    key={product._id}
                    value={product._id}
                  >
                    {product.productName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportUsesGenderFilter(
            selectedReportType
          ) && (
            <div className="form-field">
              <label htmlFor="reportGender">
                Gender
              </label>

              <select
                id="reportGender"
                value={filters.gender}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    gender:
                      event.target
                        .value as ReportFilters["gender"]
                  }))
                }
              >
                <option value="">
                  All genders
                </option>
                <option value="MALE">
                  Male
                </option>
                <option value="FEMALE">
                  Female
                </option>
                <option value="UNISEX">
                  Unisex
                </option>
              </select>
            </div>
          )}

          {reportUsesSizeFilter(
            selectedReportType
          ) && (
            <div className="form-field">
              <label htmlFor="reportSize">
                Size
              </label>

              <input
                id="reportSize"
                value={filters.size}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    size:
                      event.target.value
                  }))
                }
                placeholder="Example: 24"
              />
            </div>
          )}

          {reportUsesPaymentModeFilter(
            selectedReportType
          ) && (
            <div className="form-field">
              <label htmlFor="reportPaymentMode">
                Payment Mode
              </label>

              <select
                id="reportPaymentMode"
                value={filters.paymentMode}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    paymentMode:
                      event.target
                        .value as ReportFilters["paymentMode"]
                  }))
                }
              >
                <option value="">
                  All payment modes
                </option>
                <option value="CASH">
                  Cash
                </option>
                <option value="CARD">
                  Card
                </option>
                <option value="ONLINE">
                  Online
                </option>
              </select>
            </div>
          )}

          <div className="report-filter-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={isLoading}
            >
              {isLoading
                ? "Generating..."
                : "Generate Report"}
            </button>

            <button
              type="button"
              className="secondary-button"
              disabled={isLoading}
              onClick={clearReport}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {report && (
        <div className="report-summary-grid">
          <div className="report-summary-card">
            <span>Total Invoices</span>
            <strong>
              {report.summary.totalInvoices}
            </strong>
          </div>

          <div className="report-summary-card">
            <span>Total Quantity</span>
            <strong>
              {report.summary.totalQuantity}
            </strong>
          </div>

          <div className="report-summary-card">
            <span>Taxable Amount</span>
            <strong>
              {formatCurrency(
                report.summary.taxableAmount
              )}
            </strong>
          </div>

          <div className="report-summary-card">
            <span>Total GST</span>
            <strong>
              {formatCurrency(
                report.summary.totalGstAmount
              )}
            </strong>
          </div>

          <div className="report-summary-card">
            <span>Grand Total</span>
            <strong>
              {formatCurrency(
                report.summary.grandTotal
              )}
            </strong>
          </div>

          <div className="report-summary-card">
            <span>Paid Amount</span>
            <strong>
              {formatCurrency(
                report.summary.paidAmount
              )}
            </strong>
          </div>

          <div className="report-summary-card">
            <span>Pending Amount</span>
            <strong>
              {formatCurrency(
                report.summary.pendingAmount
              )}
            </strong>
          </div>
        </div>
      )}

      <div className="content-card">
        {isLoading ? (
          <LoadingSpinner message="Generating report..." />
        ) : !report ? (
          <div className="empty-state">
            <h3>Select and generate a report</h3>
            <p>
              Choose a school, timeline and report
              type to view the result.
            </p>
          </div>
        ) : report.data.length === 0 ? (
          <div className="empty-state">
            <h3>No report data found</h3>
            <p>
              No matching records were found for
              the selected filters.
            </p>
          </div>
        ) : (
          <>
            <div className="report-table-heading">
              <div>
                <h2>{report.title}</h2>

                <p>
                  {selectedSchool?.schoolName}
                  {appliedFilters?.dateFrom
                    ? ` | From ${appliedFilters.dateFrom}`
                    : ""}
                  {appliedFilters?.dateTo
                    ? ` | To ${appliedFilters.dateTo}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table report-table">
                <thead>
                  <tr>
                    <th>S.No.</th>

                    {displayedColumns.map(
                      (column) => (
                        <th key={column.key}>
                          {column.header}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {report.data.map(
                    (row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td>{rowIndex + 1}</td>

                        {displayedColumns.map(
                          (column) => (
                            <td
                              key={column.key}
                              className={
                                typeof row[
                                  column.key
                                ] === "number"
                                  ? "report-number-cell"
                                  : ""
                              }
                            >
                              {formatCellValue(
                                column.key,
                                row[column.key]
                              )}
                            </td>
                          )
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}