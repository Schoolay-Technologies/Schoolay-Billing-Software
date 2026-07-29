import axios from "axios";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  downloadProductionExcel,
  getProductionData,
  getProductionMatrix
} from "../../api/production.api";

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
  ProductionFilters,
  ProductionGroup,
  ProductionMatrixRow,
  ProductionRow,
  ProductionSummary
} from "../../types/production.types";

import type {
  ApiErrorResponse,
  School
} from "../../types/school.types";

type ProductionTab =
  | "DATA"
  | "MATRIX";

const initialFilters: ProductionFilters = {
  dateFrom: "",
  dateTo: "",
  schoolId: "",
  productId: "",
  gender: "",
  size: "",
  className: "",
  groupBy: "ENTIRE_SEASON"
};

const emptySummary: ProductionSummary = {
  totalQuantity: 0,
  totalRows: 0,
  uniqueSchools: 0,
  uniqueProducts: 0,
  uniqueSizes: 0
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
        .map(
          (currentError) =>
            currentError.message
        )
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

function formatDate(
  value: string
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN"
  );
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

function getDisplayPeriod(
  row: ProductionRow,
  groupBy: ProductionGroup
): string {
  if (
    groupBy === "ENTIRE_SEASON"
  ) {
    return formatDate(row.date);
  }

  return row.period;
}

function sortSizes(
  sizes: string[]
): string[] {
  return [...sizes].sort(
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
}

export default function ProductionPage() {
  const [
    activeTab,
    setActiveTab
  ] = useState<ProductionTab>(
    "DATA"
  );

  const [
    schools,
    setSchools
  ] = useState<School[]>([]);

  const [
    products,
    setProducts
  ] = useState<Product[]>([]);

  const [
    productionRows,
    setProductionRows
  ] = useState<ProductionRow[]>([]);

  const [
    matrixRows,
    setMatrixRows
  ] = useState<
    ProductionMatrixRow[]
  >([]);

  const [
    matrixSizes,
    setMatrixSizes
  ] = useState<string[]>([]);

  const [
    filters,
    setFilters
  ] = useState<ProductionFilters>({
    ...initialFilters
  });

  const [
    appliedFilters,
    setAppliedFilters
  ] = useState<ProductionFilters>({
    ...initialFilters
  });

  const [
    summary,
    setSummary
  ] = useState<ProductionSummary>({
    ...emptySummary
  });

  const [
    isLoading,
    setIsLoading
  ] = useState(true);

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

  const loadProductionReport =
    useCallback(async () => {
      try {
        setIsLoading(true);

        const [
          dataResult,
          matrixResult
        ] = await Promise.all([
          getProductionData(
            appliedFilters
          ),

          getProductionMatrix(
            appliedFilters
          )
        ]);

        setProductionRows(
          dataResult.data
        );

        setMatrixRows(
          matrixResult.data
        );

        setMatrixSizes(
          sortSizes(
            matrixResult.sizes
          )
        );

        setSummary(
          dataResult.summary
        );
      } catch (error) {
        setNotification({
          type: "error",
          message:
            getErrorMessage(error)
        });
      } finally {
        setIsLoading(false);
      }
    }, [appliedFilters]);

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  useEffect(() => {
    void loadProductionReport();
  }, [loadProductionReport]);

  async function handleSchoolChange(
    schoolId: string
  ): Promise<void> {
    setFilters(
      (currentValue) => ({
        ...currentValue,
        schoolId,
        productId: ""
      })
    );

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

  function validateFilters():
    string | null {
    if (
      filters.dateFrom &&
      filters.dateTo
    ) {
      const startDate =
        new Date(filters.dateFrom);

      const endDate =
        new Date(filters.dateTo);

      if (
        startDate.getTime() >
        endDate.getTime()
      ) {
        return (
          "Start date cannot be after end date."
        );
      }
    }

    return null;
  }

  function handleFilterSubmit(
    event:
      FormEvent<HTMLFormElement>
  ): void {
    event.preventDefault();

    const validationError =
      validateFilters();

    if (validationError) {
      setNotification({
        type: "error",
        message:
          validationError
      });

      return;
    }

    setNotification(null);

    setAppliedFilters({
      ...filters,
      size:
        filters.size.trim(),

      className:
        filters.className.trim()
    });
  }

  function clearFilters(): void {
    setFilters({
      ...initialFilters
    });

    setAppliedFilters({
      ...initialFilters
    });

    setProducts([]);
    setNotification(null);
  }

  async function handleExcelDownload():
    Promise<void> {
    try {
      setIsDownloading(true);
      setNotification(null);

      await downloadProductionExcel(
        appliedFilters
      );

      setNotification({
        type: "success",
        message:
          "Production Excel report downloaded successfully."
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

  const filterDescription =
    useMemo(() => {
      const descriptions:
        string[] = [];

      if (
        appliedFilters.dateFrom
      ) {
        descriptions.push(
          `From: ${formatDate(
            appliedFilters.dateFrom
          )}`
        );
      }

      if (
        appliedFilters.dateTo
      ) {
        descriptions.push(
          `To: ${formatDate(
            appliedFilters.dateTo
          )}`
        );
      }

      const selectedSchool =
        schools.find(
          (school) =>
            school._id ===
            appliedFilters.schoolId
        );

      if (selectedSchool) {
        descriptions.push(
          `School: ${selectedSchool.schoolName}`
        );
      }

      const selectedProduct =
        products.find(
          (product) =>
            product._id ===
            appliedFilters.productId
        );

      if (selectedProduct) {
        descriptions.push(
          `Product: ${selectedProduct.productName}`
        );
      }

      if (
        appliedFilters.gender
      ) {
        descriptions.push(
          `Gender: ${formatLabel(
            appliedFilters.gender
          )}`
        );
      }

      if (
        appliedFilters.size
      ) {
        descriptions.push(
          `Size: ${appliedFilters.size}`
        );
      }

      if (
        appliedFilters.className
      ) {
        descriptions.push(
          `Class: ${appliedFilters.className}`
        );
      }

      descriptions.push(
        `Grouping: ${formatLabel(
          appliedFilters.groupBy
        )}`
      );

      return descriptions;
    }, [
      appliedFilters,
      schools,
      products
    ]);

  function handlePrintReport():
    void {
    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1200,height=850"
      );

    if (!printWindow) {
      setNotification({
        type: "error",
        message:
          "Please allow pop-ups to print or save the production report as PDF."
      });

      return;
    }

    const summaryHtml = `
      <div class="summary-grid">
        <div>
          <span>Total Quantity</span>
          <strong>${summary.totalQuantity}</strong>
        </div>

        <div>
          <span>Schools</span>
          <strong>${summary.uniqueSchools}</strong>
        </div>

        <div>
          <span>Products</span>
          <strong>${summary.uniqueProducts}</strong>
        </div>

        <div>
          <span>Sizes</span>
          <strong>${summary.uniqueSizes}</strong>
        </div>
      </div>
    `;

    let tableHtml = "";

    if (activeTab === "DATA") {
      const rows = productionRows
        .map(
          (row, index) => `
            <tr>
              <td>${index + 1}</td>

              <td>
                ${escapeHtml(
                  getDisplayPeriod(
                    row,
                    appliedFilters.groupBy
                  )
                )}
              </td>

              <td>
                ${escapeHtml(
                  row.schoolName
                )}
              </td>

              <td>
                ${escapeHtml(
                  row.productName
                )}
              </td>

              <td>
                ${escapeHtml(
                  formatLabel(
                    row.gender
                  )
                )}
              </td>

              <td>
                ${escapeHtml(
                  row.size
                )}
              </td>

              <td>
                ${escapeHtml(
                  row.className ||
                  "—"
                )}
              </td>

              <td class="number">
                ${row.totalQuantity}
              </td>
            </tr>
          `
        )
        .join("");

      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Date / Period</th>
              <th>School</th>
              <th>Product</th>
              <th>Gender</th>
              <th>Size</th>
              <th>Class</th>
              <th>Total Quantity</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>

          <tfoot>
            <tr>
              <td colspan="7">
                Grand Total
              </td>

              <td class="number">
                ${summary.totalQuantity}
              </td>
            </tr>
          </tfoot>
        </table>
      `;
    } else {
      const matrixHeadings =
        matrixSizes
          .map(
            (size) =>
              `<th>${escapeHtml(
                size
              )}</th>`
          )
          .join("");

      const rows =
        matrixRows
          .map(
            (row, index) => {
              const sizeCells =
                matrixSizes
                  .map(
                    (size) =>
                      `<td class="number">${
                        row.sizes[
                          size
                        ] ?? 0
                      }</td>`
                  )
                  .join("");

              return `
                <tr>
                  <td>${index + 1}</td>

                  <td>
                    ${escapeHtml(
                      row.productName
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      row.productCode
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      formatLabel(
                        row.gender
                      )
                    )}
                  </td>

                  ${sizeCells}

                  <td class="number">
                    <strong>
                      ${row.total}
                    </strong>
                  </td>
                </tr>
              `;
            }
          )
          .join("");

      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Product</th>
              <th>Code</th>
              <th>Gender</th>
              ${matrixHeadings}
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>
            Schoolay Production Report
          </title>

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
              font-family:
                Arial,
                sans-serif;
              color: #17202a;
            }

            .header {
              display: flex;
              justify-content:
                space-between;
              align-items:
                flex-start;
              padding-bottom: 14px;
              border-bottom:
                2px solid #432387;
            }

            h1 {
              margin: 0;
              color: #432387;
              font-size: 24px;
            }

            h2 {
              margin:
                4px 0 0;
              font-size: 16px;
            }

            .date {
              text-align: right;
              font-size: 12px;
            }

            .filters {
              margin: 14px 0;
              padding: 10px;
              border:
                1px solid #d9dde3;
              background: #f8f9fb;
              font-size: 12px;
            }

            .filters span {
              display:
                inline-block;
              margin:
                3px 14px 3px 0;
            }

            .summary-grid {
              display: grid;
              grid-template-columns:
                repeat(
                  4,
                  minmax(0, 1fr)
                );
              gap: 10px;
              margin-bottom: 16px;
            }

            .summary-grid div {
              padding: 10px;
              border:
                1px solid #d9dde3;
              border-radius: 5px;
              text-align: center;
            }

            .summary-grid span,
            .summary-grid strong {
              display: block;
            }

            .summary-grid span {
              color: #667085;
              font-size: 11px;
            }

            .summary-grid strong {
              margin-top: 5px;
              font-size: 18px;
            }

            table {
              width: 100%;
              border-collapse:
                collapse;
            }

            th,
            td {
              padding: 7px;
              border:
                1px solid #cfd5dc;
              font-size: 10px;
              text-align: left;
            }

            th {
              background: #432387;
              color: #ffffff;
            }

            .number {
              text-align: center;
            }

            tfoot {
              font-weight: bold;
              background: #f3f4f6;
            }

            .footer {
              margin-top: 14px;
              text-align: center;
              color: #667085;
              font-size: 10px;
            }
          </style>
        </head>

        <body>
          <div class="header">
            <div>
              <h1>
                SCHOOLAY
              </h1>

              <h2>
                ${
                  activeTab ===
                  "DATA"
                    ? "Production Data Report"
                    : "Production Matrix Report"
                }
              </h2>
            </div>

            <div class="date">
              Generated:
              ${new Date().toLocaleString(
                "en-IN"
              )}
            </div>
          </div>

          <div class="filters">
            ${filterDescription
              .map(
                (description) =>
                  `<span>${escapeHtml(
                    description
                  )}</span>`
              )
              .join("")}
          </div>

          ${summaryHtml}
          ${tableHtml}

          <div class="footer">
            Generated from completed,
            non-cancelled Schoolay invoices.
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

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>
            Production
          </h1>

          <p>
            View size-wise production
            requirements from completed
            invoices
          </p>
        </div>

        <div className="page-heading-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={
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
            disabled={isLoading}
            onClick={
              handlePrintReport
            }
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {notification && (
        <Alert
          type={notification.type}
          message={
            notification.message
          }
          onClose={() =>
            setNotification(null)
          }
        />
      )}

      <div className="production-summary-grid">
        <div className="production-summary-card">
          <span>
            Total Quantity
          </span>

          <strong>
            {summary.totalQuantity}
          </strong>
        </div>

        <div className="production-summary-card">
          <span>
            Schools
          </span>

          <strong>
            {summary.uniqueSchools}
          </strong>
        </div>

        <div className="production-summary-card">
          <span>
            Products
          </span>

          <strong>
            {summary.uniqueProducts}
          </strong>
        </div>

        <div className="production-summary-card">
          <span>
            Sizes
          </span>

          <strong>
            {summary.uniqueSizes}
          </strong>
        </div>
      </div>

      <div className="content-card">
        <form
          className="production-filter-form"
          onSubmit={
            handleFilterSubmit
          }
        >
          <div className="form-field">
            <label htmlFor="productionDateFrom">
              Date From
            </label>

            <input
              id="productionDateFrom"
              type="date"
              value={
                filters.dateFrom
              }
              onChange={(event) =>
                setFilters(
                  (currentValue) => ({
                    ...currentValue,
                    dateFrom:
                      event.target.value
                  })
                )
              }
            />
          </div>

          <div className="form-field">
            <label htmlFor="productionDateTo">
              Date To
            </label>

            <input
              id="productionDateTo"
              type="date"
              value={filters.dateTo}
              onChange={(event) =>
                setFilters(
                  (currentValue) => ({
                    ...currentValue,
                    dateTo:
                      event.target.value
                  })
                )
              }
            />
          </div>

          <div className="form-field">
            <label htmlFor="productionSchool">
              School
            </label>

            <select
              id="productionSchool"
              value={
                filters.schoolId
              }
              onChange={(event) =>
                void handleSchoolChange(
                  event.target.value
                )
              }
            >
              <option value="">
                All Schools
              </option>

              {schools.map(
                (school) => (
                  <option
                    key={school._id}
                    value={school._id}
                  >
                    {school.schoolName}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="productionProduct">
              Product
            </label>

            <select
              id="productionProduct"
              value={
                filters.productId
              }
              disabled={
                !filters.schoolId ||
                isLoadingProducts
              }
              onChange={(event) =>
                setFilters(
                  (currentValue) => ({
                    ...currentValue,
                    productId:
                      event.target.value
                  })
                )
              }
            >
              <option value="">
                {isLoadingProducts
                  ? "Loading..."
                  : "All Products"}
              </option>

              {products.map(
                (product) => (
                  <option
                    key={product._id}
                    value={product._id}
                  >
                    {product.productName}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="productionGender">
              Gender
            </label>

            <select
              id="productionGender"
              value={filters.gender}
              onChange={(event) =>
                setFilters(
                  (currentValue) => ({
                    ...currentValue,
                    gender:
                      event.target
                        .value as
                        ProductionFilters["gender"]
                  })
                )
              }
            >
              <option value="">
                All Genders
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

          <div className="form-field">
            <label htmlFor="productionSize">
              Size
            </label>

            <input
              id="productionSize"
              value={filters.size}
              onChange={(event) =>
                setFilters(
                  (currentValue) => ({
                    ...currentValue,
                    size:
                      event.target.value
                  })
                )
              }
              placeholder="Example: 24"
            />
          </div>

          <div className="form-field">
            <label htmlFor="productionClass">
              Class
            </label>

            <input
              id="productionClass"
              value={
                filters.className
              }
              onChange={(event) =>
                setFilters(
                  (currentValue) => ({
                    ...currentValue,
                    className:
                      event.target.value
                  })
                )
              }
              placeholder="Example: Grade 5"
            />
          </div>

          <div className="form-field">
            <label htmlFor="productionGroup">
              Report Period
            </label>

            <select
              id="productionGroup"
              value={
                filters.groupBy
              }
              onChange={(event) =>
                setFilters(
                  (currentValue) => ({
                    ...currentValue,
                    groupBy:
                      event.target
                        .value as ProductionGroup
                  })
                )
              }
            >
              <option value="DAILY">
                Daily
              </option>

              <option value="WEEKLY">
                Weekly
              </option>

              <option value="MONTHLY">
                Monthly
              </option>

              <option value="ENTIRE_SEASON">
                Entire Season
              </option>
            </select>
          </div>

          <div className="production-filter-actions">
            <button
              type="submit"
              className="primary-button"
            >
              Generate Report
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        </form>
      </div>

      <div className="content-card">
        <div className="production-tabs">
          <button
            type="button"
            className={
              activeTab === "DATA"
                ? "production-tab production-tab-active"
                : "production-tab"
            }
            onClick={() =>
              setActiveTab("DATA")
            }
          >
            Production Data
          </button>

          <button
            type="button"
            className={
              activeTab === "MATRIX"
                ? "production-tab production-tab-active"
                : "production-tab"
            }
            onClick={() =>
              setActiveTab("MATRIX")
            }
          >
            Production Matrix
          </button>
        </div>

        <div className="production-filter-description">
          {filterDescription.map(
            (description) => (
              <span
                key={description}
              >
                {description}
              </span>
            )
          )}
        </div>

        {isLoading ? (
          <LoadingSpinner message="Loading production report..." />
        ) : activeTab ===
          "DATA" ? (
          productionRows.length ===
          0 ? (
            <div className="empty-state">
              <h3>
                No production data found
              </h3>

              <p>
                Completed invoices matching
                the selected filters will
                appear here.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>
                      Date / Period
                    </th>
                    <th>School</th>
                    <th>Product</th>
                    <th>Gender</th>
                    <th>Size</th>
                    <th>Class</th>
                    <th>
                      Total Quantity
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {productionRows.map(
                    (row, index) => (
                      <tr
                        key={[
                          row.period,
                          row.schoolId,
                          row.productId,
                          row.gender,
                          row.size,
                          row.className
                        ].join("-")}
                      >
                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {getDisplayPeriod(
                            row,
                            appliedFilters.groupBy
                          )}
                        </td>

                        <td>
                          <div className="school-name-cell">
                            <strong>
                              {
                                row.schoolCode
                              }
                            </strong>

                            <span>
                              {
                                row.schoolName
                              }
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="school-name-cell">
                            <strong>
                              {
                                row.productName
                              }
                            </strong>

                            <span>
                              {
                                row.productCode
                              }
                            </span>
                          </div>
                        </td>

                        <td>
                          {formatLabel(
                            row.gender
                          )}
                        </td>

                        <td>
                          <strong>
                            {row.size}
                          </strong>
                        </td>

                        <td>
                          {row.className ||
                            "—"}
                        </td>

                        <td>
                          <strong>
                            {
                              row.totalQuantity
                            }
                          </strong>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>

                <tfoot>
                  <tr>
                    <td
                      colSpan={7}
                      className="production-total-label"
                    >
                      Grand Total
                    </td>

                    <td>
                      <strong>
                        {
                          summary.totalQuantity
                        }
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        ) : matrixRows.length ===
          0 ? (
          <div className="empty-state">
            <h3>
              No production matrix found
            </h3>

            <p>
              Completed invoice items will
              be grouped size-wise here.
            </p>
          </div>
        ) : (
          <div className="table-responsive production-matrix-wrapper">
            <table className="data-table production-matrix-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Product</th>
                  <th>Code</th>
                  <th>Gender</th>

                  {matrixSizes.map(
                    (size) => (
                      <th key={size}>
                        {size}
                      </th>
                    )
                  )}

                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {matrixRows.map(
                  (row, index) => (
                    <tr
                      key={[
                        row.productId,
                        row.gender
                      ].join("-")}
                    >
                      <td>
                        {index + 1}
                      </td>

                      <td>
                        <strong>
                          {
                            row.productName
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          row.productCode
                        }
                      </td>

                      <td>
                        {formatLabel(
                          row.gender
                        )}
                      </td>

                      {matrixSizes.map(
                        (size) => (
                          <td
                            key={size}
                            className="production-matrix-number"
                          >
                            {row.sizes[
                              size
                            ] ?? 0}
                          </td>
                        )
                      )}

                      <td className="production-matrix-total">
                        <strong>
                          {row.total}
                        </strong>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}