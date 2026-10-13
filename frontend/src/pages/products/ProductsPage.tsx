import axios from "axios";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createProduct,
  getProducts,
  updateProductStatus,
} from "../../api/product.api";

import { getSchools } from "../../api/school.api";

import Alert from "../../components/common/Alert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";

import type {
  ApiErrorResponse,
  Pagination,
  School,
} from "../../types/school.types";

import type {
  CreateProductInput,
  Product,
  ProductGender,
  ProductStatus,
  ProductVariantInput,
} from "../../types/product.types";

import "./ProductsPage.css";

const emptyVariant: ProductVariantInput = {
  size: "",
  unitPrice: 0,
  gstPercentage: 5,
  status: "ACTIVE",
};

const initialFormData: CreateProductInput = {
  schoolId: "",
  productName: "",
  gender: "UNISEX",
  variants: [
    {
      ...emptyVariant,
    },
  ],
  status: "ACTIVE",
};

function calculateGst(
  unitPrice: number,
  gstPercentage: number
): number {
  return Math.round(
    ((unitPrice * gstPercentage) / 100 + Number.EPSILON) * 100
  ) / 100;
}

function calculateSellingPrice(
  unitPrice: number,
  gstPercentage: number
): number {
  return Math.round(
    (
      unitPrice +
      calculateGst(unitPrice, gstPercentage) +
      Number.EPSILON
    ) * 100
  ) / 100;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
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

function getInitials(value: string): string {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "PR";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function getGenderLabel(gender: ProductGender): string {
  switch (gender) {
    case "MALE":
      return "Male";

    case "FEMALE":
      return "Female";

    case "UNISEX":
    default:
      return "Unisex";
  }
}

function getStatusLabel(status: ProductStatus): string {
  return status === "ACTIVE" ? "Active" : "Inactive";
}

type IconName =
  | "package"
  | "search"
  | "plus"
  | "filter"
  | "refresh"
  | "school"
  | "tag"
  | "users"
  | "check"
  | "pause"
  | "chevronLeft"
  | "chevronRight"
  | "close"
  | "rupee"
  | "layers"
  | "trash"
  | "arrow"
  | "settings";

function Icon({
  name,
  size = 20,
}: {
  name: IconName;
  size?: number;
}) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "package":
      return (
        <svg {...commonProps}>
          <path d="m16.5 9.4-9-5.19" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="M3.27 6.96 12 12.01l8.73-5.05" />
          <path d="M12 22.08V12" />
        </svg>
      );

    case "search":
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );

    case "plus":
      return (
        <svg {...commonProps}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );

    case "filter":
      return (
        <svg {...commonProps}>
          <path d="M4 6h16" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...commonProps}>
          <path d="M20 11a8 8 0 0 0-14.9-3" />
          <path d="M4 4v4h4" />
          <path d="M4 13a8 8 0 0 0 14.9 3" />
          <path d="M20 20v-4h-4" />
        </svg>
      );

    case "school":
      return (
        <svg {...commonProps}>
          <path d="m3 9 9-5 9 5" />
          <path d="M5 10v8" />
          <path d="M9 10v8" />
          <path d="M15 10v8" />
          <path d="M19 10v8" />
          <path d="M3 18h18" />
          <path d="M2 21h20" />
        </svg>
      );

    case "tag":
      return (
        <svg {...commonProps}>
          <path d="M20.59 13.41 13.41 20.59a2 2 0 0 1-2.82 0L3.41 13.41a2 2 0 0 1 0-2.82l7.18-7.18A2 2 0 0 1 12 2.82H19a2 2 0 0 1 2 2v7a2 2 0 0 1-.41 1.59Z" />
          <circle cx="16.5" cy="7.5" r="1" />
        </svg>
      );

    case "users":
      return (
        <svg {...commonProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "check":
      return (
        <svg {...commonProps}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "pause":
      return (
        <svg {...commonProps}>
          <path d="M8 5v14" />
          <path d="M16 5v14" />
        </svg>
      );

    case "chevronLeft":
      return (
        <svg {...commonProps}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      );

    case "chevronRight":
      return (
        <svg {...commonProps}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );

    case "close":
      return (
        <svg {...commonProps}>
          <path d="M6 6l12 12" />
          <path d="M18 6 6 18" />
        </svg>
      );

    case "rupee":
      return (
        <svg {...commonProps}>
          <path d="M6 4h12" />
          <path d="M6 8h10" />
          <path d="m6 8 8 12" />
          <path d="M6 8h4a4 4 0 0 0 0-8" />
        </svg>
      );

    case "layers":
      return (
        <svg {...commonProps}>
          <path d="m12 2 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5" />
          <path d="m3 17 9 5 9-5" />
        </svg>
      );

    case "trash":
      return (
        <svg {...commonProps}>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 15H6L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...commonProps}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "settings":
      return (
        <svg {...commonProps}>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.42 1.42-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2v-.08a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.42-1.42.06-.06A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.56-1.03H7v-2h.84A1.7 1.7 0 0 0 9.4 11a1.7 1.7 0 0 0-.34-1.88L9 9.06l1.42-1.42.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 13.39 6.5V6h2v.5a1.7 1.7 0 0 0 1.03 1.54 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.42 1.42-.06.06A1.7 1.7 0 0 0 19.4 11a1.7 1.7 0 0 0 1.56 1.03H21v2h-.04A1.7 1.7 0 0 0 19.4 15Z" />
        </svg>
      );

    default:
      return null;
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [schools, setSchools] = useState<School[]>([]);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
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

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const activeProductsOnPage = useMemo(
    () =>
      products.filter(
        (product) => product.status === "ACTIVE"
      ).length,
    [products]
  );

  const inactiveProductsOnPage = useMemo(
    () =>
      products.filter(
        (product) => product.status === "INACTIVE"
      ).length,
    [products]
  );

  const totalVariantsOnPage = useMemo(
    () =>
      products.reduce(
        (total, product) =>
          total + product.variants.length,
        0
      ),
    [products]
  );

  const loadSchools = useCallback(async () => {
    try {
      const result = await getSchools({
        status: "ACTIVE",
        page: 1,
        limit: 100,
      });

      setSchools(result.data);
    } catch (error) {
      setNotification({
        type: "error",
        message: getErrorMessage(error),
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
        limit: pagination.limit,
      });

      setProducts(result.data);
      setPagination(result.pagination);
    } catch (error) {
      setNotification({
        type: "error",
        message: getErrorMessage(error),
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
    pagination.limit,
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
      [name]: value,
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
                value === "" ? 0 : Number(value),
            };
          }

          return {
            ...variant,
            [field]: value,
          };
        }
      );

      return {
        ...currentValue,
        variants,
      };
    });
  }

  function addVariantRow() {
    setFormData((currentValue) => ({
      ...currentValue,
      variants: [
        ...currentValue.variants,
        {
          ...emptyVariant,
        },
      ],
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
          ),
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
            .toUpperCase(),
        }));

      await createProduct({
        ...formData,
        productName:
          formData.productName.trim(),
        variants: cleanedVariants,
      });

      resetForm();
      setIsModalOpen(false);

      setPagination((currentValue) => ({
        ...currentValue,
        page: 1,
      }));

      setNotification({
        type: "success",
        message:
          "Product created successfully.",
      });

      await loadProducts();
    } catch (error) {
      setNotification({
        type: "error",
        message: getErrorMessage(error),
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
        message: `${product.productName} marked as ${newStatus.toLowerCase()}.`,
      });

      await loadProducts();
    } catch (error) {
      setNotification({
        type: "error",
        message: getErrorMessage(error),
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
      page: 1,
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
      page: 1,
    }));
  }

  const hasFilters =
    Boolean(search) ||
    Boolean(schoolFilter) ||
    Boolean(genderFilter) ||
    Boolean(statusFilter);

  return (
    <section className="products-page">
      <div className="products-page__container">

        {/* =====================================================
            HEADER
            ===================================================== */}

        <header className="products-header">
          <div className="products-header__left">

            <div className="products-breadcrumb">
              <span>Schoolay ERP</span>
              <Icon name="arrow" size={15} />
              <span>Masters</span>
              <Icon name="arrow" size={15} />
              <strong>Products</strong>
            </div>

            <div className="products-title-row">
              <div className="products-title-icon">
                <Icon name="package" size={30} />
              </div>

              <div>
                <h1>Products</h1>

                <p>
                  Manage school-wise products,
                  sizes, GST and selling prices.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="products-primary-button"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            <Icon name="plus" size={21} />
            <span>Add Product</span>
          </button>
        </header>

        {/* =====================================================
            NOTIFICATION
            ===================================================== */}

        {notification && (
          <div className="products-notification">
            <Alert
              type={notification.type}
              message={notification.message}
              onClose={() =>
                setNotification(null)
              }
            />
          </div>
        )}

        {/* =====================================================
            SUMMARY
            ===================================================== */}

        <section className="products-summary">

          <div className="product-summary-card product-summary-card--primary">
            <div className="product-summary-card__icon">
              <Icon name="package" size={25} />
            </div>

            <div>
              <span>Products</span>

              <strong>
                {pagination.total}
              </strong>

              <small>
                Total product records
              </small>
            </div>
          </div>

          <div className="product-summary-card product-summary-card--success">
            <div className="product-summary-card__icon">
              <Icon name="check" size={25} />
            </div>

            <div>
              <span>Active</span>

              <strong>
                {activeProductsOnPage}
              </strong>

              <small>
                On current page
              </small>
            </div>
          </div>

          <div className="product-summary-card product-summary-card--warning">
            <div className="product-summary-card__icon">
              <Icon name="pause" size={25} />
            </div>

            <div>
              <span>Inactive</span>

              <strong>
                {inactiveProductsOnPage}
              </strong>

              <small>
                On current page
              </small>
            </div>
          </div>

          <div className="product-summary-card product-summary-card--neutral">
            <div className="product-summary-card__icon">
              <Icon name="layers" size={25} />
            </div>

            <div>
              <span>Size Variants</span>

              <strong>
                {totalVariantsOnPage}
              </strong>

              <small>
                On current page
              </small>
            </div>
          </div>

        </section>

        {/* =====================================================
            DIRECTORY
            ===================================================== */}

        <section className="products-directory">

          <div className="products-directory__header">

            <div>
              <h2>Product Directory</h2>

              <p>
                Search and manage products configured
                for your schools.
              </p>
            </div>

            <button
              type="button"
              className="products-refresh-button"
              onClick={() => void loadProducts()}
              disabled={isLoading}
            >
              <Icon name="refresh" size={19} />
              Refresh
            </button>

          </div>

          {/* =================================================
              FILTERS
              ================================================= */}

          <form
            className="products-filter-bar"
            onSubmit={handleSearchSubmit}
          >

            <div className="products-search">

              <Icon name="search" size={20} />

              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
                placeholder="Search product, code or SKU..."
              />

              {searchInput && (
                <button
                  type="button"
                  className="products-search-clear"
                  onClick={() =>
                    setSearchInput("")
                  }
                  aria-label="Clear search"
                >
                  <Icon name="close" size={17} />
                </button>
              )}

              <button
                type="submit"
                className="products-search-button"
              >
                Search
              </button>
            </div>

            <div className="products-filter-control">
              <Icon name="school" size={18} />

              <select
                value={schoolFilter}
                onChange={(event) => {
                  setSchoolFilter(
                    event.target.value
                  );

                  setPagination(
                    (current) => ({
                      ...current,
                      page: 1,
                    })
                  );
                }}
              >
                <option value="">
                  All schools
                </option>

                {activeSchools.map(
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

            <div className="products-filter-control">
              <Icon name="users" size={18} />

              <select
                value={genderFilter}
                onChange={(event) => {
                  setGenderFilter(
                    event.target.value as
                      | ProductGender
                      | ""
                  );

                  setPagination(
                    (current) => ({
                      ...current,
                      page: 1,
                    })
                  );
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
            </div>

            <div className="products-filter-control">
              <Icon name="filter" size={18} />

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value as
                      | ProductStatus
                      | ""
                  );

                  setPagination(
                    (current) => ({
                      ...current,
                      page: 1,
                    })
                  );
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
            </div>

            {hasFilters && (
              <button
                type="button"
                className="products-clear-button"
                onClick={clearFilters}
              >
                Clear
              </button>
            )}

          </form>

          {/* =================================================
              FILTER CHIPS
              ================================================= */}

          {hasFilters && (
            <div className="products-active-filters">

              <span>
                Active filters:
              </span>

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSearchInput("");

                    setPagination(
                      (current) => ({
                        ...current,
                        page: 1,
                      })
                    );
                  }}
                >
                  Search: "{search}"
                  <Icon
                    name="close"
                    size={14}
                  />
                </button>
              )}

              {schoolFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setSchoolFilter("");

                    setPagination(
                      (current) => ({
                        ...current,
                        page: 1,
                      })
                    );
                  }}
                >
                  School
                  <Icon
                    name="close"
                    size={14}
                  />
                </button>
              )}

              {genderFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setGenderFilter("");

                    setPagination(
                      (current) => ({
                        ...current,
                        page: 1,
                      })
                    );
                  }}
                >
                  {getGenderLabel(
                    genderFilter
                  )}
                  <Icon
                    name="close"
                    size={14}
                  />
                </button>
              )}

              {statusFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("");

                    setPagination(
                      (current) => ({
                        ...current,
                        page: 1,
                      })
                    );
                  }}
                >
                  {getStatusLabel(
                    statusFilter
                  )}
                  <Icon
                    name="close"
                    size={14}
                  />
                </button>
              )}

            </div>
          )}

          {/* =================================================
              CONTENT
              ================================================= */}

          {isLoading ? (
            <div className="products-loading">
              <LoadingSpinner message="Loading products..." />
            </div>
          ) : products.length === 0 ? (
            <div className="products-empty">

              <div className="products-empty__icon">
                <Icon
                  name="package"
                  size={36}
                />
              </div>

              <h3>
                No products found
              </h3>

              <p>
                {hasFilters
                  ? "Try changing your search or filter criteria."
                  : "Create your first school product to start managing sizes and prices."}
              </p>

              {hasFilters ? (
                <button
                  type="button"
                  className="products-secondary-button"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  className="products-primary-button"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(true);
                  }}
                >
                  <Icon
                    name="plus"
                    size={20}
                  />
                  Add Product
                </button>
              )}

            </div>
          ) : (
            <>
              {/* =================================================
                  DESKTOP TABLE
                  ================================================= */}

              <div className="products-table-wrapper">

                <table className="products-table">

                  <thead>
                    <tr>
                      <th>S.No.</th>
                      <th>School</th>
                      <th>Product</th>
                      <th>Code / SKU</th>
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
                          <tr
                            key={
                              product._id
                            }
                          >

                            <td>
                              <span className="serial-number">
                                {(pagination.page -
                                  1) *
                                  pagination.limit +
                                  index +
                                  1}
                              </span>
                            </td>

                            <td>
                              <div className="product-school">

                                <div className="product-school__avatar">
                                  {getInitials(
                                    product
                                      .schoolId
                                      .schoolName
                                  )}
                                </div>

                                <div>
                                  <strong>
                                    {
                                      product
                                        .schoolId
                                        .schoolName
                                    }
                                  </strong>

                                  <span>
                                    {
                                      product
                                        .schoolId
                                        .schoolCode
                                    }
                                  </span>
                                </div>

                              </div>
                            </td>

                            <td>
                              <div className="product-name-cell">

                                <strong>
                                  {
                                    product.productName
                                  }
                                </strong>

                                <span>
                                  {
                                    product.variants
                                      .length
                                  }{" "}
                                  size{" "}
                                  {product
                                    .variants
                                    .length ===
                                  1
                                    ? "variant"
                                    : "variants"}
                                </span>

                              </div>
                            </td>

                            <td>
                              <span className="product-code-badge">
                                {
                                  product.productCode
                                }
                              </span>
                            </td>

                            <td>
                              <span
                                className={`gender-badge gender-badge--${product.gender.toLowerCase()}`}
                              >
                                {
                                  getGenderLabel(
                                    product.gender
                                  )
                                }
                              </span>
                            </td>

                            <td>
                              <div className="product-size-list">

                                {product.variants.map(
                                  (variant) => (
                                    <span
                                      key={
                                        variant
                                          ._id ??
                                        variant.sku
                                      }
                                    >
                                      {
                                        variant.size
                                      }
                                    </span>
                                  )
                                )}

                              </div>
                            </td>

                            <td>
                              <div className="product-price">

                                <strong>
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
                                </strong>

                                <span>
                                  Incl. GST
                                </span>

                              </div>
                            </td>

                            <td>
                              <span
                                className={`product-status product-status--${
                                  product.status ===
                                  "ACTIVE"
                                    ? "active"
                                    : "inactive"
                                }`}
                              >
                                <span />
                                {
                                  getStatusLabel(
                                    product.status
                                  )
                                }
                              </span>
                            </td>

                            <td>
                              <button
                                type="button"
                                className={`product-action-button ${
                                  product.status ===
                                  "ACTIVE"
                                    ? "product-action-button--deactivate"
                                    : "product-action-button--activate"
                                }`}
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

              {/* =================================================
                  MOBILE CARDS
                  ================================================= */}

              <div className="products-mobile-list">

                {products.map(
                  (product) => {
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
                      <article
                        className="product-mobile-card"
                        key={product._id}
                      >

                        <div className="product-mobile-card__header">

                          <div className="product-mobile-identity">

                            <div className="product-school__avatar">
                              {getInitials(
                                product
                                  .schoolId
                                  .schoolName
                              )}
                            </div>

                            <div>
                              <strong>
                                {
                                  product.productName
                                }
                              </strong>

                              <span>
                                {
                                  product.productCode
                                }
                              </span>
                            </div>

                          </div>

                          <span
                            className={`product-status product-status--${
                              product.status ===
                              "ACTIVE"
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            <span />
                            {
                              getStatusLabel(
                                product.status
                              )
                            }
                          </span>

                        </div>

                        <div className="product-mobile-school">
                          <Icon
                            name="school"
                            size={18}
                          />

                          <span>
                            {
                              product.schoolId
                                .schoolName
                            }
                          </span>
                        </div>

                        <div className="product-mobile-grid">

                          <div>
                            <span>
                              Gender
                            </span>

                            <strong>
                              {
                                getGenderLabel(
                                  product.gender
                                )
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Sizes
                            </span>

                            <strong>
                              {
                                product
                                  .variants
                                  .length
                              }
                            </strong>
                          </div>

                        </div>

                        <div className="product-mobile-sizes">

                          <span className="product-mobile-label">
                            Available Sizes
                          </span>

                          <div className="product-size-list">
                            {product.variants.map(
                              (variant) => (
                                <span
                                  key={
                                    variant
                                      ._id ??
                                    variant.sku
                                  }
                                >
                                  {
                                    variant.size
                                  }
                                </span>
                              )
                            )}
                          </div>

                        </div>

                        <div className="product-mobile-price">

                          <span>
                            Selling Price
                          </span>

                          <strong>
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
                          </strong>

                        </div>

                        <button
                          type="button"
                          className={`product-mobile-action ${
                            product.status ===
                            "ACTIVE"
                              ? "product-mobile-action--deactivate"
                              : "product-mobile-action--activate"
                          }`}
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
                              ? "Deactivate Product"
                              : "Activate Product"}
                        </button>

                      </article>
                    );
                  }
                )}

              </div>

              {/* =================================================
                  PAGINATION
                  ================================================= */}

              <div className="products-pagination">

                <div className="products-pagination__info">
                  Showing{" "}
                  <strong>
                    {products.length}
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {pagination.total}
                  </strong>{" "}
                  products
                </div>

                <div className="products-pagination__controls">

                  <button
                    type="button"
                    disabled={
                      pagination.page <= 1
                    }
                    onClick={() =>
                      setPagination(
                        (current) => ({
                          ...current,
                          page:
                            current.page - 1,
                        })
                      )
                    }
                    aria-label="Previous page"
                  >
                    <Icon
                      name="chevronLeft"
                      size={20}
                    />
                  </button>

                  <span>
                    Page{" "}
                    <strong>
                      {pagination.page}
                    </strong>{" "}
                    of{" "}
                    <strong>
                      {Math.max(
                        pagination.totalPages,
                        1
                      )}
                    </strong>
                  </span>

                  <button
                    type="button"
                    disabled={
                      pagination.page >=
                      pagination.totalPages
                    }
                    onClick={() =>
                      setPagination(
                        (current) => ({
                          ...current,
                          page:
                            current.page + 1,
                        })
                      )
                    }
                    aria-label="Next page"
                  >
                    <Icon
                      name="chevronRight"
                      size={20}
                    />
                  </button>

                </div>

              </div>
            </>
          )}

        </section>
      </div>

      {/* =======================================================
          CREATE PRODUCT MODAL
          ======================================================= */}

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
            className="product-form"
            onSubmit={
              handleCreateProduct
            }
          >

            {/* Intro */}

            <div className="product-form__intro">

              <div className="product-form__intro-icon">
                <Icon
                  name="package"
                  size={25}
                />
              </div>

              <div>
                <h3>
                  Product Configuration
                </h3>

                <p>
                  Configure the school product,
                  gender and size-wise pricing.
                </p>
              </div>

            </div>

            {/* Basic Details */}

            <section className="product-form-section">

              <div className="product-form-section__heading">

                <div className="form-step">
                  01
                </div>

                <div>
                  <h3>
                    Product Details
                  </h3>

                  <p>
                    Define the basic product
                    information.
                  </p>
                </div>

              </div>

              <div className="product-form-grid">

                <div className="product-form-field product-form-field--full">

                  <label htmlFor="schoolId">
                    School{" "}
                    <span>*</span>
                  </label>

                  <div className="product-form-control">

                    <Icon
                      name="school"
                      size={19}
                    />

                    <select
                      id="schoolId"
                      name="schoolId"
                      value={
                        formData.schoolId
                      }
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

                </div>

                <div className="product-form-field">

                  <label htmlFor="productName">
                    Product Name{" "}
                    <span>*</span>
                  </label>

                  <div className="product-form-control">

                    <Icon
                      name="tag"
                      size={19}
                    />

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

                </div>

                <div className="product-form-field">

                  <label htmlFor="gender">
                    Gender{" "}
                    <span>*</span>
                  </label>

                  <div className="product-form-control">

                    <Icon
                      name="users"
                      size={19}
                    />

                    <select
                      id="gender"
                      name="gender"
                      value={
                        formData.gender
                      }
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

                </div>

                <div className="product-form-field">

                  <label htmlFor="status">
                    Product Status
                  </label>

                  <div className="product-form-control">

                    <Icon
                      name="settings"
                      size={19}
                    />

                    <select
                      id="status"
                      name="status"
                      value={
                        formData.status
                      }
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

              </div>

            </section>

            {/* Variants */}

            <section className="product-form-section">

              <div className="product-form-section__heading product-form-section__heading--with-action">

                <div className="product-form-section__heading-left">

                  <div className="form-step">
                    02
                  </div>

                  <div>
                    <h3>
                      Sizes & Pricing
                    </h3>

                    <p>
                      Configure size-wise unit
                      price, GST and final selling
                      price.
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  className="add-size-button"
                  onClick={
                    addVariantRow
                  }
                >
                  <Icon
                    name="plus"
                    size={18}
                  />
                  Add Size
                </button>

              </div>

              <div className="variant-info-banner">
                <Icon
                  name="rupee"
                  size={19}
                />

                <span>
                  Selling price is automatically
                  calculated as Unit Price + GST.
                </span>
              </div>

              <div className="variants-table-wrapper">

                <table className="variants-table">

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
                                    event
                                      .target
                                      .value
                                  )
                                }
                                required
                                placeholder="22"
                              />

                            </td>

                            <td>

                              <div className="variant-input-with-prefix">
                                <span>
                                  ₹
                                </span>

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
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  required
                                />
                              </div>

                            </td>

                            <td>

                              <div className="variant-input-with-suffix">

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
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  required
                                />

                                <span>
                                  %
                                </span>

                              </div>

                            </td>

                            <td>

                              <span className="variant-calculated-value">
                                {formatCurrency(
                                  gstAmount
                                )}
                              </span>

                            </td>

                            <td>

                              <span className="variant-selling-price">
                                {formatCurrency(
                                  sellingPrice
                                )}
                              </span>

                            </td>

                            <td>

                              <button
                                type="button"
                                className="variant-remove-button"
                                disabled={
                                  formData
                                    .variants
                                    .length ===
                                  1
                                }
                                onClick={() =>
                                  removeVariantRow(
                                    index
                                  )
                                }
                              >
                                <Icon
                                  name="trash"
                                  size={17}
                                />
                              </button>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

              {/* Mobile variants */}

              <div className="variants-mobile-list">

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
                      <div
                        className="variant-mobile-card"
                        key={index}
                      >

                        <div className="variant-mobile-card__header">

                          <strong>
                            Size Variant{" "}
                            {index + 1}
                          </strong>

                          <button
                            type="button"
                            className="variant-remove-button"
                            disabled={
                              formData
                                .variants
                                .length ===
                              1
                            }
                            onClick={() =>
                              removeVariantRow(
                                index
                              )
                            }
                          >
                            <Icon
                              name="trash"
                              size={17}
                            />
                          </button>

                        </div>

                        <div className="variant-mobile-grid">

                          <div>
                            <label>
                              Size
                            </label>

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
                                  event
                                    .target
                                    .value
                                )
                              }
                              required
                              placeholder="22"
                            />
                          </div>

                          <div>
                            <label>
                              Unit Price
                            </label>

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
                                  event
                                    .target
                                    .value
                                )
                              }
                              required
                            />
                          </div>

                          <div>
                            <label>
                              GST %
                            </label>

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
                                  event
                                    .target
                                    .value
                                )
                              }
                              required
                            />
                          </div>

                          <div>
                            <label>
                              GST Amount
                            </label>

                            <strong>
                              {formatCurrency(
                                gstAmount
                              )}
                            </strong>
                          </div>

                          <div className="variant-mobile-selling-price">
                            <label>
                              Selling Price
                            </label>

                            <strong>
                              {formatCurrency(
                                sellingPrice
                              )}
                            </strong>
                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </section>

            {/* Footer */}

            <div className="product-form-actions">

              <button
                type="button"
                className="products-secondary-button"
                disabled={
                  isSubmitting
                }
                onClick={() =>
                  setIsModalOpen(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="products-primary-button"
                disabled={
                  isSubmitting
                }
              >
                <Icon
                  name="plus"
                  size={19}
                />

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