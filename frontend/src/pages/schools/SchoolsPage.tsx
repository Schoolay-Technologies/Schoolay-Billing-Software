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
  createSchool,
  getSchools,
  updateSchoolStatus,
} from "../../api/school.api";

import Alert from "../../components/common/Alert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";

import type {
  ApiErrorResponse,
  CreateSchoolInput,
  Pagination,
  School,
  SchoolStatus,
} from "../../types/school.types";

import "./SchoolsPage.css";

/* =========================================================
   INITIAL FORM
========================================================= */

const initialFormData: CreateSchoolInput = {
  schoolName: "",
  schoolCode: "",
  address: {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "Karnataka",
    postalCode: "",
  },
  contactPerson: "",
  contactNumber: "",
  email: "",
  gstNumber: "",
  status: "ACTIVE",
};

/* =========================================================
   ICON
========================================================= */

type IconName =
  | "school"
  | "search"
  | "plus"
  | "filter"
  | "refresh"
  | "chevronLeft"
  | "chevronRight"
  | "close"
  | "building"
  | "location"
  | "phone"
  | "mail"
  | "user"
  | "gst"
  | "check"
  | "pause"
  | "arrow";

function Icon({
  name,
  size = 18,
}: {
  name: IconName;
  size?: number;
}) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "school":
      return (
        <svg {...props}>
          <path d="m3 10 9-6 9 6" />
          <path d="M5 10v9" />
          <path d="M9 10v9" />
          <path d="M15 10v9" />
          <path d="M19 10v9" />
          <path d="M3 19h18" />
          <path d="M8 14h2" />
          <path d="M14 14h2" />
        </svg>
      );

    case "building":
      return (
        <svg {...props}>
          <path d="M4 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17" />
          <path d="M16 8h3a1 1 0 0 1 1 1v12" />
          <path d="M8 7h4" />
          <path d="M8 11h4" />
          <path d="M8 15h4" />
          <path d="M9 21v-3h2v3" />
        </svg>
      );

    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );

    case "plus":
      return (
        <svg {...props}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );

    case "filter":
      return (
        <svg {...props}>
          <path d="M4 6h16" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...props}>
          <path d="M20 11a8 8 0 0 0-14.8-4L3 10" />
          <path d="M3 5v5h5" />
          <path d="M4 13a8 8 0 0 0 14.8 4L21 14" />
          <path d="M21 19v-5h-5" />
        </svg>
      );

    case "chevronLeft":
      return (
        <svg {...props}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      );

    case "chevronRight":
      return (
        <svg {...props}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );

    case "close":
      return (
        <svg {...props}>
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </svg>
      );

    case "location":
      return (
        <svg {...props}>
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );

    case "phone":
      return (
        <svg {...props}>
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7A2 2 0 0 1 22 16.9Z" />
        </svg>
      );

    case "mail":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );

    case "user":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );

    case "gst":
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>
      );

    case "check":
      return (
        <svg {...props}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "pause":
      return (
        <svg {...props}>
          <path d="M8 5v14" />
          <path d="M16 5v14" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...props}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    default:
      return null;
  }
}

/* =========================================================
   ERROR HANDLER
========================================================= */

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const responseData = error.response?.data;

    if (responseData?.errors?.length) {
      return responseData.errors
        .map((item) => item.message)
        .join(", ");
    }

    return (
      responseData?.message ??
      "The request failed. Please try again."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

/* =========================================================
   STATUS HELPERS
========================================================= */

function getStatusLabel(status: SchoolStatus) {
  return status === "ACTIVE"
    ? "Active"
    : "Inactive";
}

function getInitials(name: string) {
  if (!name) return "SC";

  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/* =========================================================
   PAGE
========================================================= */

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>(
    []
  );

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<SchoolStatus | "">("");

  const [formData, setFormData] =
    useState<CreateSchoolInput>(
      initialFormData
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [updatingSchoolId, setUpdatingSchoolId] =
    useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [notification, setNotification] =
    useState<{
      type: "success" | "error";
      message: string;
    } | null>(null);

  /* =======================================================
     LOAD SCHOOLS
  ======================================================= */

  const loadSchools = useCallback(
    async () => {
      try {
        setIsLoading(true);

        const result = await getSchools({
          search: search || undefined,
          status: statusFilter,
          page: pagination.page,
          limit: pagination.limit,
        });

        setSchools(result.data);
        setPagination(result.pagination);
      } catch (error) {
        setNotification({
          type: "error",
          message: getErrorMessage(error),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      search,
      statusFilter,
      pagination.page,
      pagination.limit,
    ]
  );

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  /* =======================================================
     DERIVED STATS
  ======================================================= */

  const pageStats = useMemo(() => {
    const active = schools.filter(
      (school) =>
        school.status === "ACTIVE"
    ).length;

    const inactive = schools.filter(
      (school) =>
        school.status === "INACTIVE"
    ).length;

    return {
      active,
      inactive,
      visible: schools.length,
      total: pagination.total,
    };
  }, [schools, pagination.total]);

  const hasFilters =
    Boolean(search) ||
    Boolean(statusFilter);

  /* =======================================================
     INPUT CHANGE
  ======================================================= */

  function handleInputChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {
    const { name, value } =
      event.target;

    if (name.startsWith("address.")) {
      const addressField =
        name.replace(
          "address.",
          ""
        ) as keyof CreateSchoolInput["address"];

      setFormData((currentValue) => ({
        ...currentValue,

        address: {
          ...currentValue.address,

          [addressField]: value,
        },
      }));

      return;
    }

    setFormData((currentValue) => ({
      ...currentValue,

      [name]: value,
    }));
  }

  /* =======================================================
     SEARCH
  ======================================================= */

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

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  function handleClearFilters() {
    setSearch("");
    setSearchInput("");
    setStatusFilter("");

    setPagination((currentValue) => ({
      ...currentValue,
      page: 1,
    }));
  }

  /* =======================================================
     OPEN MODAL
  ======================================================= */

  function openCreateModal() {
    setFormData(initialFormData);
    setIsModalOpen(true);
  }

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  function closeCreateModal() {
    if (isSubmitting) return;

    setIsModalOpen(false);
    setFormData(initialFormData);
  }

  /* =======================================================
     CREATE SCHOOL
  ======================================================= */

  async function handleCreateSchool(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setNotification(null);

      await createSchool({
        ...formData,

        schoolName:
          formData.schoolName.trim(),

        schoolCode:
          formData.schoolCode
            .trim()
            .toUpperCase(),

        contactPerson:
          formData.contactPerson.trim(),

        contactNumber:
          formData.contactNumber.trim(),

        email:
          formData.email.trim(),

        gstNumber:
          formData.gstNumber
            .trim()
            .toUpperCase(),
      });

      setFormData(initialFormData);
      setIsModalOpen(false);

      setPagination((currentValue) => ({
        ...currentValue,
        page: 1,
      }));

      setNotification({
        type: "success",
        message:
          "School has been successfully created.",
      });

      await loadSchools();
    } catch (error) {
      setNotification({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /* =======================================================
     STATUS CHANGE
  ======================================================= */

  async function handleStatusChange(
    school: School
  ) {
    const newStatus: SchoolStatus =
      school.status === "ACTIVE"
        ? "INACTIVE"
        : "ACTIVE";

    try {
      setUpdatingSchoolId(school._id);
      setNotification(null);

      await updateSchoolStatus(
        school._id,
        newStatus
      );

      setNotification({
        type: "success",
        message: `${school.schoolName} is now ${newStatus.toLowerCase()}.`,
      });

      await loadSchools();
    } catch (error) {
      setNotification({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setUpdatingSchoolId(null);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="schools-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="schools-header">

        <div className="schools-header-content">

          <div className="schools-breadcrumb">
            <span>Schoolay ERP</span>
            <Icon
              name="arrow"
              size={12}
            />
            <strong>Schools</strong>
          </div>

          <div className="schools-title-row">

            <div className="schools-page-icon">
              <Icon
                name="school"
                size={22}
              />
            </div>

            <div>
              <h1>
                Schools
              </h1>

              <p>
                Manage school accounts,
                contacts and operational
                relationships.
              </p>
            </div>

          </div>

        </div>

        <button
          type="button"
          className="schools-primary-button"
          onClick={openCreateModal}
        >
          <Icon
            name="plus"
            size={17}
          />

          Add School
        </button>

      </div>

      {/* =================================================
          NOTIFICATION
      ================================================= */}

      {notification && (
        <div className="schools-notification">
          <Alert
            type={notification.type}
            message={notification.message}
            onClose={() =>
              setNotification(null)
            }
          />
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="schools-stat-grid">

        <div className="school-stat-card">
          <div className="school-stat-icon blue">
            <Icon
              name="school"
              size={18}
            />
          </div>

          <div>
            <span>Total Schools</span>

            <strong>
              {pagination.total}
            </strong>

            <small>
              Registered accounts
            </small>
          </div>
        </div>

        <div className="school-stat-card">
          <div className="school-stat-icon green">
            <Icon
              name="check"
              size={18}
            />
          </div>

          <div>
            <span>Active</span>

            <strong>
              {pageStats.active}
            </strong>

            <small>
              On current page
            </small>
          </div>
        </div>

        <div className="school-stat-card">
          <div className="school-stat-icon gray">
            <Icon
              name="pause"
              size={18}
            />
          </div>

          <div>
            <span>Inactive</span>

            <strong>
              {pageStats.inactive}
            </strong>

            <small>
              On current page
            </small>
          </div>
        </div>

        <div className="school-stat-card">
          <div className="school-stat-icon purple">
            <Icon
              name="building"
              size={18}
            />
          </div>

          <div>
            <span>Showing</span>

            <strong>
              {pageStats.visible}
            </strong>

            <small>
              Records on this page
            </small>
          </div>
        </div>

      </div>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="schools-content-card">

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="schools-toolbar">

          <div className="toolbar-title">

            <div>
              <h2>
                School Directory
              </h2>

              <p>
                Search and manage your
                registered schools.
              </p>
            </div>

          </div>

          <button
            type="button"
            className="toolbar-refresh"
            onClick={() =>
              void loadSchools()
            }
            disabled={isLoading}
          >
            <Icon
              name="refresh"
              size={15}
            />

            Refresh
          </button>

        </div>

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <form
          className="schools-filter-bar"
          onSubmit={
            handleSearchSubmit
          }
        >

          <div className="school-search-box">

            <Icon
              name="search"
              size={17}
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Search school name or code..."
              aria-label="Search schools"
            />

            {searchInput && (
              <button
                type="button"
                className="search-clear"
                onClick={() =>
                  setSearchInput("")
                }
                aria-label="Clear search"
              >
                <Icon
                  name="close"
                  size={14}
                />
              </button>
            )}

          </div>

          <div className="school-filter-select">

            <Icon
              name="filter"
              size={15}
            />

            <select
              value={statusFilter}
              onChange={(event) => {
                const value =
                  event.target
                    .value as
                    | SchoolStatus
                    | "";

                setStatusFilter(value);

                setPagination(
                  (currentValue) => ({
                    ...currentValue,
                    page: 1,
                  })
                );
              }}
            >
              <option value="">
                All Statuses
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>

          </div>

          <button
            type="submit"
            className="filter-search-button"
          >
            Search
          </button>

          {hasFilters && (
            <button
              type="button"
              className="clear-filter-button"
              onClick={
                handleClearFilters
              }
            >
              Clear filters
            </button>
          )}

        </form>

        {/* ACTIVE FILTERS */}

        {hasFilters && (
          <div className="active-filter-row">

            <span>
              Active filters:
            </span>

            {search && (
              <button
                type="button"
                className="filter-chip"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");

                  setPagination(
                    (currentValue) => ({
                      ...currentValue,
                      page: 1,
                    })
                  );
                }}
              >
                Search: "{search}"
                <Icon
                  name="close"
                  size={11}
                />
              </button>
            )}

            {statusFilter && (
              <button
                type="button"
                className="filter-chip"
                onClick={() => {
                  setStatusFilter("");

                  setPagination(
                    (currentValue) => ({
                      ...currentValue,
                      page: 1,
                    })
                  );
                }}
              >
                Status:{" "}
                {getStatusLabel(
                  statusFilter
                )}

                <Icon
                  name="close"
                  size={11}
                />
              </button>
            )}

          </div>
        )}

        {/* =================================================
            TABLE
        ================================================= */}

        {isLoading ? (
          <div className="schools-loading">
            <LoadingSpinner
              message="Loading school directory..."
            />
          </div>
        ) : schools.length === 0 ? (
          <div className="schools-empty-state">

            <div className="empty-school-icon">
              <Icon
                name="school"
                size={25}
              />
            </div>

            <h3>
              No schools found
            </h3>

            <p>
              {hasFilters
                ? "Try adjusting your search or filters."
                : "Create your first school to start managing your school network."}
            </p>

            {hasFilters ? (
              <button
                type="button"
                className="secondary-action-button"
                onClick={
                  handleClearFilters
                }
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                className="schools-primary-button"
                onClick={
                  openCreateModal
                }
              >
                <Icon
                  name="plus"
                  size={16}
                />
                Add Your First School
              </button>
            )}

          </div>
        ) : (
          <>
            {/* DESKTOP */}

            <div className="schools-table-wrapper">

              <table className="schools-table">

                <thead>
                  <tr>
                    <th className="serial-column">
                      #
                    </th>

                    <th>
                      School
                    </th>

                    <th>
                      Code
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Location
                    </th>

                    <th>
                      Status
                    </th>

                    <th className="action-column">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {schools.map(
                    (school, index) => (
                      <tr
                        key={
                          school._id
                        }
                      >

                        <td className="serial-number">
                          {(pagination.page -
                            1) *
                            pagination.limit +
                            index +
                            1}
                        </td>

                        <td>

                          <div className="school-identity">

                            <div className="school-avatar">
                              {getInitials(
                                school.schoolName
                              )}
                            </div>

                            <div className="school-identity-info">

                              <strong>
                                {
                                  school.schoolName
                                }
                              </strong>

                              <span>
                                {school.email ||
                                  "No email registered"}
                              </span>

                            </div>

                          </div>

                        </td>

                        <td>

                          <span className="school-code-badge">
                            {
                              school.schoolCode
                            }
                          </span>

                        </td>

                        <td>

                          <div className="contact-cell">

                            {school.contactPerson && (
                              <div>
                                <Icon
                                  name="user"
                                  size={12}
                                />

                                <span>
                                  {
                                    school.contactPerson
                                  }
                                </span>
                              </div>
                            )}

                            {school.contactNumber && (
                              <div>
                                <Icon
                                  name="phone"
                                  size={12}
                                />

                                <span>
                                  {
                                    school.contactNumber
                                  }
                                </span>
                              </div>
                            )}

                            {!school.contactPerson &&
                              !school.contactNumber && (
                                <span className="muted-text">
                                  No contact
                                </span>
                              )}

                          </div>

                        </td>

                        <td>

                          <div className="location-cell">

                            <Icon
                              name="location"
                              size={13}
                            />

                            <span>
                              {school.address
                                ?.city ||
                                "—"}
                            </span>

                          </div>

                        </td>

                        <td>

                          <span
                            className={`school-status ${
                              school.status ===
                              "ACTIVE"
                                ? "active"
                                : "inactive"
                            }`}
                          >

                            <span className="status-dot" />

                            {
                              getStatusLabel(
                                school.status
                              )
                            }

                          </span>

                        </td>

                        <td>

                          <button
                            type="button"
                            className={`status-action ${
                              school.status ===
                              "ACTIVE"
                                ? "deactivate"
                                : "activate"
                            }`}
                            disabled={
                              updatingSchoolId ===
                              school._id
                            }
                            onClick={() =>
                              void handleStatusChange(
                                school
                              )
                            }
                          >

                            {updatingSchoolId ===
                            school._id ? (
                              "Updating..."
                            ) : school.status ===
                              "ACTIVE" ? (
                              <>
                                <Icon
                                  name="pause"
                                  size={13}
                                />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Icon
                                  name="check"
                                  size={13}
                                />
                                Activate
                              </>
                            )}

                          </button>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* MOBILE */}

            <div className="schools-mobile-list">

              {schools.map((school) => (
                <article
                  className="school-mobile-card"
                  key={school._id}
                >

                  <div className="mobile-school-header">

                    <div className="school-identity">

                      <div className="school-avatar">
                        {getInitials(
                          school.schoolName
                        )}
                      </div>

                      <div className="school-identity-info">

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

                    <span
                      className={`school-status ${
                        school.status ===
                        "ACTIVE"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      <span className="status-dot" />
                      {
                        getStatusLabel(
                          school.status
                        )
                      }
                    </span>

                  </div>

                  <div className="mobile-school-details">

                    <div>
                      <span>
                        Contact
                      </span>

                      <strong>
                        {
                          school.contactPerson ||
                          "—"
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Phone
                      </span>

                      <strong>
                        {
                          school.contactNumber ||
                          "—"
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Email
                      </span>

                      <strong>
                        {
                          school.email ||
                          "—"
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Location
                      </span>

                      <strong>
                        {
                          school.address
                            ?.city ||
                          "—"
                        }
                      </strong>
                    </div>

                  </div>

                  <div className="mobile-school-footer">

                    <span>
                      School Code:{" "}
                      <strong>
                        {
                          school.schoolCode
                        }
                      </strong>
                    </span>

                    <button
                      type="button"
                      className={`status-action ${
                        school.status ===
                        "ACTIVE"
                          ? "deactivate"
                          : "activate"
                      }`}
                      disabled={
                        updatingSchoolId ===
                        school._id
                      }
                      onClick={() =>
                        void handleStatusChange(
                          school
                        )
                      }
                    >

                      {updatingSchoolId ===
                      school._id
                        ? "Updating..."
                        : school.status ===
                          "ACTIVE"
                        ? "Deactivate"
                        : "Activate"}

                    </button>

                  </div>

                </article>
              ))}

            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            <div className="schools-pagination">

              <div className="pagination-info">

                <strong>
                  {pagination.total}
                </strong>

                <span>
                  schools total
                </span>

                <span className="pagination-divider">
                  •
                </span>

                <span>
                  Showing{" "}
                  {Math.min(
                    schools.length,
                    pagination.limit
                  )}{" "}
                  on this page
                </span>

              </div>

              <div className="pagination-controls">

                <button
                  type="button"
                  className="pagination-button"
                  disabled={
                    pagination.page <= 1
                  }
                  onClick={() =>
                    setPagination(
                      (currentValue) => ({
                        ...currentValue,
                        page:
                          currentValue.page -
                          1,
                      })
                    )
                  }
                >
                  <Icon
                    name="chevronLeft"
                    size={15}
                  />

                  Previous
                </button>

                <div className="page-indicator">
                  <span>
                    Page
                  </span>

                  <strong>
                    {pagination.page}
                  </strong>

                  <span>
                    of
                  </span>

                  <strong>
                    {Math.max(
                      pagination.totalPages,
                      1
                    )}
                  </strong>
                </div>

                <button
                  type="button"
                  className="pagination-button"
                  disabled={
                    pagination.page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    setPagination(
                      (currentValue) => ({
                        ...currentValue,
                        page:
                          currentValue.page +
                          1,
                      })
                    )
                  }
                >
                  Next

                  <Icon
                    name="chevronRight"
                    size={15}
                  />
                </button>

              </div>

            </div>
          </>
        )}

      </div>

      {/* =================================================
          CREATE SCHOOL MODAL
      ================================================= */}

      {isModalOpen && (
        <Modal
          title="Create School"
          onClose={closeCreateModal}
        >

          <form
            className="professional-school-form"
            onSubmit={
              handleCreateSchool
            }
          >

            <div className="modal-introduction">

              <div className="modal-intro-icon">
                <Icon
                  name="school"
                  size={19}
                />
              </div>

              <div>
                <strong>
                  Add a new school
                </strong>

                <p>
                  Enter the school’s basic
                  information and primary
                  contact details.
                </p>
              </div>

            </div>

            {/* BASIC INFORMATION */}

            <div className="form-section">

              <div className="form-section-heading">

                <div>
                  <span>
                    01
                  </span>

                  <div>
                    <h3>
                      Basic Information
                    </h3>

                    <p>
                      School identification
                      details.
                    </p>
                  </div>
                </div>

              </div>

              <div className="professional-form-grid">

                <div className="professional-field form-field-full">

                  <label htmlFor="schoolName">
                    School Name
                    <span>*</span>
                  </label>

                  <input
                    id="schoolName"
                    name="schoolName"
                    value={
                      formData.schoolName
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    maxLength={150}
                    placeholder="Enter official school name"
                  />

                </div>

                <div className="professional-field">

                  <label htmlFor="schoolCode">
                    School Code
                    <span>*</span>
                  </label>

                  <input
                    id="schoolCode"
                    name="schoolCode"
                    value={
                      formData.schoolCode
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    maxLength={20}
                    placeholder="e.g. NCFE"
                  />

                  <small>
                    A unique short identifier
                    for the school.
                  </small>

                </div>

                <div className="professional-field">

                  <label htmlFor="status">
                    Initial Status
                  </label>

                  <select
                    id="status"
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleInputChange
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

            {/* ADDRESS */}

            <div className="form-section">

              <div className="form-section-heading">

                <div>
                  <span>
                    02
                  </span>

                  <div>
                    <h3>
                      Location
                    </h3>

                    <p>
                      School address and
                      geographical details.
                    </p>
                  </div>
                </div>

              </div>

              <div className="professional-form-grid">

                <div className="professional-field form-field-full">

                  <label htmlFor="addressLine1">
                    Address Line 1
                  </label>

                  <input
                    id="addressLine1"
                    name="address.addressLine1"
                    value={
                      formData.address
                        .addressLine1
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Building number, street"
                  />

                </div>

                <div className="professional-field form-field-full">

                  <label htmlFor="addressLine2">
                    Address Line 2
                  </label>

                  <input
                    id="addressLine2"
                    name="address.addressLine2"
                    value={
                      formData.address
                        .addressLine2
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Area, landmark or locality"
                  />

                </div>

                <div className="professional-field">

                  <label htmlFor="city">
                    City
                  </label>

                  <input
                    id="city"
                    name="address.city"
                    value={
                      formData.address.city
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Bengaluru"
                  />

                </div>

                <div className="professional-field">

                  <label htmlFor="state">
                    State
                  </label>

                  <input
                    id="state"
                    name="address.state"
                    value={
                      formData.address.state
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Karnataka"
                  />

                </div>

                <div className="professional-field">

                  <label htmlFor="postalCode">
                    Postal Code
                  </label>

                  <input
                    id="postalCode"
                    name="address.postalCode"
                    value={
                      formData.address
                        .postalCode
                    }
                    onChange={
                      handleInputChange
                    }
                    maxLength={10}
                    placeholder="560043"
                  />

                </div>

              </div>

            </div>

            {/* CONTACT */}

            <div className="form-section">

              <div className="form-section-heading">

                <div>
                  <span>
                    03
                  </span>

                  <div>
                    <h3>
                      Primary Contact
                    </h3>

                    <p>
                      Main school management
                      contact information.
                    </p>
                  </div>
                </div>

              </div>

              <div className="professional-form-grid">

                <div className="professional-field">

                  <label htmlFor="contactPerson">
                    Contact Person
                  </label>

                  <input
                    id="contactPerson"
                    name="contactPerson"
                    value={
                      formData.contactPerson
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Administrator / Coordinator"
                  />

                </div>

                <div className="professional-field">

                  <label htmlFor="contactNumber">
                    Contact Number
                  </label>

                  <input
                    id="contactNumber"
                    name="contactNumber"
                    type="tel"
                    value={
                      formData.contactNumber
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="9876543210"
                  />

                </div>

                <div className="professional-field">

                  <label htmlFor="email">
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={
                      formData.email
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="admin@school.com"
                  />

                </div>

                <div className="professional-field">

                  <label htmlFor="gstNumber">
                    GST Number
                  </label>

                  <input
                    id="gstNumber"
                    name="gstNumber"
                    value={
                      formData.gstNumber
                    }
                    onChange={
                      handleInputChange
                    }
                    maxLength={15}
                    placeholder="GSTIN, if applicable"
                  />

                </div>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="professional-form-actions">

              <button
                type="button"
                className="modal-cancel-button"
                disabled={
                  isSubmitting
                }
                onClick={
                  closeCreateModal
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="modal-submit-button"
                disabled={
                  isSubmitting
                }
              >

                {isSubmitting ? (
                  <>
                    <span className="button-spinner" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Icon
                      name="check"
                      size={16}
                    />
                    Create School
                  </>
                )}

              </button>

            </div>

          </form>

        </Modal>
      )}

    </section>
  );
}