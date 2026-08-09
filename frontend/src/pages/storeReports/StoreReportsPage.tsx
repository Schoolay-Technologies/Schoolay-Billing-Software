import axios from "axios";

import html2canvas from "html2canvas";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

import {
  createStoreReport,
  downloadStoreReportsExcel,
  getStoreMtd,
  getStoreReports
} from "../../api/storeReport.api";

import {
  getSchools
} from "../../api/school.api";

import Alert from
  "../../components/common/Alert";

import Modal from
  "../../components/common/Modal";

import LoadingSpinner from
  "../../components/common/LoadingSpinner";

import type {
  School
} from "../../types/school.types";

import type {
  CreateStoreReportInput,
  StoreMtdSummary,
  StoreName,
  StoreReport
} from "../../types/storeReport.types";


const storeOptions: Array<{
  value: StoreName;
  label: string;
}> = [
  {
    value:
      "MANDUR_STORE",
    label:
      "Mandur Store"
  },
  {
    value:
      "TIPPASANDRA_STORE",
    label:
      "Tippasandra Store"
  },
  {
    value:
      "BANASWADI_STORE",
    label:
      "Banaswadi Store"
  }
];

const today =
  new Date()
    .toISOString()
    .slice(0, 10);

function createInitialForm():
  CreateStoreReportInput {
  return {
    storeName:
      "MANDUR_STORE",

    reportDate:
      today,

    openingTime:
      "",

    closingTime:
      "",

    totalCustomers:
      0,

    preOrders: [
      {
        schoolId: "",
        quantity: 1,
        amountCollected:
          0
      }
    ],

    directPurchaseQuantity:
      0,

    directPurchaseAmount:
      0,

    directPurchaseOnlineAmount:
      0,

    directPurchaseCashAmount:
      0,

    exchangesRaised:
      0,

    exchangesFulfilled:
      0,

    exchangePendingReason:
      "",

    remarks:
      ""
  };
}

function formatCurrency(
  value: number
): string {
  return new Intl
    .NumberFormat(
      "en-IN",
      {
        style:
          "currency",
        currency:
          "INR"
      }
    )
    .format(value);
}

function getErrorMessage(
  error: unknown
): string {
  if (
    axios.isAxiosError(
      error
    )
  ) {
    return (
      error.response
        ?.data
        ?.message ??
      "Request failed."
    );
  }

  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  return "Unexpected error.";
}

export default function StoreReportsPage() {
  const [
    schools,
    setSchools
  ] =
    useState<School[]>(
      []
    );

    const reportPreviewRef =
  useRef<HTMLDivElement | null>(
    null
  );

  const [
    reports,
    setReports
  ] =
    useState<
      StoreReport[]
    >([]);

  const [
    formData,
    setFormData
  ] =
    useState(
      createInitialForm()
    );

  const [
    previewReport,
    setPreviewReport
  ] =
    useState<
      StoreReport | null
    >(null);

  const [
    isCreateOpen,
    setIsCreateOpen
  ] =
    useState(false);

  const [
    isPreviewOpen,
    setIsPreviewOpen
  ] =
    useState(false);

  const [
    isLoading,
    setIsLoading
  ] =
    useState(true);

  const [
    isSubmitting,
    setIsSubmitting
  ] =
    useState(false);

  const [
    notification,
    setNotification
  ] =
    useState<{
      type:
        | "success"
        | "error";

      message:
        string;
    } | null>(
      null
    );

  const [
    storeFilter,
    setStoreFilter
  ] =
    useState("");

  const [
    fromDate,
    setFromDate
  ] =
    useState("");

  const [
    toDate,
    setToDate
  ] =
    useState("");

  const [
    mtdStore,
    setMtdStore
  ] =
    useState<StoreName>(
      "MANDUR_STORE"
    );

  const [
    mtdFromDate,
    setMtdFromDate
  ] =
    useState("");

  const [
    mtdToDate,
    setMtdToDate
  ] =
    useState("");

  const [
    mtdSummary,
    setMtdSummary
  ] =
    useState<
      StoreMtdSummary | null
    >(null);

  const totals =
    useMemo(() => {
      const quantity =
        formData
          .preOrders
          .reduce(
            (
              total,
              row
            ) =>
              total +
              Number(
                row.quantity ||
                  0
              ),
            0
          );

      const amount =
        formData
          .preOrders
          .reduce(
            (
              total,
              row
            ) =>
              total +
              Number(
                row
                  .amountCollected ||
                  0
              ),
            0
          );

      return {
        quantity,
        amount,

        totalAmount:
          amount +
          formData
            .directPurchaseAmount
      };
    }, [
      formData
    ]);

  const loadSchools =
    useCallback(
      async () => {
        try {
          const result =
            await getSchools({
              page: 1,
              limit: 100,
              status:
                "ACTIVE"
            });

          setSchools(
            result.data
          );
        } catch (
          error
        ) {
          setNotification({
            type:
              "error",

            message:
              getErrorMessage(
                error
              )
          });
        }
      },
      []
    );

  const loadReports =
    useCallback(
      async () => {
        try {
          setIsLoading(
            true
          );

          const result =
            await getStoreReports({
              storeName:
                storeFilter ||
                undefined,

              fromDate:
                fromDate ||
                undefined,

              toDate:
                toDate ||
                undefined,

              page: 1,
              limit: 100
            });

          setReports(
            result.data
          );
        } catch (
          error
        ) {
          setNotification({
            type:
              "error",

            message:
              getErrorMessage(
                error
              )
          });
        } finally {
          setIsLoading(
            false
          );
        }
      },
      [
        storeFilter,
        fromDate,
        toDate
      ]
    );

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  function updateField<
    K extends
      keyof CreateStoreReportInput
  >(
    field: K,
    value:
      CreateStoreReportInput[K]
  ): void {
    setFormData(
      (current) => ({
        ...current,
        [field]:
          value
      })
    );
  }

  function updatePreOrder(
    index: number,
    field:
      | "schoolId"
      | "quantity"
      | "amountCollected",
    value:
      string | number
  ): void {
    setFormData(
      (current) => ({
        ...current,

        preOrders:
          current
            .preOrders
            .map(
              (
                row,
                rowIndex
              ) =>
                rowIndex ===
                index
                  ? {
                      ...row,
                      [field]:
                        value
                    }
                  : row
            )
      })
    );
  }

  function addPreOrder():
    void {
    setFormData(
      (current) => ({
        ...current,

        preOrders: [
          ...current
            .preOrders,

          {
            schoolId:
              "",
            quantity:
              1,
            amountCollected:
              0
          }
        ]
      })
    );
  }

  function removePreOrder(
    index: number
  ): void {
    setFormData(
      (current) => ({
        ...current,

        preOrders:
          current
            .preOrders
            .filter(
              (
                _,
                rowIndex
              ) =>
                rowIndex !==
                index
            )
      })
    );
  }

  async function handleDownloadReportImage():
  Promise<void> {
  if (!reportPreviewRef.current) {
    setNotification({
      type: "error",
      message:
        "Report preview is not available."
    });

    return;
  }

  try {
    const canvas =
      await html2canvas(
        reportPreviewRef.current,
        {
          scale: 2,
          backgroundColor:
            "#ffffff",
          useCORS: true
        }
      );

    const imageUrl =
      canvas.toDataURL(
        "image/png"
      );

    const link =
      document.createElement(
        "a"
      );

    const storeName =
      previewReport
        ?.storeName
        .replaceAll(
          "_",
          "-"
        ) ??
      "Store";

    const reportDate =
      previewReport
        ?.reportDate
        ?.slice(
          0,
          10
        ) ??
      "Report";

    link.href =
      imageUrl;

    link.download =
      `${storeName}-${reportDate}-Store-Report.png`;

    document.body
      .appendChild(
        link
      );

    link.click();

    link.remove();
  } catch (error) {
    setNotification({
      type: "error",
      message:
        getErrorMessage(
          error
        )
    });
  }
}

  async function handleSubmit(
    event:
      FormEvent
  ): Promise<void> {
    event.preventDefault();

    try {
      setIsSubmitting(
        true
      );

      setNotification(
        null
      );

      const result =
        await createStoreReport(
          {
            ...formData,

            preOrders:
              formData
                .preOrders
                .filter(
                  (row) =>
                    row.schoolId
                )
          }
        );

      setPreviewReport(
        result.data
      );

      setIsCreateOpen(
        false
      );

      setIsPreviewOpen(
        true
      );

      setFormData(
        createInitialForm()
      );

      await loadReports();

    } catch (error) {
      setNotification({
        type: "error",

        message:
          getErrorMessage(
            error
          )
      });
    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  async function handleExport():
    Promise<void> {
    if (
      !fromDate ||
      !toDate
    ) {
      setNotification({
        type:
          "error",

        message:
          "Select From Date and To Date."
      });

      return;
    }

    try {
      await downloadStoreReportsExcel(
        storeFilter,
        fromDate,
        toDate
      );
    } catch (
      error
    ) {
      setNotification({
        type:
          "error",

        message:
          getErrorMessage(
            error
          )
      });
    }
  }

  async function handleMtd():
    Promise<void> {
    if (
      !mtdFromDate ||
      !mtdToDate
    ) {
      setNotification({
        type:
          "error",

        message:
          "Select MTD From Date and To Date."
      });

      return;
    }

    try {
      const result =
        await getStoreMtd(
          mtdStore,
          mtdFromDate,
          mtdToDate
        );

      setMtdSummary(
        result.data
      );
    } catch (
      error
    ) {
      setNotification({
        type:
          "error",

        message:
          getErrorMessage(
            error
          )
      });
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>
            Store Reports
          </h1>

          <p>
            Daily retailer store
            closure and collection
            reports
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            setIsCreateOpen(
              true
            )
          }
        >
          + Daily Report
        </button>
      </div>

      {notification && (
        <Alert
          type={
            notification.type
          }
          message={
            notification.message
          }
          onClose={() =>
            setNotification(
              null
            )
          }
        />
      )}

      <div className="content-card">
        <div className="store-report-toolbar">

          <select
            value={
              storeFilter
            }
            onChange={(
              event
            ) =>
              setStoreFilter(
                event.target
                  .value
              )
            }
          >
            <option value="">
              All Stores
            </option>

            {storeOptions.map(
              (store) => (
                <option
                  key={
                    store.value
                  }
                  value={
                    store.value
                  }
                >
                  {
                    store.label
                  }
                </option>
              )
            )}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(
              event
            ) =>
              setFromDate(
                event.target
                  .value
              )
            }
          />

          <input
            type="date"
            value={toDate}
            onChange={(
              event
            ) =>
              setToDate(
                event.target
                  .value
              )
            }
          />

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              void handleExport()
            }
          >
            Export Excel
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner
            message=
              "Loading store reports..."
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Store</th>
                  <th>Customers</th>
                  <th>Pre Orders</th>
                  <th>Pre Order Amount</th>
                  <th>Direct Purchase</th>
                  <th>Direct Amount</th>
                  <th>Exchanges</th>
                  <th>Total Collection</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {reports.map(
                  (report) => (
                    <tr
                      key={
                        report._id
                      }
                    >
                      <td>
                        {new Date(
                          report
                            .reportDate
                        )
                          .toLocaleDateString(
                            "en-IN"
                          )}
                      </td>

                      <td>
                        {report
                          .storeName
                          .replaceAll(
                            "_",
                            " "
                          )}
                      </td>

                      <td>
                        {
                          report
                            .totalCustomers
                        }
                      </td>

                      <td>
                        {
                          report
                            .totalPreOrderQuantity
                        }
                      </td>

                      <td>
                        {formatCurrency(
                          report
                            .totalPreOrderAmount
                        )}
                      </td>

                      <td>
                        {
                          report
                            .directPurchaseQuantity
                        }
                      </td>

                      <td>
                        {formatCurrency(
                          report
                            .directPurchaseAmount
                        )}
                      </td>

                      <td>
                        {
                          report
                            .exchangesRaised
                        }
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(
                            report
                              .totalAmountCollected
                          )}
                        </strong>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="invoice-action-button"
                          onClick={() => {
                            setPreviewReport(
                              report
                            );

                            setIsPreviewOpen(
                              true
                            );
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="content-card store-mtd-card">
        <h3>
          MTD Summary
        </h3>

        <div className="store-report-toolbar">
          <select
            value={
              mtdStore
            }
            onChange={(
              event
            ) =>
              setMtdStore(
                event.target
                  .value as
                  StoreName
              )
            }
          >
            {storeOptions.map(
              (store) => (
                <option
                  key={
                    store.value
                  }
                  value={
                    store.value
                  }
                >
                  {
                    store.label
                  }
                </option>
              )
            )}
          </select>

          <input
            type="date"
            value={
              mtdFromDate
            }
            onChange={(
              event
            ) =>
              setMtdFromDate(
                event.target
                  .value
              )
            }
          />

          <input
            type="date"
            value={
              mtdToDate
            }
            onChange={(
              event
            ) =>
              setMtdToDate(
                event.target
                  .value
              )
            }
          />

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              void handleMtd()
            }
          >
            Calculate MTD
          </button>
        </div>

        {mtdSummary && (
          <div className="store-mtd-summary">
            <div>
              <span>
                Total Collection
              </span>

              <strong>
                {formatCurrency(
                  mtdSummary
                    .totalAmountCollected
                )}
              </strong>
            </div>

            <div>
              <span>
                Customers
              </span>

              <strong>
                {
                  mtdSummary
                    .totalCustomers
                }
              </strong>
            </div>

            <div>
              <span>
                Pre Orders
              </span>

              <strong>
                {
                  mtdSummary
                    .totalPreOrders
                }
              </strong>
            </div>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <Modal
          title=
            "Daily Store Report"
          onClose={() =>
            setIsCreateOpen(
              false
            )
          }
        >
          <form
            onSubmit={(
              event
            ) =>
              void handleSubmit(
                event
              )
            }
          >
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Store *
                </label>

                <select
                  value={
                    formData
                      .storeName
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "storeName",
                      event.target
                        .value as
                        StoreName
                    )
                  }
                >
                  {storeOptions.map(
                    (store) => (
                      <option
                        key={
                          store.value
                        }
                        value={
                          store.value
                        }
                      >
                        {
                          store.label
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="form-field">
                <label>
                  Report Date *
                </label>

                <input
                  type="date"
                  value={
                    formData
                      .reportDate
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "reportDate",
                      event.target
                        .value
                    )
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label>
                  Opening Time *
                </label>

                <input
                  type="time"
                  value={
                    formData
                      .openingTime
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "openingTime",
                      event.target
                        .value
                    )
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label>
                  Closing Time *
                </label>

                <input
                  type="time"
                  value={
                    formData
                      .closingTime
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "closingTime",
                      event.target
                        .value
                    )
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label>
                  Total Customers
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    formData
                      .totalCustomers
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "totalCustomers",
                      Number(
                        event.target
                          .value
                      ) || 0
                    )
                  }
                />
              </div>
            </div>

            <div className="variant-section">
              <div className="variant-heading">
                <div>
                  <h3>
                    Pre Orders
                  </h3>

                  <p>
                    Add school-wise
                    pre-orders.
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    addPreOrder
                  }
                >
                  + Add School
                </button>
              </div>

              {formData
                .preOrders
                .map(
                  (
                    row,
                    index
                  ) => (
                    <div
                      className="store-preorder-row"
                      key={
                        index
                      }
                    >
                      <select
                        value={
                          row
                            .schoolId
                        }
                        onChange={(
                          event
                        ) =>
                          updatePreOrder(
                            index,
                            "schoolId",
                            event.target
                              .value
                          )
                        }
                      >
                        <option value="">
                          Select School
                        </option>

                        {schools.map(
                          (
                            school
                          ) => (
                            <option
                              key={
                                school
                                  ._id
                              }
                              value={
                                school
                                  ._id
                              }
                            >
                              {
                                school
                                  .schoolName
                              }
                            </option>
                          )
                        )}
                      </select>

                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={
                          row.quantity
                        }
                        onChange={(
                          event
                        ) =>
                          updatePreOrder(
                            index,
                            "quantity",
                            Number(
                              event
                                .target
                                .value
                            ) ||
                              1
                          )
                        }
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount"
                        value={
                          row
                            .amountCollected
                        }
                        onChange={(
                          event
                        ) =>
                          updatePreOrder(
                            index,
                            "amountCollected",
                            Number(
                              event
                                .target
                                .value
                            ) ||
                              0
                          )
                        }
                      />

                      <button
                        type="button"
                        className="remove-row-button"
                        onClick={() =>
                          removePreOrder(
                            index
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  )
                )}

              <p>
                Total Pre Orders:{" "}
                <strong>
                  {
                    totals.quantity
                  }
                </strong>
                {" | "}
                Amount:{" "}
                <strong>
                  {formatCurrency(
                    totals.amount
                  )}
                </strong>
              </p>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>
                  Direct Purchases
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    formData
                      .directPurchaseQuantity
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "directPurchaseQuantity",
                      Number(
                        event.target
                          .value
                      ) || 0
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Direct Purchase Amount
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    formData
                      .directPurchaseAmount
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "directPurchaseAmount",
                      Number(
                        event.target
                          .value
                      ) || 0
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Online Amount
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    formData
                      .directPurchaseOnlineAmount
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "directPurchaseOnlineAmount",
                      Number(
                        event.target
                          .value
                      ) || 0
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Cash Amount
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    formData
                      .directPurchaseCashAmount
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "directPurchaseCashAmount",
                      Number(
                        event.target
                          .value
                      ) || 0
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Exchanges Raised
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    formData
                      .exchangesRaised
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "exchangesRaised",
                      Number(
                        event.target
                          .value
                      ) || 0
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label>
                  Exchanges Fulfilled
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    formData
                      .exchangesFulfilled
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "exchangesFulfilled",
                      Number(
                        event.target
                          .value
                      ) || 0
                    )
                  }
                />
              </div>

              {formData
                .exchangesRaised !==
                formData
                  .exchangesFulfilled && (
                <div className="form-field form-field-full">
                  <label>
                    Why is the exchange not closed? *
                  </label>

                  <textarea
                    value={
                      formData
                        .exchangePendingReason
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "exchangePendingReason",
                        event.target
                          .value
                      )
                    }
                    required
                  />
                </div>
              )}

              <div className="form-field form-field-full">
                <label>
                  Remarks
                </label>

                <textarea
                  value={
                    formData
                      .remarks
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "remarks",
                      event.target
                        .value
                    )
                  }
                />
              </div>
            </div>

            <div className="store-report-total">
              Total Collection:{" "}
              <strong>
                {formatCurrency(
                  totals
                    .totalAmount
                )}
              </strong>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setIsCreateOpen(
                    false
                  )
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  isSubmitting
                }
              >
                {isSubmitting
                  ? "Submitting..."
                  : "Submit Report"}
              </button>
            </div>
          </form>
        </Modal>
      )}

     {isPreviewOpen &&
  previewReport && (
    <Modal
      title="Store Report Preview"
      onClose={() =>
        setIsPreviewOpen(false)
      }
    >
<div
  ref={reportPreviewRef}
  className="store-report-preview store-report-capture"
>
        <div className="store-preview-header">
          <div>
            <h2>
              {previewReport.storeName
                .replaceAll(
                  "_",
                  " "
                )}
            </h2>

            <p>
              Report Date:{" "}
              {new Date(
                previewReport.reportDate
              ).toLocaleDateString(
                "en-IN"
              )}
            </p>
          </div>

          <div className="store-preview-total-badge">
            <span>
              Total Collection
            </span>

            <strong>
              {formatCurrency(
                previewReport
                  .totalAmountCollected
              )}
            </strong>
          </div>
        </div>

        <div className="store-preview-section">
          <h3>
            Store Information
          </h3>

          <div className="store-preview-grid">
            <div>
              <span>
                Store Name
              </span>

              <strong>
                {previewReport.storeName
                  .replaceAll(
                    "_",
                    " "
                  )}
              </strong>
            </div>

            <div>
              <span>
                Report Date
              </span>

              <strong>
                {new Date(
                  previewReport.reportDate
                ).toLocaleDateString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div>
              <span>
                Opening Time
              </span>

              <strong>
                {
                  previewReport.openingTime
                }
              </strong>
            </div>

            <div>
              <span>
                Closing Time
              </span>

              <strong>
                {
                  previewReport.closingTime
                }
              </strong>
            </div>

            <div>
              <span>
                Total Customers
              </span>

              <strong>
                {
                  previewReport.totalCustomers
                }
              </strong>
            </div>
          </div>
        </div>

        <div className="store-preview-section">
          <div className="store-preview-section-heading">
            <h3>
              Pre-Orders
            </h3>

            <div className="store-preview-summary-inline">
              <span>
                Total Qty:{" "}
                <strong>
                  {
                    previewReport
                      .totalPreOrderQuantity
                  }
                </strong>
              </span>

              <span>
                Amount:{" "}
                <strong>
                  {formatCurrency(
                    previewReport
                      .totalPreOrderAmount
                  )}
                </strong>
              </span>
            </div>
          </div>

          {previewReport.preOrders.length >
          0 ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>School</th>
                    <th>School Code</th>
                    <th>Pre-Order Qty</th>
                    <th>
                      Amount Collected
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {previewReport.preOrders.map(
                    (
                      row,
                      index
                    ) => (
                      <tr
                        key={
                          row._id
                        }
                      >
                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {
                            row.schoolName
                          }
                        </td>

                        <td>
                          {
                            row.schoolCode
                          }
                        </td>

                        <td>
                          {
                            row.quantity
                          }
                        </td>

                        <td>
                          {formatCurrency(
                            row.amountCollected
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>

                <tfoot>
                  <tr>
                    <th
                      colSpan={3}
                    >
                      Total
                    </th>

                    <th>
                      {
                        previewReport
                          .totalPreOrderQuantity
                      }
                    </th>

                    <th>
                      {formatCurrency(
                        previewReport
                          .totalPreOrderAmount
                      )}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="store-preview-empty">
              No pre-orders entered.
            </div>
          )}
        </div>

        <div className="store-preview-section">
          <h3>
            Direct Purchase
          </h3>

          <div className="store-preview-grid">
            <div>
              <span>
                Number of Direct
                Purchases
              </span>

              <strong>
                {
                  previewReport
                    .directPurchaseQuantity
                }
              </strong>
            </div>

            <div>
              <span>
                Total Direct Purchase
                Amount
              </span>

              <strong>
                {formatCurrency(
                  previewReport
                    .directPurchaseAmount
                )}
              </strong>
            </div>

            <div>
              <span>
                Online Amount
              </span>

              <strong>
                {formatCurrency(
                  previewReport
                    .directPurchaseOnlineAmount
                )}
              </strong>
            </div>

            <div>
              <span>
                Cash Amount
              </span>

              <strong>
                {formatCurrency(
                  previewReport
                    .directPurchaseCashAmount
                )}
              </strong>
            </div>
          </div>
        </div>

        <div className="store-preview-section">
          <h3>
            Exchange Summary
          </h3>

          <div className="store-preview-grid">
            <div>
              <span>
                Exchanges Raised
              </span>

              <strong>
                {
                  previewReport
                    .exchangesRaised
                }
              </strong>
            </div>

            <div>
              <span>
                Exchanges Fulfilled
              </span>

              <strong>
                {
                  previewReport
                    .exchangesFulfilled
                }
              </strong>
            </div>

            <div>
              <span>
                Pending Exchanges
              </span>

              <strong>
                {
                  previewReport
                    .exchangesPending
                }
              </strong>
            </div>
          </div>

          {previewReport
            .exchangesPending >
            0 && (
            <div className="store-preview-reason">
              <span>
                Reason for Pending
                Exchange
              </span>

              <p>
                {previewReport
                  .exchangePendingReason ||
                  "—"}
              </p>
            </div>
          )}
        </div>

        <div className="store-preview-section">
          <h3>
            Collection Summary
          </h3>

          <div className="store-preview-grid">
            <div>
              <span>
                Pre-Order Collection
              </span>

              <strong>
                {formatCurrency(
                  previewReport
                    .totalPreOrderAmount
                )}
              </strong>
            </div>

            <div>
              <span>
                Direct Purchase
                Collection
              </span>

              <strong>
                {formatCurrency(
                  previewReport
                    .directPurchaseAmount
                )}
              </strong>
            </div>

            <div className="store-preview-total">
              <span>
                Total Amount
                Collected
              </span>

              <strong>
                {formatCurrency(
                  previewReport
                    .totalAmountCollected
                )}
              </strong>
            </div>
          </div>
        </div>

        <div className="store-preview-section">
          <h3>
            Remarks
          </h3>

          <div className="store-preview-remarks">
            {previewReport.remarks ||
              "No remarks entered."}
          </div>
        </div>

        <div
  className="form-actions store-preview-actions"
  data-html2canvas-ignore="true"
>
  <button
    type="button"
    className="secondary-button"
    onClick={() =>
      void handleDownloadReportImage()
    }
  >
    Download as Image
  </button>

  <button
    type="button"
    className="primary-button"
    onClick={() =>
      setIsPreviewOpen(
        false
      )
    }
  >
    Done
  </button>
</div>
      </div>
    </Modal>
  )}
    </section>
  );
}