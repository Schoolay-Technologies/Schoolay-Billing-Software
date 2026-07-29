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

import Modal from
  "../../components/common/Modal";

import type {
  ApiErrorResponse,
  Pagination,
  School
} from "../../types/school.types";

import type {
  Product
} from "../../types/product.types";

import type {
  DistributionItemInput,
  DistributionPlace,
  FulfilmentStatus,
  PendingReason,
  TrackedInvoice,
  UpdateDistributionInput
} from "../../types/orderTracking.types";

const pendingReasonOptions: Array<{
  value: PendingReason;
  label: string;
}> = [
  {
    value: "ITEM_NOT_AVAILABLE",
    label: "Item Not Available"
  },
  {
    value: "ALTERATION_REQUIRED",
    label: "Alteration Required"
  },
  {
    value: "WRONG_SIZE_ORDERED",
    label: "Wrong Size Ordered"
  },
  {
    value: "DAMAGED_ITEM",
    label: "Damaged Item"
  },
  {
    value: "PRODUCTION_PENDING",
    label: "Production Pending"
  },
  {
    value: "STOCK_TRANSFER_PENDING",
    label: "Stock Transfer Pending"
  },
  {
    value: "CUSTOMER_NOT_AVAILABLE",
    label: "Customer Not Available"
  },
  {
    value: "OTHER",
    label: "Other"
  }
];

function formatLabel(
  value: string | null | undefined
): string {
  if (!value) {
    return "Not Specified";
  }

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

function getStatusClass(
  status:
    | FulfilmentStatus
    | null
    | undefined
): string {
  if (
    status ===
    "COMPLETELY_DELIVERED"
  ) {
    return "status-active";
  }

  if (
    status ===
    "PARTIALLY_COMPLETED"
  ) {
    return "status-partial";
  }

  return "status-inactive";
}

export default function OrderTrackingPage() {
  const [orders, setOrders] =
    useState<TrackedInvoice[]>([]);

  const [schools, setSchools] =
    useState<School[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [
    selectedOrder,
    setSelectedOrder
  ] = useState<TrackedInvoice | null>(
    null
  );

  const [
    pagination,
    setPagination
  ] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [schoolFilter, setSchoolFilter] =
    useState("");

  const [
    fulfilmentFilter,
    setFulfilmentFilter
  ] = useState<
    FulfilmentStatus | ""
  >("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isLoadingOrder,
    setIsLoadingOrder
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting
  ] = useState(false);

  const [
    isTrackingModalOpen,
    setIsTrackingModalOpen
  ] = useState(false);

  const [
    isHistoryModalOpen,
    setIsHistoryModalOpen
  ] = useState(false);

  const [
    distributionForm,
    setDistributionForm
  ] = useState<UpdateDistributionInput>({
    placeOfDistribution:
      "SCHOOL_CAMP",
    customDistributionPlace: "",
    items: [],
    remarks: ""
  });

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

  const loadOrders =
    useCallback(async () => {
      try {
        setIsLoading(true);

        const result =
          await getOrderTrackingList({
            search:
              search || undefined,

            schoolId:
              schoolFilter ||
              undefined,

            fulfilmentStatus:
              fulfilmentFilter,

            page: pagination.page,
            limit: pagination.limit
          });

        setOrders(result.data);

        setPagination(
          result.pagination
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
    }, [
      search,
      schoolFilter,
      fulfilmentFilter,
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

      const result =
        await getOrderTrackingById(
          invoiceId
        );

      const order = result.data;

      setSelectedOrder(order);

      const productResult =
        await getProducts({
          schoolId:
            typeof order.schoolId ===
            "string"
              ? order.schoolId
              : order.schoolId._id,

          status: "ACTIVE",
          page: 1,
          limit: 100
        });

      setProducts(productResult.data);

      setDistributionForm({
        placeOfDistribution:
          "SCHOOL_CAMP",

        customDistributionPlace:
          "",

        items: order.items.map(
          (item) => ({
            invoiceItemId:
              item._id,

            deliveredNow: 0,

            pendingReason:
              item.pendingReason ||
              undefined,

            pendingReasonRemarks:
              item.pendingReasonRemarks ||
              ""
          })
        ),

        remarks: ""
      });
    } catch (error) {
      setIsTrackingModalOpen(false);

      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
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

      const result =
        await getOrderTrackingById(
          invoiceId
        );

      setSelectedOrder(result.data);
    } catch (error) {
      setIsHistoryModalOpen(false);

      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
      });
    } finally {
      setIsLoadingOrder(false);
    }
  }

  function updateDistributionItem(
    index: number,
    changes: Partial<DistributionItemInput>
  ): void {
    setDistributionForm(
      (current) => ({
        ...current,

        items: current.items.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  ...changes
                }
              : item
        )
      })
    );
  }

  async function submitDistribution(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    if (!selectedOrder) {
      return;
    }

    // Validate all items before submitting
    for (let i = 0; i < distributionForm.items.length; i++) {
      const item = distributionForm.items[i];
      const orderItem = selectedOrder.items[i];
      const itemPending = orderItem?.pendingQuantity ?? 
        Math.max((orderItem?.quantity || 0) - (orderItem?.deliveredQuantity || 0), 0);
      const pendingAfter = itemPending - (item?.deliveredNow ?? 0);

      if (pendingAfter > 0 && !item.pendingReason) {
        setNotification({
          type: "error",
          message: `Please select a pending reason for item ${i + 1}.`
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setNotification(null);

      const result =
        await updateOrderDistribution(
          selectedOrder._id,
          distributionForm
        );

      setNotification({
        type: "success",
        message:
          "Order tracking updated successfully."
      });

      setSelectedOrder(result.data);
      setIsTrackingModalOpen(false);

      await loadOrders();
    } catch (error) {
      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
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

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Tracking of Order</h1>

          <p>
            Track ordered, delivered and
            pending uniform items
          </p>
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
          className="filter-section"
          onSubmit={handleSearchSubmit}
        >
          <div className="search-group">
            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Invoice, student, school or phone"
            />

            <button
              type="submit"
              className="secondary-button"
            >
              Search
            </button>
          </div>

          <select
            value={schoolFilter}
            onChange={(event) => {
              setSchoolFilter(
                event.target.value
              );

              setPagination(
                (current) => ({
                  ...current,
                  page: 1
                })
              );
            }}
          >
            <option value="">
              All schools
            </option>

            {schools.map((school) => (
              <option
                key={school._id}
                value={school._id}
              >
                {school.schoolName}
              </option>
            ))}
          </select>

          <select
            value={fulfilmentFilter}
            onChange={(event) => {
              setFulfilmentFilter(
                event.target.value as
                  | FulfilmentStatus
                  | ""
              );

              setPagination(
                (current) => ({
                  ...current,
                  page: 1
                })
              );
            }}
          >
            <option value="">
              All delivery statuses
            </option>

            <option value="NOT_COMPLETED">
              Not Completed
            </option>

            <option value="PARTIALLY_COMPLETED">
              Partially Completed
            </option>

            <option value="COMPLETELY_DELIVERED">
              Completely Delivered
            </option>
          </select>
        </form>

        {isLoading ? (
          <LoadingSpinner message="Loading order tracking..." />
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders found</h3>

            <p>
              Completed invoices will appear
              here for distribution tracking.
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Invoice</th>
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
                  {orders.map(
                    (order, index) => (
                      <tr key={order._id}>
                        <td>
                          {(pagination.page -
                            1) *
                            pagination.limit +
                            index +
                            1}
                        </td>

                        <td>
                          <strong>
                            {
                              order.invoiceNumber
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            order.studentName
                          }
                        </td>

                        <td>
                          {
                            order.schoolCode
                          }
                        </td>

                        <td>
                          {formatLabel(
  order.placeOfOrder ?? "SCHOOL_CAMP"
)}

                          {order.specializedStoreName
                            ? ` - ${order.specializedStoreName}`
                            : ""}
                        </td>

                        <td>
                          {order.totalOrderedQuantity ??
  order.items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  )}
                        </td>

                        <td>
                          {order.totalDeliveredQuantity ?? 0}
                        </td>

                        <td>
                          <strong>
                            {order.totalPendingQuantity ??
  order.items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  )}
                          </strong>
                        </td>

                        <td>
                          <span
  className={`status-badge ${getStatusClass(
    order.fulfilmentStatus ??
      "NOT_COMPLETED"
  )}`}
>
  {formatLabel(
    order.fulfilmentStatus ??
      "NOT_COMPLETED"
  )}
</span>
                        </td>

                        <td>
                          <div className="invoice-actions">
                            <button
                              type="button"
                              className="invoice-action-button"
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
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination-section">
              <p>
                Showing {orders.length} of{" "}
                {pagination.total} orders
              </p>

              <div className="pagination-buttons">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={
                    pagination.page <= 1
                  }
                  onClick={() =>
                    setPagination(
                      (current) => ({
                        ...current,
                        page:
                          current.page - 1
                      })
                    )
                  }
                >
                  Previous
                </button>

                <span>
                  Page {pagination.page} of{" "}
                  {Math.max(
                    pagination.totalPages,
                    1
                  )}
                </span>

                <button
                  type="button"
                  className="secondary-button"
                  disabled={
                    pagination.page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    setPagination(
                      (current) => ({
                        ...current,
                        page:
                          current.page + 1
                      })
                    )
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
          onClose={() => {
            if (!isSubmitting) {
              setIsTrackingModalOpen(
                false
              );
            }
          }}
        >
          {isLoadingOrder ||
          !selectedOrder ? (
            <LoadingSpinner message="Loading order..." />
          ) : (
            <form
              onSubmit={(event) =>
                void submitDistribution(
                  event
                )
              }
            >
              <div className="tracking-summary">
                <div>
                  <span>Invoice</span>
                  <strong>
                    {
                      selectedOrder.invoiceNumber
                    }
                  </strong>
                </div>

                <div>
                  <span>Student</span>
                  <strong>
                    {
                      selectedOrder.studentName
                    }
                  </strong>
                </div>

                <div>
                  <span>Pending</span>
                  <strong>
                    {
                      selectedOrder.totalPendingQuantity
                    }
                  </strong>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label>
                    Place of Distribution
                  </label>

                  <select
                    value={
                      distributionForm.placeOfDistribution
                    }
                    onChange={(event) =>
                      setDistributionForm(
                        (current) => ({
                          ...current,

                          placeOfDistribution:
                            event.target
                              .value as DistributionPlace
                        })
                      )
                    }
                  >
                    <option value="SCHOOL_CAMP">
                      School Camp
                    </option>

                    <option value="TIPPASANDRA_STORE">
                      Tippasandra Store
                    </option>

                    <option value="MANDUR_STORE">
                      Mandur Store
                    </option>

                    <option value="SARJAPUR_STORE">
                      Sarjapur Store
                    </option>

                    <option value="SPECIALIZED_SCHOOL_STORE">
                      Specialized School Store
                    </option>

                    <option value="HOME_DELIVERY">
                      Home Delivery
                    </option>

                    <option value="SCHOOL_DELIVERY">
                      School Delivery
                    </option>

                    <option value="COURIER">
                      Courier
                    </option>

                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </div>

                {distributionForm.placeOfDistribution ===
                  "OTHER" && (
                  <div className="form-field">
                    <label>
                      Distribution Place
                    </label>

                    <input
                      value={
                        distributionForm.customDistributionPlace
                      }
                      onChange={(event) =>
                        setDistributionForm(
                          (current) => ({
                            ...current,

                            customDistributionPlace:
                              event.target
                                .value
                          })
                        )
                      }
                      required
                    />
                  </div>
                )}
              </div>

              <div className="tracking-items">
                {selectedOrder.items.map(
                  (item, index) => {
                    const formItem =
                      distributionForm
                        .items[index];

                    const itemDelivered =
                      item.deliveredQuantity ?? 0;

                    const itemPending =
                      item.pendingQuantity ??
                      Math.max(
                        item.quantity - itemDelivered,
                        0
                      );

                    const pendingAfter =
                      itemPending -
                      (formItem
                        ?.deliveredNow ??
                        0);

                    return (
                      <article
                        className="tracking-item-card"
                        key={item._id}
                      >
                        <div className="tracking-item-title">
                          <div>
                            <strong>
                              {
                                item.productName
                              }
                            </strong>

                            <span>
                              Size:{" "}
                              {item.size}
                            </span>
                          </div>

                          <span>
  Ordered: {item.quantity} |
  Delivered: {itemDelivered} |
  Pending: {itemPending}
</span>
                        </div>

                        <div className="form-grid">
                          <div className="form-field">
                            <label>
                              Delivered Now
                            </label>

                        <input
  type="number"
  min="0"
  max={itemPending}
  value={formItem?.deliveredNow ?? 0}
  onChange={(event) =>
    updateDistributionItem(index, {
      deliveredNow:
        Number(event.target.value) || 0
    })
  }
/>
                          </div>

                          <div className="form-field">
                            <label>
                              Pending After Update
                            </label>

                            <input
                              value={Math.max(
                                pendingAfter,
                                0
                              )}
                              readOnly
                            />
                          </div>

                          {pendingAfter > 0 && (
                            <div className="form-field">
                              <label>
                                Pending Reason
                              </label>

                              <select
                                value={
                                  formItem
                                    ?.pendingReason ??
                                  ""
                                }
                                onChange={(event) =>
                                  updateDistributionItem(
                                    index,
                                    {
                                      pendingReason:
                                        event
                                          .target
                                          .value as PendingReason
                                    }
                                  )
                                }
                                required
                                style={{
                                  borderColor: pendingAfter > 0 && !formItem?.pendingReason ? '#dc2626' : undefined
                                }}
                              >
                                <option value="">
                                  Select reason
                                </option>

                                {pendingReasonOptions.map(
                                  (option) => (
                                    <option
                                      key={
                                        option.value
                                      }
                                      value={
                                        option.value
                                      }
                                    >
                                      {
                                        option.label
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                              {pendingAfter > 0 && !formItem?.pendingReason && (
                                <small style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                                  Pending reason is required
                                </small>
                              )}
                            </div>
                          )}
                        </div>

                        {pendingAfter > 0 &&
                          (formItem?.pendingReason ===
                            "OTHER" ||
                            formItem?.pendingReason ===
                              "ALTERATION_REQUIRED") && (
                            <div className="form-field">
                              <label>
                                Pending Details
                              </label>

                              <textarea
                                rows={3}
                                value={
                                  formItem.pendingReasonRemarks
                                }
                                onChange={(event) =>
                                  updateDistributionItem(
                                    index,
                                    {
                                      pendingReasonRemarks:
                                        event
                                          .target
                                          .value
                                    }
                                  )
                                }
                                required
                              />
                            </div>
                          )}
                      </article>
                    );
                  }
                )}
              </div>

              <div className="form-field">
                <label>
                  Distribution Remarks
                </label>

                <textarea
                  rows={3}
                  value={
                    distributionForm.remarks
                  }
                  onChange={(event) =>
                    setDistributionForm(
                      (current) => ({
                        ...current,
                        remarks:
                          event.target.value
                      })
                    )
                  }
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={isSubmitting}
                  onClick={() =>
                    setIsTrackingModalOpen(
                      false
                    )
                  }
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
          onClose={() =>
            setIsHistoryModalOpen(false)
          }
        >
          {isLoadingOrder ||
          !selectedOrder ? (
            <LoadingSpinner message="Loading history..." />
          ) : (
            <div>
              <div className="tracking-summary">
                <div>
                  <span>Invoice</span>
                  <strong>
                    {
                      selectedOrder.invoiceNumber
                    }
                  </strong>
                </div>

                <div>
                  <span>Delivered</span>
                  <strong>
                    {
                      selectedOrder.totalDeliveredQuantity
                    }
                  </strong>
                </div>

                <div>
                  <span>Pending</span>
                  <strong>
                    {
                      selectedOrder.totalPendingQuantity
                    }
                  </strong>
                </div>
              </div>

              <h3>Distribution History</h3>

              {selectedOrder
                .distributionHistory
                .length === 0 ? (
                <div className="empty-state">
                  <p>
                    No distribution updates
                    have been recorded.
                  </p>
                </div>
              ) : (
                selectedOrder.distributionHistory.map(
                  (history) => (
                    <article
                      className="history-card"
                      key={history._id}
                    >
                      <div className="history-header">
                        <strong>
                          {new Date(
                            history.distributionDate
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                        <span>
                          {formatLabel(
                            history.placeOfDistribution
                          )}
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
                            </tr>
                          </thead>

                          <tbody>
                            {history.items.map(
                              (
                                item,
                                index
                              ) => (
                                <tr
                                  key={`${item.invoiceItemId}-${index}`}
                                >
                                  <td>
                                    {
                                      item.productName
                                    }
                                  </td>

                                  <td>
                                    {
                                      item.size
                                    }
                                  </td>

                                  <td>
                                    {
                                      item.deliveredNow
                                    }
                                  </td>

                                  <td>
                                    {
                                      item.pendingAfterUpdate
                                    }
                                  </td>

                                  <td>
                                    {item.pendingReason
                                      ? formatLabel(
                                          item.pendingReason
                                        )
                                      : "—"}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>

                      {history.remarks && (
                        <p>
                          {history.remarks}
                        </p>
                      )}
                    </article>
                  )
                )
              )}
            </div>
          )}
        </Modal>
      )}
    </section>
  );
}