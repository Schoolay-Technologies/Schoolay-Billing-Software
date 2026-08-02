import axios from "axios";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  activateCamp,
  closeCamp,
  copyPublicCampLink,
  createCamp,
  deleteCamp,
  downloadQrImage,
  getCampById,
  getCampQrCode,
  getCamps,
  sharePublicCampLink,
  updateCamp
} from "../../api/camp.api";

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
  Camp,
  CampFormInput,
  CampFormProductInput,
  CampQrData,
  CampStatus
} from "../../types/camp.types";

import type {
  Product
} from "../../types/product.types";

import type {
  ApiErrorResponse,
  Pagination,
  School
} from "../../types/school.types";

const initialPagination:
  Pagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  };

function getTodayDate(): string {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function createInitialForm():
  CampFormInput {
  return {
    campName: "",
    campCode: "",
    schoolId: "",
    startDate:
      getTodayDate(),
    endDate:
      getTodayDate(),
    status: "DRAFT",
    products: [],
    instructions: ""
  };
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

function formatDate(
  value: string
): string {
  const date =
    new Date(value);

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
      month: "short",
      year: "numeric"
    }
  );
}

function getStatusClass(
  status: CampStatus
): string {
  if (status === "ACTIVE") {
    return "status-active";
  }

  if (status === "CLOSED") {
    return "status-inactive";
  }

  return "status-draft";
}

function formatStatus(
  status: CampStatus
): string {
  return (
    status.charAt(0) +
    status
      .slice(1)
      .toLowerCase()
  );
}

function getCampSchoolId(
  camp: Camp
): string {
  return typeof camp.schoolId ===
    "string"
    ? camp.schoolId
    : camp.schoolId._id;
}

export default function CampsPage() {
  const [
    camps,
    setCamps
  ] = useState<Camp[]>([]);

  const [
    schools,
    setSchools
  ] = useState<School[]>([]);

  const [
    products,
    setProducts
  ] = useState<Product[]>([]);

  const [
    formData,
    setFormData
  ] = useState<CampFormInput>(
    createInitialForm()
  );

  const [
    pagination,
    setPagination
  ] = useState<Pagination>({
    ...initialPagination
  });

  const [
    editingCampId,
    setEditingCampId
  ] = useState<
    string | null
  >(null);

  const [
    selectedCamp,
    setSelectedCamp
  ] = useState<
    Camp | null
  >(null);

  const [
    qrData,
    setQrData
  ] = useState<
    CampQrData | null
  >(null);

  const [
    searchInput,
    setSearchInput
  ] = useState("");

  const [
    search,
    setSearch
  ] = useState("");

  const [
    schoolFilter,
    setSchoolFilter
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter
  ] = useState<
    CampStatus | ""
  >("");

  const [
    dateFrom,
    setDateFrom
  ] = useState("");

  const [
    dateTo,
    setDateTo
  ] = useState("");

  const [
    isLoading,
    setIsLoading
  ] = useState(true);

  const [
    isLoadingCamp,
    setIsLoadingCamp
  ] = useState(false);

  const [
    isLoadingProducts,
    setIsLoadingProducts
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting
  ] = useState(false);

  const [
    isUpdatingStatus,
    setIsUpdatingStatus
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting
  ] = useState(false);

  const [
    isLoadingQr,
    setIsLoadingQr
  ] = useState(false);

  const [
    isFormModalOpen,
    setIsFormModalOpen
  ] = useState(false);

  const [
    isViewModalOpen,
    setIsViewModalOpen
  ] = useState(false);

  const [
    isDeleteModalOpen,
    setIsDeleteModalOpen
  ] = useState(false);

  const [
    isStatusModalOpen,
    setIsStatusModalOpen
  ] = useState(false);

  const [
    nextStatus,
    setNextStatus
  ] = useState<
    "ACTIVE" | "CLOSED" | null
  >(null);

  const [
    isQrModalOpen,
    setIsQrModalOpen
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

        setSchools(
          result.data
        );
      } catch (error) {
        setNotification({
          type: "error",
          message:
            getErrorMessage(error)
        });
      }
    }, []);

  const loadCamps =
    useCallback(async () => {
      try {
        setIsLoading(true);

        const result =
          await getCamps({
            search:
              search || undefined,

            schoolId:
              schoolFilter ||
              undefined,

            status:
              statusFilter,

            dateFrom:
              dateFrom ||
              undefined,

            dateTo:
              dateTo ||
              undefined,

            page:
              pagination.page,

            limit:
              pagination.limit
          });

        setCamps(result.data);

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
      statusFilter,
      dateFrom,
      dateTo,
      pagination.page,
      pagination.limit
    ]);

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  useEffect(() => {
    void loadCamps();
  }, [loadCamps]);

  async function loadProductsForSchool(
    schoolId: string
  ): Promise<Product[]> {
    if (!schoolId) {
      setProducts([]);
      return [];
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

      setProducts(
        result.data
      );

      return result.data;
    } catch (error) {
      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
      });

      setProducts([]);

      return [];
    } finally {
      setIsLoadingProducts(false);
    }
  }

  function resetForm(): void {
    setFormData(
      createInitialForm()
    );

    setProducts([]);
    setEditingCampId(null);
  }

  function openCreateModal(): void {
    resetForm();
    setNotification(null);
    setIsFormModalOpen(true);
  }

  async function openEditModal(
    campId: string
  ): Promise<void> {
    try {
      setIsLoadingCamp(true);
      setIsFormModalOpen(true);

      const result =
        await getCampById(
          campId
        );

      const camp =
        result.data;

      const schoolId =
        getCampSchoolId(camp);

      await loadProductsForSchool(
        schoolId
      );

      setEditingCampId(
        camp._id
      );

      setFormData({
        campName:
          camp.campName,

        campCode:
          camp.campCode,

        schoolId,

        startDate:
          new Date(
            camp.startDate
          )
            .toISOString()
            .slice(0, 10),

        endDate:
          new Date(
            camp.endDate
          )
            .toISOString()
            .slice(0, 10),

        status:
          camp.status,

        products:
          camp.products.map(
            (product) => ({
              productId:
                product.productId,

              variants:
                product.variants.map(
                  (variant) => ({
                    variantId:
                      variant.variantId
                  })
                )
            })
          ),

        instructions:
          camp.instructions ?? ""
      });
    } catch (error) {
      setIsFormModalOpen(false);

      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
      });
    } finally {
      setIsLoadingCamp(false);
    }
  }

  async function openViewModal(
    campId: string
  ): Promise<void> {
    try {
      setSelectedCamp(null);
      setIsViewModalOpen(true);
      setIsLoadingCamp(true);

      const result =
        await getCampById(
          campId
        );

      setSelectedCamp(
        result.data
      );
    } catch (error) {
      setIsViewModalOpen(false);

      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
      });
    } finally {
      setIsLoadingCamp(false);
    }
  }

  async function openQrModal(
    camp: Camp
  ): Promise<void> {
    try {
      setQrData(null);
      setSelectedCamp(camp);
      setIsQrModalOpen(true);
      setIsLoadingQr(true);

      const result =
        await getCampQrCode(
          camp._id
        );

      setQrData(
        result.data
      );
    } catch (error) {
      setIsQrModalOpen(false);

      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
      });
    } finally {
      setIsLoadingQr(false);
    }
  }

  function updateFormField<
    Key extends keyof CampFormInput
  >(
    field: Key,
    value:
      CampFormInput[Key]
  ): void {
    setFormData(
      (current) => ({
        ...current,
        [field]: value
      })
    );
  }

  async function handleSchoolChange(
    schoolId: string
  ): Promise<void> {
    setFormData(
      (current) => ({
        ...current,
        schoolId,
        products: []
      })
    );

    await loadProductsForSchool(
      schoolId
    );
  }

  function isProductSelected(
    productId: string
  ): boolean {
    return formData.products.some(
      (product) =>
        product.productId ===
        productId
    );
  }

  function getSelectedProduct(
    productId: string
  ):
    | CampFormProductInput
    | undefined {
    return formData.products.find(
      (product) =>
        product.productId ===
        productId
    );
  }

  function toggleProduct(
    product: Product
  ): void {
    const alreadySelected =
      isProductSelected(
        product._id
      );

    setFormData(
      (current) => {
        if (alreadySelected) {
          return {
            ...current,

            products:
              current.products.filter(
                (selectedProduct) =>
                  selectedProduct.productId !==
                  product._id
              )
          };
        }

        return {
          ...current,

          products: [
            ...current.products,
            {
              productId:
                product._id,

              variants: []
            }
          ]
        };
      }
    );
  }

  function isVariantSelected(
    productId: string,
    variantId: string
  ): boolean {
    const selectedProduct =
      getSelectedProduct(
        productId
      );

    return Boolean(
      selectedProduct?.variants.some(
        (variant) =>
          variant.variantId ===
          variantId
      )
    );
  }

  function toggleVariant(
    productId: string,
    variantId: string
  ): void {
    setFormData(
      (current) => ({
        ...current,

        products:
          current.products.map(
            (product) => {
              if (
                product.productId !==
                productId
              ) {
                return product;
              }

              const exists =
                product.variants.some(
                  (variant) =>
                    variant.variantId ===
                    variantId
                );

              return {
                ...product,

                variants: exists
                  ? product.variants.filter(
                      (variant) =>
                        variant.variantId !==
                        variantId
                    )
                  : [
                      ...product.variants,
                      {
                        variantId
                      }
                    ]
              };
            }
          )
      })
    );
  }

  function selectAllVariants(
    product: Product
  ): void {
    const activeVariants =
      product.variants.filter(
        (variant) =>
          variant.status ===
          "ACTIVE"
      );

    setFormData(
      (current) => ({
        ...current,

        products:
          current.products.map(
            (selectedProduct) =>
              selectedProduct.productId ===
              product._id
                ? {
                    ...selectedProduct,

                    variants:
                      activeVariants.map(
                        (variant) => ({
                          variantId:
                            variant._id
                        })
                      )
                  }
                : selectedProduct
          )
      })
    );
  }

  function clearAllVariants(
    productId: string
  ): void {
    setFormData(
      (current) => ({
        ...current,

        products:
          current.products.map(
            (selectedProduct) =>
              selectedProduct.productId ===
              productId
                ? {
                    ...selectedProduct,
                    variants: []
                  }
                : selectedProduct
          )
      })
    );
  }

  function validateForm():
    string | null {
    if (
      !formData.campName.trim()
    ) {
      return "Enter the camp name.";
    }

    if (
      !formData.campCode.trim()
    ) {
      return "Enter the camp code.";
    }

    if (!formData.schoolId) {
      return "Select a school.";
    }

    if (!formData.startDate) {
      return "Select the start date.";
    }

    if (!formData.endDate) {
      return "Select the end date.";
    }

    if (
      new Date(
        formData.endDate
      ).getTime() <
      new Date(
        formData.startDate
      ).getTime()
    ) {
      return "End date cannot be before the start date.";
    }

    if (
      formData.products.length ===
      0
    ) {
      return "Select at least one product.";
    }

    for (
      const selectedProduct of
      formData.products
    ) {
      const product =
        products.find(
          (currentProduct) =>
            currentProduct._id ===
            selectedProduct.productId
        );

      if (
        selectedProduct.variants
          .length === 0
      ) {
        return `Select at least one size for ${
          product?.productName ??
          "every product"
        }.`;
      }
    }

    return null;
  }

  async function submitForm(
    event:
      FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setNotification({
        type: "error",
        message:
          validationError
      });

      return;
    }

    const payload:
      CampFormInput = {
      ...formData,

      campName:
        formData.campName.trim(),

      campCode:
        formData.campCode
          .trim()
          .toUpperCase(),

      instructions:
        formData.instructions.trim()
    };

    try {
      setIsSubmitting(true);
      setNotification(null);

      if (editingCampId) {
        await updateCamp(
          editingCampId,
          payload
        );

        setNotification({
          type: "success",
          message:
            "Camp updated successfully."
        });
      } else {
        await createCamp(
          payload
        );

        setNotification({
          type: "success",
          message:
            "Camp created successfully."
        });
      }

      setIsFormModalOpen(false);
      resetForm();

      if (
        pagination.page !== 1
      ) {
        setPagination(
          (current) => ({
            ...current,
            page: 1
          })
        );
      } else {
        await loadCamps();
      }
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

  function openStatusModal(
    camp: Camp,
    status:
      | "ACTIVE"
      | "CLOSED"
  ): void {
    setSelectedCamp(camp);
    setNextStatus(status);
    setIsStatusModalOpen(true);
  }

  async function confirmStatusChange():
    Promise<void> {
    if (
      !selectedCamp ||
      !nextStatus
    ) {
      return;
    }

    try {
      setIsUpdatingStatus(true);

      if (
        nextStatus ===
        "ACTIVE"
      ) {
        await activateCamp(
          selectedCamp._id
        );
      } else {
        await closeCamp(
          selectedCamp._id
        );
      }

      setNotification({
        type: "success",

        message:
          nextStatus ===
          "ACTIVE"
            ? "Camp activated successfully."
            : "Camp closed successfully."
      });

      setIsStatusModalOpen(false);
      setSelectedCamp(null);
      setNextStatus(null);

      await loadCamps();
    } catch (error) {
      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function openDeleteModal(
    camp: Camp
  ): void {
    setSelectedCamp(camp);
    setIsDeleteModalOpen(true);
  }

  async function confirmDelete():
    Promise<void> {
    if (!selectedCamp) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteCamp(
        selectedCamp._id
      );

      setNotification({
        type: "success",
        message:
          "Camp deleted successfully."
      });

      setIsDeleteModalOpen(false);
      setSelectedCamp(null);

      await loadCamps();
    } catch (error) {
      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function applyFilters(
    event:
      FormEvent<HTMLFormElement>
  ): void {
    event.preventDefault();

    setSearch(
      searchInput.trim()
    );

    setPagination(
      (current) => ({
        ...current,
        page: 1
      })
    );
  }

  function resetFilters(): void {
    setSearchInput("");
    setSearch("");
    setSchoolFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");

    setPagination(
      (current) => ({
        ...current,
        page: 1
      })
    );
  }

  const selectedProductCount =
    formData.products.length;

  const selectedSizeCount =
    useMemo(
      () =>
        formData.products.reduce(
          (
            total,
            product
          ) =>
            total +
            product.variants.length,
          0
        ),
      [formData.products]
    );

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>
            School Camps
          </h1>

          <p>
            Configure products and
            sizes, generate QR codes and
            receive parent orders through
            the existing invoice workflow.
          </p>
        </div>

        <div className="page-heading-actions">
          <button
            type="button"
            className="primary-button"
            onClick={
              openCreateModal
            }
          >
            + Create Camp
          </button>
        </div>
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
            setNotification(null)
          }
        />
      )}

      <div className="content-card">
        <form
          className="filter-section camp-filter-section"
          onSubmit={
            applyFilters
          }
        >
          <div className="search-group">
            <input
              type="search"
              value={
                searchInput
              }
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Camp name, code or school"
            />

            <button
              type="submit"
              className="secondary-button"
            >
              Search
            </button>
          </div>

          <select
            value={
              schoolFilter
            }
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

            {schools.map(
              (school) => (
                <option
                  key={
                    school._id
                  }
                  value={
                    school._id
                  }
                >
                  {
                    school.schoolName
                  }
                </option>
              )
            )}
          </select>

          <select
            value={
              statusFilter
            }
            onChange={(event) => {
              setStatusFilter(
                event.target
                  .value as
                  | CampStatus
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
              All statuses
            </option>

            <option value="DRAFT">
              Draft
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="CLOSED">
              Closed
            </option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(event) =>
              setDateFrom(
                event.target.value
              )
            }
            title="From date"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(event) =>
              setDateTo(
                event.target.value
              )
            }
            title="To date"
          />

          <button
            type="button"
            className="secondary-button"
            onClick={
              resetFilters
            }
          >
            Reset
          </button>
        </form>

        {isLoading ? (
          <LoadingSpinner message="Loading camps..." />
        ) : camps.length === 0 ? (
          <div className="empty-state">
            <h3>
              No camps found
            </h3>

            <p>
              Create a camp and choose
              the products and sizes that
              parents can order.
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table camp-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Camp</th>
                    <th>School</th>
                    <th>Dates</th>
                    <th>Products</th>
                    <th>Orders</th>
                    <th>Status</th>
                    <th>QR</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {camps.map(
                    (
                      camp,
                      index
                    ) => (
                      <tr
                        key={
                          camp._id
                        }
                      >
                        <td>
                          {(pagination.page -
                            1) *
                            pagination.limit +
                            index +
                            1}
                        </td>

                        <td>
                          <div className="school-name-cell">
                            <strong>
                              {
                                camp.campName
                              }
                            </strong>

                            <span>
                              {
                                camp.campCode
                              }
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="school-name-cell">
                            <strong>
                              {
                                camp.schoolCode
                              }
                            </strong>

                            <span>
                              {
                                camp.schoolName
                              }
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="camp-date-cell">
                            <span>
                              {formatDate(
                                camp.startDate
                              )}
                            </span>

                            <span>
                              to
                            </span>

                            <span>
                              {formatDate(
                                camp.endDate
                              )}
                            </span>
                          </div>
                        </td>

                        <td>
                          <strong>
                            {
                              camp.products
                                .length
                            }
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {
                              camp.orderCount
                            }
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`status-badge ${getStatusClass(
                              camp.status
                            )}`}
                          >
                            {formatStatus(
                              camp.status
                            )}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="invoice-action-button"
                            onClick={() =>
                              void openQrModal(
                                camp
                              )
                            }
                          >
                            View QR
                          </button>
                        </td>

                        <td>
                          <div className="invoice-actions camp-actions">
                            <button
                              type="button"
                              className="invoice-action-button"
                              onClick={() =>
                                void openViewModal(
                                  camp._id
                                )
                              }
                            >
                              View
                            </button>

                            {camp.status !==
                              "CLOSED" && (
                              <button
                                type="button"
                                className="invoice-action-button"
                                onClick={() =>
                                  void openEditModal(
                                    camp._id
                                  )
                                }
                              >
                                Edit
                              </button>
                            )}

                            {camp.status ===
                              "DRAFT" && (
                              <button
                                type="button"
                                className="invoice-action-button"
                                onClick={() =>
                                  openStatusModal(
                                    camp,
                                    "ACTIVE"
                                  )
                                }
                              >
                                Activate
                              </button>
                            )}

                            {camp.status ===
                              "ACTIVE" && (
                              <button
                                type="button"
                                className="invoice-action-button"
                                onClick={() =>
                                  openStatusModal(
                                    camp,
                                    "CLOSED"
                                  )
                                }
                              >
                                Close
                              </button>
                            )}

                            {camp.status ===
                              "DRAFT" &&
                              camp.orderCount ===
                                0 && (
                              <button
                                type="button"
                                className="invoice-action-button invoice-action-danger"
                                onClick={() =>
                                  openDeleteModal(
                                    camp
                                  )
                                }
                              >
                                Delete
                              </button>
                            )}
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
                Showing{" "}
                {camps.length} of{" "}
                {pagination.total} camps
              </p>

              <div className="pagination-buttons">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={
                    pagination.page <=
                    1
                  }
                  onClick={() =>
                    setPagination(
                      (current) => ({
                        ...current,
                        page:
                          current.page -
                          1
                      })
                    )
                  }
                >
                  Previous
                </button>

                <span>
                  Page{" "}
                  {pagination.page} of{" "}
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
                          current.page +
                          1
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

      {isFormModalOpen && (
        <Modal
          title={
            editingCampId
              ? "Edit Camp"
              : "Create Camp"
          }
          onClose={() => {
            if (!isSubmitting) {
              setIsFormModalOpen(
                false
              );

              resetForm();
            }
          }}
        >
          {isLoadingCamp ? (
            <LoadingSpinner message="Loading camp..." />
          ) : (
            <form
              onSubmit={(event) =>
                void submitForm(
                  event
                )
              }
            >
              <div className="camp-form-section">
                <h3>
                  Camp Details
                </h3>

                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="campName">
                      Camp Name{" "}
                      <span>*</span>
                    </label>

                    <input
                      id="campName"
                      value={
                        formData.campName
                      }
                      onChange={(event) =>
                        updateFormField(
                          "campName",
                          event.target
                            .value
                        )
                      }
                      placeholder="NCFE Uniform Camp 2026"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="campCode">
                      Camp Code{" "}
                      <span>*</span>
                    </label>

                    <input
                      id="campCode"
                      value={
                        formData.campCode
                      }
                      onChange={(event) =>
                        updateFormField(
                          "campCode",
                          event.target
                            .value
                            .toUpperCase()
                        )
                      }
                      placeholder="NCFE-2026-01"
                      required
                    />
                  </div>

                  <div className="form-field form-field-full">
                    <label htmlFor="campSchool">
                      School{" "}
                      <span>*</span>
                    </label>

                    <select
                      id="campSchool"
                      value={
                        formData.schoolId
                      }
                      onChange={(event) =>
                        void handleSchoolChange(
                          event.target
                            .value
                        )
                      }
                      required
                    >
                      <option value="">
                        Select school
                      </option>

                      {schools.map(
                        (school) => (
                          <option
                            key={
                              school._id
                            }
                            value={
                              school._id
                            }
                          >
                            {
                              school.schoolName
                            }{" "}
                            (
                            {
                              school.schoolCode
                            }
                            )
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="campStartDate">
                      Start Date{" "}
                      <span>*</span>
                    </label>

                    <input
                      id="campStartDate"
                      type="date"
                      value={
                        formData.startDate
                      }
                      onChange={(event) =>
                        updateFormField(
                          "startDate",
                          event.target
                            .value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="campEndDate">
                      End Date{" "}
                      <span>*</span>
                    </label>

                    <input
                      id="campEndDate"
                      type="date"
                      value={
                        formData.endDate
                      }
                      onChange={(event) =>
                        updateFormField(
                          "endDate",
                          event.target
                            .value
                        )
                      }
                      min={
                        formData.startDate
                      }
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="campStatus">
                      Initial Status
                    </label>

                    <select
                      id="campStatus"
                      value={
                        formData.status
                      }
                      disabled={
                        editingCampId !==
                          null &&
                        formData.status ===
                          "CLOSED"
                      }
                      onChange={(event) =>
                        updateFormField(
                          "status",
                          event.target
                            .value as CampStatus
                        )
                      }
                    >
                      <option value="DRAFT">
                        Draft
                      </option>

                      <option value="ACTIVE">
                        Active
                      </option>

                      {editingCampId && (
                        <option value="CLOSED">
                          Closed
                        </option>
                      )}
                    </select>
                  </div>

                  <div className="form-field form-field-full">
                    <label htmlFor="campInstructions">
                      Instructions
                    </label>

                    <textarea
                      id="campInstructions"
                      rows={3}
                      value={
                        formData.instructions
                      }
                      onChange={(event) =>
                        updateFormField(
                          "instructions",
                          event.target
                            .value
                        )
                      }
                      placeholder="Instructions shown to parents on the public order form"
                    />
                  </div>
                </div>
              </div>

              <div className="camp-form-section">
                <div className="camp-section-heading">
                  <div>
                    <h3>
                      Products and Sizes
                    </h3>

                    <p>
                      Select existing
                      products and the
                      sizes parents can
                      order.
                    </p>
                  </div>

                  <div className="camp-selection-summary">
                    <span>
                      {
                        selectedProductCount
                      }{" "}
                      products
                    </span>

                    <span>
                      {
                        selectedSizeCount
                      }{" "}
                      sizes
                    </span>
                  </div>
                </div>

                {!formData.schoolId ? (
                  <div className="camp-product-empty">
                    Select a school to
                    load its products.
                  </div>
                ) : isLoadingProducts ? (
                  <LoadingSpinner message="Loading school products..." />
                ) : products.length ===
                  0 ? (
                  <div className="camp-product-empty">
                    No active products
                    were found for the
                    selected school.
                  </div>
                ) : (
                  <div className="camp-product-list">
                    {products.map(
                      (product) => {
                        const selected =
                          isProductSelected(
                            product._id
                          );

                        const activeVariants =
                          product.variants.filter(
                            (variant) =>
                              variant.status ===
                              "ACTIVE"
                          );

                        return (
                          <article
                            className={`camp-product-card ${
                              selected
                                ? "camp-product-card-selected"
                                : ""
                            }`}
                            key={
                              product._id
                            }
                          >
                            <div className="camp-product-header">
                              <label className="camp-product-checkbox">
                                <input
                                  type="checkbox"
                                  checked={
                                    selected
                                  }
                                  onChange={() =>
                                    toggleProduct(
                                      product
                                    )
                                  }
                                />

                                <span>
                                  <strong>
                                    {
                                      product.productName
                                    }
                                  </strong>

                                  <small>
                                    {
                                      product.productCode
                                    }{" "}
                                    ·{" "}
                                    {
                                      product.gender
                                    }
                                  </small>
                                </span>
                              </label>

                              {selected && (
                                <div className="camp-size-shortcuts">
                                  <button
                                    type="button"
                                    className="text-button"
                                    onClick={() =>
                                      selectAllVariants(
                                        product
                                      )
                                    }
                                  >
                                    Select All
                                  </button>

                                  <button
                                    type="button"
                                    className="text-button"
                                    onClick={() =>
                                      clearAllVariants(
                                        product._id
                                      )
                                    }
                                  >
                                    Clear
                                  </button>
                                </div>
                              )}
                            </div>

                            {selected && (
                              <div className="camp-size-grid">
                                {activeVariants.map(
                                  (
                                    variant
                                  ) => (
                                    <label
                                      className={`camp-size-option ${
                                        isVariantSelected(
                                          product._id,
                                          variant._id
                                        )
                                          ? "camp-size-option-selected"
                                          : ""
                                      }`}
                                      key={
                                        variant._id
                                      }
                                    >
                                      <input
                                        type="checkbox"
                                        checked={
                                          isVariantSelected(
                                            product._id,
                                            variant._id
                                          )
                                        }
                                        onChange={() =>
                                          toggleVariant(
                                            product._id,
                                            variant._id
                                          )
                                        }
                                      />

                                      <span>
                                        {
                                          variant.size
                                        }
                                      </span>
                                    </label>
                                  )
                                )}
                              </div>
                            )}
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={
                    isSubmitting
                  }
                  onClick={() => {
                    setIsFormModalOpen(
                      false
                    );

                    resetForm();
                  }}
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
                    ? "Saving..."
                    : editingCampId
                      ? "Update Camp"
                      : "Create Camp"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {isViewModalOpen && (
        <Modal
          title="Camp Details"
          onClose={() =>
            setIsViewModalOpen(
              false
            )
          }
        >
          {isLoadingCamp ||
          !selectedCamp ? (
            <LoadingSpinner message="Loading camp..." />
          ) : (
            <div>
              <div className="camp-view-header">
                <div>
                  <h2>
                    {
                      selectedCamp.campName
                    }
                  </h2>

                  <p>
                    {
                      selectedCamp.campCode
                    }
                  </p>
                </div>

                <span
                  className={`status-badge ${getStatusClass(
                    selectedCamp.status
                  )}`}
                >
                  {formatStatus(
                    selectedCamp.status
                  )}
                </span>
              </div>

              <div className="camp-view-grid">
                <div>
                  <span>
                    School
                  </span>

                  <strong>
                    {
                      selectedCamp.schoolName
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    School Code
                  </span>

                  <strong>
                    {
                      selectedCamp.schoolCode
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Start Date
                  </span>

                  <strong>
                    {formatDate(
                      selectedCamp.startDate
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    End Date
                  </span>

                  <strong>
                    {formatDate(
                      selectedCamp.endDate
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Products
                  </span>

                  <strong>
                    {
                      selectedCamp.products
                        .length
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Orders Received
                  </span>

                  <strong>
                    {
                      selectedCamp.orderCount
                    }
                  </strong>
                </div>
              </div>

              {selectedCamp.instructions && (
                <div className="camp-instructions-box">
                  <strong>
                    Instructions
                  </strong>

                  <p>
                    {
                      selectedCamp.instructions
                    }
                  </p>
                </div>
              )}

              <h3>
                Available Products and
                Sizes
              </h3>

              <div className="camp-view-products">
                {selectedCamp.products.map(
                  (product) => (
                    <article
                      className="camp-view-product-card"
                      key={
                        product.productId
                      }
                    >
                      <div>
                        <strong>
                          {
                            product.productName
                          }
                        </strong>

                        <span>
                          {
                            product.productCode
                          }{" "}
                          ·{" "}
                          {
                            product.gender
                          }
                        </span>
                      </div>

                      <div className="camp-view-sizes">
                        {product.variants.map(
                          (variant) => (
                            <span
                              key={
                                variant.variantId
                              }
                            >
                              {
                                variant.size
                              }
                            </span>
                          )
                        )}
                      </div>
                    </article>
                  )
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {isQrModalOpen && (
        <Modal
          title="Camp QR Code"
          onClose={() =>
            setIsQrModalOpen(
              false
            )
          }
        >
          {isLoadingQr ||
          !qrData ? (
            <LoadingSpinner message="Generating QR code..." />
          ) : (
            <div className="camp-qr-content">
              <div className="camp-qr-heading">
                <h3>
                  {
                    qrData.campName
                  }
                </h3>

                <p>
                  {
                    qrData.campCode
                  }
                </p>
              </div>

              <img
                src={
                  qrData.qrCodeDataUrl
                }
                alt={`QR code for ${qrData.campName}`}
                className="camp-qr-image"
              />

              <div className="camp-public-url-box">
                <label>
                  Public Order Link
                </label>

                <input
                  value={
                    qrData.publicUrl
                  }
                  readOnly
                />
              </div>

              <div className="camp-qr-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    void copyPublicCampLink(
                      qrData.publicUrl
                    ).then(() => {
                      setNotification({
                        type: "success",
                        message:
                          "Public link copied."
                      });
                    })
                  }
                >
                  Copy Link
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    void sharePublicCampLink(
                      qrData.campName,
                      qrData.publicUrl
                    ).then(
                      (shared) => {
                        if (!shared) {
                          setNotification({
                            type: "error",
                            message:
                              "Sharing is not supported on this device. Use Copy Link instead."
                          });
                        }
                      }
                    )
                  }
                >
                  Share
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    void downloadQrImage(
                      qrData.qrCodeDataUrl,
                      qrData.campCode
                    )
                  }
                >
                  Download QR
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {isStatusModalOpen &&
        selectedCamp &&
        nextStatus && (
        <Modal
          title={
            nextStatus ===
            "ACTIVE"
              ? "Activate Camp"
              : "Close Camp"
          }
          onClose={() => {
            if (
              !isUpdatingStatus
            ) {
              setIsStatusModalOpen(
                false
              );
            }
          }}
        >
          <p>
            {nextStatus ===
            "ACTIVE"
              ? "Activate"
              : "Close"}{" "}
            <strong>
              {
                selectedCamp.campName
              }
            </strong>
            ?
          </p>

          <p>
            {nextStatus ===
            "ACTIVE"
              ? "Parents will be able to access the public link and submit orders during the configured dates."
              : "Parents will no longer be able to submit new orders through this camp link."}
          </p>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={
                isUpdatingStatus
              }
              onClick={() =>
                setIsStatusModalOpen(
                  false
                )
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className={
                nextStatus ===
                "ACTIVE"
                  ? "primary-button"
                  : "danger-button"
              }
              disabled={
                isUpdatingStatus
              }
              onClick={() =>
                void confirmStatusChange()
              }
            >
              {isUpdatingStatus
                ? "Updating..."
                : nextStatus ===
                    "ACTIVE"
                  ? "Activate Camp"
                  : "Close Camp"}
            </button>
          </div>
        </Modal>
      )}

      {isDeleteModalOpen &&
        selectedCamp && (
        <Modal
          title="Delete Camp"
          onClose={() => {
            if (!isDeleting) {
              setIsDeleteModalOpen(
                false
              );
            }
          }}
        >
          <p>
            Delete{" "}
            <strong>
              {
                selectedCamp.campName
              }
            </strong>
            ?
          </p>

          <p>
            This can only be done before
            any parent orders have been
            submitted.
          </p>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={
                isDeleting
              }
              onClick={() =>
                setIsDeleteModalOpen(
                  false
                )
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="danger-button"
              disabled={
                isDeleting
              }
              onClick={() =>
                void confirmDelete()
              }
            >
              {isDeleting
                ? "Deleting..."
                : "Delete Camp"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}