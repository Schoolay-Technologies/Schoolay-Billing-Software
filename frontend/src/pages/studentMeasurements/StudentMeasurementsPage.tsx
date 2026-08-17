import axios from "axios";

import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  createStudentMeasurement,
  deleteStudentMeasurement,
  downloadStudentMeasurementExcel,
  getStudentMeasurementById,
  getStudentMeasurements,
  updateStudentMeasurement,
  uploadStudentPhoto
} from "../../api/studentMeasurement.api";

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

import {
  STUDENT_SIZE_CHART
} from "../../constants/studentSizeChart";

import type {
  Product
} from "../../types/product.types";

import type {
  ApiErrorResponse,
  Pagination,
  School
} from "../../types/school.types";

import type {
  BodyMeasurements,
  MeasurementRecordStatus,
  SizeMode,
  SizeSelectionMode,
  StudentGender,
  StudentMeasurementInput,
  StudentMeasurementItemInput,
  StudentMeasurementRecord,
  StudentMeasurementReportFilters,
  StudentPhoto
} from "../../types/studentMeasurement.types";

import {
  recommendStudentSize
} from "../../utils/recommendStudentSize";

const emptyPhoto: StudentPhoto = {
  url: "",
  publicId: "",
  width: 0,
  height: 0
};

const emptyMeasurements: BodyMeasurements = {
  height: undefined,
  chest: undefined,
  waist: undefined,
  hip: undefined,
  shoulder: undefined,
  sleeve: undefined,
  shirtLength: undefined,
  pantLength: undefined,
  inseam: undefined,
  neck: undefined
};

const emptyItem: StudentMeasurementItemInput = {
  productId: "",
  quantity: 1,
  sizeMode: "STANDARD",
  sizeSelectionMode: "RECOMMENDED",
  manualOverrideSize: "",
  customSize: "",
  remarks: ""
};

const emptyPagination: Pagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
};

const emptyReportFilters:
  StudentMeasurementReportFilters = {
    schoolId: "",
    dateFrom: "",
    dateTo: "",
    className: "",
    section: "",
    gender: "",
    academicYear: "",
    productId: "",
    size: ""
  };

const measurementFields: Array<{
  key: keyof BodyMeasurements;
  label: string;
  unit: string;
  placeholder: string;
}> = [
  {
    key: "height",
    label: "Height",
    unit: "cm",
    placeholder: "Example: 145"
  },
  {
    key: "chest",
    label: "Chest",
    unit: "inches",
    placeholder: "Example: 29"
  },
  {
    key: "waist",
    label: "Waist",
    unit: "inches",
    placeholder: "Example: 27"
  },
  {
    key: "hip",
    label: "Hip",
    unit: "inches",
    placeholder: "Example: 30"
  },
  {
    key: "shoulder",
    label: "Shoulder",
    unit: "inches",
    placeholder: "Example: 13"
  },
  {
    key: "sleeve",
    label: "Sleeve Length",
    unit: "inches",
    placeholder: "Example: 19"
  },
  {
    key: "shirtLength",
    label: "Shirt Length",
    unit: "inches",
    placeholder: "Example: 24"
  },
  {
    key: "pantLength",
    label: "Pant Length",
    unit: "inches",
    placeholder: "Example: 36"
  },
  {
    key: "inseam",
    label: "Inseam",
    unit: "inches",
    placeholder: "Example: 26"
  },
  {
    key: "neck",
    label: "Neck",
    unit: "inches",
    placeholder: "Example: 13.5"
  }
];

function getTodayDate(): string {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function getCurrentAcademicYear(): string {
  const currentDate =
    new Date();

  const currentYear =
    currentDate.getFullYear();

  const currentMonth =
    currentDate.getMonth() + 1;

  if (currentMonth >= 4) {
    return `${currentYear}-${String(
      currentYear + 1
    ).slice(-2)}`;
  }

  return `${currentYear - 1}-${String(
    currentYear
  ).slice(-2)}`;
}

function createInitialForm():
  StudentMeasurementInput {
  return {
    schoolId: "",
    studentName: "",
    mobileNumber: "",
    studentId: "",
    className: "",
    section: "",
    gender: "MALE",
    academicYear:
      getCurrentAcademicYear(),

    photo: {
      ...emptyPhoto
    },

    measurements: {
      ...emptyMeasurements
    },

    measurementDate:
      getTodayDate(),

    items: [
      {
        ...emptyItem
      }
    ],

    generalRemarks: "",
    status: "ACTIVE"
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

function formatLabel(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return "Not specified";
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
      month: "2-digit",
      year: "numeric"
    }
  );
}

function getSchoolId(
  schoolId:
    StudentMeasurementRecord["schoolId"]
): string {
  return typeof schoolId === "string"
    ? schoolId
    : schoolId._id;
}

function getProductId(
  productId:
    StudentMeasurementRecord["items"][number]["productId"]
): string {
  return typeof productId === "string"
    ? productId
    : productId._id;
}

function getStatusClass(
  status:
    MeasurementRecordStatus
): string {
  return status === "ACTIVE"
    ? "status-active"
    : "status-inactive";
}

function revokePreviewUrl(
  value: string
): void {
  if (
    value.startsWith("blob:")
  ) {
    URL.revokeObjectURL(value);
  }
}

export default function StudentMeasurementsPage() {
  const cameraInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const galleryInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    records,
    setRecords
  ] = useState<
    StudentMeasurementRecord[]
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
    StudentMeasurementRecord | null
  >(null);

  const [
    editingRecordId,
    setEditingRecordId
  ] = useState<
    string | null
  >(null);

  const [
    formData,
    setFormData
  ] = useState<
    StudentMeasurementInput
  >(
    createInitialForm()
  );

  const [
    reportFilters,
    setReportFilters
  ] = useState<
    StudentMeasurementReportFilters
  >({
    ...emptyReportFilters
  });

  const [
    pagination,
    setPagination
  ] = useState<Pagination>({
    ...emptyPagination
  });

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
    classFilter,
    setClassFilter
  ] = useState("");

  const [
    academicYearFilter,
    setAcademicYearFilter
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
    MeasurementRecordStatus | ""
  >("ACTIVE");

  const [
    pendingPhotoFile,
    setPendingPhotoFile
  ] = useState<
    File | null
  >(null);

  const [
    pendingPhotoPreview,
    setPendingPhotoPreview
  ] = useState("");

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
    isUploadingPhoto,
    setIsUploadingPhoto
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
    isPhotoConfirmOpen,
    setIsPhotoConfirmOpen
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

  const recommendation =
    useMemo(
      () =>
        recommendStudentSize(
          formData.measurements
        ),
      [formData.measurements]
    );

  const availableSizes =
    useMemo(
      () =>
        STUDENT_SIZE_CHART.map(
          (item) => item.size
        ),
      []
    );

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

  const loadRecords =
    useCallback(async () => {
      try {
        setIsLoading(true);

        const result =
          await getStudentMeasurements({
            search:
              search || undefined,

            schoolId:
              schoolFilter ||
              undefined,

            className:
              classFilter ||
              undefined,

            academicYear:
              academicYearFilter ||
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

        setRecords(
          result.data
        );

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
      academicYearFilter,
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

  useEffect(() => {
    return () => {
      revokePreviewUrl(
        pendingPhotoPreview
      );
    };
  }, [pendingPhotoPreview]);

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

    setPendingPhotoFile(null);
    setPendingPhotoPreview("");

    setIsFormModalOpen(true);
  }

  async function openEditModal(
    id: string
  ): Promise<void> {
    try {
      setIsLoadingRecord(true);
      setIsFormModalOpen(true);

      const result =
        await getStudentMeasurementById(
          id
        );

      const record =
        result.data;

      const schoolId =
        getSchoolId(
          record.schoolId
        );

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

        studentId:
          record.studentId,

        mobileNumber:
          record.mobileNumber || "",

        className:
          record.className,

        section:
          record.section ?? "",

        gender:
          record.gender,

        academicYear:
          record.academicYear,

        photo: {
          url:
            record.photo?.url ?? "",

          publicId:
            record.photo?.publicId ??
            "",

          width:
            record.photo?.width ?? 0,

          height:
            record.photo?.height ?? 0
        },

        measurements: {
          height:
            record.measurements
              ?.height,

          chest:
            record.measurements
              ?.chest,

          waist:
            record.measurements
              ?.waist,

          hip:
            record.measurements
              ?.hip,

          shoulder:
            record.measurements
              ?.shoulder,

          sleeve:
            record.measurements
              ?.sleeve,

          shirtLength:
            record.measurements
              ?.shirtLength,

          pantLength:
            record.measurements
              ?.pantLength,

          inseam:
            record.measurements
              ?.inseam,

          neck:
            record.measurements
              ?.neck
        },

        measurementDate:
          record.measurementDate
            ? new Date(
                record.measurementDate
              )
                .toISOString()
                .slice(0, 10)
            : getTodayDate(),

        items:
          record.items.map(
            (item) => ({
              productId:
                getProductId(
                  item.productId
                ),

              quantity:
                item.quantity,

              sizeMode:
                item.sizeMode,

              sizeSelectionMode:
                item.sizeSelectionMode,

              manualOverrideSize:
                item.manualOverrideSize ??
                "",

              customSize:
                item.sizeMode ===
                "CUSTOM"
                  ? item.finalSize
                  : "",

              remarks:
                item.remarks ?? ""
            })
          ),

        generalRemarks:
          record.generalRemarks ??
          "",

        status:
          record.status
      });

      setPendingPhotoFile(null);
      setPendingPhotoPreview("");
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
      setSelectedRecord(null);
      setIsViewModalOpen(true);

      const result =
        await getStudentMeasurementById(
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
    record:
      StudentMeasurementRecord
  ): void {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  }

  function updateFormField<
    Key extends keyof StudentMeasurementInput
  >(
    field: Key,
    value:
      StudentMeasurementInput[Key]
  ): void {
    setFormData(
      (current) => ({
        ...current,
        [field]: value
      })
    );
  }

  function updateMeasurement(
    field:
      keyof BodyMeasurements,
    value: string
  ): void {
    const parsedValue =
      value.trim() === ""
        ? undefined
        : Number(value);

    setFormData(
      (current) => ({
        ...current,

        measurements: {
          ...current.measurements,

          [field]:
            parsedValue ===
              undefined ||
            Number.isFinite(
              parsedValue
            )
              ? parsedValue
              : undefined
        }
      })
    );
  }

  function updateItem(
    index: number,
    changes:
      Partial<StudentMeasurementItemInput>
  ): void {
    setFormData(
      (current) => ({
        ...current,

        items:
          current.items.map(
            (
              item,
              itemIndex
            ) =>
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

  function handlePhotoSelected(
    event:
      ChangeEvent<HTMLInputElement>
  ): void {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setNotification({
        type: "error",
        message:
          "Please select a valid image."
      });

      return;
    }

    const maximumSize =
      5 * 1024 * 1024;

    if (
      file.size >
      maximumSize
    ) {
      setNotification({
        type: "error",
        message:
          "Student photo cannot exceed 5 MB."
      });

      return;
    }

    revokePreviewUrl(
      pendingPhotoPreview
    );

    const previewUrl =
      URL.createObjectURL(file);

    setPendingPhotoFile(file);

    setPendingPhotoPreview(
      previewUrl
    );

    setIsPhotoConfirmOpen(true);
  }

  function handleRetakePhoto(): void {
    setIsPhotoConfirmOpen(false);

    setPendingPhotoFile(null);

    revokePreviewUrl(
      pendingPhotoPreview
    );

    setPendingPhotoPreview("");

    cameraInputRef.current?.click();
  }

  function cancelPendingPhoto(): void {
    setIsPhotoConfirmOpen(false);

    setPendingPhotoFile(null);

    revokePreviewUrl(
      pendingPhotoPreview
    );

    setPendingPhotoPreview("");
  }

  async function confirmAndUploadPhoto():
    Promise<void> {
    if (!pendingPhotoFile) {
      return;
    }

    try {
      setIsUploadingPhoto(true);

      const uploadedPhoto =
        await uploadStudentPhoto(
          pendingPhotoFile
        );

      setFormData(
        (current) => ({
          ...current,
          photo:
            uploadedPhoto
        })
      );

      setNotification({
        type: "success",
        message:
          "Student photo uploaded successfully."
      });

      setIsPhotoConfirmOpen(false);
      setPendingPhotoFile(null);

      revokePreviewUrl(
        pendingPhotoPreview
      );

      setPendingPhotoPreview("");
    } catch (error) {
      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  function removeCurrentPhoto(): void {
    setFormData(
      (current) => ({
        ...current,

        photo: {
          ...emptyPhoto
        }
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
      !formData.studentId.trim()
    ) {
      return "Enter the student ID.";
    }

    if (
      !formData.className.trim()
    ) {
      return "Enter the class.";
    }

    if (
      !formData.academicYear.trim()
    ) {
      return "Enter the academic year.";
    }

    const hasMeasurement =
      Object.values(
        formData.measurements
      ).some(
        (value) =>
          typeof value ===
            "number" &&
          Number.isFinite(value) &&
          value > 0
      );

    if (!hasMeasurement) {
      return "Enter at least one body measurement.";
    }

    if (
      formData.items.length === 0
    ) {
      return "Add at least one uniform item.";
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
        return `Select a product for item ${
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

      if (
        item.sizeMode ===
          "STANDARD" &&
        item.sizeSelectionMode ===
          "RECOMMENDED" &&
        !recommendation.recommendedSize
      ) {
        return `A recommended size is not available for item ${
          index + 1
        }. Select manual override.`;
      }

      if (
        item.sizeMode ===
          "STANDARD" &&
        item.sizeSelectionMode ===
          "MANUAL_OVERRIDE" &&
        !item.manualOverrideSize.trim()
      ) {
        return `Select the manual override size for item ${
          index + 1
        }.`;
      }

      if (
        item.sizeMode ===
          "CUSTOM" &&
        !item.customSize.trim()
      ) {
        return `Enter the custom size for item ${
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
      StudentMeasurementInput = {
      ...formData,

      studentName:
        formData.studentName.trim(),

      studentId:
        formData.studentId.trim(),

      mobileNumber:
        formData.mobileNumber.trim(),

      className:
        formData.className.trim(),

      section:
        formData.section.trim(),

      academicYear:
        formData.academicYear.trim(),

      items:
        formData.items.map(
          (item) => ({
            ...item,

            manualOverrideSize:
              item.manualOverrideSize.trim(),

            customSize:
              item.customSize.trim(),

            remarks:
              item.remarks.trim()
          })
        ),

      generalRemarks:
        formData.generalRemarks.trim()
    };

    try {
      setIsSubmitting(true);
      setNotification(null);

      if (editingRecordId) {
        await updateStudentMeasurement(
          editingRecordId,
          payload
        );

        setNotification({
          type: "success",
          message:
            "Student measurement record updated successfully."
        });
      } else {
        await createStudentMeasurement(
          payload
        );

        setNotification({
          type: "success",
          message:
            "Student measurement record created successfully."
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

      await deleteStudentMeasurement(
        selectedRecord._id
      );

      setNotification({
        type: "success",
        message:
          "Student measurement record deleted successfully."
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

      await downloadStudentMeasurementExcel(
        reportFilters
      );

      setNotification({
        type: "success",
        message:
          "Student measurement report downloaded successfully."
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

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>
            Student Measurements
          </h1>

          <p>
            Capture student photos, store
            body measurements and assign
            recommended or manually
            overridden uniform sizes
          </p>
        </div>

        <div className="page-heading-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setReportFilters({
                ...emptyReportFilters
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
            onClick={
              openCreateModal
            }
          >
            + Add Student
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
          className="filter-section student-measurement-filter-section"
          onSubmit={
            handleSearchSubmit
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
              placeholder="Student name, ID, class or school"
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

          <input
            value={
              classFilter
            }
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

          <input
            value={
              academicYearFilter
            }
            onChange={(event) => {
              setAcademicYearFilter(
                event.target.value
              );

              setPagination(
                (current) => ({
                  ...current,
                  page: 1
                })
              );
            }}
            placeholder="Academic year"
          />

          <select
            value={
              genderFilter
            }
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
            value={
              statusFilter
            }
            onChange={(event) => {
              setStatusFilter(
                event.target
                  .value as
                  | MeasurementRecordStatus
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
          <LoadingSpinner message="Loading student measurement records..." />
        ) : records.length ===
          0 ? (
          <div className="empty-state">
            <h3>
              No measurement records found
            </h3>

            <p>
              Add a student profile,
              measurements and uniform
              items.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-responsive">
              <table className="data-table student-measurement-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Photo</th>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Mobile</th>
                    <th>School</th>
                    <th>Class</th>
                    <th>Gender</th>
                    <th>Year</th>
                    <th>
                      Recommended Size
                    </th>
                    <th>Items</th>
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
                          {record.photo
                            ?.url ? (
                            <img
                              src={
                                record
                                  .photo
                                  .url
                              }
                              alt={
                                record.studentName
                              }
                              className="student-photo-thumbnail"
                            />
                          ) : (
                            <div className="student-photo-placeholder student-photo-placeholder-small">
                              No Photo
                            </div>
                          )}
                        </td>

                        <td>
                          {formatDate(
                            record.measurementDate
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
                              ID:{" "}
                              {
                                record.studentId
                              }
                            </span>
                          </div>
                        </td>

                        <td>
                          {record.mobileNumber || "—"}
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
                          {
                            record.academicYear
                          }
                        </td>

                        <td>
                          <strong>
                            {record.recommendedSize ||
                              "—"}
                          </strong>

                          {record.recommendationScore >
                            0 && (
                            <div className="recommendation-small-score">
                              {
                                record.recommendationScore
                              }
                              % match
                            </div>
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

            {/* Mobile Card View */}
            <div className="mobile-card-view">
              {records.map((record) => (
                <div className="data-card student-card" key={record._id}>
                  <div className="data-card-header">
                    <div>
                      <div className="student-name">{record.studentName}</div>
                      <div className="student-id">ID: {record.studentId}</div>
                    </div>
                    <span
                      className={`badge status-badge ${getStatusClass(
                        record.status
                      )}`}
                    >
                      {formatLabel(record.status)}
                    </span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">Photo</span>
                    <span className="value">
                      {record.photo?.url ? (
                        <img
                          src={record.photo.url}
                          alt={record.studentName}
                          className="student-photo-thumbnail"
                        />
                      ) : (
                        "No Photo"
                      )}
                    </span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">Mobile</span>
                    <span className="value">{record.mobileNumber || "—"}</span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">School</span>
                    <span className="value">{record.schoolName}</span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">Class</span>
                    <span className="value">
                      {record.className}
                      {record.section ? ` - ${record.section}` : ""}
                    </span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">Gender</span>
                    <span className="value">{formatLabel(record.gender)}</span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">Academic Year</span>
                    <span className="value">{record.academicYear}</span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">Measurement Date</span>
                    <span className="value">{formatDate(record.measurementDate)}</span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">Recommended Size</span>
                    <span className="value">
                      <span className="recommended-size">
                        {record.recommendedSize || "—"}
                      </span>
                      {record.recommendationScore > 0 && (
                        <div className="recommendation-small-score">
                          {record.recommendationScore}% match
                        </div>
                      )}
                    </span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">Uniform Items</span>
                    <span className="value">
                      <strong>{record.items.length}</strong> items
                    </span>
                  </div>

                  <div className="data-card-actions">
                    <button
                      type="button"
                      className="invoice-action-button"
                      onClick={() => void openViewModal(record._id)}
                    >
                      View
                    </button>

                    <button
                      type="button"
                      className="invoice-action-button"
                      onClick={() => void openEditModal(record._id)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="invoice-action-button invoice-delete-button"
                      onClick={() => openDeleteModal(record)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pagination-section">
              <p>
                Showing{" "}
                {records.length} of{" "}
                {pagination.total} records
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

      <input
        ref={
          cameraInputRef
        }
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={
          handlePhotoSelected
        }
      />

      <input
        ref={
          galleryInputRef
        }
        type="file"
        accept="image/*"
        hidden
        onChange={
          handlePhotoSelected
        }
      />

      {isFormModalOpen && (
        <Modal
          title={
            editingRecordId
              ? "Edit Student Measurement"
              : "Add Student Measurement"
          }
          onClose={() => {
            if (
              !isSubmitting &&
              !isUploadingPhoto
            ) {
              setIsFormModalOpen(
                false
              );
            }
          }}
        >
          {isLoadingRecord ? (
            <LoadingSpinner message="Loading student record..." />
          ) : (
            <form
              onSubmit={(event) =>
                void submitForm(
                  event
                )
              }
            >
              <div className="student-measurement-section">
                <h3>
                  Student Profile
                </h3>

                <div className="student-profile-layout">
                  <div className="student-photo-section">
                    {formData.photo
                      .url ? (
                      <img
                        src={
                          formData.photo
                            .url
                        }
                        alt="Student"
                        className="student-photo-large"
                      />
                    ) : (
                      <div className="student-photo-placeholder">
                        Student Photo
                      </div>
                    )}

                    <div className="student-photo-actions">
                      <button
                        type="button"
                        className="primary-button"
                        disabled={
                          isUploadingPhoto
                        }
                        onClick={() =>
                          cameraInputRef.current?.click()
                        }
                      >
                        Capture Photo
                      </button>

                      <button
                        type="button"
                        className="secondary-button"
                        disabled={
                          isUploadingPhoto
                        }
                        onClick={() =>
                          galleryInputRef.current?.click()
                        }
                      >
                        Choose Photo
                      </button>

                      {formData.photo
                        .url && (
                        <button
                          type="button"
                          className="text-button text-danger"
                          disabled={
                            isUploadingPhoto
                          }
                          onClick={
                            removeCurrentPhoto
                          }
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>

                    <p className="student-photo-help">
                      On mobile, Capture
                      Photo opens the
                      device camera. The
                      photo is uploaded
                      only after you
                      confirm it.
                    </p>
                  </div>

                  <div className="form-grid student-profile-fields">
                    <div className="form-field form-field-full">
                      <label htmlFor="measurementSchool">
                        School{" "}
                        <span>*</span>
                      </label>

                      <select
                        id="measurementSchool"
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
                      <label htmlFor="measurementStudentName">
                        Student Name{" "}
                        <span>*</span>
                      </label>

                      <input
                        id="measurementStudentName"
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
                      <label htmlFor="measurementStudentId">
                        Student ID{" "}
                        <span>*</span>
                      </label>

                      <input
                        id="measurementStudentId"
                        value={
                          formData.studentId
                        }
                        onChange={(event) =>
                          updateFormField(
                            "studentId",
                            event.target
                              .value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="measurementMobileNumber">
                        Mobile Number
                      </label>

                      <input
                        id="measurementMobileNumber"
                        type="tel"
                        value={
                          formData.mobileNumber
                        }
                        onChange={(event) =>
                          updateFormField(
                            "mobileNumber",
                            event.target
                              .value
                          )
                        }
                        placeholder="Enter 10-digit mobile number"
                        maxLength={10}
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="measurementClass">
                        Class{" "}
                        <span>*</span>
                      </label>

                      <input
                        id="measurementClass"
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
                      <label htmlFor="measurementSection">
                        Section
                      </label>

                      <input
                        id="measurementSection"
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
                      <label htmlFor="measurementGender">
                        Gender{" "}
                        <span>*</span>
                      </label>

                      <select
                        id="measurementGender"
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
                      <label htmlFor="measurementAcademicYear">
                        Academic Year{" "}
                        <span>*</span>
                      </label>

                      <input
                        id="measurementAcademicYear"
                        value={
                          formData.academicYear
                        }
                        onChange={(event) =>
                          updateFormField(
                            "academicYear",
                            event.target
                              .value
                          )
                        }
                        placeholder="2026-27"
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="measurementDate">
                        Measurement Date{" "}
                        <span>*</span>
                      </label>

                      <input
                        id="measurementDate"
                        type="date"
                        value={
                          formData.measurementDate
                        }
                        onChange={(event) =>
                          updateFormField(
                            "measurementDate",
                            event.target
                              .value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="measurementStatus">
                        Status
                      </label>

                      <select
                        id="measurementStatus"
                        value={
                          formData.status
                        }
                        onChange={(event) =>
                          updateFormField(
                            "status",
                            event.target
                              .value as MeasurementRecordStatus
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
              </div>

              <div className="student-measurement-section">
                <div className="student-measurement-section-heading">
                  <div>
                    <h3>
                      Body Measurements
                    </h3>

                    <p>
                      Height is in
                      centimetres. Other
                      measurements are in
                      inches.
                    </p>
                  </div>
                </div>

                <div className="measurement-grid">
                  {measurementFields.map(
                    (field) => (
                      <div
                        className="form-field"
                        key={
                          field.key
                        }
                      >
                        <label
                          htmlFor={`measurement-${field.key}`}
                        >
                          {
                            field.label
                          }{" "}
                          <small>
                            (
                            {
                              field.unit
                            }
                            )
                          </small>
                        </label>

                        <input
                          id={`measurement-${field.key}`}
                          type="number"
                          min="0"
                          step="0.1"
                          value={
                            formData
                              .measurements[
                              field.key
                            ] ?? ""
                          }
                          onChange={(event) =>
                            updateMeasurement(
                              field.key,
                              event.target
                                .value
                            )
                          }
                          placeholder={
                            field.placeholder
                          }
                        />
                      </div>
                    )
                  )}
                </div>

                <div className="recommendation-card">
                  <div>
                    <span>
                      Recommended Size
                    </span>

                    <strong>
                      {recommendation.recommendedSize ||
                        "Enter measurements"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Match Score
                    </span>

                    <strong>
                      {
                        recommendation.score
                      }
                      %
                    </strong>
                  </div>

                  <div>
                    <span>
                      Fields Considered
                    </span>

                    <strong>
                      {
                        recommendation.consideredFields
                          .length
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Exact Matches
                    </span>

                    <strong>
                      {
                        recommendation.matchedFields
                          .length
                      }
                    </strong>
                  </div>
                </div>

                <p className="recommendation-warning">
                  The recommendation is
                  advisory. Select manual
                  override or custom size
                  whenever required.
                </p>
              </div>

              <div className="student-measurement-section">
                <div className="student-measurement-section-heading">
                  <div>
                    <h3>
                      Uniform Items
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
                    onClick={
                      addItem
                    }
                  >
                    + Add Item
                  </button>
                </div>

                <div className="student-measurement-items">
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

                      const finalSize =
                        item.sizeMode ===
                        "CUSTOM"
                          ? item.customSize
                          : item.sizeSelectionMode ===
                              "MANUAL_OVERRIDE"
                            ? item.manualOverrideSize
                            : recommendation.recommendedSize;

                      return (
                        <article
                          className="student-measurement-item-card"
                          key={
                            index
                          }
                        >
                          <div className="student-measurement-item-header">
                            <div>
                              <strong>
                                Uniform Item{" "}
                                {index + 1}
                              </strong>

                              {finalSize && (
                                <span>
                                  Final size:{" "}
                                  {
                                    finalSize
                                  }
                                </span>
                              )}
                            </div>

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
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    {
                                      productId:
                                        event
                                          .target
                                          .value
                                    }
                                  )
                                }
                                required
                              >
                                <option value="">
                                  {isLoadingProducts
                                    ? "Loading products..."
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
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    {
                                      quantity:
                                        Math.max(
                                          1,
                                          Number(
                                            event
                                              .target
                                              .value
                                          ) ||
                                            1
                                        )
                                    }
                                  )
                                }
                                required
                              />
                            </div>

                            <div className="form-field">
                              <label>
                                Size Type
                              </label>

                              <select
                                value={
                                  item.sizeMode
                                }
                                onChange={(event) => {
                                  const sizeMode =
                                    event.target
                                      .value as SizeMode;

                                  updateItem(
                                    index,
                                    {
                                      sizeMode,

                                      customSize:
                                        sizeMode ===
                                        "CUSTOM"
                                          ? item.customSize
                                          : ""
                                    }
                                  );
                                }}
                              >
                                <option value="STANDARD">
                                  Standard Size
                                </option>

                                <option value="CUSTOM">
                                  Custom Size
                                </option>
                              </select>
                            </div>

                            {item.sizeMode ===
                            "STANDARD" ? (
                              <>
                                <div className="form-field">
                                  <label>
                                    Size Selection
                                  </label>

                                  <select
                                    value={
                                      item.sizeSelectionMode
                                    }
                                    onChange={(event) => {
                                      const mode =
                                        event.target
                                          .value as SizeSelectionMode;

                                      updateItem(
                                        index,
                                        {
                                          sizeSelectionMode:
                                            mode,

                                          manualOverrideSize:
                                            mode ===
                                            "RECOMMENDED"
                                              ? ""
                                              : item.manualOverrideSize
                                        }
                                      );
                                    }}
                                  >
                                    <option value="RECOMMENDED">
                                      Use Recommended
                                      Size
                                    </option>

                                    <option value="MANUAL_OVERRIDE">
                                      Manual Override
                                    </option>
                                  </select>
                                </div>

                                <div className="form-field">
                                  <label>
                                    Recommended Size
                                  </label>

                                  <input
                                    value={
                                      recommendation.recommendedSize
                                    }
                                    placeholder="Enter body measurements"
                                    readOnly
                                  />
                                </div>

                                {item.sizeSelectionMode ===
                                  "MANUAL_OVERRIDE" && (
                                  <div className="form-field">
                                    <label>
                                      Manual Size{" "}
                                      <span>*</span>
                                    </label>

                                    <select
                                      value={
                                        item.manualOverrideSize
                                      }
                                      onChange={(event) =>
                                        updateItem(
                                          index,
                                          {
                                            manualOverrideSize:
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

                                      {availableSizes.map(
                                        (
                                          size
                                        ) => (
                                          <option
                                            key={
                                              size
                                            }
                                            value={
                                              size
                                            }
                                          >
                                            {
                                              size
                                            }
                                          </option>
                                        )
                                      )}

                                      {selectedProduct?.variants
                                        ?.filter(
                                          (
                                            variant
                                          ) =>
                                            variant.status ===
                                            "ACTIVE" &&
                                            !availableSizes.includes(
                                              variant.size
                                            )
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
                                                variant.size
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
                                )}
                              </>
                            ) : (
                              <div className="form-field form-field-full">
                                <label>
                                  Custom Size /
                                  Description{" "}
                                  <span>*</span>
                                </label>

                                <input
                                  value={
                                    item.customSize
                                  }
                                  onChange={(event) =>
                                    updateItem(
                                      index,
                                      {
                                        customSize:
                                          event
                                            .target
                                            .value
                                      }
                                    )
                                  }
                                  placeholder="Example: Size 32 with waist +1 inch"
                                  required
                                />
                              </div>
                            )}

                            <div className="form-field form-field-full">
                              <label>
                                Item Remarks
                              </label>

                              <textarea
                                rows={3}
                                value={
                                  item.remarks
                                }
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    {
                                      remarks:
                                        event
                                          .target
                                          .value
                                    }
                                  )
                                }
                                placeholder="Optional stitching, fitting or custom instructions"
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
                <label htmlFor="measurementGeneralRemarks">
                  General Remarks
                </label>

                <textarea
                  id="measurementGeneralRemarks"
                  rows={3}
                  value={
                    formData.generalRemarks
                  }
                  onChange={(event) =>
                    updateFormField(
                      "generalRemarks",
                      event.target
                        .value
                    )
                  }
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={
                    isSubmitting ||
                    isUploadingPhoto
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
                    isSubmitting ||
                    isUploadingPhoto
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

      {isPhotoConfirmOpen && (
        <Modal
          title="Confirm Student Photo"
          onClose={() => {
            if (
              !isUploadingPhoto
            ) {
              cancelPendingPhoto();
            }
          }}
        >
          <div className="student-photo-confirmation">
            {pendingPhotoPreview && (
              <img
                src={
                  pendingPhotoPreview
                }
                alt="Student preview"
                className="student-photo-confirm-preview"
              />
            )}

            <p>
              Is this photo clear and
              suitable for the student
              profile?
            </p>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={
                  isUploadingPhoto
                }
                onClick={
                  cancelPendingPhoto
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="secondary-button"
                disabled={
                  isUploadingPhoto
                }
                onClick={
                  handleRetakePhoto
                }
              >
                Retake
              </button>

              <button
                type="button"
                className="primary-button"
                disabled={
                  isUploadingPhoto
                }
                onClick={() =>
                  void confirmAndUploadPhoto()
                }
              >
                {isUploadingPhoto
                  ? "Uploading..."
                  : "Use Photo"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {isViewModalOpen && (
        <Modal
          title="Student Measurement Record"
          onClose={() =>
            setIsViewModalOpen(
              false
            )
          }
        >
          {isLoadingRecord ||
          !selectedRecord ? (
            <LoadingSpinner message="Loading student record..." />
          ) : (
            <div>
              <div className="student-measurement-view-header">
                {selectedRecord
                  .photo?.url ? (
                  <img
                    src={
                      selectedRecord
                        .photo.url
                    }
                    alt={
                      selectedRecord.studentName
                    }
                    className="student-photo-view"
                  />
                ) : (
                  <div className="student-photo-placeholder">
                    No Photo
                  </div>
                )}

                <div>
                  <h2>
                    {
                      selectedRecord.studentName
                    }
                  </h2>

                  <p>
                    Student ID:{" "}
                    {
                      selectedRecord.studentId
                    }
                  </p>

                  {selectedRecord.mobileNumber && (
                    <p>
                      Mobile:{" "}
                      {
                        selectedRecord.mobileNumber
                      }
                    </p>
                  )}

                  <span
                    className={`status-badge ${getStatusClass(
                      selectedRecord.status
                    )}`}
                  >
                    {formatLabel(
                      selectedRecord.status
                    )}
                  </span>
                </div>
              </div>

              <div className="student-measurement-view-grid">
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
                    Academic Year
                  </span>

                  <strong>
                    {
                      selectedRecord.academicYear
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Measurement Date
                  </span>

                  <strong>
                    {formatDate(
                      selectedRecord.measurementDate
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Recommended Size
                  </span>

                  <strong>
                    {selectedRecord.recommendedSize ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Recommendation Score
                  </span>

                  <strong>
                    {
                      selectedRecord.recommendationScore
                    }
                    %
                  </strong>
                </div>

                <div>
                  <span>
                    Number of Items
                  </span>

                  <strong>
                    {
                      selectedRecord.items
                        .length
                    }
                  </strong>
                </div>
              </div>

              <h3>
                Body Measurements
              </h3>

              <div className="measurement-view-grid">
                {measurementFields.map(
                  (field) => (
                    <div
                      key={
                        field.key
                      }
                    >
                      <span>
                        {
                          field.label
                        }
                      </span>

                      <strong>
                        {selectedRecord
                          .measurements[
                          field.key
                        ] ?? "—"}

                        {selectedRecord
                          .measurements[
                          field.key
                        ] !==
                          undefined &&
                          ` ${field.unit}`}
                      </strong>
                    </div>
                  )
                )}
              </div>

              <h3>
                Uniform Items
              </h3>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>S.No.</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>
                        Recommended
                      </th>
                      <th>
                        Selection
                      </th>
                      <th>
                        Manual Override
                      </th>
                      <th>
                        Final Size
                      </th>
                      <th>
                        Size Type
                      </th>
                      <th>Remarks</th>
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
                            {
                              item.quantity
                            }
                          </td>

                          <td>
                            {item.recommendedSize ||
                              "—"}
                          </td>

                          <td>
                            {formatLabel(
                              item.sizeSelectionMode
                            )}
                          </td>

                          <td>
                            {item.manualOverrideSize ||
                              "—"}
                          </td>

                          <td>
                            <strong>
                              {
                                item.finalSize
                              }
                            </strong>
                          </td>

                          <td>
                            {formatLabel(
                              item.sizeMode
                            )}
                          </td>

                          <td>
                            {item.remarks ||
                              "—"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {selectedRecord.generalRemarks && (
                <div className="student-measurement-remarks">
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
          title="Delete Student Measurement"
          onClose={() => {
            if (!isDeleting) {
              setIsDeleteModalOpen(
                false
              );
            }
          }}
        >
          <p>
            Delete the measurement
            record for{" "}
            <strong>
              {
                selectedRecord.studentName
              }
            </strong>
            ?
          </p>

          <p>
            The MongoDB record and its
            Cloudinary photo will be
            deleted. This action cannot
            be undone.
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
                : "Delete Record"}
            </button>
          </div>
        </Modal>
      )}

      {isReportModalOpen && (
        <Modal
          title="Student Measurement Reports"
          onClose={() => {
            if (
              !isDownloading
            ) {
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
                        event.target
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
                        event.target
                          .value
                    })
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>
                Class
              </label>

              <input
                value={
                  reportFilters.className
                }
                onChange={(event) =>
                  setReportFilters(
                    (current) => ({
                      ...current,
                      className:
                        event.target
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
                        event.target
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
                        event.target
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
                Academic Year
              </label>

              <input
                value={
                  reportFilters.academicYear
                }
                onChange={(event) =>
                  setReportFilters(
                    (current) => ({
                      ...current,

                      academicYear:
                        event.target
                          .value
                    })
                  )
                }
                placeholder="2026-27"
              />
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
                        event.target
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

            <div className="form-field">
              <label>
                Final Size
              </label>

              <input
                value={
                  reportFilters.size
                }
                onChange={(event) =>
                  setReportFilters(
                    (current) => ({
                      ...current,
                      size:
                        event.target
                          .value
                    })
                  )
                }
                placeholder="Example: 32"
              />
            </div>
          </div>

          <div className="student-measurement-report-note">
            The Excel report will
            include student profile,
            mobile number, photo URL,
            body measurements, item,
            quantity, recommended size,
            manual override and final
            size in separate columns.
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