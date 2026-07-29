import axios from "axios";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  createStudentSizeRecord,
  deleteStudentSizeRecord,
  downloadStudentSizeExcel,
  getStudentSizeRecordById,
  getStudentSizeRecords,
  updateStudentSizeRecord
} from "../../api/studentSizeRecord.api";

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
  Product
} from "../../types/product.types";

import type {
  ApiErrorResponse,
  Pagination,
  School
} from "../../types/school.types";

import type {
  CreateStudentSizeRecordInput,
  StudentGender,
  StudentSizeItemInput,
  StudentSizeRecord,
  StudentSizeRecordStatus,
  StudentSizeReportFilters
} from "../../types/studentSizeRecord.types";

const emptyItem: StudentSizeItemInput = {
  productId: "",
  variantId: "",
  quantity: 1,
  additionalDescription: ""
};

function getTodayDate(): string {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function createInitialForm():
  CreateStudentSizeRecordInput {
  return {
    schoolId: "",
    studentName: "",
    admissionNumber: "",
    className: "",
    section: "",
    gender: "MALE",
    parentName: "",
    contactNumber: "",
    recordDate: getTodayDate(),
    items: [
      {
        ...emptyItem
      }
    ],
    generalRemarks: "",
    status: "ACTIVE"
  };
}

const initialReportFilters:
  StudentSizeReportFilters = {
    schoolId: "",
    dateFrom: "",
    dateTo: "",
    className: "",
    section: "",
    gender: "",
    productId: ""
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
  value:
    | string
    | null
    | undefined
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

function getStatusClass(
  status: StudentSizeRecordStatus
): string {
  return status === "ACTIVE"
    ? "status-active"
    : "status-inactive";
}

export default function StudentSizeRecordsPage() {
  const [
    records,
    setRecords
  ] = useState<
    StudentSizeRecord[]
  >([]);

  const [
    schools,
    setSchools
  ] = useState<School[]>([]);

  const [
    products,
    setProducts
  ] = useState<Product[]>([]);

  const [
    reportProducts,
    setReportProducts
  ] = useState<Product[]>([]);

  const [
    selectedRecord,
    setSelectedRecord
  ] = useState<
    StudentSizeRecord | null
  >(null);

  const [
    editingRecordId,
    setEditingRecordId
  ] = useState<string | null>(
    null
  );

  const [
    formData,
    setFormData
  ] =
    useState<CreateStudentSizeRecordInput>(
      createInitialForm()
    );

  const [
    reportFilters,
    setReportFilters
  ] =
    useState<StudentSizeReportFilters>({
      ...initialReportFilters
    });

  const [
    pagination,
    setPagination
  ] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [
    searchInput,
    setSearchInput
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [
    schoolFilter,
    setSchoolFilter
  ] = useState("");

  const [
    classFilter,
    setClassFilter
  ] = useState("");

  const [
    genderFilter,
    setGenderFilter
  ] = useState<
    StudentGender | ""
  >("");

  const [
    statusFilter,
    setStatusFilter
  ] = useState<
    StudentSizeRecordStatus | ""
  >("ACTIVE");

  const [
    isLoading,
    setIsLoading
  ] = useState(true);

  const [
    isLoadingRecord,
    setIsLoadingRecord
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
    isDeleting,
    setIsDeleting
  ] = useState(false);

  const [
    isDownloading,
    setIsDownloading
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
    isReportModalOpen,
    setIsReportModalOpen
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

  const loadRecords =
    useCallback(async () => {
      try {
        setIsLoading(true);

        const result =
          await getStudentSizeRecords({
            search:
              search || undefined,

            schoolId:
              schoolFilter ||
              undefined,

            className:
              classFilter ||
              undefined,

            gender:
              genderFilter,

            status:
              statusFilter,

            page:
              pagination.page,

            limit:
              pagination.limit
          });

        setRecords(result.data);
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
      classFilter,
      genderFilter,
      statusFilter,
      pagination.page,
      pagination.limit
    ]);

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  async function loadProductsForSchool(
    schoolId: string
  ): Promise<Product[]> {
    if (!schoolId) {
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

      return result.data;
    } finally {
      setIsLoadingProducts(false);
    }
  }

  async function handleSchoolChange(
    schoolId: string
  ): Promise<void> {
    setFormData(
      (current) => ({
        ...current,
        schoolId,
        items: [
          {
            ...emptyItem
          }
        ]
      })
    );

    setProducts([]);

    if (!schoolId) {
      return;
    }

    try {
      const schoolProducts =
        await loadProductsForSchool(
          schoolId
        );

      setProducts(
        schoolProducts
      );
    } catch (error) {
      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
      });
    }
  }

  function openCreateModal(): void {
    setEditingRecordId(null);
    setSelectedRecord(null);
    setProducts([]);
    setFormData(
      createInitialForm()
    );
    setIsFormModalOpen(true);
  }

  async function openEditModal(
    id: string
  ): Promise<void> {
    try {
      setIsLoadingRecord(true);
      setIsFormModalOpen(true);

      const result =
        await getStudentSizeRecordById(
          id
        );

      const record =
        result.data;

      const schoolId =
        typeof record.schoolId ===
        "string"
          ? record.schoolId
          : record.schoolId._id;

      const schoolProducts =
        await loadProductsForSchool(
          schoolId
        );

      setProducts(
        schoolProducts
      );

      setEditingRecordId(id);

      setFormData({
        schoolId,
        studentName:
          record.studentName,

        admissionNumber:
          record.admissionNumber ??
          "",

        className:
          record.className,

        section:
          record.section ?? "",

        gender:
          record.gender,

        parentName:
          record.parentName ?? "",

        contactNumber:
          record.contactNumber ??
          "",

        recordDate:
          record.recordDate
            ? new Date(
                record.recordDate
              )
                .toISOString()
                .slice(0, 10)
            : getTodayDate(),

        items:
          record.items.map(
            (item) => ({
              productId:
                typeof item.productId ===
                "string"
                  ? item.productId
                  : String(
                      item.productId
                    ),

              variantId:
                typeof item.variantId ===
                "string"
                  ? item.variantId
                  : String(
                      item.variantId
                    ),

              quantity:
                item.quantity,

              additionalDescription:
                item.additionalDescription ??
                ""
            })
          ),

        generalRemarks:
          record.generalRemarks ??
          "",

        status:
          record.status
      });
    } catch (error) {
      setIsFormModalOpen(false);

      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
      });
    } finally {
      setIsLoadingRecord(false);
    }
  }

  async function openViewModal(
    id: string
  ): Promise<void> {
    try {
      setIsLoadingRecord(true);
      setIsViewModalOpen(true);
      setSelectedRecord(null);

      const result =
        await getStudentSizeRecordById(
          id
        );

      setSelectedRecord(
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
      setIsLoadingRecord(false);
    }
  }

  function openDeleteModal(
    record: StudentSizeRecord
  ): void {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  }

  function updateFormField<
    Key extends keyof CreateStudentSizeRecordInput
  >(
    field: Key,
    value:
      CreateStudentSizeRecordInput[Key]
  ): void {
    setFormData(
      (current) => ({
        ...current,
        [field]: value
      })
    );
  }

  function updateItem(
    index: number,
    changes:
      Partial<StudentSizeItemInput>
  ): void {
    setFormData(
      (current) => ({
        ...current,

        items:
          current.items.map(
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

  function addItem(): void {
    setFormData(
      (current) => ({
        ...current,

        items: [
          ...current.items,
          {
            ...emptyItem
          }
        ]
      })
    );
  }

  function removeItem(
    index: number
  ): void {
    setFormData(
      (current) => ({
        ...current,

        items:
          current.items.length ===
          1
            ? current.items
            : current.items.filter(
                (
                  _item,
                  itemIndex
                ) =>
                  itemIndex !==
                  index
              )
      })
    );
  }

  function validateForm():
    string | null {
    if (!formData.schoolId) {
      return "Select a school.";
    }

    if (
      formData.studentName
        .trim()
        .length < 2
    ) {
      return "Enter the student name.";
    }

    if (
      !formData.className.trim()
    ) {
      return "Enter the class.";
    }

    if (
      formData.items.length === 0
    ) {
      return "Add at least one product.";
    }

    for (
      let index = 0;
      index <
      formData.items.length;
      index += 1
    ) {
      const item =
        formData.items[index];

      if (!item.productId) {
        return `Select product for item ${
          index + 1
        }.`;
      }

      if (!item.variantId) {
        return `Select size for item ${
          index + 1
        }.`;
      }

      if (
        !Number.isInteger(
          item.quantity
        ) ||
        item.quantity < 1
      ) {
        return `Enter a valid quantity for item ${
          index + 1
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
      CreateStudentSizeRecordInput = {
      ...formData,

      studentName:
        formData.studentName.trim(),

      admissionNumber:
        formData.admissionNumber.trim(),

      className:
        formData.className.trim(),

      section:
        formData.section.trim(),

      parentName:
        formData.parentName.trim(),

      contactNumber:
        formData.contactNumber.trim(),

      items:
        formData.items.map(
          (item) => ({
            ...item,

            additionalDescription:
              item.additionalDescription.trim()
          })
        ),

      generalRemarks:
        formData.generalRemarks.trim()
    };

    try {
      setIsSubmitting(true);
      setNotification(null);

      if (editingRecordId) {
        await updateStudentSizeRecord(
          editingRecordId,
          payload
        );

        setNotification({
          type: "success",
          message:
            "Student size record updated successfully."
        });
      } else {
        await createStudentSizeRecord(
          payload
        );

        setNotification({
          type: "success",
          message:
            "Student size record created successfully."
        });
      }

      setIsFormModalOpen(false);
      setEditingRecordId(null);
      setFormData(
        createInitialForm()
      );

      await loadRecords();
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

  async function confirmDelete():
    Promise<void> {
    if (!selectedRecord) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteStudentSizeRecord(
        selectedRecord._id
      );

      setNotification({
        type: "success",
        message:
          "Student size record deleted successfully."
      });

      setIsDeleteModalOpen(false);
      setSelectedRecord(null);

      await loadRecords();
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

  function handleSearchSubmit(
    event:
      FormEvent<HTMLFormElement>
  ): void {
    event.preventDefault();

    setPagination(
      (current) => ({
        ...current,
        page: 1
      })
    );

    setSearch(
      searchInput.trim()
    );
  }

  async function handleReportSchoolChange(
    schoolId: string
  ): Promise<void> {
    setReportFilters(
      (current) => ({
        ...current,
        schoolId,
        productId: ""
      })
    );

    setReportProducts([]);

    if (!schoolId) {
      return;
    }

    try {
      const schoolProducts =
        await loadProductsForSchool(
          schoolId
        );

      setReportProducts(
        schoolProducts
      );
    } catch (error) {
      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
      });
    }
  }

  function validateReportFilters():
    string | null {
    if (
      !reportFilters.schoolId
    ) {
      return "Select a school for the report.";
    }

    if (
      reportFilters.dateFrom &&
      reportFilters.dateTo
    ) {
      const start =
        new Date(
          reportFilters.dateFrom
        );

      const end =
        new Date(
          reportFilters.dateTo
        );

      if (
        start.getTime() >
        end.getTime()
      ) {
        return "From date cannot be after To date.";
      }
    }

    return null;
  }

  async function handleExcelDownload():
    Promise<void> {
    const validationError =
      validateReportFilters();

    if (validationError) {
      setNotification({
        type: "error",
        message:
          validationError
      });

      return;
    }

    try {
      setIsDownloading(true);

      await downloadStudentSizeExcel(
        reportFilters
      );

      setNotification({
        type: "success",
        message:
          "Student size report downloaded successfully."
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

  const selectedSchool =
    useMemo(
      () =>
        schools.find(
          (school) =>
            school._id ===
            formData.schoolId
        ),
      [
        schools,
        formData.schoolId
      ]
    );

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>
            Student Size Records
          </h1>

          <p>
            Maintain student-wise
            standard product sizes
            separately from billing and
            production
          </p>
        </div>

        <div className="page-heading-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setReportFilters({
                ...initialReportFilters
              });

              setReportProducts([]);
              setIsReportModalOpen(
                true
              );
            }}
          >
            Reports
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={openCreateModal}
          >
            + Add Size Record
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

      <div className="content-card">
        <form
          className="filter-section student-size-filter-section"
          onSubmit={
            handleSearchSubmit
          }
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
              placeholder="Student, admission no., school or contact"
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

            {schools.map(
              (school) => (
                <option
                  key={school._id}
                  value={school._id}
                >
                  {
                    school.schoolName
                  }
                </option>
              )
            )}
          </select>

          <input
            value={classFilter}
            onChange={(event) => {
              setClassFilter(
                event.target.value
              );

              setPagination(
                (current) => ({
                  ...current,
                  page: 1
                })
              );
            }}
            placeholder="Filter by class"
          />

          <select
            value={genderFilter}
            onChange={(event) => {
              setGenderFilter(
                event.target
                  .value as
                  | StudentGender
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
                event.target
                  .value as
                  | StudentSizeRecordStatus
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

            <option value="ACTIVE">
              Active
            </option>

            <option value="INACTIVE">
              Inactive
            </option>
          </select>
        </form>

        {isLoading ? (
          <LoadingSpinner message="Loading student size records..." />
        ) : records.length === 0 ? (
          <div className="empty-state">
            <h3>
              No student size records
              found
            </h3>

            <p>
              Add a student and select
              their standard product
              sizes.
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Date</th>
                    <th>Student</th>
                    <th>School</th>
                    <th>Class</th>
                    <th>Gender</th>
                    <th>Products</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map(
                    (
                      record,
                      index
                    ) => (
                      <tr
                        key={
                          record._id
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
                          {formatDate(
                            record.recordDate
                          )}
                        </td>

                        <td>
                          <div className="school-name-cell">
                            <strong>
                              {
                                record.studentName
                              }
                            </strong>

                            <span>
                              {record.admissionNumber ||
                                "No admission number"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="school-name-cell">
                            <strong>
                              {
                                record.schoolCode
                              }
                            </strong>

                            <span>
                              {
                                record.schoolName
                              }
                            </span>
                          </div>
                        </td>

                        <td>
                          {
                            record.className
                          }

                          {record.section
                            ? ` - ${record.section}`
                            : ""}
                        </td>

                        <td>
                          {formatLabel(
                            record.gender
                          )}
                        </td>

                        <td>
                          <strong>
                            {
                              record.items
                                .length
                            }
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`status-badge ${getStatusClass(
                              record.status
                            )}`}
                          >
                            {formatLabel(
                              record.status
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="invoice-actions">
                            <button
                              type="button"
                              className="invoice-action-button"
                              onClick={() =>
                                void openViewModal(
                                  record._id
                                )
                              }
                            >
                              View
                            </button>

                            <button
                              type="button"
                              className="invoice-action-button"
                              onClick={() =>
                                void openEditModal(
                                  record._id
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="invoice-action-button invoice-action-danger"
                              onClick={() =>
                                openDeleteModal(
                                  record
                                )
                              }
                            >
                              Delete
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
                Showing {records.length} of{" "}
                {pagination.total} records
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
                          current.page -
                          1
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
            editingRecordId
              ? "Edit Student Size Record"
              : "Add Student Size Record"
          }
          onClose={() => {
            if (!isSubmitting) {
              setIsFormModalOpen(
                false
              );
            }
          }}
        >
          {isLoadingRecord ? (
            <LoadingSpinner message="Loading record..." />
          ) : (
            <form
              onSubmit={(event) =>
                void submitForm(
                  event
                )
              }
            >
              <div className="student-size-form-section">
                <h3>
                  Student Details
                </h3>

                <div className="form-grid">
                  <div className="form-field form-field-full">
                    <label htmlFor="sizeRecordSchool">
                      School{" "}
                      <span>*</span>
                    </label>

                    <select
                      id="sizeRecordSchool"
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
                    <label htmlFor="sizeStudentName">
                      Student Name{" "}
                      <span>*</span>
                    </label>

                    <input
                      id="sizeStudentName"
                      value={
                        formData.studentName
                      }
                      onChange={(event) =>
                        updateFormField(
                          "studentName",
                          event.target
                            .value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="sizeAdmissionNumber">
                      Admission Number
                    </label>

                    <input
                      id="sizeAdmissionNumber"
                      value={
                        formData.admissionNumber
                      }
                      onChange={(event) =>
                        updateFormField(
                          "admissionNumber",
                          event.target
                            .value
                        )
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="sizeClassName">
                      Class{" "}
                      <span>*</span>
                    </label>

                    <input
                      id="sizeClassName"
                      value={
                        formData.className
                      }
                      onChange={(event) =>
                        updateFormField(
                          "className",
                          event.target
                            .value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="sizeSection">
                      Section
                    </label>

                    <input
                      id="sizeSection"
                      value={
                        formData.section
                      }
                      onChange={(event) =>
                        updateFormField(
                          "section",
                          event.target
                            .value
                        )
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="sizeGender">
                      Gender{" "}
                      <span>*</span>
                    </label>

                    <select
                      id="sizeGender"
                      value={
                        formData.gender
                      }
                      onChange={(event) =>
                        updateFormField(
                          "gender",
                          event.target
                            .value as StudentGender
                        )
                      }
                    >
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
                    <label htmlFor="sizeRecordDate">
                      Record Date{" "}
                      <span>*</span>
                    </label>

                    <input
                      id="sizeRecordDate"
                      type="date"
                      value={
                        formData.recordDate
                      }
                      onChange={(event) =>
                        updateFormField(
                          "recordDate",
                          event.target
                            .value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="sizeParentName">
                      Parent Name
                    </label>

                    <input
                      id="sizeParentName"
                      value={
                        formData.parentName
                      }
                      onChange={(event) =>
                        updateFormField(
                          "parentName",
                          event.target
                            .value
                        )
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="sizeContactNumber">
                      Contact Number
                    </label>

                    <input
                      id="sizeContactNumber"
                      value={
                        formData.contactNumber
                      }
                      onChange={(event) =>
                        updateFormField(
                          "contactNumber",
                          event.target
                            .value
                        )
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="sizeRecordStatus">
                      Status
                    </label>

                    <select
                      id="sizeRecordStatus"
                      value={
                        formData.status
                      }
                      onChange={(event) =>
                        updateFormField(
                          "status",
                          event.target
                            .value as StudentSizeRecordStatus
                        )
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

              <div className="student-size-form-section">
                <div className="student-size-section-heading">
                  <div>
                    <h3>
                      Products and Sizes
                    </h3>

                    <p>
                      Products are loaded
                      from{" "}
                      {selectedSchool
                        ?.schoolName ??
                        "the selected school"}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={
                      !formData.schoolId
                    }
                    onClick={addItem}
                  >
                    + Add Product
                  </button>
                </div>

                <div className="student-size-items">
                  {formData.items.map(
                    (
                      item,
                      index
                    ) => {
                      const selectedProduct =
                        products.find(
                          (
                            product
                          ) =>
                            product._id ===
                            item.productId
                        );

                      return (
                        <article
                          className="student-size-item-card"
                          key={index}
                        >
                          <div className="student-size-item-header">
                            <strong>
                              Product{" "}
                              {index + 1}
                            </strong>

                            <button
                              type="button"
                              className="text-button text-danger"
                              disabled={
                                formData
                                  .items
                                  .length ===
                                1
                              }
                              onClick={() =>
                                removeItem(
                                  index
                                )
                              }
                            >
                              Remove
                            </button>
                          </div>

                          <div className="form-grid">
                            <div className="form-field">
                              <label>
                                Product{" "}
                                <span>*</span>
                              </label>

                              <select
                                value={
                                  item.productId
                                }
                                disabled={
                                  !formData.schoolId ||
                                  isLoadingProducts
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItem(
                                    index,
                                    {
                                      productId:
                                        event
                                          .target
                                          .value,

                                      variantId:
                                        ""
                                    }
                                  )
                                }
                                required
                              >
                                <option value="">
                                  {isLoadingProducts
                                    ? "Loading..."
                                    : "Select product"}
                                </option>

                                {products.map(
                                  (
                                    product
                                  ) => (
                                    <option
                                      key={
                                        product._id
                                      }
                                      value={
                                        product._id
                                      }
                                    >
                                      {
                                        product.productName
                                      }{" "}
                                      (
                                      {
                                        product.gender
                                      }
                                      )
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            <div className="form-field">
                              <label>
                                Standard Size{" "}
                                <span>*</span>
                              </label>

                              <select
                                value={
                                  item.variantId
                                }
                                disabled={
                                  !selectedProduct
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItem(
                                    index,
                                    {
                                      variantId:
                                        event
                                          .target
                                          .value
                                    }
                                  )
                                }
                                required
                              >
                                <option value="">
                                  Select size
                                </option>

                                {selectedProduct
                                  ?.variants
                                  .filter(
                                    (
                                      variant
                                    ) =>
                                      variant.status ===
                                      "ACTIVE"
                                  )
                                  .map(
                                    (
                                      variant
                                    ) => (
                                      <option
                                        key={
                                          variant._id
                                        }
                                        value={
                                          variant._id
                                        }
                                      >
                                        {
                                          variant.size
                                        }
                                      </option>
                                    )
                                  )}
                              </select>
                            </div>

                            <div className="form-field">
                              <label>
                                Quantity{" "}
                                <span>*</span>
                              </label>

                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={
                                  item.quantity
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItem(
                                    index,
                                    {
                                      quantity:
                                        Number(
                                          event
                                            .target
                                            .value
                                        ) ||
                                        1
                                    }
                                  )
                                }
                                required
                              />
                            </div>

                            <div className="form-field form-field-full">
                              <label>
                                Additional
                                Description
                              </label>

                              <textarea
                                rows={3}
                                value={
                                  item.additionalDescription
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateItem(
                                    index,
                                    {
                                      additionalDescription:
                                        event
                                          .target
                                          .value
                                    }
                                  )
                                }
                                placeholder="Optional custom size or measurement notes"
                              />
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="sizeGeneralRemarks">
                  General Remarks
                </label>

                <textarea
                  id="sizeGeneralRemarks"
                  rows={3}
                  value={
                    formData.generalRemarks
                  }
                  onChange={(event) =>
                    updateFormField(
                      "generalRemarks",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={
                    isSubmitting
                  }
                  onClick={() =>
                    setIsFormModalOpen(
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
                    ? "Saving..."
                    : editingRecordId
                      ? "Update Record"
                      : "Save Record"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {isViewModalOpen && (
        <Modal
          title="Student Size Record"
          onClose={() =>
            setIsViewModalOpen(
              false
            )
          }
        >
          {isLoadingRecord ||
          !selectedRecord ? (
            <LoadingSpinner message="Loading record..." />
          ) : (
            <div>
              <div className="student-size-view-grid">
                <div>
                  <span>
                    Student
                  </span>

                  <strong>
                    {
                      selectedRecord.studentName
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Admission Number
                  </span>

                  <strong>
                    {selectedRecord.admissionNumber ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    School
                  </span>

                  <strong>
                    {
                      selectedRecord.schoolName
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Class
                  </span>

                  <strong>
                    {
                      selectedRecord.className
                    }

                    {selectedRecord.section
                      ? ` - ${selectedRecord.section}`
                      : ""}
                  </strong>
                </div>

                <div>
                  <span>
                    Gender
                  </span>

                  <strong>
                    {formatLabel(
                      selectedRecord.gender
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Record Date
                  </span>

                  <strong>
                    {formatDate(
                      selectedRecord.recordDate
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Parent
                  </span>

                  <strong>
                    {selectedRecord.parentName ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Contact
                  </span>

                  <strong>
                    {selectedRecord.contactNumber ||
                      "—"}
                  </strong>
                </div>
              </div>

              <h3>
                Products and Sizes
              </h3>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>S.No.</th>
                      <th>Product</th>
                      <th>Gender</th>
                      <th>Size</th>
                      <th>Quantity</th>
                      <th>
                        Additional
                        Description
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedRecord.items.map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={
                            item._id
                          }
                        >
                          <td>
                            {index + 1}
                          </td>

                          <td>
                            <strong>
                              {
                                item.productName
                              }
                            </strong>

                            <div>
                              {
                                item.productCode
                              }
                            </div>
                          </td>

                          <td>
                            {formatLabel(
                              item.gender
                            )}
                          </td>

                          <td>
                            <strong>
                              {
                                item.size
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              item.quantity
                            }
                          </td>

                          <td>
                            {item.additionalDescription ||
                              "—"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {selectedRecord.generalRemarks && (
                <div className="student-size-remarks">
                  <strong>
                    General Remarks
                  </strong>

                  <p>
                    {
                      selectedRecord.generalRemarks
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {isDeleteModalOpen &&
        selectedRecord && (
        <Modal
          title="Delete Student Size Record"
          onClose={() => {
            if (!isDeleting) {
              setIsDeleteModalOpen(
                false
              );
            }
          }}
        >
          <p>
            Delete the size record for{" "}
            <strong>
              {
                selectedRecord.studentName
              }
            </strong>
            ?
          </p>

          <p>
            This action cannot be
            undone.
          </p>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={isDeleting}
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
              disabled={isDeleting}
              onClick={() =>
                void confirmDelete()
              }
            >
              {isDeleting
                ? "Deleting..."
                : "Delete Record"}
            </button>
          </div>
        </Modal>
      )}

      {isReportModalOpen && (
        <Modal
          title="Student Size Reports"
          onClose={() => {
            if (!isDownloading) {
              setIsReportModalOpen(
                false
              );
            }
          }}
        >
          <div className="form-grid">
            <div className="form-field form-field-full">
              <label>
                School{" "}
                <span>*</span>
              </label>

              <select
                value={
                  reportFilters.schoolId
                }
                onChange={(event) =>
                  void handleReportSchoolChange(
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
              <label>
                From Date
              </label>

              <input
                type="date"
                value={
                  reportFilters.dateFrom
                }
                onChange={(event) =>
                  setReportFilters(
                    (current) => ({
                      ...current,

                      dateFrom:
                        event
                          .target
                          .value
                    })
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>
                To Date
              </label>

              <input
                type="date"
                value={
                  reportFilters.dateTo
                }
                onChange={(event) =>
                  setReportFilters(
                    (current) => ({
                      ...current,

                      dateTo:
                        event
                          .target
                          .value
                    })
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>Class</label>

              <input
                value={
                  reportFilters.className
                }
                onChange={(event) =>
                  setReportFilters(
                    (current) => ({
                      ...current,

                      className:
                        event
                          .target
                          .value
                    })
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>
                Section
              </label>

              <input
                value={
                  reportFilters.section
                }
                onChange={(event) =>
                  setReportFilters(
                    (current) => ({
                      ...current,

                      section:
                        event
                          .target
                          .value
                    })
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>
                Gender
              </label>

              <select
                value={
                  reportFilters.gender
                }
                onChange={(event) =>
                  setReportFilters(
                    (current) => ({
                      ...current,

                      gender:
                        event
                          .target
                          .value as
                          | StudentGender
                          | ""
                    })
                  )
                }
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

            <div className="form-field">
              <label>
                Product
              </label>

              <select
                value={
                  reportFilters.productId
                }
                disabled={
                  !reportFilters.schoolId
                }
                onChange={(event) =>
                  setReportFilters(
                    (current) => ({
                      ...current,

                      productId:
                        event
                          .target
                          .value
                    })
                  )
                }
              >
                <option value="">
                  All products
                </option>

                {reportProducts.map(
                  (product) => (
                    <option
                      key={
                        product._id
                      }
                      value={
                        product._id
                      }
                    >
                      {
                        product.productName
                      }
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="student-size-report-note">
            The Excel workbook will
            contain one Student Summary
            sheet and a separate sheet
            for every product.
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={
                isDownloading
              }
              onClick={() =>
                setIsReportModalOpen(
                  false
                )
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="primary-button"
              disabled={
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
          </div>
        </Modal>
      )}
    </section>
  );
}