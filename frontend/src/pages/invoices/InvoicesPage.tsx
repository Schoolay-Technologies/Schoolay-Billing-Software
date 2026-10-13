import axios from "axios";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  cancelInvoice,
  createInvoice,
  downloadInvoicesExcel,
  getInvoiceById,
  getInvoices,
  updateInvoice
} from "../../api/invoice.api";

import { getProducts } from "../../api/product.api";
import { getSchools } from "../../api/school.api";

import Alert from "../../components/common/Alert";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Modal from "../../components/common/Modal";

import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceItemInput,
  InvoiceStatus,
  PaymentMode,
  PaymentStatus
} from "../../types/invoice.types";

import type { Product } from "../../types/product.types";

import type {
  ApiErrorResponse,
  Pagination,
  School
} from "../../types/school.types";

import "./InvoicesPage.css";

interface InvoiceFormItem extends InvoiceItemInput {}

type InvoiceFormMode = "CREATE" | "EDIT";

/* =========================================================
   ICONS
========================================================= */

type IconName =
  | "invoice"
  | "search"
  | "plus"
  | "filter"
  | "refresh"
  | "chevronLeft"
  | "chevronRight"
  | "close"
  | "eye"
  | "edit"
  | "print"
  | "download"
  | "trash"
  | "calendar"
  | "user"
  | "school"
  | "phone"
  | "mail"
  | "check"
  | "warning"
  | "arrow"
  | "excel"
  | "money"
  | "moreVertical";

function Icon({
  name,
  size = 16
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
    strokeLinejoin: "round" as const
  };

  switch (name) {
    case "invoice":
      return (
        <svg {...props}>
          <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
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
    case "eye":
      return (
        <svg {...props}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "edit":
      return (
        <svg {...props}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      );
    case "print":
      return (
        <svg {...props}>
          <path d="M6 9V2h12v7" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      );
    case "download":
      return (
        <svg {...props}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5 5 5-5" />
          <path d="M12 15V3" />
        </svg>
      );
    case "trash":
      return (
        <svg {...props}>
          <path d="M3 6h18" />
          <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
        </svg>
      );
    case "user":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case "school":
      return (
        <svg {...props}>
          <path d="m3 10 9-6 9 6" />
          <path d="M5 10v9" />
          <path d="M9 10v9" />
          <path d="M15 10v9" />
          <path d="M19 10v9" />
          <path d="M3 19h18" />
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
    case "check":
      return (
        <svg {...props}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    case "warning":
      return (
        <svg {...props}>
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...props}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );
    case "excel":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="m8 13 3 5" />
          <path d="m11 13-3 5" />
        </svg>
      );
    case "money":
      return (
        <svg {...props}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="3" />
          <path d="M6 12h.01" />
          <path d="M18 12h.01" />
        </svg>
      );
    case "moreVertical":
      return (
        <svg {...props}>
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      );
    default:
      return null;
  }
}

/* =========================================================
   INITIAL FORM
========================================================= */

const emptyInvoiceItem: InvoiceFormItem = {
  productId: "",
  variantId: "",
  quantity: 1
};

const initialForm: CreateInvoiceInput = {
  schoolId: "",
  studentName: "",
  className: "",
  section: "",
  parentName: "",
  contactNumber: "",
  email: "",
  paymentMode: "CASH",
  paymentReference: "",
  paymentStatus: "PENDING",
  paidAmount: 0,
  invoiceStatus: "COMPLETED",
  placeOfOrder: "SCHOOL_CAMP",
  specializedStoreName: "",
  items: [{ ...emptyInvoiceItem }],
  remarks: ""
};

function createInitialForm(): CreateInvoiceInput {
  return {
    ...initialForm,
    items: [{ ...emptyInvoiceItem }]
  };
}

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(value);
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;

    if (data?.errors?.length) {
      return data.errors.map((item) => item.message).join(", ");
    }

    return data?.message ?? "The request failed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

function getPaymentStatusClass(paymentStatus: PaymentStatus): string {
  if (paymentStatus === "PAID") return "status-paid";
  if (paymentStatus === "PARTIALLY_PAID") return "status-partial";
  return "status-pending";
}

function getInvoiceStatusClass(invoiceStatus: InvoiceStatus): string {
  if (invoiceStatus === "COMPLETED") return "status-completed";
  if (invoiceStatus === "CANCELLED") return "status-cancelled";
  return "status-draft";
}

function getStatusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

function getInitials(name: string): string {
  if (!name) return "SC";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/* =========================================================
   PAGE
========================================================= */

export default function InvoicesPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const [formData, setFormData] =
    useState<CreateInvoiceInput>(createInitialForm());

  const [formMode, setFormMode] = useState<InvoiceFormMode>("CREATE");
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] =
    useState<InvoiceStatus | "">("");
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<PaymentStatus | "">("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  /* =======================================================
     ROW MENU STATE
  ======================================================= */

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  /* Close dropdown only when the click happens outside ANY invoice menu.
     Do not use one shared ref for a mapped list: React would point that ref
     to only one of the rendered menus and clicks on other rows could close
     before their action button receives the click. */
  useEffect(() => {
    if (!openMenuId) return;

    function handleDocumentMouseDown(event: MouseEvent) {
      const target = event.target as Element | null;

      if (target?.closest(".row-menu-wrapper")) {
        return;
      }

      setOpenMenuId(null);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openMenuId]);

  function toggleRowMenu(invoiceId: string) {
    setOpenMenuId((current) =>
      current === invoiceId ? null : invoiceId
    );
  }

  /* =======================================================
     DATA LOADING
  ======================================================= */

  const loadSchools = useCallback(async () => {
    try {
      const result = await getSchools({ page: 1, limit: 100 });
      setSchools(result.data);
    } catch (error) {
      setNotification({ type: "error", message: getErrorMessage(error) });
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    try {
      setIsLoading(true);

      const result = await getInvoices({
        search: search || undefined,
        schoolId: schoolFilter || undefined,
        invoiceStatus: invoiceStatusFilter,
        paymentStatus: paymentStatusFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: pagination.page,
        limit: pagination.limit
      });

      setInvoices(result.data);
      setPagination(result.pagination);
    } catch (error) {
      setNotification({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }, [
    search,
    schoolFilter,
    invoiceStatusFilter,
    paymentStatusFilter,
    dateFrom,
    dateTo,
    pagination.page,
    pagination.limit
  ]);

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  async function loadProductsForSchool(schoolId: string): Promise<Product[]> {
    if (!schoolId) {
      setProducts([]);
      return [];
    }

    try {
      setIsLoadingProducts(true);
      const result = await getProducts({ schoolId, page: 1, limit: 100 });
      setProducts(result.data);
      return result.data;
    } catch (error) {
      setNotification({ type: "error", message: getErrorMessage(error) });
      return [];
    } finally {
      setIsLoadingProducts(false);
    }
  }

  /* =======================================================
     FORM HANDLERS
  ======================================================= */

  function resetInvoiceForm(): void {
    setFormData(createInitialForm());
    setProducts([]);
    setEditingInvoiceId(null);
    setFormMode("CREATE");
  }

  function openCreateInvoiceModal(): void {
    resetInvoiceForm();
    setNotification(null);
    setIsFormModalOpen(true);
  }

  function closeFormModal(): void {
    if (isSubmitting) return;
    setIsFormModalOpen(false);
    resetInvoiceForm();
  }

  async function handleSchoolChange(schoolId: string): Promise<void> {
    setFormData((currentValue) => ({
      ...currentValue,
      schoolId,
      items: [{ ...emptyInvoiceItem }]
    }));

    await loadProductsForSchool(schoolId);
  }

  function updateFormField<K extends keyof CreateInvoiceInput>(
    field: K,
    value: CreateInvoiceInput[K]
  ): void {
    setFormData((currentValue) => ({ ...currentValue, [field]: value }));
  }

  function updateInvoiceItem(
    index: number,
    field: keyof InvoiceFormItem,
    value: string
  ): void {
    setFormData((currentValue) => ({
      ...currentValue,
      items: currentValue.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === "quantity") {
          const parsedQuantity = Number(value);
          return {
            ...item,
            quantity:
              Number.isFinite(parsedQuantity) && parsedQuantity > 0
                ? parsedQuantity
                : 1
          };
        }

        if (field === "productId") {
          return { ...item, productId: value, variantId: "" };
        }

        return { ...item, [field]: value };
      })
    }));
  }

  function addInvoiceItem(): void {
    setFormData((currentValue) => ({
      ...currentValue,
      items: [...currentValue.items, { ...emptyInvoiceItem }]
    }));
  }

  function removeInvoiceItem(index: number): void {
    setFormData((currentValue) => {
      if (currentValue.items.length === 1) return currentValue;
      return {
        ...currentValue,
        items: currentValue.items.filter((_, itemIndex) => itemIndex !== index)
      };
    });
  }

  /* =======================================================
     CALCULATIONS
  ======================================================= */

  const calculatedSummary = useMemo(() => {
    let taxableAmount = 0;
    let gstAmount = 0;

    for (const item of formData.items) {
      const product = products.find((p) => p._id === item.productId);
      const variant = product?.variants.find((v) => v._id === item.variantId);

      if (!variant) continue;

      const lineTaxableAmount = roundCurrency(variant.unitPrice * item.quantity);
      const lineGstAmount = roundCurrency(
        lineTaxableAmount * (variant.gstPercentage / 100)
      );

      taxableAmount += lineTaxableAmount;
      gstAmount += lineGstAmount;
    }

    taxableAmount = roundCurrency(taxableAmount);
    gstAmount = roundCurrency(gstAmount);

    const unroundedGrandTotal = roundCurrency(taxableAmount + gstAmount);
    const grandTotal = Math.round(unroundedGrandTotal);

    return {
      taxableAmount,
      gstAmount,
      roundOff: roundCurrency(grandTotal - unroundedGrandTotal),
      grandTotal
    };
  }, [formData.items, products]);

  /* =======================================================
     VALIDATION
  ======================================================= */

  function validateInvoiceForm(): string | null {
    if (!formData.schoolId) return "Please select a school.";
    if (!formData.studentName.trim()) return "Student name is required.";
    if (!formData.className.trim()) return "Class is required.";
    if (formData.items.length === 0) return "At least one invoice item is required.";

    for (let index = 0; index < formData.items.length; index += 1) {
      const item = formData.items[index];
      if (!item.productId) return `Please select a product in item ${index + 1}.`;
      if (!item.variantId) return `Please select a size in item ${index + 1}.`;
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return `Enter a valid quantity in item ${index + 1}.`;
      }
    }

    if (
      formData.paidAmount < 0 ||
      formData.paidAmount > calculatedSummary.grandTotal
    ) {
      return "Paid amount cannot exceed the invoice grand total.";
    }

    return null;
  }

  /* =======================================================
     SUBMIT
  ======================================================= */

  async function submitInvoice(
    invoiceStatus: "DRAFT" | "COMPLETED"
  ): Promise<void> {
    const validationError = validateInvoiceForm();

    if (validationError) {
      setNotification({ type: "error", message: validationError });
      return;
    }

    try {
      setIsSubmitting(true);
      setNotification(null);

      const payload: CreateInvoiceInput = {
        schoolId: formData.schoolId,
        studentName: formData.studentName.trim(),
        className: formData.className.trim(),
        section: formData.section.trim(),
        parentName: formData.parentName.trim(),
        contactNumber: formData.contactNumber.trim(),
        email: formData.email.trim(),
        placeOfOrder: formData.placeOfOrder || "SCHOOL_CAMP",
        specializedStoreName:
          formData.placeOfOrder === "SPECIALIZED_SCHOOL_STORE"
            ? formData.specializedStoreName.trim()
            : "",
        paymentMode: formData.paymentMode,
        paymentReference: formData.paymentReference.trim(),
        paymentStatus: formData.paymentStatus,
        paidAmount: formData.paidAmount,
        invoiceStatus,
        items: formData.items,
        remarks: formData.remarks.trim()
      };

      if (formMode === "EDIT" && editingInvoiceId) {
        const result = await updateInvoice(editingInvoiceId, payload);
        setNotification({
          type: "success",
          message: `Invoice ${result.data.invoiceNumber} updated successfully.`
        });
      } else {
        const result = await createInvoice(payload);
        setNotification({
          type: "success",
          message:
            invoiceStatus === "DRAFT"
              ? `Draft ${result.data.invoiceNumber} saved successfully.`
              : `Invoice ${result.data.invoiceNumber} generated successfully.`
        });
      }

      setIsFormModalOpen(false);
      resetInvoiceForm();

      if (pagination.page !== 1) {
        setPagination((currentValue) => ({ ...currentValue, page: 1 }));
      } else {
        await loadInvoices();
      }
    } catch (error) {
      setNotification({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCompletedSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void submitInvoice("COMPLETED");
  }

  /* =======================================================
     VIEW / EDIT
  ======================================================= */

  async function handleViewInvoice(invoiceId: string): Promise<void> {
    try {
      setIsLoadingInvoice(true);
      setSelectedInvoice(null);
      setIsViewModalOpen(true);
      const result = await getInvoiceById(invoiceId);
      setSelectedInvoice(result.data);
    } catch (error) {
      setIsViewModalOpen(false);
      setNotification({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsLoadingInvoice(false);
    }
  }

  async function handleEditInvoice(invoiceId: string): Promise<void> {
    try {
      setIsLoadingInvoice(true);
      setNotification(null);

      const result = await getInvoiceById(invoiceId);
      const invoice = result.data;

      if (invoice.invoiceStatus === "CANCELLED") {
        throw new Error("A cancelled invoice cannot be edited.");
      }

      await loadProductsForSchool(
        typeof invoice.schoolId === "string"
          ? invoice.schoolId
          : invoice.schoolId._id
      );

      setFormData({
        schoolId:
          typeof invoice.schoolId === "string"
            ? invoice.schoolId
            : invoice.schoolId._id,
        studentName: invoice.studentName,
        className: invoice.className,
        section: invoice.section ?? "",
        parentName: invoice.parentName ?? "",
        contactNumber: invoice.contactNumber ?? "",
        email: invoice.email ?? "",
        placeOfOrder: invoice.placeOfOrder ?? "SCHOOL_CAMP",
        specializedStoreName: invoice.specializedStoreName ?? "",
        paymentMode: invoice.paymentMode,
        paymentReference: invoice.paymentReference ?? "",
        paymentStatus: invoice.paymentStatus,
        paidAmount: invoice.paidAmount,
        invoiceStatus:
          invoice.invoiceStatus === "DRAFT" ? "DRAFT" : "COMPLETED",
        items: invoice.items.map((item) => ({
          productId:
            typeof item.productId === "string"
              ? item.productId
              : item.productId._id,
          variantId: item.variantId,
          quantity: item.quantity
        })),
        remarks: invoice.remarks ?? ""
      });

      setEditingInvoiceId(invoice._id);
      setFormMode("EDIT");
      setIsFormModalOpen(true);
    } catch (error) {
      setNotification({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsLoadingInvoice(false);
    }
  }

  /* =======================================================
     CANCEL
  ======================================================= */

  function openCancellationModal(invoice: Invoice): void {
    if (invoice.invoiceStatus === "CANCELLED") {
      setNotification({
        type: "error",
        message: "This invoice is already cancelled."
      });
      return;
    }

    setInvoiceToCancel(invoice);
    setCancellationReason("");
    setIsCancelModalOpen(true);
  }

  async function handleCancelInvoice(): Promise<void> {
    if (!invoiceToCancel) return;

    if (cancellationReason.trim().length < 3) {
      setNotification({
        type: "error",
        message: "Enter a cancellation reason containing at least 3 characters."
      });
      return;
    }

    try {
      setIsCancelling(true);
      setNotification(null);

      const result = await cancelInvoice(
        invoiceToCancel._id,
        cancellationReason.trim()
      );

      setNotification({
        type: "success",
        message: `Invoice ${result.data.invoiceNumber} cancelled successfully.`
      });

      setIsCancelModalOpen(false);
      setInvoiceToCancel(null);
      setCancellationReason("");
      await loadInvoices();
    } catch (error) {
      setNotification({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsCancelling(false);
    }
  }

  /* =======================================================
     PRINT / PDF / EXPORT
  ======================================================= */

  function handlePrintInvoice(invoice: Invoice): void {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      setNotification({
        type: "error",
        message: "Please allow pop-ups to print the invoice."
      });
      return;
    }

    const itemRows = invoice.items
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.productName}</td>
            <td>${item.gender}</td>
            <td>${item.size}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.unitPrice)}</td>
            <td>${item.gstPercentage}%</td>
            <td>${formatCurrency(item.totalAmount)}</td>
          </tr>
        `
      )
      .join("");

    const paymentModeChecked = (mode: string) =>
      invoice.paymentMode === mode ? "☑" : "☐";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${invoice.invoiceNumber}</title>
          <style>
            @page { size: A4; margin: 8mm 10mm; }
            * { box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              color: #1a1a2e;
              margin: 0; padding: 0;
              background: #ffffff;
              font-size: 12px;
            }
            .invoice-container { max-width: 100%; padding: 0; }
            .header-section {
              display: flex; justify-content: space-between; align-items: flex-start;
              border-bottom: 3px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 16px;
            }
            .company-details { flex: 1; }
            .company-name {
              font-size: 20px; font-weight: 800; color: #1a1a2e;
              letter-spacing: -0.5px; margin: 0 0 4px 0;
            }
            .company-address { font-size: 11px; color: #4a4a6a; line-height: 1.5; margin: 0; }
            .company-gst { font-size: 10.5px; color: #4a4a6a; margin: 3px 0 0 0; font-weight: 500; }
            .company-gst span { background: #f0f0f5; padding: 1px 8px; border-radius: 3px; }
            .invoice-title { text-align: right; min-width: 180px; }
            .invoice-title h2 {
              font-size: 24px; font-weight: 800; color: #1a1a2e;
              margin: 0 0 4px 0; letter-spacing: 1px;
            }
            .invoice-number {
              font-size: 13px; font-weight: 600; color: #2d2d5e;
              background: #f0f0f5; padding: 2px 12px; border-radius: 4px;
              display: inline-block;
            }
            .invoice-date { font-size: 11px; color: #4a4a6a; margin-top: 3px; }
            .cancelled-stamp {
              color: #b91c1c; border: 3px solid #b91c1c; padding: 6px 16px;
              font-weight: 800; font-size: 18px; transform: rotate(-10deg);
              display: inline-block; margin-top: 6px; border-radius: 4px;
              letter-spacing: 2px;
            }
            .details-grid {
              display: grid; grid-template-columns: 1fr 1fr;
              gap: 14px; margin-bottom: 16px;
            }
            .detail-box {
              border: 1px solid #e0e0ea; border-radius: 6px;
              padding: 10px 14px; background: #fafafe;
            }
            .detail-box .label {
              font-size: 9.5px; text-transform: uppercase;
              letter-spacing: 0.5px; color: #6b6b8a; font-weight: 600;
              display: block; margin-bottom: 3px;
            }
            .detail-box .value { font-size: 13px; font-weight: 600; color: #1a1a2e; }
            .detail-box .value-small { font-size: 11px; font-weight: 400; color: #2d2d5e; }
            .payment-mode-section {
              border: 1px solid #e0e0ea; border-radius: 6px;
              padding: 10px 14px; background: #fafafe; margin-bottom: 16px;
              display: flex; justify-content: space-between;
              align-items: center; flex-wrap: wrap;
            }
            .payment-mode-label { font-size: 11px; font-weight: 600; color: #1a1a2e; }
            .payment-mode-options { display: flex; gap: 20px; font-size: 13px; }
            .payment-mode-options span { display: flex; align-items: center; gap: 4px; }
            .payment-mode-options .checked { color: #1a8a4a; font-weight: 700; }
            .bank-details {
              border: 1px solid #e0e0ea; border-radius: 6px;
              padding: 10px 14px; background: #f8f8ff; margin-bottom: 16px;
              font-size: 10.5px; color: #2d2d5e; line-height: 1.6;
            }
            .bank-details strong { color: #1a1a2e; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
            .items-table th {
              background: #1a1a2e; color: #ffffff; padding: 8px 10px;
              text-align: left; font-weight: 600; font-size: 10px;
              text-transform: uppercase; letter-spacing: 0.3px;
            }
            .items-table td { border-bottom: 1px solid #e8e8f0; padding: 8px 10px; color: #2d2d5e; }
            .items-table tr:last-child td { border-bottom: 2px solid #1a1a2e; }
            .items-table .text-right { text-align: right; }
            .items-table .total-cell { font-weight: 700; color: #1a1a2e; }
            .summary-section { display: flex; justify-content: flex-end; margin-bottom: 16px; }
            .summary-box {
              width: 280px; border: 1px solid #e0e0ea; border-radius: 6px;
              padding: 10px 14px; background: #fafafe;
            }
            .summary-row {
              display: flex; justify-content: space-between;
              padding: 4px 0; font-size: 11px; color: #4a4a6a;
            }
            .summary-row .amount { font-weight: 600; color: #1a1a2e; }
            .summary-divider { border-top: 1px solid #e0e0ea; margin: 6px 0; }
            .summary-grand {
              display: flex; justify-content: space-between;
              padding: 6px 0 0 0; font-size: 15px; font-weight: 800;
              color: #1a1a2e; border-top: 2px solid #1a1a2e; margin-top: 4px;
            }
            .terms-section {
              border-top: 2px solid #1a1a2e; padding-top: 12px; margin-top: 4px;
            }
            .terms-title {
              font-size: 11px; font-weight: 700; color: #1a1a2e;
              margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px;
            }
            .terms-list {
              display: grid; grid-template-columns: 1fr 1fr; gap: 2px 20px;
              margin: 0; padding: 0; list-style: none;
              font-size: 9.5px; color: #4a4a6a; line-height: 1.6;
            }
            .terms-list li::before { content: "• "; color: #1a1a2e; font-weight: 700; }
            .terms-list .highlight { color: #b91c1c; font-weight: 600; }
            .footer-section {
              margin-top: 12px; text-align: center; font-size: 9px;
              color: #8a8aaa; border-top: 1px solid #e8e8f0; padding-top: 10px;
            }
            @media print { .no-print { display: none; } }
            @media (max-width: 600px) {
              .details-grid { grid-template-columns: 1fr; }
              .header-section { flex-direction: column; align-items: flex-start; }
              .invoice-title { text-align: left; margin-top: 8px; width: 100%; }
              .payment-mode-options { flex-wrap: wrap; gap: 10px; }
              .terms-list { grid-template-columns: 1fr; }
              .summary-box { width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header-section">
              <div class="company-details">
                <h1 class="company-name">SCHOOLAY TECHNOLOGIES PRIVATE LIMITED</h1>
                <p class="company-address">546/1, BRR Layout, Dodda Banaswadi, Bangalore - 560043</p>
                <p class="company-gst">
                  <span>GSTIN: 29AAZCS4585N1ZY</span> &nbsp;|&nbsp; State: Karnataka (29)
                </p>
                <p class="company-gst" style="font-weight:400; margin-top:2px;">
                  📧 kiran@schoolay.com &nbsp;|&nbsp; 📞 +91 8088438290
                </p>
              </div>
              <div class="invoice-title">
                <h2>INVOICE</h2>
                <div class="invoice-number">${invoice.invoiceNumber}</div>
                <div class="invoice-date">
                  ${new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric"
                  })}
                </div>
                ${invoice.invoiceStatus === "CANCELLED" ? `<div class="cancelled-stamp">CANCELLED</div>` : ""}
              </div>
            </div>

            <div class="details-grid">
              <div class="detail-box">
                <span class="label">Student Information</span>
                <div class="value">${invoice.studentName}</div>
                <div class="value-small">
                  Class: ${invoice.className}${invoice.section ? ` - ${invoice.section}` : ""}
                </div>
                <div class="value-small">
                  Parent: ${invoice.parentName || "—"} &nbsp;|&nbsp; ${invoice.contactNumber || "—"}
                </div>
              </div>
              <div class="detail-box">
                <span class="label">School Information</span>
                <div class="value">${invoice.schoolName}</div>
                <div class="value-small">Code: ${invoice.schoolCode}</div>
                <div class="value-small">Payment: ${invoice.paymentStatus.replaceAll("_", " ")}</div>
              </div>
            </div>

            <div class="payment-mode-section">
              <span class="payment-mode-label">Mode of Payment:</span>
              <div class="payment-mode-options">
                <span class="${invoice.paymentMode === "CARD" ? "checked" : ""}">${paymentModeChecked("CARD")} Card</span>
                <span class="${invoice.paymentMode === "CASH" ? "checked" : ""}">${paymentModeChecked("CASH")} Cash</span>
                <span class="${invoice.paymentMode === "ONLINE" ? "checked" : ""}">${paymentModeChecked("ONLINE")} Online</span>
              </div>
            </div>

            <div class="bank-details">
              <strong>🏦 Schoolay Technologies Private Limited</strong><br />
              Punjab National Bank, Indiranagar<br />
              <strong>Account Number:</strong> 1268002100016836 &nbsp;|&nbsp;
              <strong>IFSC:</strong> PUNB0126800
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width:40px;">#</th>
                  <th style="width:28%;">Item</th>
                  <th style="width:10%;">Gender</th>
                  <th style="width:10%;">Size</th>
                  <th style="width:8%;">Qty</th>
                  <th style="width:13%;">Unit Price</th>
                  <th style="width:8%;">GST</th>
                  <th style="width:14%;text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <div class="summary-section">
              <div class="summary-box">
                <div class="summary-row">
                  <span>Taxable Amount</span>
                  <span class="amount">${formatCurrency(invoice.taxableAmount)}</span>
                </div>
                <div class="summary-row">
                  <span>Total GST</span>
                  <span class="amount">${formatCurrency(invoice.totalGstAmount)}</span>
                </div>
                <div class="summary-row">
                  <span>Round Off</span>
                  <span class="amount">${formatCurrency(invoice.roundOff)}</span>
                </div>
                <div class="summary-divider"></div>
                <div class="summary-grand">
                  <span>Grand Total</span>
                  <span>${formatCurrency(invoice.grandTotal)}</span>
                </div>
              </div>
            </div>

            <div class="terms-section">
              <p class="terms-title">📋 Terms &amp; Conditions</p>
              <ul class="terms-list">
                <li>All sales are final. <span class="highlight">No refund policy.</span></li>
                <li>Refund (if approved) requires School TC copy.</li>
                <li>Exchange allowed within <strong>7 working days</strong> with original bill.</li>
                <li>Exchange limited to size exchange &amp; with original tags.</li>
                <li>Size &amp; items must be checked at purchase. <span class="highlight">No claims after wash/use.</span></li>
                <li><span class="highlight">NO exchange</span> for customized items (printed/embroidered).</li>
                <li>Belts, socks, ties, badges &amp; winter wear are non-returnable/non-exchangeable.</li>
                <li>Colours, sizes &amp; stock subject to change without prior notice.</li>
                <li>Prices subject to change without prior notice.</li>
                <li>Online orders: Tracking details will be shared. Courier handled via authorized partner.</li>
                <li>Delivery queries may be addressed to courier partner with tracking ID.</li>
              </ul>
            </div>

            <div class="footer-section">
              Thank you for your business! — Schoolay Technologies Private Limited
            </div>
          </div>
          <script>window.onload = function () { window.print(); };</script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  function handlePdfInvoice(invoice: Invoice): void {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1";
    window.open(`${apiBaseUrl}/invoices/${invoice._id}/pdf`, "_blank");
  }

  /* =======================================================
     FILTERS
  ======================================================= */

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setPagination((currentValue) => ({ ...currentValue, page: 1 }));
    setSearch(searchInput.trim());
  }

  function clearFilters(): void {
    setSearchInput("");
    setSearch("");
    setSchoolFilter("");
    setInvoiceStatusFilter("");
    setPaymentStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setPagination((currentValue) => ({ ...currentValue, page: 1 }));
  }

  const hasFilters =
    Boolean(search) ||
    Boolean(schoolFilter) ||
    Boolean(invoiceStatusFilter) ||
    Boolean(paymentStatusFilter) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  async function handleExportInvoices(): Promise<void> {
    if (!exportFromDate || !exportToDate) {
      setNotification({ type: "error", message: "Select From Date and To Date." });
      return;
    }

    if (exportToDate < exportFromDate) {
      setNotification({
        type: "error",
        message: "To Date cannot be before From Date."
      });
      return;
    }

    try {
      setIsExportingExcel(true);
      setNotification(null);
      await downloadInvoicesExcel(exportFromDate, exportToDate);
      setNotification({
        type: "success",
        message: "Invoices exported successfully."
      });
    } catch (error) {
      setNotification({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsExportingExcel(false);
    }
  }

  /* =======================================================
     DERIVED STATS
  ======================================================= */

  const pageStats = useMemo(() => {
    const paid = invoices.filter((i) => i.paymentStatus === "PAID").length;
    const pending = invoices.filter((i) => i.paymentStatus === "PENDING").length;
    const totalValue = invoices.reduce((sum, i) => sum + i.grandTotal, 0);

    return { paid, pending, totalValue };
  }, [invoices]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="invoices-page">
      {/* HEADER */}
      <div className="invoices-header">
        <div className="invoices-header-content">
          <div className="invoices-breadcrumb">
            <span>Schoolay ERP</span>
            <Icon name="arrow" size={12} />
            <strong>Invoices</strong>
          </div>

          <div className="invoices-title-row">
            <div className="invoices-page-icon">
              <Icon name="invoice" size={22} />
            </div>

            <div>
              <h1>Invoices</h1>
              <p>Create, edit, view, print and manage student-wise invoices.</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="invoices-primary-button"
          onClick={openCreateInvoiceModal}
        >
          <Icon name="plus" size={17} />
          Create Invoice
        </button>
      </div>

      {/* NOTIFICATION */}
      {notification && (
        <div className="invoices-notification">
          <Alert
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      {/* SUMMARY */}
      <div className="invoices-stat-grid">
        <div className="invoice-stat-card">
          <div className="invoice-stat-icon blue">
            <Icon name="invoice" size={18} />
          </div>
          <div>
            <span>Total Invoices</span>
            <strong>{pagination.total}</strong>
            <small>All records</small>
          </div>
        </div>

        <div className="invoice-stat-card">
          <div className="invoice-stat-icon green">
            <Icon name="check" size={18} />
          </div>
          <div>
            <span>Paid</span>
            <strong>{pageStats.paid}</strong>
            <small>On current page</small>
          </div>
        </div>

        <div className="invoice-stat-card">
          <div className="invoice-stat-icon warning">
            <Icon name="warning" size={18} />
          </div>
          <div>
            <span>Pending</span>
            <strong>{pageStats.pending}</strong>
            <small>On current page</small>
          </div>
        </div>

        <div className="invoice-stat-card">
          <div className="invoice-stat-icon purple">
            <Icon name="money" size={18} />
          </div>
          <div>
            <span>Page Value</span>
            <strong>{formatCurrency(pageStats.totalValue)}</strong>
            <small>Sum on this page</small>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="invoices-content-card">
        {/* TOOLBAR */}
        <div className="invoices-toolbar">
          <div className="toolbar-title">
            <div>
              <h2>Invoice Directory</h2>
              <p>Search, filter and manage all your invoices.</p>
            </div>
          </div>

          <button
            type="button"
            className="toolbar-refresh"
            onClick={() => void loadInvoices()}
            disabled={isLoading}
          >
            <Icon name="refresh" size={15} />
            Refresh
          </button>
        </div>

        {/* EXPORT TOOLBAR */}
        <div className="invoice-export-toolbar">
          <div className="export-toolbar-label">
            <Icon name="excel" size={16} />
            <div>
              <strong>Export to Excel</strong>
              <span>Download invoices for a date range</span>
            </div>
          </div>

          <div className="invoice-export-fields">
            <div className="invoice-export-field">
              <label htmlFor="exportFromDate">From Date</label>
              <input
                id="exportFromDate"
                type="date"
                value={exportFromDate}
                onChange={(event) => setExportFromDate(event.target.value)}
              />
            </div>

            <div className="invoice-export-field">
              <label htmlFor="exportToDate">To Date</label>
              <input
                id="exportToDate"
                type="date"
                value={exportToDate}
                min={exportFromDate}
                onChange={(event) => setExportToDate(event.target.value)}
              />
            </div>

            <button
              type="button"
              className="invoice-export-button"
              disabled={isExportingExcel}
              onClick={() => void handleExportInvoices()}
            >
              <Icon name="download" size={15} />
              {isExportingExcel ? "Exporting..." : "Export Excel"}
            </button>
          </div>
        </div>

        {/* FILTER BAR */}
        <form className="invoices-filter-bar" onSubmit={handleSearchSubmit}>
          <div className="school-search-box">
            <Icon name="search" size={17} />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search invoice number, student, class or phone..."
            />
            {searchInput && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>

          <div className="school-filter-select">
            <Icon name="school" size={15} />
            <select
              value={schoolFilter}
              onChange={(event) => {
                setSchoolFilter(event.target.value);
                setPagination((currentValue) => ({ ...currentValue, page: 1 }));
              }}
            >
              <option value="">All schools</option>
              {schools.map((school) => (
                <option key={school._id} value={school._id}>
                  {school.schoolName}
                </option>
              ))}
            </select>
          </div>

          <div className="school-filter-select">
            <Icon name="filter" size={15} />
            <select
              value={invoiceStatusFilter}
              onChange={(event) => {
                setInvoiceStatusFilter(
                  event.target.value as InvoiceStatus | ""
                );
                setPagination((currentValue) => ({ ...currentValue, page: 1 }));
              }}
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="school-filter-select">
            <Icon name="money" size={15} />
            <select
              value={paymentStatusFilter}
              onChange={(event) => {
                setPaymentStatusFilter(
                  event.target.value as PaymentStatus | ""
                );
                setPagination((currentValue) => ({ ...currentValue, page: 1 }));
              }}
            >
              <option value="">All payments</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <div className="school-filter-select date-filter">
            <Icon name="calendar" size={15} />
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPagination((currentValue) => ({ ...currentValue, page: 1 }));
              }}
            />
          </div>

          <div className="school-filter-select date-filter">
            <Icon name="calendar" size={15} />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPagination((currentValue) => ({ ...currentValue, page: 1 }));
              }}
            />
          </div>

          <button type="submit" className="filter-search-button">
            Search
          </button>

          {hasFilters && (
            <button
              type="button"
              className="clear-filter-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </form>

        {/* ACTIVE FILTERS */}
        {hasFilters && (
          <div className="active-filter-row">
            <span>Active filters:</span>

            {search && (
              <button
                type="button"
                className="filter-chip"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setPagination((currentValue) => ({ ...currentValue, page: 1 }));
                }}
              >
                Search: "{search}"
                <Icon name="close" size={11} />
              </button>
            )}

            {schoolFilter && (
              <button
                type="button"
                className="filter-chip"
                onClick={() => {
                  setSchoolFilter("");
                  setPagination((currentValue) => ({ ...currentValue, page: 1 }));
                }}
              >
                School:{" "}
                {schools.find((s) => s._id === schoolFilter)?.schoolName}
                <Icon name="close" size={11} />
              </button>
            )}

            {invoiceStatusFilter && (
              <button
                type="button"
                className="filter-chip"
                onClick={() => {
                  setInvoiceStatusFilter("");
                  setPagination((currentValue) => ({ ...currentValue, page: 1 }));
                }}
              >
                Status: {getStatusLabel(invoiceStatusFilter)}
                <Icon name="close" size={11} />
              </button>
            )}

            {paymentStatusFilter && (
              <button
                type="button"
                className="filter-chip"
                onClick={() => {
                  setPaymentStatusFilter("");
                  setPagination((currentValue) => ({ ...currentValue, page: 1 }));
                }}
              >
                Payment: {getStatusLabel(paymentStatusFilter)}
                <Icon name="close" size={11} />
              </button>
            )}
          </div>
        )}

        {/* TABLE */}
        {isLoading ? (
          <div className="invoices-loading">
            <LoadingSpinner message="Loading invoices..." />
          </div>
        ) : invoices.length === 0 ? (
          <div className="invoices-empty-state">
            <div className="empty-invoice-icon">
              <Icon name="invoice" size={25} />
            </div>
            <h3>No invoices found</h3>
            <p>
              {hasFilters
                ? "Try adjusting your search or filters."
                : "Create your first invoice to start billing students."}
            </p>
            {hasFilters ? (
              <button
                type="button"
                className="secondary-action-button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                className="invoices-primary-button"
                onClick={openCreateInvoiceModal}
              >
                <Icon name="plus" size={16} />
                Create First Invoice
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="invoices-table-wrapper">
              <table className="invoices-table">
                <thead>
                  <tr>
                    <th className="serial-column">#</th>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>School</th>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th className="action-column">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((invoice, index) => (
                    <tr key={invoice._id}>
                      <td className="serial-number">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>

                      <td>
                        <span className="invoice-number-badge">
                          {invoice.invoiceNumber}
                        </span>
                      </td>

                      <td>
                        <div className="date-cell">
                          {new Date(invoice.invoiceDate).toLocaleDateString(
                            "en-IN",
                            { day: "2-digit", month: "short", year: "numeric" }
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="school-identity">
                          <div className="school-avatar">
                            {getInitials(invoice.schoolName)}
                          </div>
                          <div className="school-identity-info">
                            <strong>{invoice.schoolName}</strong>
                            <span>{invoice.schoolCode}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="student-cell">
                          <Icon name="user" size={12} />
                          <span>{invoice.studentName}</span>
                        </div>
                      </td>

                      <td>
                        <span className="class-badge">
                          {invoice.className}
                          {invoice.section ? ` - ${invoice.section}` : ""}
                        </span>
                      </td>

                      <td>
                        <strong className="amount-text">
                          {formatCurrency(invoice.grandTotal)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getPaymentStatusClass(
                            invoice.paymentStatus
                          )}`}
                        >
                          <span className="status-dot" />
                          {getStatusLabel(invoice.paymentStatus)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getInvoiceStatusClass(
                            invoice.invoiceStatus
                          )}`}
                        >
                          <span className="status-dot" />
                          {invoice.invoiceStatus}
                        </span>
                      </td>

                      <td>
                        <div className="row-menu-wrapper">
                          <button
                            type="button"
                            className={`row-menu-trigger ${
                              openMenuId === invoice._id ? "open" : ""
                            }`}
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={() => toggleRowMenu(invoice._id)}
                            aria-label="More actions"
                            aria-expanded={openMenuId === invoice._id}
                          >
                            <Icon name="moreVertical" size={16} />
                          </button>

                          {openMenuId === invoice._id && (
                            <div
                              className="row-menu-dropdown"
                              role="menu"
                            >
                              <button
                                type="button"
                                className="row-menu-item"
                                role="menuitem"
                                onMouseDown={(event) => event.stopPropagation()}
                                onClick={() => {
                                  handleViewInvoice(invoice._id);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Icon name="eye" size={14} />
                                <span>View</span>
                              </button>

                              <button
                                type="button"
                                className="row-menu-item"
                                role="menuitem"
                                disabled={
                                  invoice.invoiceStatus === "CANCELLED"
                                }
                                onMouseDown={(event) => event.stopPropagation()}
                                onClick={() => {
                                  handleEditInvoice(invoice._id);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Icon name="edit" size={14} />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                className="row-menu-item"
                                role="menuitem"
                                onMouseDown={(event) => event.stopPropagation()}
                                onClick={() => {
                                  handlePrintInvoice(invoice);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Icon name="print" size={14} />
                                <span>Print</span>
                              </button>

                              <button
                                type="button"
                                className="row-menu-item"
                                role="menuitem"
                                onMouseDown={(event) => event.stopPropagation()}
                                onClick={() => {
                                  handlePdfInvoice(invoice);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Icon name="download" size={14} />
                                <span>Download PDF</span>
                              </button>

                              <div className="row-menu-divider" />

                              <button
                                type="button"
                                className="row-menu-item danger"
                                role="menuitem"
                                disabled={
                                  invoice.invoiceStatus === "CANCELLED"
                                }
                                onMouseDown={(event) => event.stopPropagation()}
                                onClick={() => {
                                  openCancellationModal(invoice);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Icon name="trash" size={14} />
                                <span>Cancel Invoice</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE LIST */}
            <div className="invoices-mobile-list">
              {invoices.map((invoice) => (
                <article className="invoice-mobile-card" key={invoice._id}>
                  <div className="mobile-invoice-header">
                    <div>
                      <span className="invoice-number-badge">
                        {invoice.invoiceNumber}
                      </span>
                      <div className="mobile-invoice-date">
                        {new Date(invoice.invoiceDate).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short", year: "numeric" }
                        )}
                      </div>
                    </div>

                    <span
                      className={`status-badge ${getInvoiceStatusClass(
                        invoice.invoiceStatus
                      )}`}
                    >
                      <span className="status-dot" />
                      {invoice.invoiceStatus}
                    </span>
                  </div>

                  <div className="mobile-invoice-details">
                    <div>
                      <span>School</span>
                      <strong>{invoice.schoolName}</strong>
                    </div>
                    <div>
                      <span>Student</span>
                      <strong>{invoice.studentName}</strong>
                    </div>
                    <div>
                      <span>Class</span>
                      <strong>
                        {invoice.className}
                        {invoice.section ? ` - ${invoice.section}` : ""}
                      </strong>
                    </div>
                    <div>
                      <span>Total</span>
                      <strong className="amount-text">
                        {formatCurrency(invoice.grandTotal)}
                      </strong>
                    </div>
                  </div>

                  <div className="mobile-invoice-payment">
                    <span>Payment</span>
                    <span
                      className={`status-badge ${getPaymentStatusClass(
                        invoice.paymentStatus
                      )}`}
                    >
                      <span className="status-dot" />
                      {getStatusLabel(invoice.paymentStatus)}
                    </span>
                  </div>

                  <div className="mobile-invoice-footer">
                    <button
                      type="button"
                      className="mobile-menu-trigger"
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={() => toggleRowMenu(invoice._id)}
                      aria-expanded={openMenuId === invoice._id}
                    >
                      <Icon name="moreVertical" size={16} />
                      Actions
                    </button>

                    {openMenuId === invoice._id && (
                      <div
                        className="row-menu-dropdown mobile"
                        role="menu"
                      >
                        <button
                          type="button"
                          className="row-menu-item"
                          role="menuitem"
                          onClick={() => {
                            handleViewInvoice(invoice._id);
                            setOpenMenuId(null);
                          }}
                        >
                          <Icon name="eye" size={14} />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          className="row-menu-item"
                          role="menuitem"
                          disabled={invoice.invoiceStatus === "CANCELLED"}
                          onClick={() => {
                            handleEditInvoice(invoice._id);
                            setOpenMenuId(null);
                          }}
                        >
                          <Icon name="edit" size={14} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className="row-menu-item"
                          role="menuitem"
                          onClick={() => {
                            handlePrintInvoice(invoice);
                            setOpenMenuId(null);
                          }}
                        >
                          <Icon name="print" size={14} />
                          <span>Print</span>
                        </button>

                        <button
                          type="button"
                          className="row-menu-item"
                          role="menuitem"
                          onClick={() => {
                            handlePdfInvoice(invoice);
                            setOpenMenuId(null);
                          }}
                        >
                          <Icon name="download" size={14} />
                          <span>Download PDF</span>
                        </button>

                        <div className="row-menu-divider" />

                        <button
                          type="button"
                          className="row-menu-item danger"
                          role="menuitem"
                          disabled={invoice.invoiceStatus === "CANCELLED"}
                          onClick={() => {
                            openCancellationModal(invoice);
                            setOpenMenuId(null);
                          }}
                        >
                          <Icon name="trash" size={14} />
                          <span>Cancel Invoice</span>
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* PAGINATION */}
            <div className="invoices-pagination">
              <div className="pagination-info">
                <strong>{pagination.total}</strong>
                <span>invoices total</span>
                <span className="pagination-divider">•</span>
                <span>
                  Showing {Math.min(invoices.length, pagination.limit)} on this
                  page
                </span>
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-button"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((currentValue) => ({
                      ...currentValue,
                      page: currentValue.page - 1
                    }))
                  }
                >
                  <Icon name="chevronLeft" size={15} />
                  Previous
                </button>

                <div className="page-indicator">
                  <span>Page</span>
                  <strong>{pagination.page}</strong>
                  <span>of</span>
                  <strong>{Math.max(pagination.totalPages, 1)}</strong>
                </div>

                <button
                  type="button"
                  className="pagination-button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((currentValue) => ({
                      ...currentValue,
                      page: currentValue.page + 1
                    }))
                  }
                >
                  Next
                  <Icon name="chevronRight" size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isFormModalOpen && (
        <Modal
          title={formMode === "EDIT" ? "Edit Invoice" : "Create Invoice"}
          onClose={closeFormModal}
        >
          <form
            className="professional-invoice-form"
            onSubmit={handleCompletedSubmit}
          >
            <div className="modal-introduction">
              <div className="modal-intro-icon">
                <Icon name="invoice" size={19} />
              </div>
              <div>
                <strong>
                  {formMode === "EDIT"
                    ? "Update invoice details"
                    : "Add a new invoice"}
                </strong>
                <p>
                  Fill in student, school and payment details to generate a
                  GST-compliant invoice.
                </p>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-heading">
                <div>
                  <span>01</span>
                  <div>
                    <h3>Invoice Details</h3>
                    <p>School, place of order and student information.</p>
                  </div>
                </div>
              </div>

              <div className="professional-form-grid">
                <div className="professional-field">
                  <label htmlFor="invoiceSchool">
                    School <span>*</span>
                  </label>
                  <select
                    id="invoiceSchool"
                    value={formData.schoolId}
                    onChange={(event) =>
                      void handleSchoolChange(event.target.value)
                    }
                    required
                  >
                    <option value="">Select school</option>
                    {schools
                      .filter(
                        (school) =>
                          school.status === "ACTIVE" ||
                          school._id === formData.schoolId
                      )
                      .map((school) => (
                        <option key={school._id} value={school._id}>
                          {school.schoolName} ({school.schoolCode})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="professional-field">
                  <label htmlFor="placeOfOrder">
                    Place of Order <span>*</span>
                  </label>
                  <select
                    id="placeOfOrder"
                    value={formData.placeOfOrder}
                    onChange={(event) => {
                      const selectedPlace = event.target
                        .value as CreateInvoiceInput["placeOfOrder"];
                      updateFormField("placeOfOrder", selectedPlace);
                      if (selectedPlace !== "SPECIALIZED_SCHOOL_STORE") {
                        updateFormField("specializedStoreName", "");
                      }
                    }}
                    required
                  >
                    <option value="SCHOOL_CAMP">School Camp</option>
                    <option value="TIPPASANDRA_STORE">Tippasandra Store</option>
                    <option value="MANDUR_STORE">Mandur Store</option>
                    <option value="SARJAPUR_STORE">Sarjapur Store</option>
                    <option value="SPECIALIZED_SCHOOL_STORE">
                      Specialized School Store
                    </option>
                  </select>
                </div>

                {formData.placeOfOrder === "SPECIALIZED_SCHOOL_STORE" && (
                  <div className="professional-field form-field-full">
                    <label htmlFor="specializedStoreName">
                      Specialized Store Name <span>*</span>
                    </label>
                    <input
                      id="specializedStoreName"
                      value={formData.specializedStoreName}
                      onChange={(event) =>
                        updateFormField(
                          "specializedStoreName",
                          event.target.value
                        )
                      }
                      placeholder="Enter school store name"
                      required
                    />
                  </div>
                )}

                <div className="professional-field">
                  <label htmlFor="studentName">
                    Student Name <span>*</span>
                  </label>
                  <input
                    id="studentName"
                    value={formData.studentName}
                    onChange={(event) =>
                      updateFormField("studentName", event.target.value)
                    }
                    placeholder="Full name"
                    required
                  />
                </div>

                <div className="professional-field">
                  <label htmlFor="className">
                    Class <span>*</span>
                  </label>
                  <input
                    id="className"
                    value={formData.className}
                    onChange={(event) =>
                      updateFormField("className", event.target.value)
                    }
                    placeholder="e.g. 5"
                    required
                  />
                </div>

                <div className="professional-field">
                  <label htmlFor="section">Section</label>
                  <input
                    id="section"
                    value={formData.section}
                    onChange={(event) =>
                      updateFormField("section", event.target.value)
                    }
                    placeholder="e.g. A"
                  />
                </div>

                <div className="professional-field">
                  <label htmlFor="parentName">Parent Name</label>
                  <input
                    id="parentName"
                    value={formData.parentName}
                    onChange={(event) =>
                      updateFormField("parentName", event.target.value)
                    }
                    placeholder="Parent / guardian"
                  />
                </div>

                <div className="professional-field">
                  <label htmlFor="contactNumber">Contact Number</label>
                  <input
                    id="contactNumber"
                    value={formData.contactNumber}
                    onChange={(event) =>
                      updateFormField("contactNumber", event.target.value)
                    }
                    placeholder="10-digit mobile"
                  />
                </div>

                <div className="professional-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      updateFormField("email", event.target.value)
                    }
                    placeholder="parent@email.com"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-heading">
                <div>
                  <span>02</span>
                  <div>
                    <h3>Payment Details</h3>
                    <p>Payment mode, status and reference.</p>
                  </div>
                </div>
              </div>

              <div className="professional-form-grid">
                <div className="professional-field">
                  <label htmlFor="paymentMode">Payment Mode</label>
                  <select
                    id="paymentMode"
                    value={formData.paymentMode}
                    onChange={(event) =>
                      updateFormField(
                        "paymentMode",
                        event.target.value as PaymentMode
                      )
                    }
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>

                <div className="professional-field">
                  <label htmlFor="paymentStatus">Payment Status</label>
                  <select
                    id="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={(event) =>
                      updateFormField(
                        "paymentStatus",
                        event.target.value as PaymentStatus
                      )
                    }
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>

                <div className="professional-field">
                  <label htmlFor="paymentReference">Payment Reference</label>
                  <input
                    id="paymentReference"
                    value={formData.paymentReference}
                    onChange={(event) =>
                      updateFormField("paymentReference", event.target.value)
                    }
                    placeholder="Transaction ID / Ref"
                  />
                </div>

                <div className="professional-field">
                  <label htmlFor="paidAmount">Paid Amount (₹)</label>
                  <input
                    id="paidAmount"
                    type="number"
                    min="0"
                    max={calculatedSummary.grandTotal}
                    step="0.01"
                    value={formData.paidAmount}
                    onChange={(event) =>
                      updateFormField(
                        "paidAmount",
                        Number(event.target.value) || 0
                      )
                    }
                  />
                  <small>
                    Grand total: {formatCurrency(calculatedSummary.grandTotal)}
                  </small>
                </div>

                <div className="professional-field form-field-full">
                  <label htmlFor="remarks">Remarks</label>
                  <input
                    id="remarks"
                    value={formData.remarks}
                    onChange={(event) =>
                      updateFormField("remarks", event.target.value)
                    }
                    placeholder="Optional notes"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-heading">
                <div>
                  <span>03</span>
                  <div>
                    <h3>Invoice Items</h3>
                    <p>Select products and sizes for this invoice.</p>
                  </div>
                </div>
              </div>

              {isLoadingProducts ? (
                <LoadingSpinner message="Loading products..." />
              ) : (
                <div className="items-table-wrapper">
                  <table className="items-table-form">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Size</th>
                        <th>Gender</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>GST</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => {
                        const product = products.find(
                          (p) => p._id === item.productId
                        );
                        const variant = product?.variants.find(
                          (v) => v._id === item.variantId
                        );
                        const taxableAmount = variant
                          ? roundCurrency(variant.unitPrice * item.quantity)
                          : 0;
                        const gstAmount = variant
                          ? roundCurrency(
                              taxableAmount * (variant.gstPercentage / 100)
                            )
                          : 0;
                        const total = roundCurrency(taxableAmount + gstAmount);

                        return (
                          <tr key={index}>
                            <td>
                              <select
                                value={item.productId}
                                onChange={(event) =>
                                  updateInvoiceItem(
                                    index,
                                    "productId",
                                    event.target.value
                                  )
                                }
                                required
                              >
                                <option value="">Select product</option>
                                {products.map((currentProduct) => (
                                  <option
                                    key={currentProduct._id}
                                    value={currentProduct._id}
                                  >
                                    {currentProduct.productName}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                value={item.variantId}
                                disabled={!product}
                                onChange={(event) =>
                                  updateInvoiceItem(
                                    index,
                                    "variantId",
                                    event.target.value
                                  )
                                }
                                required
                              >
                                <option value="">Select size</option>
                                {product?.variants.map((currentVariant) => (
                                  <option
                                    key={currentVariant._id}
                                    value={currentVariant._id}
                                  >
                                    {currentVariant.size}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <span className="muted-text">
                                {product?.gender ?? "—"}
                              </span>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={item.quantity}
                                onChange={(event) =>
                                  updateInvoiceItem(
                                    index,
                                    "quantity",
                                    event.target.value
                                  )
                                }
                                className="qty-input"
                              />
                            </td>
                            <td>
                              <span className="muted-text">
                                {variant
                                  ? formatCurrency(variant.unitPrice)
                                  : "—"}
                              </span>
                            </td>
                            <td>
                              <span className="muted-text">
                                {variant ? `${variant.gstPercentage}%` : "—"}
                              </span>
                            </td>
                            <td>
                              <strong className="amount-text">
                                {formatCurrency(total)}
                              </strong>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="icon-action-button danger"
                                title="Remove item"
                                disabled={formData.items.length === 1}
                                onClick={() => removeInvoiceItem(index)}
                              >
                                <Icon name="trash" size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <button
                    type="button"
                    className="add-item-button"
                    disabled={!formData.schoolId || isLoadingProducts}
                    onClick={addInvoiceItem}
                  >
                    <Icon name="plus" size={15} />
                    Add Item
                  </button>
                </div>
              )}
            </div>

            <div className="invoice-summary-panel">
              <div className="summary-row">
                <span>Taxable Amount</span>
                <strong>{formatCurrency(calculatedSummary.taxableAmount)}</strong>
              </div>
              <div className="summary-row">
                <span>Total GST</span>
                <strong>{formatCurrency(calculatedSummary.gstAmount)}</strong>
              </div>
              <div className="summary-row">
                <span>Round Off</span>
                <strong>{formatCurrency(calculatedSummary.roundOff)}</strong>
              </div>
              <div className="summary-row summary-grand">
                <span>Grand Total</span>
                <strong>{formatCurrency(calculatedSummary.grandTotal)}</strong>
              </div>
            </div>

            <div className="professional-form-actions">
              <button
                type="button"
                className="modal-cancel-button"
                disabled={isSubmitting}
                onClick={closeFormModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="modal-secondary-button"
                disabled={isSubmitting}
                onClick={() => void submitInvoice("DRAFT")}
              >
                {formMode === "EDIT" ? "Update as Draft" : "Save Draft"}
              </button>

              <button
                type="submit"
                className="modal-submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="button-spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon name="check" size={16} />
                    {formMode === "EDIT" ? "Update Invoice" : "Generate Invoice"}
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW MODAL */}
      {isViewModalOpen && (
        <Modal
          title="Invoice Details"
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedInvoice(null);
          }}
        >
          {isLoadingInvoice || !selectedInvoice ? (
            <LoadingSpinner message="Loading invoice..." />
          ) : (
            <div className="invoice-view">
              <div className="invoice-view-header">
                <div>
                  <span className="invoice-number-badge">
                    {selectedInvoice.invoiceNumber}
                  </span>
                  <p>
                    {new Date(selectedInvoice.invoiceDate).toLocaleDateString(
                      "en-IN",
                      { day: "2-digit", month: "long", year: "numeric" }
                    )}
                  </p>
                </div>

                <span
                  className={`status-badge ${getInvoiceStatusClass(
                    selectedInvoice.invoiceStatus
                  )}`}
                >
                  <span className="status-dot" />
                  {selectedInvoice.invoiceStatus}
                </span>
              </div>

              <div className="invoice-view-grid">
                <div>
                  <span>School</span>
                  <strong>{selectedInvoice.schoolName}</strong>
                </div>
                <div>
                  <span>Student</span>
                  <strong>{selectedInvoice.studentName}</strong>
                </div>
                <div>
                  <span>Class</span>
                  <strong>
                    {selectedInvoice.className}
                    {selectedInvoice.section
                      ? ` - ${selectedInvoice.section}`
                      : ""}
                  </strong>
                </div>
                <div>
                  <span>Parent</span>
                  <strong>{selectedInvoice.parentName || "—"}</strong>
                </div>
                <div>
                  <span>Contact</span>
                  <strong>{selectedInvoice.contactNumber || "—"}</strong>
                </div>
                <div>
                  <span>Payment</span>
                  <strong>
                    {selectedInvoice.paymentMode} –{" "}
                    {getStatusLabel(selectedInvoice.paymentStatus)}
                  </strong>
                </div>
              </div>

              <div className="items-table-wrapper">
                <table className="items-table-form">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th>Gender</th>
                      <th>Size</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>GST</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={item._id}>
                        <td>{index + 1}</td>
                        <td>{item.productName}</td>
                        <td>{item.gender}</td>
                        <td>{item.size}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unitPrice)}</td>
                        <td>{item.gstPercentage}%</td>
                        <td>
                          <strong>{formatCurrency(item.totalAmount)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="invoice-summary-panel">
                <div className="summary-row">
                  <span>Taxable Amount</span>
                  <strong>
                    {formatCurrency(selectedInvoice.taxableAmount)}
                  </strong>
                </div>
                <div className="summary-row">
                  <span>Total GST</span>
                  <strong>
                    {formatCurrency(selectedInvoice.totalGstAmount)}
                  </strong>
                </div>
                <div className="summary-row">
                  <span>Round Off</span>
                  <strong>{formatCurrency(selectedInvoice.roundOff)}</strong>
                </div>
                <div className="summary-row summary-grand">
                  <span>Grand Total</span>
                  <strong>{formatCurrency(selectedInvoice.grandTotal)}</strong>
                </div>
              </div>

              {selectedInvoice.invoiceStatus === "CANCELLED" && (
                <div className="cancelled-information">
                  <strong>Cancellation Reason</strong>
                  <p>{selectedInvoice.cancellationReason}</p>
                </div>
              )}

              <div className="professional-form-actions">
                <button
                  type="button"
                  className="modal-secondary-button"
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                >
                  <Icon name="print" size={15} />
                  Print
                </button>

                <button
                  type="button"
                  className="modal-secondary-button"
                  onClick={() => handlePdfInvoice(selectedInvoice)}
                >
                  <Icon name="download" size={15} />
                  PDF
                </button>

                <button
                  type="button"
                  className="modal-submit-button"
                  disabled={selectedInvoice.invoiceStatus === "CANCELLED"}
                  onClick={() => {
                    setIsViewModalOpen(false);
                    void handleEditInvoice(selectedInvoice._id);
                  }}
                >
                  <Icon name="edit" size={15} />
                  Edit Invoice
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* CANCEL MODAL */}
      {isCancelModalOpen && invoiceToCancel && (
        <Modal
          title="Cancel Invoice"
          onClose={() => {
            if (!isCancelling) {
              setIsCancelModalOpen(false);
              setInvoiceToCancel(null);
              setCancellationReason("");
            }
          }}
        >
          <div className="cancel-invoice-content">
            <div className="warning-message">
              <div className="warning-icon">
                <Icon name="warning" size={22} />
              </div>
              <div>
                <strong>Cancel {invoiceToCancel.invoiceNumber}?</strong>
                <p>
                  This invoice will remain in billing history but will be
                  excluded from active sales and production reports.
                </p>
              </div>
            </div>

            <div className="professional-field">
              <label htmlFor="cancellationReason">
                Cancellation Reason <span>*</span>
              </label>
              <textarea
                id="cancellationReason"
                rows={4}
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                placeholder="Explain why this invoice is being cancelled"
              />
            </div>

            <div className="professional-form-actions">
              <button
                type="button"
                className="modal-cancel-button"
                disabled={isCancelling}
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setInvoiceToCancel(null);
                  setCancellationReason("");
                }}
              >
                Back
              </button>

              <button
                type="button"
                className="modal-danger-button"
                disabled={isCancelling || cancellationReason.trim().length < 3}
                onClick={() => void handleCancelInvoice()}
              >
                {isCancelling ? (
                  <>
                    <span className="button-spinner" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Icon name="trash" size={15} />
                    Cancel Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}