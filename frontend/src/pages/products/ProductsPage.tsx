import axios from "axios";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  createProduct,
  getProducts,
  updateProductStatus
} from "../../api/product.api";

import { getSchools } from "../../api/school.api";

import Alert from "../../components/common/Alert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";

import type {
  ApiErrorResponse,
  Pagination,
  School
} from "../../types/school.types";

import type {
  CreateProductInput,
  Product,
  ProductGender,
  ProductStatus,
  ProductVariantInput
} from "../../types/product.types";

const emptyVariant: ProductVariantInput = {
  size: "",
  unitPrice: 0,
  gstPercentage: 5,
  status: "ACTIVE"
};

const initialFormData: CreateProductInput = {
  schoolId: "",
  productName: "",
  gender: "UNISEX",
  variants: [
    {
      ...emptyVariant
    }
  ],
  status: "ACTIVE"
};

function calculateGst(
  unitPrice: number,
  gstPercentage: number
): number {
  return Math.round(
    ((unitPrice * gstPercentage) / 100 +
      Number.EPSILON) *
      100
  ) / 100;
}

function calculateSellingPrice(
  unitPrice: number,
  gstPercentage: number
): number {
  return Math.round(
    (unitPrice +
      calculateGst(unitPrice, gstPercentage) +
      Number.EPSILON) *
      100
  ) / 100;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(value);
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const responseData = error.response?.data;

    if (responseData?.errors?.length) {
      return responseData.errors
        .map((item) => item.message)
        .join(", ");
    }

    return responseData?.message ?? "The request failed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [schools, setSchools] = useState<School[]>([]);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [schoolFilter, setSchoolFilter] =
    useState("");

  const [genderFilter, setGenderFilter] =
    useState<ProductGender | "">("");

  const [statusFilter, setStatusFilter] =
    useState<ProductStatus | "">("");

  const [formData, setFormData] =
    useState<CreateProductInput>(
      structuredClone(initialFormData)
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [updatingProductId, setUpdatingProductId] =
    useState<string | null>(null);

  const [notification, setNotification] =
    useState<{
      type: "success" | "error";
      message: string;
    } | null>(null);

  const activeSchools = useMemo(
    () =>
      schools.filter(
        (school) => school.status === "ACTIVE"
      ),
    [schools]
  );

  const loadSchools = useCallback(async () => {
    try {
      const result = await getSchools({
        status: "ACTIVE",
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

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);

      const result = await getProducts({
        search: search || undefined,
        schoolId: schoolFilter || undefined,
        gender: genderFilter,
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit
      });

      setProducts(result.data);
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
    schoolFilter,
    genderFilter,
    statusFilter,
    pagination.page,
    pagination.limit
  ]);

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  function resetForm() {
    setFormData(
      structuredClone(initialFormData)
    );
  }

  function handleMainInputChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setFormData((currentValue) => ({
      ...currentValue,
      [name]: value
    }));
  }

  function handleVariantChange(
    index: number,
    field: keyof ProductVariantInput,
    value: string
  ) {
    setFormData((currentValue) => {
      const variants = currentValue.variants.map(
        (variant, variantIndex) => {
          if (variantIndex !== index) {
            return variant;
          }

          if (
            field === "unitPrice" ||
            field === "gstPercentage"
          ) {
            return {
              ...variant,
              [field]:
                value === "" ? 0 : Number(value)
            };
          }

          return {
            ...variant,
            [field]: value
          };
        }
      );

      return {
        ...currentValue,
        variants
      };
    });
  }

  function addVariantRow() {
    setFormData((currentValue) => ({
      ...currentValue,
      variants: [
        ...currentValue.variants,
        {
          ...emptyVariant
        }
      ]
    }));
  }

  function removeVariantRow(index: number) {
    setFormData((currentValue) => {
      if (currentValue.variants.length === 1) {
        return currentValue;
      }

      return {
        ...currentValue,
        variants:
          currentValue.variants.filter(
            (_, variantIndex) =>
              variantIndex !== index
          )
      };
    });
  }

  async function handleCreateProduct(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setNotification(null);

      const cleanedVariants =
        formData.variants.map((variant) => ({
          ...variant,
          size: variant.size
            .trim()
            .toUpperCase()
        }));

      await createProduct({
        ...formData,
        productName:
          formData.productName.trim(),
        variants: cleanedVariants
      });

      resetForm();
      setIsModalOpen(false);

      setPagination((currentValue) => ({
        ...currentValue,
        page: 1
      }));

      setNotification({
        type: "success",
        message: "Product created successfully."
      });

      await loadProducts();
    } catch (error) {
      setNotification({
        type: "error",
        message: getErrorMessage(error)
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(
    product: Product
  ) {
    const newStatus: ProductStatus =
      product.status === "ACTIVE"
        ? "INACTIVE"
        : "ACTIVE";

    try {
      setUpdatingProductId(product._id);

      await updateProductStatus(
        product._id,
        newStatus
      );

      setNotification({
        type: "success",
        message: `${product.productName} marked as ${newStatus.toLowerCase()}.`
      });

      await loadProducts();
    } catch (error) {
      setNotification({
        type: "error",
        message: getErrorMessage(error)
      });
    } finally {
      setUpdatingProductId(null);
    }
  }

  function handleSearchSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPagination((currentValue) => ({
      ...currentValue,
      page: 1
    }));

    setSearch(searchInput.trim());
  }

  function clearFilters() {
    setSearch("");
    setSearchInput("");
    setSchoolFilter("");
    setGenderFilter("");
    setStatusFilter("");

    setPagination((currentValue) => ({
      ...currentValue,
      page: 1
    }));
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Products</h1>
          <p>
            Create school-wise products and size-based
            pricing
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          + Add Product
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

      <div className="content-card">
        <form
          className="filter-section product-filters"
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
              placeholder="Search product, code or SKU"
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

              setPagination((current) => ({
                ...current,
                page: 1
              }));
            }}
          >
            <option value="">
              All schools
            </option>

            {activeSchools.map((school) => (
              <option
                key={school._id}
                value={school._id}
              >
                {school.schoolName}
              </option>
            ))}
          </select>

          <select
            value={genderFilter}
            onChange={(event) => {
              setGenderFilter(
                event.target.value as
                  | ProductGender
                  | ""
              );

              setPagination((current) => ({
                ...current,
                page: 1
              }));
            }}
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

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target.value as
                  | ProductStatus
                  | ""
              );

              setPagination((current) => ({
                ...current,
                page: 1
              }));
            }}
          >
            <option value="">
              All statuses
            </option>
            <option value="ACTIVE">
              Active
            </option>
            <option value="INACTIVE">
              Inactive
            </option>
          </select>

          <button
            type="button"
            className="text-button"
            onClick={clearFilters}
          >
            Clear
          </button>
        </form>

        {isLoading ? (
          <LoadingSpinner message="Loading products..." />
        ) : products.length === 0 ? (
          <div className="empty-state">
            <h3>No products found</h3>
            <p>
              Create a product under an active
              school.
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
                    <th>School</th>
                    <th>Product</th>
                    <th>Code</th>
                    <th>Gender</th>
                    <th>Sizes</th>
                    <th>Price Range</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map(
                    (product, index) => {
                      const sellingPrices =
                        product.variants.map(
                          (variant) =>
                            variant.sellingPrice
                        );

                      const minimumPrice =
                        Math.min(
                          ...sellingPrices
                        );

                      const maximumPrice =
                        Math.max(
                          ...sellingPrices
                        );

                      return (
                        <tr key={product._id}>
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
                                product.schoolId
                                  .schoolCode
                              }
                            </strong>
                            <div>
                              {
                                product.schoolId
                                  .schoolName
                              }
                            </div>
                          </td>

                          <td>
                            <strong>
                              {
                                product.productName
                              }
                            </strong>
                          </td>

                          <td>
                            <span className="code-badge">
                              {
                                product.productCode
                              }
                            </span>
                          </td>

                          <td>
                            {product.gender}
                          </td>

                          <td>
                            <div className="size-list">
                              {product.variants.map(
                                (variant) => (
                                  <span
                                    key={
                                      variant._id ??
                                      variant.sku
                                    }
                                    className="size-badge"
                                  >
                                    {variant.size}
                                  </span>
                                )
                              )}
                            </div>
                          </td>

                          <td>
                            {minimumPrice ===
                            maximumPrice
                              ? formatCurrency(
                                  minimumPrice
                                )
                              : `${formatCurrency(
                                  minimumPrice
                                )} – ${formatCurrency(
                                  maximumPrice
                                )}`}
                          </td>

                          <td>
                            <span
                              className={`status-badge ${
                                product.status ===
                                "ACTIVE"
                                  ? "status-active"
                                  : "status-inactive"
                              }`}
                            >
                              {product.status}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="table-action-button"
                              disabled={
                                updatingProductId ===
                                product._id
                              }
                              onClick={() =>
                                void handleStatusChange(
                                  product
                                )
                              }
                            >
                              {updatingProductId ===
                              product._id
                                ? "Updating..."
                                : product.status ===
                                    "ACTIVE"
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-card-view">
              {products.map((product) => {
                const sellingPrices =
                  product.variants.map(
                    (variant) =>
                      variant.sellingPrice
                  );

                const minimumPrice =
                  Math.min(
                    ...sellingPrices
                  );

                const maximumPrice =
                  Math.max(
                    ...sellingPrices
                  );

                return (
                  <div className="data-card product-card" key={product._id}>
                    <div className="data-card-header">
                      <div>
                        <div className="product-name">{product.productName}</div>
                        <div className="product-code">{product.productCode}</div>
                      </div>
                      <span
                        className={`badge status-badge ${
                          product.status === "ACTIVE"
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        {product.status}
                      </span>
                    </div>

                    <div className="data-card-item">
                      <span className="label">School</span>
                      <span className="value">{product.schoolId.schoolName}</span>
                    </div>

                    <div className="data-card-item">
                      <span className="label">Gender</span>
                      <span className="value">{product.gender}</span>
                    </div>

                    <div className="data-card-item">
                      <span className="label">Sizes</span>
                      <span className="value">
                        <div className="size-list">
                          {product.variants.map(
                            (variant) => (
                              <span
                                key={variant._id ?? variant.sku}
                                className="size-badge"
                              >
                                {variant.size}
                              </span>
                            )
                          )}
                        </div>
                      </span>
                    </div>

                    <div className="data-card-item">
                      <span className="label">Price Range</span>
                      <span className="value">
                        {minimumPrice === maximumPrice
                          ? formatCurrency(minimumPrice)
                          : `${formatCurrency(minimumPrice)} – ${formatCurrency(maximumPrice)}`}
                      </span>
                    </div>

                    <div className="data-card-actions">
                      <button
                        type="button"
                        className="table-action-button"
                        disabled={updatingProductId === product._id}
                        onClick={() => void handleStatusChange(product)}
                      >
                        {updatingProductId === product._id
                          ? "Updating..."
                          : product.status === "ACTIVE"
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pagination-section">
              <p>
                Showing {products.length} of{" "}
                {pagination.total} products
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

      {isModalOpen && (
        <Modal
          title="Create Product"
          onClose={() => {
            if (!isSubmitting) {
              setIsModalOpen(false);
            }
          }}
        >
          <form
            className="school-form"
            onSubmit={handleCreateProduct}
          >
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="schoolId">
                  School <span>*</span>
                </label>

                <select
                  id="schoolId"
                  name="schoolId"
                  value={formData.schoolId}
                  onChange={
                    handleMainInputChange
                  }
                  required
                >
                  <option value="">
                    Select school
                  </option>

                  {activeSchools.map(
                    (school) => (
                      <option
                        key={school._id}
                        value={school._id}
                      >
                        {school.schoolName} (
                        {school.schoolCode})
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="productName">
                  Product Name <span>*</span>
                </label>

                <input
                  id="productName"
                  name="productName"
                  value={
                    formData.productName
                  }
                  onChange={
                    handleMainInputChange
                  }
                  required
                  placeholder="Track Pant"
                />
              </div>

              <div className="form-field">
                <label htmlFor="gender">
                  Gender <span>*</span>
                </label>

                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={
                    handleMainInputChange
                  }
                >
                  <option value="UNISEX">
                    Unisex
                  </option>
                  <option value="MALE">
                    Male
                  </option>
                  <option value="FEMALE">
                    Female
                  </option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="status">
                  Product Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={
                    handleMainInputChange
                  }
                >
                  <option value="ACTIVE">
                    Active
                  </option>
                  <option value="INACTIVE">
                    Inactive
                  </option>
                </select>
              </div>
            </div>

            <div className="variant-section">
              <div className="variant-heading">
                <div>
                  <h3>Sizes and Prices</h3>
                  <p>
                    Add all required sizes for
                    this product.
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={addVariantRow}
                >
                  + Add Size
                </button>
              </div>

              <div className="table-responsive">
                <table className="data-table variant-table">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Unit Price</th>
                      <th>GST %</th>
                      <th>GST Amount</th>
                      <th>Selling Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {formData.variants.map(
                      (variant, index) => {
                        const gstAmount =
                          calculateGst(
                            variant.unitPrice,
                            variant.gstPercentage
                          );

                        const sellingPrice =
                          calculateSellingPrice(
                            variant.unitPrice,
                            variant.gstPercentage
                          );

                        return (
                          <tr key={index}>
                            <td>
                              <input
                                value={
                                  variant.size
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleVariantChange(
                                    index,
                                    "size",
                                    event.target
                                      .value
                                  )
                                }
                                required
                                placeholder="22"
                              />
                            </td>

                            <td>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  variant.unitPrice
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleVariantChange(
                                    index,
                                    "unitPrice",
                                    event.target
                                      .value
                                  )
                                }
                                required
                              />
                            </td>

                            <td>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={
                                  variant.gstPercentage
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleVariantChange(
                                    index,
                                    "gstPercentage",
                                    event.target
                                      .value
                                  )
                                }
                                required
                              />
                            </td>

                            <td>
                              {formatCurrency(
                                gstAmount
                              )}
                            </td>

                            <td>
                              <strong>
                                {formatCurrency(
                                  sellingPrice
                                )}
                              </strong>
                            </td>

                            <td>
                              <button
                                type="button"
                                className="remove-row-button"
                                disabled={
                                  formData
                                    .variants
                                    .length === 1
                                }
                                onClick={() =>
                                  removeVariantRow(
                                    index
                                  )
                                }
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={isSubmitting}
                onClick={() =>
                  setIsModalOpen(false)
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
                  ? "Creating Product..."
                  : "Create Product"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}