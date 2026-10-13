import axios from "axios";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "../../api/axios";

import Alert from "../../components/common/Alert";
import LoadingSpinner from "../../components/common/LoadingSpinner";

import type {
  ApiErrorResponse,
} from "../../types/school.types";

import "./DashboardPage.css";

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
    sizeWiseProduction: SizeProductionRequirement[];
    productWiseProduction: ProductProductionRequirement[];
    schoolWiseSales: SchoolSalesSummary[];
    recentInvoices: RecentInvoice[];
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
  totalCancelledInvoices: 0,
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;

    if (data?.errors?.length) {
      return data.errors
        .map((currentError) => currentError.message)
        .join(", ");
    }

    return data?.message ?? "Unable to load dashboard.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  }

  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`;
  }

  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }

  return `₹${value}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatLabel(
  value: string | null | undefined,
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
        word.slice(1),
    )
    .join(" ");
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function Icon({
  name,
}: {
  name:
    | "refresh"
    | "building"
    | "box"
    | "invoice"
    | "money"
    | "arrow"
    | "users"
    | "production"
    | "calendar"
    | "dots"
    | "check"
    | "clock"
    | "truck"
    | "warning";
}) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
          <path d="M4 5v4h4" />
          <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
          <path d="M20 19v-4h-4" />
        </svg>
      );

    case "building":
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
          <path d="M9 7h2" />
          <path d="M13 7h2" />
          <path d="M9 11h2" />
          <path d="M13 11h2" />
          <path d="M9 15h2" />
          <path d="M13 15h2" />
        </svg>
      );

    case "box":
      return (
        <svg {...common}>
          <path d="m21 8-9-5-9 5 9 5 9-5Z" />
          <path d="M3 8v8l9 5 9-5V8" />
          <path d="M12 13v8" />
        </svg>
      );

    case "invoice":
      return (
        <svg {...common}>
          <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z" />
          <path d="M9 7h6" />
          <path d="M9 11h6" />
          <path d="M9 15h3" />
        </svg>
      );

    case "money":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15 8.5c-.8-.7-1.8-1-3-1-1.7 0-3 .8-3 2s1.2 1.8 3 2c1.8.2 3 .9 3 2s-1.3 2-3 2c-1.2 0-2.2-.3-3-1" />
          <path d="M12 6v12" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
          <path d="M16 5.5a3 3 0 0 1 0 5.8" />
          <path d="M18 15c2 .7 3 2.2 3 5" />
        </svg>
      );

    case "production":
      return (
        <svg {...common}>
          <path d="M4 19V9" />
          <path d="M10 19V5" />
          <path d="M16 19v-8" />
          <path d="M22 19V3" />
          <path d="M2 21h21" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 9h18" />
        </svg>
      );

    case "dots":
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="1" fill="currentColor" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="19" cy="12" r="1" fill="currentColor" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case "truck":
      return (
        <svg {...common}>
          <path d="M3 6h11v10H3z" />
          <path d="M14 10h4l3 3v3h-7z" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
      );

    case "warning":
      return (
        <svg {...common}>
          <path d="M12 3 2.5 20h19L12 3Z" />
          <path d="M12 9v5" />
          <path d="M12 17h.01" />
        </svg>
      );

    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Donut chart                                                                */
/* -------------------------------------------------------------------------- */

function DonutChart({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: {
    label: string;
    value: number;
    className: string;
  }[];
  centerValue: string;
  centerLabel: string;
}) {
  const total = segments.reduce(
    (sum, segment) => sum + segment.value,
    0,
  );

  let cumulative = 0;

  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="donut-wrapper">
      <div className="donut-chart">
        <svg
          viewBox="0 0 180 180"
          className="donut-svg"
        >
          <circle
            cx="90"
            cy="90"
            r={radius}
            className="donut-background"
          />

          {segments.map((segment) => {
            const percentage =
              total > 0
                ? segment.value / total
                : 0;

            const dash =
              percentage * circumference;

            const offset =
              -cumulative * circumference;

            cumulative += percentage;

            return (
              <circle
                key={segment.label}
                cx="90"
                cy="90"
                r={radius}
                className={`donut-segment ${segment.className}`}
                strokeDasharray={`${dash} ${
                  circumference - dash
                }`}
                strokeDashoffset={offset}
              />
            );
          })}
        </svg>

        <div className="donut-center">
          <strong>{centerValue}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>

      <div className="donut-legend">
        {segments.map((segment) => {
          const percentage =
            total > 0
              ? Math.round(
                  (segment.value / total) * 100,
                )
              : 0;

          return (
            <div
              className="legend-row"
              key={segment.label}
            >
              <span className="legend-label">
                <span
                  className={`legend-dot ${segment.className}`}
                />
                {segment.label}
              </span>

              <strong>{percentage}%</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Horizontal chart                                                           */
/* -------------------------------------------------------------------------- */

function HorizontalBarChart({
  data,
  valueFormatter,
}: {
  data: {
    label: string;
    value: number;
    secondary?: string;
  }[];
  valueFormatter?: (value: number) => string;
}) {
  const maximum = Math.max(
    ...data.map((item) => item.value),
    1,
  );

  return (
    <div className="horizontal-chart">
      {data.map((item) => {
        const width = Math.max(
          (item.value / maximum) * 100,
          4,
        );

        return (
          <div
            className="horizontal-chart-row"
            key={item.label}
          >
            <div className="horizontal-chart-top">
              <div className="horizontal-chart-label">
                {item.label}
              </div>

              <div className="horizontal-chart-value">
                {valueFormatter
                  ? valueFormatter(item.value)
                  : formatNumber(item.value)}
              </div>
            </div>

            <div className="horizontal-track">
              <div
                className="horizontal-fill"
                style={{
                  width: `${width}%`,
                }}
              />
            </div>

            {item.secondary && (
              <div className="horizontal-secondary">
                {item.secondary}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Metric card                                                                */
/* -------------------------------------------------------------------------- */

function MetricCard({
  label,
  value,
  description,
  icon,
  accent,
}: {
  label: string;
  value: string;
  description: string;
  icon:
    | "money"
    | "invoice"
    | "building"
    | "users";
  accent: string;
}) {
  return (
    <article className={`metric-card ${accent}`}>
      <div className="metric-card-top">
        <div className="metric-icon">
          <Icon name={icon} />
        </div>

        <button
          type="button"
          className="metric-menu"
          aria-label="More options"
        >
          <Icon name="dots" />
        </button>
      </div>

      <div className="metric-label">
        {label}
      </div>

      <div className="metric-value">
        {value}
      </div>

      <div className="metric-description">
        {description}
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Main dashboard                                                             */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const [summary, setSummary] =
    useState<DashboardSummary>({
      ...emptySummary,
    });

  const [
    sizeWiseProduction,
    setSizeWiseProduction,
  ] = useState<SizeProductionRequirement[]>(
    [],
  );

  const [
    productWiseProduction,
    setProductWiseProduction,
  ] = useState<
    ProductProductionRequirement[]
  >([]);

  const [
    schoolWiseSales,
    setSchoolWiseSales,
  ] = useState<SchoolSalesSummary[]>([]);

  const [
    recentInvoices,
    setRecentInvoices,
  ] = useState<RecentInvoice[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [notification, setNotification] =
    useState<{
      type: "success" | "error";
      message: string;
    } | null>(null);

  const loadDashboard =
    useCallback(async () => {
      try {
        setNotification(null);

        const response =
          await api.get<DashboardResponse>(
            "/dashboard",
          );

        const data = response.data.data;

        setSummary(
          data.summary ?? emptySummary,
        );

        setSizeWiseProduction(
          data.sizeWiseProduction ?? [],
        );

        setProductWiseProduction(
          data.productWiseProduction ?? [],
        );

        setSchoolWiseSales(
          data.schoolWiseSales ?? [],
        );

        setRecentInvoices(
          data.recentInvoices ?? [],
        );
      } catch (error) {
        setNotification({
          type: "error",
          message: getErrorMessage(error),
        });
      }
    }, []);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      await loadDashboard();

      setIsLoading(false);
    };

    void initialize();
  }, [loadDashboard]);

  const refreshDashboard = async () => {
    setIsRefreshing(true);

    await loadDashboard();

    setIsRefreshing(false);
  };

  const topSchools = useMemo(() => {
    return [...schoolWiseSales]
      .sort(
        (a, b) =>
          b.totalSales - a.totalSales,
      )
      .slice(0, 6);
  }, [schoolWiseSales]);

  const topProducts = useMemo(() => {
    return [...productWiseProduction]
      .sort(
        (a, b) =>
          b.totalQuantity -
          a.totalQuantity,
      )
      .slice(0, 6);
  }, [productWiseProduction]);

  const topSizes = useMemo(() => {
    return [...sizeWiseProduction]
      .sort(
        (a, b) =>
          b.totalQuantity -
          a.totalQuantity,
      )
      .slice(0, 8);
  }, [sizeWiseProduction]);

  const totalSchoolSales = useMemo(() => {
    return schoolWiseSales.reduce(
      (sum, school) =>
        sum + school.totalSales,
      0,
    );
  }, [schoolWiseSales]);

  const paymentTotal =
    summary.totalPaidAmount +
    summary.totalPendingAmount;

  const paidPercentage =
    paymentTotal > 0
      ? Math.round(
          (summary.totalPaidAmount /
            paymentTotal) *
            100,
        )
      : 0;

  const deliveredInvoices =
    recentInvoices.filter(
      (invoice) =>
        invoice.fulfilmentStatus ===
        "COMPLETELY_DELIVERED",
    ).length;

  const pendingInvoices =
    recentInvoices.filter(
      (invoice) =>
        invoice.paymentStatus ===
        "PENDING",
    ).length;

  if (isLoading) {
    return (
      <section className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-brand">
            SCHOOLAY
          </div>

          <LoadingSpinner message="Preparing your business dashboard..." />
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <header className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">
            BUSINESS OVERVIEW
          </div>

          <h1>Good afternoon, Admin</h1>

          <p>
            Here's what's happening across
            your Schoolay business today.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <div className="date-chip">
            <Icon name="calendar" />

            <span>
              {new Date().toLocaleDateString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                },
              )}
            </span>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={() =>
              void refreshDashboard()
            }
            disabled={isRefreshing}
          >
            <span
              className={
                isRefreshing
                  ? "refresh-spin"
                  : ""
              }
            >
              <Icon name="refresh" />
            </span>

            {isRefreshing
              ? "Refreshing"
              : "Refresh"}
          </button>
        </div>
      </header>

      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() =>
            setNotification(null)
          }
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* KPI cards                                                          */}
      {/* ------------------------------------------------------------------ */}

      <div className="metrics-grid">
        <MetricCard
          label="Today's Sales"
          value={formatCompactCurrency(
            summary.todaySales,
          )}
          description="Completed invoice value today"
          icon="money"
          accent="metric-blue"
        />

        <MetricCard
          label="Monthly Sales"
          value={formatCompactCurrency(
            summary.monthlySales,
          )}
          description="Completed invoice value this month"
          icon="money"
          accent="metric-violet"
        />

        <MetricCard
          label="Today's Invoices"
          value={formatNumber(
            summary.todayInvoices,
          )}
          description="Invoices generated today"
          icon="invoice"
          accent="metric-green"
        />

        <MetricCard
          label="Outstanding"
          value={formatCompactCurrency(
            summary.totalPendingAmount,
          )}
          description="Pending customer payments"
          icon="users"
          accent="metric-orange"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main analytics                                                      */}
      {/* ------------------------------------------------------------------ */}

      <div className="analytics-grid">
        {/* School sales chart */}
        <article className="dashboard-panel panel-large">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">
                SALES ANALYTICS
              </div>

              <h2>Sales by School</h2>

              <p>
                Revenue contribution across
                your schools.
              </p>
            </div>

            <div className="panel-total">
              <span>Total</span>
              <strong>
                {formatCompactCurrency(
                  totalSchoolSales,
                )}
              </strong>
            </div>
          </div>

          {topSchools.length === 0 ? (
            <div className="dashboard-empty">
              <Icon name="building" />
              <span>
                No school sales data available.
              </span>
            </div>
          ) : (
            <HorizontalBarChart
              data={topSchools.map(
                (school) => ({
                  label:
                    school.schoolName,
                  value:
                    school.totalSales,
                  secondary: `${formatNumber(
                    school.invoiceCount,
                  )} invoices · ${formatNumber(
                    school.totalQuantity,
                  )} units`,
                }),
              )}
              valueFormatter={
                formatCompactCurrency
              }
            />
          )}
        </article>

        {/* Revenue mix */}
        <article className="dashboard-panel">
          <div className="panel-header compact">
            <div>
              <div className="panel-kicker">
                REVENUE MIX
              </div>

              <h2>School Contribution</h2>

              <p>
                Share of total school sales.
              </p>
            </div>
          </div>

          {topSchools.length === 0 ? (
            <div className="dashboard-empty">
              No data available.
            </div>
          ) : (
            <DonutChart
              centerValue={formatCompactCurrency(
                totalSchoolSales,
              )}
              centerLabel="school sales"
              segments={[
                ...topSchools.slice(0, 5).map(
                  (school, index) => ({
                    label:
                      school.schoolCode ||
                      school.schoolName,
                    value:
                      school.totalSales,
                    className: `donut-color-${index}`,
                  }),
                ),
                ...(schoolWiseSales.length >
                5
                  ? [
                      {
                        label: "Other",
                        value:
                          schoolWiseSales
                            .slice(5)
                            .reduce(
                              (
                                sum,
                                school,
                              ) =>
                                sum +
                                school.totalSales,
                              0,
                            ),
                        className:
                          "donut-color-other",
                      },
                    ]
                  : []),
              ]}
            />
          )}
        </article>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Payment section                                                     */}
      {/* ------------------------------------------------------------------ */}

      <div className="analytics-grid">
        <article className="dashboard-panel">
          <div className="panel-header compact">
            <div>
              <div className="panel-kicker">
                COLLECTIONS
              </div>

              <h2>Payment Overview</h2>

              <p>
                Collected versus outstanding
                customer payments.
              </p>
            </div>
          </div>

          <div className="payment-overview">
            <DonutChart
              centerValue={`${paidPercentage}%`}
              centerLabel="collected"
              segments={[
                {
                  label: "Collected",
                  value:
                    summary.totalPaidAmount,
                  className:
                    "donut-color-green",
                },
                {
                  label: "Outstanding",
                  value:
                    summary.totalPendingAmount,
                  className:
                    "donut-color-orange",
                },
              ]}
            />

            <div className="payment-values">
              <div className="payment-value-row">
                <div>
                  <span className="payment-dot paid" />
                  Collected
                </div>

                <strong>
                  {formatCurrency(
                    summary.totalPaidAmount,
                  )}
                </strong>
              </div>

              <div className="payment-value-row">
                <div>
                  <span className="payment-dot pending" />
                  Outstanding
                </div>

                <strong>
                  {formatCurrency(
                    summary.totalPendingAmount,
                  )}
                </strong>
              </div>

              <div className="payment-total-line">
                <span>Total</span>

                <strong>
                  {formatCurrency(
                    paymentTotal,
                  )}
                </strong>
              </div>
            </div>
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="panel-header compact">
            <div>
              <div className="panel-kicker">
                INVOICE STATUS
              </div>

              <h2>Today's Activity</h2>

              <p>
                Current invoice and fulfilment
                snapshot.
              </p>
            </div>
          </div>

          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon activity-green">
                <Icon name="check" />
              </div>

              <div className="activity-content">
                <strong>
                  {formatNumber(
                    summary.todayInvoices,
                  )}
                </strong>

                <span>
                  invoices generated today
                </span>
              </div>

              <Icon name="arrow" />
            </div>

            <div className="activity-item">
              <div className="activity-icon activity-orange">
                <Icon name="clock" />
              </div>

              <div className="activity-content">
                <strong>
                  {formatNumber(
                    pendingInvoices,
                  )}
                </strong>

                <span>
                  pending payments in recent invoices
                </span>
              </div>

              <Icon name="arrow" />
            </div>

            <div className="activity-item">
              <div className="activity-icon activity-blue">
                <Icon name="truck" />
              </div>

              <div className="activity-content">
                <strong>
                  {formatNumber(
                    deliveredInvoices,
                  )}
                </strong>

                <span>
                  recently delivered invoices
                </span>
              </div>

              <Icon name="arrow" />
            </div>

            <div className="activity-item">
              <div className="activity-icon activity-red">
                <Icon name="warning" />
              </div>

              <div className="activity-content">
                <strong>
                  {formatNumber(
                    summary.totalCancelledInvoices,
                  )}
                </strong>

                <span>
                  cancelled invoices
                </span>
              </div>

              <Icon name="arrow" />
            </div>
          </div>
        </article>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Production intelligence                                            */}
      {/* ------------------------------------------------------------------ */}

      <article className="dashboard-panel production-panel">
        <div className="panel-header">
          <div>
            <div className="panel-kicker">
              PRODUCTION INTELLIGENCE
            </div>

            <h2>Production Requirements</h2>

            <p>
              Current required quantities based
              on completed invoices.
            </p>
          </div>

          <div className="production-total">
            <span>Total Units</span>

            <strong>
              {formatNumber(
                productWiseProduction.reduce(
                  (sum, item) =>
                    sum + item.totalQuantity,
                  0,
                ),
              )}
            </strong>
          </div>
        </div>

        <div className="production-grid">
          <div>
            <div className="subsection-title">
              Product requirement
            </div>

            {topProducts.length === 0 ? (
              <div className="dashboard-empty small">
                No production requirement
                available.
              </div>
            ) : (
              <HorizontalBarChart
                data={topProducts.map(
                  (product) => ({
                    label:
                      product.productName,
                    value:
                      product.totalQuantity,
                    secondary: `${product.productCode} · ${formatLabel(
                      product.gender,
                    )}`,
                  }),
                )}
              />
            )}
          </div>

          <div>
            <div className="subsection-title">
              Size distribution
            </div>

            {topSizes.length === 0 ? (
              <div className="dashboard-empty small">
                No size data available.
              </div>
            ) : (
              <div className="size-grid">
                {topSizes.map((item) => {
                  const maximum = Math.max(
                    ...topSizes.map(
                      (size) =>
                        size.totalQuantity,
                    ),
                    1,
                  );

                  const width =
                    Math.max(
                      (item.totalQuantity /
                        maximum) *
                        100,
                      6,
                    );

                  return (
                    <div
                      className="size-item"
                      key={item.size}
                    >
                      <div className="size-item-header">
                        <strong>
                          {item.size}
                        </strong>

                        <span>
                          {formatNumber(
                            item.totalQuantity,
                          )}
                        </span>
                      </div>

                      <div className="size-track">
                        <div
                          className="size-fill"
                          style={{
                            width: `${width}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </article>

      {/* ------------------------------------------------------------------ */}
      {/* School performance                                                 */}
      {/* ------------------------------------------------------------------ */}

      <article className="dashboard-panel table-panel">
        <div className="panel-header">
          <div>
            <div className="panel-kicker">
              BUSINESS PERFORMANCE
            </div>

            <h2>School Performance</h2>

            <p>
              Sales, collections and outstanding
              amounts by school.
            </p>
          </div>

          <button
            type="button"
            className="view-all-button"
          >
            View all
            <Icon name="arrow" />
          </button>
        </div>

        {schoolWiseSales.length === 0 ? (
          <div className="dashboard-empty">
            <Icon name="building" />
            <span>
              No school performance data found.
            </span>
          </div>
        ) : (
          <div className="modern-table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Invoices</th>
                  <th>Units</th>
                  <th>Sales</th>
                  <th>Collected</th>
                  <th>Outstanding</th>
                </tr>
              </thead>

              <tbody>
                {topSchools.map((school) => (
                  <tr key={school.schoolId}>
                    <td>
                      <div className="school-cell">
                        <div className="school-avatar">
                          {(
                            school.schoolCode ||
                            school.schoolName
                          )
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {
                              school.schoolName
                            }
                          </strong>

                          <span>
                            {
                              school.schoolCode
                            }
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {formatNumber(
                        school.invoiceCount,
                      )}
                    </td>

                    <td>
                      {formatNumber(
                        school.totalQuantity,
                      )}
                    </td>

                    <td>
                      <strong>
                        {formatCurrency(
                          school.totalSales,
                        )}
                      </strong>
                    </td>

                    <td>
                      <span className="table-paid">
                        {formatCurrency(
                          school.paidAmount,
                        )}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          school.pendingAmount >
                          0
                            ? "table-pending"
                            : "table-paid"
                        }
                      >
                        {formatCurrency(
                          school.pendingAmount,
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {/* ------------------------------------------------------------------ */}
      {/* Recent invoices                                                    */}
      {/* ------------------------------------------------------------------ */}

      <article className="dashboard-panel table-panel">
        <div className="panel-header">
          <div>
            <div className="panel-kicker">
              RECENT ACTIVITY
            </div>

            <h2>Recent Invoices</h2>

            <p>
              Latest transactions generated in
              the billing system.
            </p>
          </div>

          <button
            type="button"
            className="view-all-button"
          >
            View all
            <Icon name="arrow" />
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="dashboard-empty">
            <Icon name="invoice" />
            <span>
              No invoices have been generated
              yet.
            </span>
          </div>
        ) : (
          <div className="modern-table-wrapper">
            <table className="modern-table invoices-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Student</th>
                  <th>School</th>
                  <th>Class</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Delivery</th>
                </tr>
              </thead>

              <tbody>
                {recentInvoices
                  .slice(0, 10)
                  .map((invoice) => (
                    <tr
                      key={invoice._id}
                    >
                      <td>
                        <span className="invoice-number">
                          {
                            invoice.invoiceNumber
                          }
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          invoice.invoiceDate,
                        )}
                      </td>

                      <td>
                        <div className="student-cell">
                          <strong>
                            {
                              invoice.studentName
                            }
                          </strong>

                          <span>
                            {invoice.section
                              ? `${invoice.className} - ${invoice.section}`
                              : invoice.className}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="school-mini">
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
                        {invoice.className}
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(
                            invoice.grandTotal,
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`status-pill payment-${invoice.paymentStatus.toLowerCase()}`}
                        >
                          <span className="status-dot" />
                          {formatLabel(
                            invoice.paymentStatus,
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-pill ${
                            invoice.fulfilmentStatus ===
                            "COMPLETELY_DELIVERED"
                              ? "delivery-complete"
                              : invoice.fulfilmentStatus ===
                                  "PARTIALLY_COMPLETED"
                                ? "delivery-partial"
                                : "delivery-pending"
                          }`}
                        >
                          <span className="status-dot" />

                          {invoice.fulfilmentStatus
                            ? formatLabel(
                                invoice.fulfilmentStatus,
                              )
                            : "Not Started"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <footer className="dashboard-footer">
        <span>
          Schoolay ERP
        </span>

        <span>
          Business intelligence dashboard
        </span>
      </footer>
    </section>
  );
}