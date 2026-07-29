import axios from "axios";
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import { api } from "../../api/axios";

import Alert from "../../components/common/Alert";
import LoadingSpinner from "../../components/common/LoadingSpinner";

import type {
  ApiErrorResponse
} from "../../types/school.types";

interface DashboardSummary {
  totalSchools: number;
  totalProducts: number;
  todayInvoices: number;
  todaySales: number;
  monthlySales: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
  totalCancelledInvoices: number;
}

interface SizeProductionRequirement {
  size: string;
  totalQuantity: number;
}

interface ProductProductionRequirement {
  productId: string;
  productName: string;
  productCode: string;
  gender: "MALE" | "FEMALE" | "UNISEX";
  totalQuantity: number;
}

interface SchoolSalesSummary {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  invoiceCount: number;
  totalQuantity: number;
  totalSales: number;
  paidAmount: number;
  pendingAmount: number;
}

interface RecentInvoice {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;

  schoolName: string;
  schoolCode: string;

  studentName: string;
  className: string;
  section?: string;

  grandTotal: number;
  paidAmount: number;

  paymentStatus:
    | "PENDING"
    | "PARTIALLY_PAID"
    | "PAID";

  invoiceStatus:
    | "DRAFT"
    | "COMPLETED"
    | "CANCELLED";

  fulfilmentStatus?:
    | "NOT_COMPLETED"
    | "PARTIALLY_COMPLETED"
    | "COMPLETELY_DELIVERED";
}

interface DashboardResponse {
  success: boolean;

  data: {
    summary: DashboardSummary;

    sizeWiseProduction:
      SizeProductionRequirement[];

    productWiseProduction:
      ProductProductionRequirement[];

    schoolWiseSales:
      SchoolSalesSummary[];

    recentInvoices:
      RecentInvoice[];
  };
}

const emptySummary: DashboardSummary = {
  totalSchools: 0,
  totalProducts: 0,
  todayInvoices: 0,
  todaySales: 0,
  monthlySales: 0,
  totalPaidAmount: 0,
  totalPendingAmount: 0,
  totalCancelledInvoices: 0
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
      "Unable to load dashboard."
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  ).format(value);
}

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(value);
}

function formatLabel(
  value: string | null | undefined
): string {
  if (!value) {
    return "Not Specified";
  }

  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
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
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
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

function getPaymentStatusClass(
  status: RecentInvoice["paymentStatus"]
): string {
  if (status === "PAID") {
    return "status-active";
  }

  if (
    status ===
    "PARTIALLY_PAID"
  ) {
    return "status-partial";
  }

  return "status-pending";
}

function getInvoiceStatusClass(
  status: RecentInvoice["invoiceStatus"]
): string {
  if (status === "COMPLETED") {
    return "status-active";
  }

  if (status === "CANCELLED") {
    return "status-inactive";
  }

  return "status-draft";
}

export default function DashboardPage() {
  const [
    summary,
    setSummary
  ] = useState<DashboardSummary>({
    ...emptySummary
  });

  const [
    sizeWiseProduction,
    setSizeWiseProduction
  ] = useState<
    SizeProductionRequirement[]
  >([]);

  const [
    productWiseProduction,
    setProductWiseProduction
  ] = useState<
    ProductProductionRequirement[]
  >([]);

  const [
    schoolWiseSales,
    setSchoolWiseSales
  ] = useState<
    SchoolSalesSummary[]
  >([]);

  const [
    recentInvoices,
    setRecentInvoices
  ] = useState<RecentInvoice[]>([]);

  const [
    isLoading,
    setIsLoading
  ] = useState(true);

  const [
    notification,
    setNotification
  ] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadDashboard =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setNotification(null);

        const response =
          await api.get<DashboardResponse>(
            "/dashboard"
          );

        setSummary(
          response.data.data.summary ??
            emptySummary
        );

        setSizeWiseProduction(
          response.data.data
            .sizeWiseProduction ?? []
        );

        setProductWiseProduction(
          response.data.data
            .productWiseProduction ?? []
        );

        setSchoolWiseSales(
          response.data.data
            .schoolWiseSales ?? []
        );

        setRecentInvoices(
          response.data.data
            .recentInvoices ?? []
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
    }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const dashboardCards = useMemo(
    () => [
      {
        title: "Total Schools",
        value: formatNumber(
          summary.totalSchools
        ),
        description:
          "Schools created in the software"
      },
      {
        title: "Total Products",
        value: formatNumber(
          summary.totalProducts
        ),
        description:
          "Active and inactive products"
      },
      {
        title: "Today's Invoices",
        value: formatNumber(
          summary.todayInvoices
        ),
        description:
          "Completed invoices generated today"
      },
      {
        title: "Today's Sales",
        value: formatCurrency(
          summary.todaySales
        ),
        description:
          "Completed invoice value today"
      },
      {
        title: "Monthly Sales",
        value: formatCurrency(
          summary.monthlySales
        ),
        description:
          "Completed invoice value this month"
      },
      {
        title: "Total Paid Amount",
        value: formatCurrency(
          summary.totalPaidAmount
        ),
        description:
          "Amount collected from completed invoices"
      },
      {
        title: "Total Pending Amount",
        value: formatCurrency(
          summary.totalPendingAmount
        ),
        description:
          "Outstanding customer payments"
      },
      {
        title:
          "Total Cancelled Invoices",
        value: formatNumber(
          summary.totalCancelledInvoices
        ),
        description:
          "Invoices marked as cancelled"
      }
    ],
    [summary]
  );

  const maximumSizeQuantity =
    useMemo(
      () =>
        Math.max(
          ...sizeWiseProduction.map(
            (item) =>
              item.totalQuantity
          ),
          1
        ),
      [sizeWiseProduction]
    );

  const maximumProductQuantity =
    useMemo(
      () =>
        Math.max(
          ...productWiseProduction.map(
            (item) =>
              item.totalQuantity
          ),
          1
        ),
      [productWiseProduction]
    );

  if (isLoading) {
    return (
      <section>
        <div className="page-heading">
          <div>
            <h1>Dashboard</h1>

            <p>
              Overview of billing, sales,
              collections and production
            </p>
          </div>
        </div>

        <LoadingSpinner message="Loading dashboard..." />
      </section>
    );
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>

          <p>
            Overview of billing, sales,
            collections and production
            requirements
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            void loadDashboard()
          }
        >
          Refresh Dashboard
        </button>
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

      <div className="dashboard-grid">
        {dashboardCards.map(
          (card) => (
            <article
              className="dashboard-card dashboard-metric-card"
              key={card.title}
            >
              <p>{card.title}</p>

              <strong>
                {card.value}
              </strong>

              <span>
                {card.description}
              </span>
            </article>
          )
        )}
      </div>

      <div className="dashboard-report-grid">
        <article className="content-card dashboard-report-card">
          <div className="dashboard-section-heading">
            <div>
              <h2>
                Size-wise Production
                Requirement
              </h2>

              <p>
                Required quantities from
                completed invoices
              </p>
            </div>
          </div>

          {sizeWiseProduction.length ===
          0 ? (
            <div className="empty-state">
              <p>
                No size-wise production
                requirement found.
              </p>
            </div>
          ) : (
            <div className="dashboard-bar-list">
              {sizeWiseProduction.map(
                (item) => {
                  const width =
                    Math.max(
                      (
                        item.totalQuantity /
                        maximumSizeQuantity
                      ) *
                        100,
                      4
                    );

                  return (
                    <div
                      className="dashboard-bar-row"
                      key={item.size}
                    >
                      <div className="dashboard-bar-label">
                        <span>
                          Size {item.size}
                        </span>

                        <strong>
                          {formatNumber(
                            item.totalQuantity
                          )}
                        </strong>
                      </div>

                      <div className="dashboard-bar-track">
                        <div
                          className="dashboard-bar-fill"
                          style={{
                            width: `${width}%`
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </article>

        <article className="content-card dashboard-report-card">
          <div className="dashboard-section-heading">
            <div>
              <h2>
                Product-wise Production
                Requirement
              </h2>

              <p>
                Total required quantity for
                each product
              </p>
            </div>
          </div>

          {productWiseProduction.length ===
          0 ? (
            <div className="empty-state">
              <p>
                No product-wise production
                requirement found.
              </p>
            </div>
          ) : (
            <div className="dashboard-bar-list">
              {productWiseProduction.map(
                (item) => {
                  const width =
                    Math.max(
                      (
                        item.totalQuantity /
                        maximumProductQuantity
                      ) *
                        100,
                      4
                    );

                  return (
                    <div
                      className="dashboard-bar-row"
                      key={[
                        item.productId,
                        item.gender
                      ].join("-")}
                    >
                      <div className="dashboard-bar-label">
                        <span>
                          {item.productName}
                          {" · "}
                          {formatLabel(
                            item.gender
                          )}
                        </span>

                        <strong>
                          {formatNumber(
                            item.totalQuantity
                          )}
                        </strong>
                      </div>

                      <div className="dashboard-bar-track">
                        <div
                          className="dashboard-bar-fill"
                          style={{
                            width: `${width}%`
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </article>
      </div>

      <div className="content-card dashboard-table-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>School-wise Sales</h2>

            <p>
              Invoice value, collection and
              outstanding amount by school
            </p>
          </div>
        </div>

        {schoolWiseSales.length === 0 ? (
          <div className="empty-state">
            <p>
              No school-wise sales data
              found.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>School</th>
                  <th>Invoices</th>
                  <th>Quantity</th>
                  <th>Total Sales</th>
                  <th>Paid Amount</th>
                  <th>Pending Amount</th>
                </tr>
              </thead>

              <tbody>
                {schoolWiseSales.map(
                  (school, index) => (
                    <tr
                      key={school.schoolId}
                    >
                      <td>{index + 1}</td>

                      <td>
                        <div className="school-name-cell">
                          <strong>
                            {
                              school.schoolCode
                            }
                          </strong>

                          <span>
                            {
                              school.schoolName
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        {formatNumber(
                          school.invoiceCount
                        )}
                      </td>

                      <td>
                        {formatNumber(
                          school.totalQuantity
                        )}
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(
                            school.totalSales
                          )}
                        </strong>
                      </td>

                      <td>
                        {formatCurrency(
                          school.paidAmount
                        )}
                      </td>

                      <td>
                        <strong className="dashboard-pending-value">
                          {formatCurrency(
                            school.pendingAmount
                          )}
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

      <div className="content-card dashboard-table-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Recent Invoices</h2>

            <p>
              Latest invoices created in the
              billing system
            </p>
          </div>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="empty-state">
            <p>
              No invoices have been generated
              yet.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>School</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Invoice Status</th>
                  <th>Delivery Status</th>
                </tr>
              </thead>

              <tbody>
                {recentInvoices.map(
                  (invoice, index) => (
                    <tr
                      key={invoice._id}
                    >
                      <td>{index + 1}</td>

                      <td>
                        <strong>
                          {
                            invoice.invoiceNumber
                          }
                        </strong>
                      </td>

                      <td>
                        {formatDate(
                          invoice.invoiceDate
                        )}
                      </td>

                      <td>
                        <div className="school-name-cell">
                          <strong>
                            {
                              invoice.schoolCode
                            }
                          </strong>

                          <span>
                            {
                              invoice.schoolName
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        {invoice.studentName}
                      </td>

                      <td>
                        {invoice.className}

                        {invoice.section
                          ? ` - ${invoice.section}`
                          : ""}
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(
                            invoice.grandTotal
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getPaymentStatusClass(
                            invoice.paymentStatus
                          )}`}
                        >
                          {formatLabel(
                            invoice.paymentStatus
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getInvoiceStatusClass(
                            invoice.invoiceStatus
                          )}`}
                        >
                          {formatLabel(
                            invoice.invoiceStatus
                          )}
                        </span>
                      </td>

                      <td>
                        {invoice.fulfilmentStatus ? (
                          <span
                            className={`status-badge ${
                              invoice.fulfilmentStatus ===
                              "COMPLETELY_DELIVERED"
                                ? "status-active"
                                : invoice.fulfilmentStatus ===
                                    "PARTIALLY_COMPLETED"
                                  ? "status-partial"
                                  : "status-inactive"
                            }`}
                          >
                            {formatLabel(
                              invoice.fulfilmentStatus
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
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