import axios from "axios";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useState
} from "react";

import {
  createSchool,
  getSchools,
  updateSchoolStatus
} from "../../api/school.api";

import Alert from "../../components/common/Alert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";

import type {
  ApiErrorResponse,
  CreateSchoolInput,
  Pagination,
  School,
  SchoolStatus
} from "../../types/school.types";

const initialFormData: CreateSchoolInput = {
  schoolName: "",
  schoolCode: "",
  address: {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "Karnataka",
    postalCode: ""
  },
  contactPerson: "",
  contactNumber: "",
  email: "",
  gstNumber: "",
  status: "ACTIVE"
};

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

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    SchoolStatus | ""
  >("");

  const [formData, setFormData] =
    useState<CreateSchoolInput>(initialFormData);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingSchoolId, setUpdatingSchoolId] =
    useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadSchools = useCallback(async () => {
    try {
      setIsLoading(true);

      const result = await getSchools({
        search: search || undefined,
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit
      });

      setSchools(result.data);
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
    statusFilter,
    pagination.page,
    pagination.limit
  ]);

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    if (name.startsWith("address.")) {
      const addressField = name.replace(
        "address.",
        ""
      ) as keyof CreateSchoolInput["address"];

      setFormData((currentValue) => ({
        ...currentValue,
        address: {
          ...currentValue.address,
          [addressField]: value
        }
      }));

      return;
    }

    setFormData((currentValue) => ({
      ...currentValue,
      [name]: value
    }));
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPagination((currentValue) => ({
      ...currentValue,
      page: 1
    }));

    setSearch(searchInput.trim());
  }

  function handleClearFilters() {
    setSearch("");
    setSearchInput("");
    setStatusFilter("");

    setPagination((currentValue) => ({
      ...currentValue,
      page: 1
    }));
  }

  async function handleCreateSchool(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setNotification(null);

      await createSchool({
        ...formData,
        schoolName: formData.schoolName.trim(),
        schoolCode: formData.schoolCode.trim().toUpperCase(),
        contactNumber: formData.contactNumber.trim(),
        email: formData.email.trim(),
        gstNumber: formData.gstNumber.trim().toUpperCase()
      });

      setFormData(initialFormData);
      setIsModalOpen(false);

      setPagination((currentValue) => ({
        ...currentValue,
        page: 1
      }));

      setNotification({
        type: "success",
        message: "School created successfully."
      });

      await loadSchools();
    } catch (error) {
      setNotification({
        type: "error",
        message: getErrorMessage(error)
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(school: School) {
    const newStatus: SchoolStatus =
      school.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      setUpdatingSchoolId(school._id);
      setNotification(null);

      await updateSchoolStatus(school._id, newStatus);

      setNotification({
        type: "success",
        message: `${school.schoolName} marked as ${newStatus.toLowerCase()}.`
      });

      await loadSchools();
    } catch (error) {
      setNotification({
        type: "error",
        message: getErrorMessage(error)
      });
    } finally {
      setUpdatingSchoolId(null);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Schools</h1>
          <p>Create and manage schools registered in Schoolay</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => setIsModalOpen(true)}
        >
          + Add School
        </button>
      </div>

      {notification && (
        <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
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
                setSearchInput(event.target.value)
              }
              placeholder="Search by school name or code"
            />

            <button type="submit" className="secondary-button">
              Search
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              const selectedStatus = event.target.value as
                | SchoolStatus
                | "";

              setStatusFilter(selectedStatus);

              setPagination((currentValue) => ({
                ...currentValue,
                page: 1
              }));
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            type="button"
            className="text-button"
            onClick={handleClearFilters}
          >
            Clear
          </button>
        </form>

        {isLoading ? (
          <LoadingSpinner message="Loading schools..." />
        ) : schools.length === 0 ? (
          <div className="empty-state">
            <h3>No schools found</h3>
            <p>Create your first school to begin adding products.</p>
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
                    <th>Code</th>
                    <th>Contact Person</th>
                    <th>Contact Number</th>
                    <th>City</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {schools.map((school, index) => (
                    <tr key={school._id}>
                      <td>
                        {(pagination.page - 1) *
                          pagination.limit +
                          index +
                          1}
                      </td>

                      <td>
                        <div className="school-name-cell">
                          <strong>{school.schoolName}</strong>
                          <span>{school.email || "No email"}</span>
                        </div>
                      </td>

                      <td>
                        <span className="code-badge">
                          {school.schoolCode}
                        </span>
                      </td>

                      <td>{school.contactPerson || "—"}</td>

                      <td>{school.contactNumber || "—"}</td>

                      <td>{school.address?.city || "—"}</td>

                      <td>
                        <span
                          className={`status-badge ${
                            school.status === "ACTIVE"
                              ? "status-active"
                              : "status-inactive"
                          }`}
                        >
                          {school.status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="table-action-button"
                          disabled={
                            updatingSchoolId === school._id
                          }
                          onClick={() =>
                            void handleStatusChange(school)
                          }
                        >
                          {updatingSchoolId === school._id
                            ? "Updating..."
                            : school.status === "ACTIVE"
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-card-view">
              {schools.map((school) => (
                <div className="data-card school-card" key={school._id}>
                  <div className="data-card-header">
                    <div>
                      <div className="school-name">{school.schoolName}</div>
                      <div className="school-code">{school.schoolCode}</div>
                    </div>
                    <span
                      className={`badge status-badge ${
                        school.status === "ACTIVE"
                          ? "status-active"
                          : "status-inactive"
                      }`}
                    >
                      {school.status}
                    </span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">Contact Person</span>
                    <span className="value">{school.contactPerson || "—"}</span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">Contact Number</span>
                    <span className="value">{school.contactNumber || "—"}</span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">Email</span>
                    <span className="value">{school.email || "—"}</span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">City</span>
                    <span className="value">{school.address?.city || "—"}</span>
                  </div>

                  <div className="data-card-actions">
                    <button
                      type="button"
                      className="table-action-button"
                      disabled={updatingSchoolId === school._id}
                      onClick={() => void handleStatusChange(school)}
                    >
                      {updatingSchoolId === school._id
                        ? "Updating..."
                        : school.status === "ACTIVE"
                          ? "Deactivate"
                          : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pagination-section">
              <p>
                Showing {schools.length} of {pagination.total}{" "}
                schools
              </p>

              <div className="pagination-buttons">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((currentValue) => ({
                      ...currentValue,
                      page: currentValue.page - 1
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
                    setPagination((currentValue) => ({
                      ...currentValue,
                      page: currentValue.page + 1
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

      {isModalOpen && (
        <Modal
          title="Create School"
          onClose={() => {
            if (!isSubmitting) {
              setIsModalOpen(false);
            }
          }}
        >
          <form
            className="school-form"
            onSubmit={handleCreateSchool}
          >
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="schoolName">
                  School Name <span>*</span>
                </label>

                <input
                  id="schoolName"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleInputChange}
                  required
                  maxLength={150}
                  placeholder="National Centre for Excellence"
                />
              </div>

              <div className="form-field">
                <label htmlFor="schoolCode">
                  School Code <span>*</span>
                </label>

                <input
                  id="schoolCode"
                  name="schoolCode"
                  value={formData.schoolCode}
                  onChange={handleInputChange}
                  required
                  maxLength={20}
                  placeholder="NCFE"
                />
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="addressLine1">
                  Address Line 1
                </label>

                <input
                  id="addressLine1"
                  name="address.addressLine1"
                  value={formData.address.addressLine1}
                  onChange={handleInputChange}
                  placeholder="Building number and street"
                />
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="addressLine2">
                  Address Line 2
                </label>

                <input
                  id="addressLine2"
                  name="address.addressLine2"
                  value={formData.address.addressLine2}
                  onChange={handleInputChange}
                  placeholder="Area or landmark"
                />
              </div>

              <div className="form-field">
                <label htmlFor="city">City</label>

                <input
                  id="city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  placeholder="Bengaluru"
                />
              </div>

              <div className="form-field">
                <label htmlFor="state">State</label>

                <input
                  id="state"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  placeholder="Karnataka"
                />
              </div>

              <div className="form-field">
                <label htmlFor="postalCode">Postal Code</label>

                <input
                  id="postalCode"
                  name="address.postalCode"
                  value={formData.address.postalCode}
                  onChange={handleInputChange}
                  maxLength={10}
                  placeholder="560043"
                />
              </div>

              <div className="form-field">
                <label htmlFor="contactPerson">
                  Contact Person
                </label>

                <input
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  placeholder="Administrator name"
                />
              </div>

              <div className="form-field">
                <label htmlFor="contactNumber">
                  Contact Number
                </label>

                <input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                />
              </div>

              <div className="form-field">
                <label htmlFor="email">Email Address</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@school.com"
                />
              </div>

              <div className="form-field">
                <label htmlFor="gstNumber">GST Number</label>

                <input
                  id="gstNumber"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                  maxLength={15}
                  placeholder="GST number, if applicable"
                />
              </div>

              <div className="form-field">
                <label htmlFor="status">Status</label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Creating School..."
                  : "Create School"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}