import axios from "axios";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useState
} from "react";

import {
  getOrderTrackingById,
  getOrderTrackingList,
  updateOrderDistribution
} from "../../api/orderTracking.api";
import { getProducts } from "../../api/product.api";
import { getSchools } from "../../api/school.api";

import Alert from "../../components/common/Alert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";

import type {
  DistributionItemInput,
  DistributionPlace,
  FulfilmentStatus,
  PendingReason,
  TrackedInvoice,
  TrackedInvoiceItem,
  UpdateDistributionInput
} from "../../types/orderTracking.types";
import type { Product } from "../../types/product.types";
import type {
  ApiErrorResponse,
  Pagination,
  School
} from "../../types/school.types";

const pendingReasonOptions: Array<{
  value: PendingReason;
  label: string;
}> = [
  { value: "ITEM_NOT_AVAILABLE", label: "Item Not Available" },
  { value: "EXCHANGE_RAISED", label: "Exchange Raised" },
  { value: "ALTERATION_REQUIRED", label: "Alteration Required" },
  { value: "WRONG_SIZE_ORDERED", label: "Wrong Size Ordered" },
  { value: "DAMAGED_ITEM", label: "Damaged Item" },
  { value: "PRODUCTION_PENDING", label: "Production Pending" },
  { value: "STOCK_TRANSFER_PENDING", label: "Stock Transfer Pending" },
  { value: "CUSTOMER_NOT_AVAILABLE", label: "Customer Not Available" },
  { value: "OTHER", label: "Other" }
];

const distributionPlaceOptions: Array<{
  value: DistributionPlace;
  label: string;
}> = [
  { value: "SCHOOL_CAMP", label: "School Camp" },
  { value: "TIPPASANDRA_STORE", label: "Tippasandra Store" },
  { value: "MANDUR_STORE", label: "Mandur Store" },
  { value: "SARJAPUR_STORE", label: "Sarjapur Store" },
  {
    value: "SPECIALIZED_SCHOOL_STORE",
    label: "Specialized School Store"
  },
  { value: "HOME_DELIVERY", label: "Home Delivery" },
  { value: "SCHOOL_DELIVERY", label: "School Delivery" },
  { value: "COURIER", label: "Courier" },
  { value: "OTHER", label: "Other" }
];



function formatLabel(value: string | null | undefined): string {
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

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;

    if (data?.errors?.length) {
      return data.errors
        .map((item) => item.message)
        .join(", ");
    }

    return data?.message ?? "The request failed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

function getStatusClass(
  status: FulfilmentStatus | null | undefined
): string {
  if (status === "COMPLETELY_DELIVERED") {
    return "status-active";
  }

  if (status === "PARTIALLY_COMPLETED") {
    return "status-partial";
  }

  return "status-inactive";
}

function getItemDeliveredQuantity(
  item: TrackedInvoiceItem
): number {
  return item.deliveredQuantity ?? 0;
}

function getItemPendingQuantity(
  item: TrackedInvoiceItem
): number {
  return (
    item.pendingQuantity ??
    Math.max(
      item.quantity - getItemDeliveredQuantity(item),
      0
    )
  );
}

function getTotalOrderedQuantity(
  order: TrackedInvoice
): number {
  return (
    order.totalOrderedQuantity ??
    order.items.reduce(
      (total, item) => total + item.quantity,
      0
    )
  );
}

function getTotalDeliveredQuantity(
  order: TrackedInvoice
): number {
  return (
    order.totalDeliveredQuantity ??
    order.items.reduce(
      (total, item) =>
        total + getItemDeliveredQuantity(item),
      0
    )
  );
}

function getTotalPendingQuantity(
  order: TrackedInvoice
): number {
  return (
    order.totalPendingQuantity ??
    Math.max(
      getTotalOrderedQuantity(order) -
        getTotalDeliveredQuantity(order),
      0
    )
  );
}

function getSafeFulfilmentStatus(
  order: TrackedInvoice
): FulfilmentStatus {
  if (order.fulfilmentStatus) {
    return order.fulfilmentStatus;
  }

  const delivered = getTotalDeliveredQuantity(order);
  const pending = getTotalPendingQuantity(order);

  if (delivered === 0) {
    return "NOT_COMPLETED";
  }

  if (pending === 0) {
    return "COMPLETELY_DELIVERED";
  }

  return "PARTIALLY_COMPLETED";
}

function createDistributionItems(
  order: TrackedInvoice
): DistributionItemInput[] {
  return order.items.map((item) => ({
    invoiceItemId: item._id,
    deliveredNow: 0,
    pendingReason:
      item.pendingReason || undefined,
    pendingReasonRemarks:
      item.pendingReasonRemarks ?? "",
    exchangeQuantity: undefined,
    replacementProductId: undefined,
    replacementVariantId: undefined,
    exchangeReason: ""
  }));
}

function getSchoolId(order: TrackedInvoice): string {
  return typeof order.schoolId === "string"
    ? order.schoolId
    : order.schoolId._id;
}

export default function OrderTrackingPage() {
  const [orders, setOrders] =
    useState<TrackedInvoice[]>([]);
  const [schools, setSchools] =
    useState<School[]>([]);
  const [products, setProducts] =
    useState<Product[]>([]);
  const [selectedOrder, setSelectedOrder] =
    useState<TrackedInvoice | null>(null);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    });

  const [searchInput, setSearchInput] =
    useState("");
  const [search, setSearch] =
    useState("");
  const [searchType, setSearchType] = useState<"invoice" | "student" | "both">("both");
  const [schoolFilter, setSchoolFilter] =
    useState("");
  const [fulfilmentFilter, setFulfilmentFilter] =
    useState<FulfilmentStatus | "">("");
  const [placeOfOrderFilter, setPlaceOfOrderFilter] =
    useState("");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: ""
  });

  const [isLoading, setIsLoading] =
    useState(true);
  const [isLoadingOrder, setIsLoadingOrder] =
    useState(false);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] =
    useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] =
    useState(false);

  const [distributionForm, setDistributionForm] =
    useState<UpdateDistributionInput>({
      placeOfDistribution: "SCHOOL_CAMP",
      customDistributionPlace: "",
      items: [],
      remarks: ""
    });

  const [notification, setNotification] =
    useState<{
      type: "success" | "error";
      message: string;
    } | null>(null);

  const loadSchools = useCallback(async () => {
    try {
      const result = await getSchools({
        page: 1,
        limit: 100
      });

      setSchools(result.data);
    } catch (error) {
      setNotification({
        type: "error",
        message: getErrorMessage(error)
      });
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);

      const result = await getOrderTrackingList({
        search: search || undefined,
        searchType: searchType || "both",
        schoolId: schoolFilter || undefined,
        fulfilmentStatus: fulfilmentFilter || undefined,
        placeOfOrder: placeOfOrderFilter || undefined,
        fromDate: dateRange.from || undefined,
        toDate: dateRange.to || undefined,
        page: pagination.page,
        limit: pagination.limit
      });

      setOrders(result.data);
      setPagination(result.pagination);
    } catch (error) {
      setNotification({
        type: "error",
        message: getErrorMessage(error)
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    search,
    searchType,
    schoolFilter,
    fulfilmentFilter,
    placeOfOrderFilter,
    dateRange.from,
    dateRange.to,
    pagination.page,
    pagination.limit
  ]);

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);


  async function openTrackingModal(
    invoiceId: string
  ): Promise<void> {
    try {
      setIsLoadingOrder(true);
      setIsTrackingModalOpen(true);
      setSelectedOrder(null);
      setProducts([]);

      const result =
        await getOrderTrackingById(invoiceId);
      const order = result.data;

      setSelectedOrder(order);

      const productResult = await getProducts({
        schoolId: getSchoolId(order),
        status: "ACTIVE",
        page: 1,
        limit: 100
      });

      setProducts(productResult.data);

      setDistributionForm({
        placeOfDistribution: "SCHOOL_CAMP",
        customDistributionPlace: "",
        items: createDistributionItems(order),
        remarks: ""
      });
    } catch (error) {
      setIsTrackingModalOpen(false);

      setNotification({
        type: "error",
        message: getErrorMessage(error)
      });
    } finally {
      setIsLoadingOrder(false);
    }
  }

  async function openHistoryModal(
    invoiceId: string
  ): Promise<void> {
    try {
      setIsLoadingOrder(true);
      setIsHistoryModalOpen(true);
      setSelectedOrder(null);

      const result =
        await getOrderTrackingById(invoiceId);

      setSelectedOrder(result.data);
    } catch (error) {
      setIsHistoryModalOpen(false);

      setNotification({
        type: "error",
        message: getErrorMessage(error)
      });
    } finally {
      setIsLoadingOrder(false);
    }
  }

  function closeTrackingModal(): void {
    if (isSubmitting) {
      return;
    }

    setIsTrackingModalOpen(false);
    setSelectedOrder(null);
    setProducts([]);
    setDistributionForm({
      placeOfDistribution: "SCHOOL_CAMP",
      customDistributionPlace: "",
      items: [],
      remarks: ""
    });
  }

  function updateDistributionItem(
    index: number,
    changes: Partial<DistributionItemInput>
  ): void {
    setDistributionForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...changes
            }
          : item
      )
    }));
  }

  function validateDistribution(): string | null {
    if (!selectedOrder) {
      return "Order was not selected.";
    }

    if (
      distributionForm.placeOfDistribution === "OTHER" &&
      !distributionForm.customDistributionPlace.trim()
    ) {
      return "Enter the distribution place.";
    }

    let hasUpdate = false;

    for (
      let index = 0;
      index < selectedOrder.items.length;
      index += 1
    ) {
      const item = selectedOrder.items[index];
      const formItem = distributionForm.items[index];

      if (!formItem) {
        return `Tracking details are missing for item ${index + 1}.`;
      }

      const currentPending = getItemPendingQuantity(item);
      const deliveredNow = formItem.deliveredNow ?? 0;

      if (
        !Number.isInteger(deliveredNow) ||
        deliveredNow < 0
      ) {
        return `Enter a valid delivered quantity for ${item.productName}, size ${item.size}.`;
      }

      if (deliveredNow > currentPending) {
        return `Delivered quantity cannot exceed ${currentPending} for ${item.productName}, size ${item.size}.`;
      }

      if (deliveredNow > 0) {
        hasUpdate = true;
      }

      const pendingAfter = currentPending - deliveredNow;

      if (pendingAfter > 0 && !formItem.pendingReason) {
        return `Select a pending reason for ${item.productName}, size ${item.size}.`;
      }

      if (
        pendingAfter > 0 &&
        formItem.pendingReason === "OTHER" &&
        !formItem.pendingReasonRemarks.trim()
      ) {
        return `Enter pending details for ${item.productName}, size ${item.size}.`;
      }

      if (
        pendingAfter > 0 &&
        formItem.pendingReason === "ALTERATION_REQUIRED" &&
        !formItem.pendingReasonRemarks.trim()
      ) {
        return `Enter alteration details for ${item.productName}, size ${item.size}.`;
      }

      if (
        pendingAfter > 0 &&
        formItem.pendingReason === "EXCHANGE_RAISED"
      ) {
        if (
          !formItem.exchangeQuantity ||
          formItem.exchangeQuantity < 1
        ) {
          return `Enter exchange quantity for ${item.productName}, size ${item.size}.`;
        }

        if (formItem.exchangeQuantity > pendingAfter) {
          return `Exchange quantity cannot exceed the pending quantity for ${item.productName}, size ${item.size}.`;
        }

        if (!formItem.replacementProductId) {
          return `Select a replacement item for ${item.productName}, size ${item.size}.`;
        }

        if (!formItem.replacementVariantId) {
          return `Select a replacement size for ${item.productName}, size ${item.size}.`;
        }

        if (!formItem.exchangeReason?.trim()) {
          return `Enter an exchange reason for ${item.productName}, size ${item.size}.`;
        }
      }
    }

    if (!hasUpdate && !distributionForm.remarks.trim()) {
      return "Enter at least one delivered quantity or a tracking remark.";
    }

    return null;
  }

  async function submitDistribution(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    if (!selectedOrder) {
      return;
    }

    const validationError = validateDistribution();

    if (validationError) {
      setNotification({
        type: "error",
        message: validationError
      });

      return;
    }

    try {
      setIsSubmitting(true);
      setNotification(null);

      await updateOrderDistribution(
        selectedOrder._id,
        {
          ...distributionForm,
          customDistributionPlace:
            distributionForm.customDistributionPlace.trim(),
          remarks: distributionForm.remarks.trim(),
          items: distributionForm.items.map((item) => ({
            ...item,
            pendingReasonRemarks:
              item.pendingReasonRemarks.trim(),
            exchangeReason:
              item.exchangeReason?.trim()
          }))
        }
      );

      setNotification({
        type: "success",
        message:
          "Order tracking updated successfully."
      });

      closeTrackingModal();
      await loadOrders();
    } catch (error) {
      setNotification({
        type: "error",
        message: getErrorMessage(error)
      });
    } finally {
      setIsSubmitting(false);
    }
  }



  function handleSearchSubmit(
    event: FormEvent<HTMLFormElement>
  ): void {
    event.preventDefault();

    setPagination((current) => ({
      ...current,
      page: 1
    }));

    setSearch(searchInput.trim());
  }

  function clearFilters(): void {
    setSearchInput("");
    setSearch("");
    setSearchType("both");
    setSchoolFilter("");
    setFulfilmentFilter("");
    setPlaceOfOrderFilter("");
    setDateRange({ from: "", to: "" });

    setPagination((current) => ({
      ...current,
      page: 1
    }));
  }

  return (
    <div className="order-tracking-container">
      <div className="page-heading">
        <div>
          <h1>Tracking of Order</h1>
          <p>
            Track ordered, delivered, pending and exchange items
          </p>
        </div>
      </div>

      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="content-card">
        {/* Search and Filter Section */}
        <div className="filter-section">
          <form onSubmit={handleSearchSubmit} className="search-form">
            {/* Row 1: Search Input, Search Type, Search Button */}
            <div className="search-row">
              <div className="search-input-wrapper">
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(event.target.value)
                  }
                  placeholder="Search by invoice number or student name..."
                  className="search-input"
                />
              </div>
              
              <div className="search-type-wrapper">
                <select
                  value={searchType}
                  onChange={(event) => {
                    setSearchType(event.target.value as "invoice" | "student" | "both");
                  }}
                  className="search-type-select"
                >
                  <option value="both">All Fields</option>
                  <option value="invoice">Invoice Number</option>
                  <option value="student">Student Name</option>
                </select>
              </div>

              <button
                type="submit"
                className="search-button"
              >
                Search
              </button>
            </div>

            {/* Row 2: Filters - School, Order Place, Fulfilment Status */}
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">School</label>
                <select
                  value={schoolFilter}
                  onChange={(event) => {
                    setSchoolFilter(event.target.value);
                    setPagination((current) => ({
                      ...current,
                      page: 1
                    }));
                  }}
                  className="filter-select"
                >
                  <option value="">All schools</option>
                  {schools.map((school) => (
                    <option
                      key={school._id}
                      value={school._id}
                    >
                      {school.schoolName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Order Place</label>
                <select
                  value={placeOfOrderFilter}
                  onChange={(event) => {
                    setPlaceOfOrderFilter(event.target.value);
                    setPagination((current) => ({
                      ...current,
                      page: 1
                    }));
                  }}
                  className="filter-select"
                >
                  <option value="">All order places</option>
                  <option value="SCHOOL_CAMP">School Camp</option>
                  <option value="TIPPASANDRA_STORE">Tippasandra Store</option>
                  <option value="MANDUR_STORE">Mandur Store</option>
                  <option value="SARJAPUR_STORE">Sarjapur Store</option>
                  <option value="SPECIALIZED_SCHOOL_STORE">Specialized School Store</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Delivery Status</label>
                <select
                  value={fulfilmentFilter}
                  onChange={(event) => {
                    setFulfilmentFilter(
                      event.target.value as
                        | FulfilmentStatus
                        | ""
                    );
                    setPagination((current) => ({
                      ...current,
                      page: 1
                    }));
                  }}
                  className="filter-select"
                >
                  <option value="">All delivery statuses</option>
                  <option value="NOT_COMPLETED">Not Completed</option>
                  <option value="PARTIALLY_COMPLETED">Partially Completed</option>
                  <option value="COMPLETELY_DELIVERED">Completely Delivered</option>
                </select>
              </div>
            </div>

            {/* Row 3: Date Range and Clear All */}
            <div className="actions-row">
              <div className="date-range-wrapper">
                <label className="filter-label">Date Range</label>
                <div className="date-range-inputs">
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(event) => {
                      setDateRange({ ...dateRange, from: event.target.value });
                      setPagination((current) => ({
                        ...current,
                        page: 1
                      }));
                    }}
                    className="date-input"
                    placeholder="From"
                  />
                  <span className="date-separator">to</span>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(event) => {
                      setDateRange({ ...dateRange, to: event.target.value });
                      setPagination((current) => ({
                        ...current,
                        page: 1
                      }));
                    }}
                    className="date-input"
                    placeholder="To"
                  />
                </div>
              </div>

              <button
                type="button"
                className="clear-button"
                onClick={clearFilters}
              >
                Clear All Filters
              </button>
            </div>
          </form>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Loading order tracking..." />
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders found</h3>
            <p>
              Completed invoices will appear here for distribution
              tracking.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Student</th>
                    <th>School</th>
                    <th>Order Place</th>
                    <th>Ordered</th>
                    <th>Delivered</th>
                    <th>Pending</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order, index) => {
                    const fulfilmentStatus =
                      getSafeFulfilmentStatus(order);

                    return (
                      <tr key={order._id}>
                        <td>
                          {(pagination.page - 1) *
                            pagination.limit +
                            index +
                            1}
                        </td>

                        <td>
                          <strong>{order.invoiceNumber}</strong>
                        </td>

                        <td>
                          {new Date(
                            order.invoiceDate
                          ).toLocaleDateString("en-IN")}
                        </td>

                        <td>
                          <div className="school-name-cell">
                            <strong>{order.studentName}</strong>
                            <span>
                              {order.className}
                              {order.section
                                ? ` - ${order.section}`
                                : ""}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="school-name-cell">
                            <strong>{order.schoolCode}</strong>
                            <span>{order.schoolName}</span>
                          </div>
                        </td>

                        <td>
                          {formatLabel(
                            order.placeOfOrder ??
                              "SCHOOL_CAMP"
                          )}

                          {order.placeOfOrder ===
                            "SPECIALIZED_SCHOOL_STORE" &&
                          order.specializedStoreName
                            ? ` - ${order.specializedStoreName}`
                            : ""}
                        </td>

                        <td>
                          {getTotalOrderedQuantity(order)}
                        </td>

                        <td>
                          {getTotalDeliveredQuantity(order)}
                        </td>

                        <td>
                          <strong>
                            {getTotalPendingQuantity(order)}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`status-badge ${getStatusClass(
                              fulfilmentStatus
                            )}`}
                          >
                            {formatLabel(
                              fulfilmentStatus
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="invoice-actions">
                            <button
                              type="button"
                              className="invoice-action-button"
                              disabled={
                                fulfilmentStatus ===
                                "COMPLETELY_DELIVERED"
                              }
                              onClick={() =>
                                void openTrackingModal(
                                  order._id
                                )
                              }
                            >
                              Update
                            </button>

                            <button
                              type="button"
                              className="invoice-action-button"
                              onClick={() =>
                                void openHistoryModal(
                                  order._id
                                )
                              }
                            >
                              History
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-card-view">
              {orders.map((order) => {
                const fulfilmentStatus = getSafeFulfilmentStatus(order);
                return (
                  <div className="data-card tracking-card" key={order._id}>
                    <div className="data-card-header">
                      <div>
                        <div className="invoice-number">{order.invoiceNumber}</div>
                        <div className="subtitle">
                          {new Date(order.invoiceDate).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                      <span
                        className={`badge status-badge ${getStatusClass(
                          fulfilmentStatus
                        )}`}
                      >
                        {formatLabel(fulfilmentStatus)}
                      </span>
                    </div>

                    <div className="data-card-item">
                      <span className="label">Student</span>
                      <span className="value student-name">{order.studentName}</span>
                    </div>

                    <div className="data-card-item">
                      <span className="label">Class</span>
                      <span className="value">
                        {order.className}
                        {order.section ? ` - ${order.section}` : ""}
                      </span>
                    </div>

                    <div className="data-card-item">
                      <span className="label">School</span>
                      <span className="value">{order.schoolName}</span>
                    </div>

                    <div className="data-card-item">
                      <span className="label">Order Place</span>
                      <span className="value">
                        {formatLabel(order.placeOfOrder ?? "SCHOOL_CAMP")}
                        {order.placeOfOrder === "SPECIALIZED_SCHOOL_STORE" &&
                          order.specializedStoreName
                          ? ` - ${order.specializedStoreName}`
                          : ""}
                      </span>
                    </div>

                    <div className="data-card-item">
                      <span className="label">Quantity</span>
                      <span className="value">
                        <div className="quantity-info">
                          <span>Ordered: <strong>{getTotalOrderedQuantity(order)}</strong></span>
                          <span>Delivered: <strong>{getTotalDeliveredQuantity(order)}</strong></span>
                          <span>Pending: <strong>{getTotalPendingQuantity(order)}</strong></span>
                        </div>
                      </span>
                    </div>

                    <div className="data-card-actions">
                      <button
                        type="button"
                        className="invoice-action-button"
                        disabled={fulfilmentStatus === "COMPLETELY_DELIVERED"}
                        onClick={() => void openTrackingModal(order._id)}
                      >
                        Update
                      </button>

                      <button
                        type="button"
                        className="invoice-action-button"
                        onClick={() => void openHistoryModal(order._id)}
                      >
                        History
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pagination-section">
              <p>
                Showing {orders.length} of {pagination.total} orders
              </p>

              <div className="pagination-buttons">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((current) => ({
                      ...current,
                      page: current.page - 1
                    }))
                  }
                >
                  Previous
                </button>

                <span>
                  Page {pagination.page} of{" "}
                  {Math.max(pagination.totalPages, 1)}
                </span>

                <button
                  type="button"
                  className="secondary-button"
                  disabled={
                    pagination.page >= pagination.totalPages
                  }
                  onClick={() =>
                    setPagination((current) => ({
                      ...current,
                      page: current.page + 1
                    }))
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {isTrackingModalOpen && (
        <Modal
          title="Update Order Tracking"
          onClose={closeTrackingModal}
        >
          {isLoadingOrder || !selectedOrder ? (
            <LoadingSpinner message="Loading order..." />
          ) : (
            <form onSubmit={submitDistribution}>
              <div className="tracking-summary">
                <div>
                  <span>Invoice</span>
                  <strong>{selectedOrder.invoiceNumber}</strong>
                </div>

                <div>
                  <span>Student</span>
                  <strong>{selectedOrder.studentName}</strong>
                </div>

                <div>
                  <span>Pending</span>
                  <strong>
                    {getTotalPendingQuantity(selectedOrder)}
                  </strong>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="placeOfDistribution">
                    Place of Distribution <span>*</span>
                  </label>

                  <select
                    id="placeOfDistribution"
                    value={
                      distributionForm.placeOfDistribution
                    }
                    onChange={(event) =>
                      setDistributionForm((current) => ({
                        ...current,
                        placeOfDistribution:
                          event.target
                            .value as DistributionPlace,
                        customDistributionPlace:
                          event.target.value === "OTHER"
                            ? current.customDistributionPlace
                            : ""
                      }))
                    }
                    required
                  >
                    {distributionPlaceOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {distributionForm.placeOfDistribution ===
                  "OTHER" && (
                  <div className="form-field">
                    <label htmlFor="customDistributionPlace">
                      Distribution Place <span>*</span>
                    </label>

                    <input
                      id="customDistributionPlace"
                      value={
                        distributionForm.customDistributionPlace
                      }
                      onChange={(event) =>
                        setDistributionForm((current) => ({
                          ...current,
                          customDistributionPlace:
                            event.target.value
                        }))
                      }
                      required
                    />
                  </div>
                )}
              </div>

              <div className="tracking-items">
                {selectedOrder.items.map((item, index) => {
                  const formItem =
                    distributionForm.items[index];
                  const itemDelivered =
                    getItemDeliveredQuantity(item);
                  const itemPending =
                    getItemPendingQuantity(item);
                  const deliveredNow =
                    formItem?.deliveredNow ?? 0;
                  const pendingAfter = Math.max(
                    itemPending - deliveredNow,
                    0
                  );

                  const replacementProduct =
                    products.find(
                      (product) =>
                        product._id ===
                        formItem?.replacementProductId
                    );

                  return (
                    <article
                      className="tracking-item-card"
                      key={item._id}
                    >
                      <div className="tracking-item-title">
                        <div>
                          <strong>{item.productName}</strong>
                          <span>Size: {item.size}</span>
                        </div>

                        <span>
                          Ordered: {item.quantity} | Delivered:{" "}
                          {itemDelivered} | Pending: {itemPending}
                        </span>
                      </div>

                      <div className="form-grid">
                        <div className="form-field">
                          <label
                            htmlFor={`deliveredNow-${item._id}`}
                          >
                            Delivered Now
                          </label>

                          <input
                            id={`deliveredNow-${item._id}`}
                            type="number"
                            min="0"
                            max={itemPending}
                            step="1"
                            value={deliveredNow}
                            onChange={(event) =>
                              updateDistributionItem(index, {
                                deliveredNow:
                                  Number(
                                    event.target.value
                                  ) || 0
                              })
                            }
                          />
                        </div>

                        <div className="form-field">
                          <label
                            htmlFor={`pendingAfter-${item._id}`}
                          >
                            Pending After Update
                          </label>

                          <input
                            id={`pendingAfter-${item._id}`}
                            value={pendingAfter}
                            readOnly
                          />
                        </div>

                        {pendingAfter > 0 && (
                          <div className="form-field">
                            <label
                              htmlFor={`pendingReason-${item._id}`}
                            >
                              Pending Reason <span>*</span>
                            </label>

                            <select
                              id={`pendingReason-${item._id}`}
                              value={
                                formItem?.pendingReason ?? ""
                              }
                              onChange={(event) => {
                                const pendingReason =
                                  event.target
                                    .value as PendingReason;

                                updateDistributionItem(index, {
                                  pendingReason,
                                  pendingReasonRemarks:
                                    pendingReason === "OTHER" ||
                                    pendingReason ===
                                      "ALTERATION_REQUIRED"
                                      ? formItem
                                          ?.pendingReasonRemarks ??
                                        ""
                                      : "",
                                  exchangeQuantity:
                                    pendingReason ===
                                    "EXCHANGE_RAISED"
                                      ? formItem
                                          ?.exchangeQuantity
                                      : undefined,
                                  replacementProductId:
                                    pendingReason ===
                                    "EXCHANGE_RAISED"
                                      ? formItem
                                          ?.replacementProductId
                                      : undefined,
                                  replacementVariantId:
                                    pendingReason ===
                                    "EXCHANGE_RAISED"
                                      ? formItem
                                          ?.replacementVariantId
                                      : undefined,
                                  exchangeReason:
                                    pendingReason ===
                                    "EXCHANGE_RAISED"
                                      ? formItem
                                          ?.exchangeReason
                                      : ""
                                });
                              }}
                              required
                            >
                              <option value="">
                                Select reason
                              </option>

                              {pendingReasonOptions.map(
                                (option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        )}
                      </div>

                      {pendingAfter > 0 &&
                        (formItem?.pendingReason === "OTHER" ||
                          formItem?.pendingReason ===
                            "ALTERATION_REQUIRED") && (
                          <div className="form-field">
                            <label
                              htmlFor={`pendingDetails-${item._id}`}
                            >
                              {formItem.pendingReason ===
                              "ALTERATION_REQUIRED"
                                ? "Alteration Details"
                                : "Pending Details"}{" "}
                              <span>*</span>
                            </label>

                            <textarea
                              id={`pendingDetails-${item._id}`}
                              rows={3}
                              value={
                                formItem.pendingReasonRemarks
                              }
                              onChange={(event) =>
                                updateDistributionItem(index, {
                                  pendingReasonRemarks:
                                    event.target.value
                                })
                              }
                              required
                            />
                          </div>
                        )}

                      {pendingAfter > 0 &&
                        formItem?.pendingReason ===
                          "EXCHANGE_RAISED" && (
                          <div className="exchange-section">
                            <h4>Exchange Details</h4>

                            <div className="form-grid">
                              <div className="form-field">
                                <label
                                  htmlFor={`exchangeQuantity-${item._id}`}
                                >
                                  Exchange Quantity <span>*</span>
                                </label>

                                <input
                                  id={`exchangeQuantity-${item._id}`}
                                  type="number"
                                  min="1"
                                  max={pendingAfter}
                                  step="1"
                                  value={
                                    formItem.exchangeQuantity ??
                                    ""
                                  }
                                  onChange={(event) =>
                                    updateDistributionItem(index, {
                                      exchangeQuantity:
                                        Number(
                                          event.target.value
                                        ) || undefined
                                    })
                                  }
                                  required
                                />
                              </div>

                              <div className="form-field">
                                <label
                                  htmlFor={`replacementProduct-${item._id}`}
                                >
                                  Replacement Item <span>*</span>
                                </label>

                                <select
                                  id={`replacementProduct-${item._id}`}
                                  value={
                                    formItem.replacementProductId ??
                                    ""
                                  }
                                  onChange={(event) =>
                                    updateDistributionItem(index, {
                                      replacementProductId:
                                        event.target.value,
                                      replacementVariantId: ""
                                    })
                                  }
                                  required
                                >
                                  <option value="">
                                    Select item
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

                              <div className="form-field">
                                <label
                                  htmlFor={`replacementVariant-${item._id}`}
                                >
                                  Replacement Size <span>*</span>
                                </label>

                                <select
                                  id={`replacementVariant-${item._id}`}
                                  value={
                                    formItem.replacementVariantId ??
                                    ""
                                  }
                                  disabled={!replacementProduct}
                                  onChange={(event) =>
                                    updateDistributionItem(index, {
                                      replacementVariantId:
                                        event.target.value
                                    })
                                  }
                                  required
                                >
                                  <option value="">
                                    Select size
                                  </option>

                                  {replacementProduct?.variants
                                    .filter(
                                      (variant) =>
                                        variant.status === "ACTIVE"
                                    )
                                    .map((variant) => (
                                      <option
                                        key={variant._id}
                                        value={variant._id}
                                      >
                                        {variant.size}
                                      </option>
                                    ))}
                                </select>
                              </div>

                              <div className="form-field">
                                <label
                                  htmlFor={`exchangeReason-${item._id}`}
                                >
                                  Exchange Reason <span>*</span>
                                </label>

                                <input
                                  id={`exchangeReason-${item._id}`}
                                  value={
                                    formItem.exchangeReason ?? ""
                                  }
                                  onChange={(event) =>
                                    updateDistributionItem(index, {
                                      exchangeReason:
                                        event.target.value
                                    })
                                  }
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        )}
                    </article>
                  );
                })}
              </div>

              <div className="form-field">
                <label htmlFor="distributionRemarks">
                  Distribution Remarks
                </label>

                <textarea
                  id="distributionRemarks"
                  rows={3}
                  value={distributionForm.remarks}
                  onChange={(event) =>
                    setDistributionForm((current) => ({
                      ...current,
                      remarks: event.target.value
                    }))
                  }
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={isSubmitting}
                  onClick={closeTrackingModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Updating..."
                    : "Save Tracking Update"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {isHistoryModalOpen && (
        <Modal
          title="Order Tracking History"
          onClose={() => {
            if (!isSubmitting) {
              setIsHistoryModalOpen(false);
              setSelectedOrder(null);
            }
          }}
        >
          {isLoadingOrder || !selectedOrder ? (
            <LoadingSpinner message="Loading history..." />
          ) : (
            <div>
              <div className="tracking-summary">
                <div>
                  <span>Invoice</span>
                  <strong>{selectedOrder.invoiceNumber}</strong>
                </div>

                <div>
                  <span>Delivered</span>
                  <strong>
                    {getTotalDeliveredQuantity(selectedOrder)}
                  </strong>
                </div>

                <div>
                  <span>Pending</span>
                  <strong>
                    {getTotalPendingQuantity(selectedOrder)}
                  </strong>
                </div>
              </div>

              <h3>Distribution History</h3>

              {(selectedOrder.distributionHistory ?? [])
                .length === 0 ? (
                <div className="empty-state">
                  <p>
                    No distribution updates have been recorded.
                  </p>
                </div>
              ) : (
                (selectedOrder.distributionHistory ?? []).map(
                  (history, historyIndex) => (
                    <article
                      className="history-card"
                      key={
                        history._id ??
                        `${history.distributionDate}-${historyIndex}`
                      }
                    >
                      <div className="history-header">
                        <strong>
                          {new Date(
                            history.distributionDate
                          ).toLocaleString("en-IN")}
                        </strong>

                        <span>
                          {formatLabel(
                            history.placeOfDistribution
                          )}
                          {history.customDistributionPlace
                            ? ` - ${history.customDistributionPlace}`
                            : ""}
                        </span>
                      </div>

                      <div className="table-responsive">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Size</th>
                              <th>Delivered</th>
                              <th>Pending</th>
                              <th>Reason</th>
                              <th>Details</th>
                            </tr>
                          </thead>

                          <tbody>
                            {(history.items ?? []).map(
                              (item, index) => (
                                <tr
                                  key={`${item.invoiceItemId}-${index}`}
                                >
                                  <td>{item.productName}</td>
                                  <td>{item.size}</td>
                                  <td>{item.deliveredNow}</td>
                                  <td>
                                    {item.pendingAfterUpdate}
                                  </td>
                                  <td>
                                    {item.pendingReason
                                      ? formatLabel(
                                          item.pendingReason
                                        )
                                      : "—"}
                                  </td>
                                  <td>
                                    {item.pendingReasonRemarks ||
                                      "—"}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>

                      {history.remarks && (
                        <p>{history.remarks}</p>
                      )}
                    </article>
                  )
                )
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}