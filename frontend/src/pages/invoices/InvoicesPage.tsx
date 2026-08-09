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

interface InvoiceFormItem extends InvoiceItemInput {}

type InvoiceFormMode = "CREATE" | "EDIT";

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
  items: [
    {
      ...emptyInvoiceItem
    }
  ],
  remarks: ""
};

function createInitialForm(): CreateInvoiceInput {
  return {
    ...initialForm,
    items: [
      {
        ...emptyInvoiceItem
      }
    ]
  };
}

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
      return data.errors
        .map((item) => item.message)
        .join(", ");
    }

    return data?.message ?? "The request failed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

function getPaymentStatusClass(
  paymentStatus: PaymentStatus
): string {
  if (paymentStatus === "PAID") {
    return "status-active";
  }

  if (paymentStatus === "PARTIALLY_PAID") {
    return "status-partial";
  }

  return "status-pending";
}

function getInvoiceStatusClass(
  invoiceStatus: InvoiceStatus
): string {
  if (invoiceStatus === "COMPLETED") {
    return "status-active";
  }

  if (invoiceStatus === "CANCELLED") {
    return "status-inactive";
  }

  return "status-draft";
}

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

  const [formMode, setFormMode] =
    useState<InvoiceFormMode>("CREATE");

  const [editingInvoiceId, setEditingInvoiceId] =
    useState<string | null>(null);

  const [selectedInvoice, setSelectedInvoice] =
    useState<Invoice | null>(null);

  const [invoiceToCancel, setInvoiceToCancel] =
    useState<Invoice | null>(null);

  const [cancellationReason, setCancellationReason] =
    useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [schoolFilter, setSchoolFilter] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] =
    useState<InvoiceStatus | "">("");

  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<PaymentStatus | "">("");

  const [isFormModalOpen, setIsFormModalOpen] =
    useState(false);

  const [isViewModalOpen, setIsViewModalOpen] =
    useState(false);

  const [isCancelModalOpen, setIsCancelModalOpen] =
    useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] =
    useState(false);

  const [isLoadingInvoice, setIsLoadingInvoice] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isCancelling, setIsCancelling] =
    useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadSchools = useCallback(async () => {
    try {
      const result = await getSchools({
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

  async function loadProductsForSchool(
    schoolId: string
  ): Promise<Product[]> {
    if (!schoolId) {
      setProducts([]);
      return [];
    }

    try {
      setIsLoadingProducts(true);

      const result = await getProducts({
        schoolId,
        page: 1,
        limit: 100
      });

      setProducts(result.data);

      return result.data;
    } catch (error) {
      setNotification({
        type: "error",
        message: getErrorMessage(error)
      });

      return [];
    } finally {
      setIsLoadingProducts(false);
    }
  }

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
    if (isSubmitting) {
      return;
    }

    setIsFormModalOpen(false);
    resetInvoiceForm();
  }

  async function handleSchoolChange(
    schoolId: string
  ): Promise<void> {
    setFormData((currentValue) => ({
      ...currentValue,
      schoolId,
      items: [
        {
          ...emptyInvoiceItem
        }
      ]
    }));

    await loadProductsForSchool(schoolId);
  }

  function updateFormField<K extends keyof CreateInvoiceInput>(
    field: K,
    value: CreateInvoiceInput[K]
  ): void {
    setFormData((currentValue) => ({
      ...currentValue,
      [field]: value
    }));
  }

  function updateInvoiceItem(
    index: number,
    field: keyof InvoiceFormItem,
    value: string
  ): void {
    setFormData((currentValue) => ({
      ...currentValue,
      items: currentValue.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        if (field === "quantity") {
          const parsedQuantity = Number(value);

          return {
            ...item,
            quantity:
              Number.isFinite(parsedQuantity) &&
              parsedQuantity > 0
                ? parsedQuantity
                : 1
          };
        }

        if (field === "productId") {
          return {
            ...item,
            productId: value,
            variantId: ""
          };
        }

        return {
          ...item,
          [field]: value
        };
      })
    }));
  }

  function addInvoiceItem(): void {
    setFormData((currentValue) => ({
      ...currentValue,
      items: [
        ...currentValue.items,
        {
          ...emptyInvoiceItem
        }
      ]
    }));
  }

  function removeInvoiceItem(index: number): void {
    setFormData((currentValue) => {
      if (currentValue.items.length === 1) {
        return currentValue;
      }

      return {
        ...currentValue,
        items: currentValue.items.filter(
          (_, itemIndex) => itemIndex !== index
        )
      };
    });
  }

  const calculatedSummary = useMemo(() => {
    let taxableAmount = 0;
    let gstAmount = 0;

    for (const item of formData.items) {
      const product = products.find(
        (currentProduct) =>
          currentProduct._id === item.productId
      );

      const variant = product?.variants.find(
        (currentVariant) =>
          currentVariant._id === item.variantId
      );

      if (!variant) {
        continue;
      }

      const lineTaxableAmount = roundCurrency(
        variant.unitPrice * item.quantity
      );

      const lineGstAmount = roundCurrency(
        lineTaxableAmount *
          (variant.gstPercentage / 100)
      );

      taxableAmount += lineTaxableAmount;
      gstAmount += lineGstAmount;
    }

    taxableAmount = roundCurrency(taxableAmount);
    gstAmount = roundCurrency(gstAmount);

    const unroundedGrandTotal = roundCurrency(
      taxableAmount + gstAmount
    );

    const grandTotal = Math.round(
      unroundedGrandTotal
    );

    return {
      taxableAmount,
      gstAmount,
      roundOff: roundCurrency(
        grandTotal - unroundedGrandTotal
      ),
      grandTotal
    };
  }, [formData.items, products]);

  function validateInvoiceForm(): string | null {
    if (!formData.schoolId) {
      return "Please select a school.";
    }

    if (!formData.studentName.trim()) {
      return "Student name is required.";
    }

    if (!formData.className.trim()) {
      return "Class is required.";
    }

    if (formData.items.length === 0) {
      return "At least one invoice item is required.";
    }

    for (
      let index = 0;
      index < formData.items.length;
      index += 1
    ) {
      const item = formData.items[index];

      if (!item.productId) {
        return `Please select a product in item ${
          index + 1
        }.`;
      }

      if (!item.variantId) {
        return `Please select a size in item ${
          index + 1
        }.`;
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return `Enter a valid quantity in item ${
          index + 1
        }.`;
      }
    }

    if (
      formData.paidAmount < 0 ||
      formData.paidAmount >
        calculatedSummary.grandTotal
    ) {
      return "Paid amount cannot exceed the invoice grand total.";
    }

    return null;
  }

  async function submitInvoice(
    invoiceStatus: "DRAFT" | "COMPLETED"
  ): Promise<void> {
    const validationError =
      validateInvoiceForm();

    if (validationError) {
      setNotification({
        type: "error",
        message: validationError
      });

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

        placeOfOrder:
          formData.placeOfOrder || "SCHOOL_CAMP",

        specializedStoreName:
          formData.placeOfOrder ===
          "SPECIALIZED_SCHOOL_STORE"
            ? formData.specializedStoreName.trim()
            : "",

        paymentMode: formData.paymentMode,
        paymentReference:
          formData.paymentReference.trim(),
        paymentStatus: formData.paymentStatus,
        paidAmount: formData.paidAmount,
        invoiceStatus,
        items: formData.items,
        remarks: formData.remarks.trim()
      };

      if (
        formMode === "EDIT" &&
        editingInvoiceId
      ) {
        const result = await updateInvoice(
          editingInvoiceId,
          payload
        );

        setNotification({
          type: "success",
          message: `Invoice ${result.data.invoiceNumber} updated successfully.`
        });
      } else {
        const result = await createInvoice(
          payload
        );

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
        setPagination((currentValue) => ({
          ...currentValue,
          page: 1
        }));
      } else {
        await loadInvoices();
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: getErrorMessage(error)
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCompletedSubmit(
    event: FormEvent<HTMLFormElement>
  ): void {
    event.preventDefault();
    void submitInvoice("COMPLETED");
  }

  async function handleViewInvoice(
    invoiceId: string
  ): Promise<void> {
    try {
      setIsLoadingInvoice(true);
      setSelectedInvoice(null);
      setIsViewModalOpen(true);

      const result = await getInvoiceById(
        invoiceId
      );

      setSelectedInvoice(result.data);
    } catch (error) {
      setIsViewModalOpen(false);

      setNotification({
        type: "error",
        message: getErrorMessage(error)
      });
    } finally {
      setIsLoadingInvoice(false);
    }
  }

  async function handleEditInvoice(
    invoiceId: string
  ): Promise<void> {
    try {
      setIsLoadingInvoice(true);
      setNotification(null);

      const result = await getInvoiceById(
        invoiceId
      );

      const invoice = result.data;

      if (
        invoice.invoiceStatus === "CANCELLED"
      ) {
        throw new Error(
          "A cancelled invoice cannot be edited."
        );
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

        specializedStoreName:
          invoice.specializedStoreName ?? "",

        paymentMode: invoice.paymentMode,
        paymentReference: invoice.paymentReference ?? "",
        paymentStatus: invoice.paymentStatus,
        paidAmount: invoice.paidAmount,

        invoiceStatus:
          invoice.invoiceStatus === "DRAFT"
            ? "DRAFT"
            : "COMPLETED",

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
      setNotification({
        type: "error",
        message: getErrorMessage(error)
      });
    } finally {
      setIsLoadingInvoice(false);
    }
  }

  function openCancellationModal(
    invoice: Invoice
  ): void {
    if (
      invoice.invoiceStatus === "CANCELLED"
    ) {
      setNotification({
        type: "error",
        message:
          "This invoice is already cancelled."
      });

      return;
    }

    setInvoiceToCancel(invoice);
    setCancellationReason("");
    setIsCancelModalOpen(true);
  }

  async function handleCancelInvoice(): Promise<void> {
    if (!invoiceToCancel) {
      return;
    }

    if (
      cancellationReason.trim().length < 3
    ) {
      setNotification({
        type: "error",
        message:
          "Enter a cancellation reason containing at least 3 characters."
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
      setNotification({
        type: "error",
        message: getErrorMessage(error)
      });
    } finally {
      setIsCancelling(false);
    }
  }

  function handlePrintInvoice(
    invoice: Invoice
  ): void {
    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=700"
    );

    if (!printWindow) {
      setNotification({
        type: "error",
        message:
          "Please allow pop-ups to print the invoice."
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

    const paymentModeChecked = (mode: string) => {
      return invoice.paymentMode === mode ? "☑" : "☐";
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${invoice.invoiceNumber}</title>

          <style>
            @page {
              size: A4;
              margin: 8mm 10mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              color: #1a1a2e;
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-size: 12px;
            }

            .invoice-container {
              max-width: 100%;
              padding: 0;
            }

            /* Header Section */
            .header-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3px solid #1a1a2e;
              padding-bottom: 16px;
              margin-bottom: 16px;
            }

            .company-details {
              flex: 1;
            }

            .company-name {
              font-size: 20px;
              font-weight: 800;
              color: #1a1a2e;
              letter-spacing: -0.5px;
              margin: 0 0 4px 0;
            }

            .company-address {
              font-size: 11px;
              color: #4a4a6a;
              line-height: 1.5;
              margin: 0;
            }

            .company-gst {
              font-size: 10.5px;
              color: #4a4a6a;
              margin: 3px 0 0 0;
              font-weight: 500;
            }

            .company-gst span {
              background: #f0f0f5;
              padding: 1px 8px;
              border-radius: 3px;
            }

            .invoice-title {
              text-align: right;
              min-width: 180px;
            }

            .invoice-title h2 {
              font-size: 24px;
              font-weight: 800;
              color: #1a1a2e;
              margin: 0 0 4px 0;
              letter-spacing: 1px;
            }

            .invoice-number {
              font-size: 13px;
              font-weight: 600;
              color: #2d2d5e;
              background: #f0f0f5;
              padding: 2px 12px;
              border-radius: 4px;
              display: inline-block;
            }

            .invoice-date {
              font-size: 11px;
              color: #4a4a6a;
              margin-top: 3px;
            }

            .cancelled-stamp {
              color: #b91c1c;
              border: 3px solid #b91c1c;
              padding: 6px 16px;
              font-weight: 800;
              font-size: 18px;
              transform: rotate(-10deg);
              display: inline-block;
              margin-top: 6px;
              border-radius: 4px;
              letter-spacing: 2px;
            }

            /* Details Grid */
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
              margin-bottom: 16px;
            }

            .detail-box {
              border: 1px solid #e0e0ea;
              border-radius: 6px;
              padding: 10px 14px;
              background: #fafafe;
            }

            .detail-box .label {
              font-size: 9.5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b6b8a;
              font-weight: 600;
              display: block;
              margin-bottom: 3px;
            }

            .detail-box .value {
              font-size: 13px;
              font-weight: 600;
              color: #1a1a2e;
            }

            .detail-box .value-small {
              font-size: 11px;
              font-weight: 400;
              color: #2d2d5e;
            }

            /* Payment Mode */
            .payment-mode-section {
              border: 1px solid #e0e0ea;
              border-radius: 6px;
              padding: 10px 14px;
              background: #fafafe;
              margin-bottom: 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap;
            }

            .payment-mode-label {
              font-size: 11px;
              font-weight: 600;
              color: #1a1a2e;
            }

            .payment-mode-options {
              display: flex;
              gap: 20px;
              font-size: 13px;
            }

            .payment-mode-options span {
              display: flex;
              align-items: center;
              gap: 4px;
            }

            .payment-mode-options .checked {
              color: #1a8a4a;
              font-weight: 700;
            }

            /* Bank Details */
            .bank-details {
              border: 1px solid #e0e0ea;
              border-radius: 6px;
              padding: 10px 14px;
              background: #f8f8ff;
              margin-bottom: 16px;
              font-size: 10.5px;
              color: #2d2d5e;
              line-height: 1.6;
            }

            .bank-details strong {
              color: #1a1a2e;
            }

            /* Table */
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
              font-size: 11px;
            }

            .items-table th {
              background: #1a1a2e;
              color: #ffffff;
              padding: 8px 10px;
              text-align: left;
              font-weight: 600;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }

            .items-table td {
              border-bottom: 1px solid #e8e8f0;
              padding: 8px 10px;
              color: #2d2d5e;
            }

            .items-table tr:last-child td {
              border-bottom: 2px solid #1a1a2e;
            }

            .items-table .text-right {
              text-align: right;
            }

            .items-table .total-cell {
              font-weight: 700;
              color: #1a1a2e;
            }

            /* Summary */
            .summary-section {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 16px;
            }

            .summary-box {
              width: 280px;
              border: 1px solid #e0e0ea;
              border-radius: 6px;
              padding: 10px 14px;
              background: #fafafe;
            }

            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 11px;
              color: #4a4a6a;
            }

            .summary-row .amount {
              font-weight: 600;
              color: #1a1a2e;
            }

            .summary-divider {
              border-top: 1px solid #e0e0ea;
              margin: 6px 0;
            }

            .summary-grand {
              display: flex;
              justify-content: space-between;
              padding: 6px 0 0 0;
              font-size: 15px;
              font-weight: 800;
              color: #1a1a2e;
              border-top: 2px solid #1a1a2e;
              margin-top: 4px;
            }

            /* Terms */
            .terms-section {
              border-top: 2px solid #1a1a2e;
              padding-top: 12px;
              margin-top: 4px;
            }

            .terms-title {
              font-size: 11px;
              font-weight: 700;
              color: #1a1a2e;
              margin: 0 0 6px 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .terms-list {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 2px 20px;
              margin: 0;
              padding: 0;
              list-style: none;
              font-size: 9.5px;
              color: #4a4a6a;
              line-height: 1.6;
            }

            .terms-list li::before {
              content: "• ";
              color: #1a1a2e;
              font-weight: 700;
            }

            .terms-list .highlight {
              color: #b91c1c;
              font-weight: 600;
            }

            /* Footer */
            .footer-section {
              margin-top: 12px;
              text-align: center;
              font-size: 9px;
              color: #8a8aaa;
              border-top: 1px solid #e8e8f0;
              padding-top: 10px;
            }

            /* Responsive */
            @media print {
              .no-print {
                display: none;
              }
            }

            @media (max-width: 600px) {
              .details-grid {
                grid-template-columns: 1fr;
              }
              .header-section {
                flex-direction: column;
                align-items: flex-start;
              }
              .invoice-title {
                text-align: left;
                margin-top: 8px;
                width: 100%;
              }
              .payment-mode-options {
                flex-wrap: wrap;
                gap: 10px;
              }
              .terms-list {
                grid-template-columns: 1fr;
              }
              .summary-box {
                width: 100%;
              }
            }
          </style>
        </head>

        <body>
          <div class="invoice-container">
            <!-- Header -->
            <div class="header-section">
              <div class="company-details">
                <h1 class="company-name">SCHOOLAY TECHNOLOGIES PRIVATE LIMITED</h1>
                <p class="company-address">
                  546/1, BRR Layout, Dodda Banaswadi, Bangalore - 560043
                </p>
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
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  })}
                </div>
                ${
                  invoice.invoiceStatus === "CANCELLED"
                    ? `<div class="cancelled-stamp">CANCELLED</div>`
                    : ""
                }
              </div>
            </div>

            <!-- Details -->
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
                <div class="value-small">
                  Payment: ${invoice.paymentStatus.replaceAll("_", " ")}
                </div>
              </div>
            </div>

            <!-- Payment Mode -->
            <div class="payment-mode-section">
              <span class="payment-mode-label">Mode of Payment:</span>
              <div class="payment-mode-options">
                <span class="${invoice.paymentMode === "CARD" ? "checked" : ""}">
                  ${paymentModeChecked("CARD")} Card
                </span>
                <span class="${invoice.paymentMode === "CASH" ? "checked" : ""}">
                  ${paymentModeChecked("CASH")} Cash
                </span>
                <span class="${invoice.paymentMode === "ONLINE" ? "checked" : ""}">
                  ${paymentModeChecked("ONLINE")} Online
                </span>
              </div>
            </div>

            <!-- Bank Details -->
            <div class="bank-details">
              <strong>🏦 Schoolay Technologies Private Limited</strong><br />
              Punjab National Bank, Indiranagar<br />
              <strong>Account Number:</strong> 1268002100016836 &nbsp;|&nbsp;
              <strong>IFSC:</strong> PUNB0126800
            </div>

            <!-- Items Table -->
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

              <tbody>
                ${itemRows}
              </tbody>
            </table>

            <!-- Summary -->
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

            <!-- Terms & Conditions -->
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

            <!-- Footer -->
            <div class="footer-section">
              Thank you for your business! — Schoolay Technologies Private Limited
            </div>
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  function handlePdfInvoice(
    invoice: Invoice
  ): void {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:5000/api/v1";

    window.open(
      `${apiBaseUrl}/invoices/${invoice._id}/pdf`,
      "_blank"
    );
  }

  function handleSearchSubmit(
    event: FormEvent<HTMLFormElement>
  ): void {
    event.preventDefault();

    setPagination((currentValue) => ({
      ...currentValue,
      page: 1
    }));

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

    setPagination((currentValue) => ({
      ...currentValue,
      page: 1
    }));
  }

  async function handleExportInvoices():
  Promise<void> {
    if (
      !exportFromDate ||
      !exportToDate
    ) {
      setNotification({
        type: "error",
        message:
          "Select From Date and To Date."
      });

      return;
    }

    if (
      exportToDate <
      exportFromDate
    ) {
      setNotification({
        type: "error",
        message:
          "To Date cannot be before From Date."
      });

      return;
    }

    try {
      setIsExportingExcel(true);
      setNotification(null);

      await downloadInvoicesExcel(
        exportFromDate,
        exportToDate
      );

      setNotification({
        type: "success",
        message:
          "Invoices exported successfully."
      });
    } catch (error) {
      setNotification({
        type: "error",
        message:
          getErrorMessage(error)
      });
    } finally {
      setIsExportingExcel(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Invoices</h1>
          <p>
            Create, edit, view, print and manage
            student-wise invoices
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateInvoiceModal}
        >
          + Create Invoice
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
        <div className="invoice-export-toolbar">
          <div className="invoice-export-field">
            <label htmlFor="exportFromDate">
              From Date
            </label>

            <input
              id="exportFromDate"
              type="date"
              value={exportFromDate}
              onChange={(event) =>
                setExportFromDate(event.target.value)
              }
            />
          </div>

          <div className="invoice-export-field">
            <label htmlFor="exportToDate">
              To Date
            </label>

            <input
              id="exportToDate"
              type="date"
              value={exportToDate}
              min={exportFromDate}
              onChange={(event) =>
                setExportToDate(event.target.value)
              }
            />
          </div>

          <button
            type="button"
            className="invoice-export-button"
            disabled={isExportingExcel}
            onClick={() =>
              void handleExportInvoices()
            }
          >
            📊{" "}
            {isExportingExcel
              ? "Exporting..."
              : "Export Excel"}
          </button>
        </div>

        <form
          className="filter-section invoice-filters"
          onSubmit={handleSearchSubmit}
        >
          <div className="search-row">
            <div className="search-input-wrapper">
              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Invoice number, student, class or phone"
              />
            </div>

            <button
              type="submit"
              className="search-button"
            >
              Search
            </button>
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">School</label>
              <select
                value={schoolFilter}
                onChange={(event) => {
                  setSchoolFilter(event.target.value);
                  setPagination((currentValue) => ({
                    ...currentValue,
                    page: 1
                  }));
                }}
              >
                <option value="">All schools</option>
                {schools.map((school) => (
                  <option
                    key={school._id}
                    value={school._id}
                  >
                    {school.schoolName}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Invoice Status</label>
              <select
                value={invoiceStatusFilter}
                onChange={(event) => {
                  setInvoiceStatusFilter(
                    event.target.value as
                      | InvoiceStatus
                      | ""
                  );
                  setPagination((currentValue) => ({
                    ...currentValue,
                    page: 1
                  }));
                }}
              >
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Payment Status</label>
              <select
                value={paymentStatusFilter}
                onChange={(event) => {
                  setPaymentStatusFilter(
                    event.target.value as
                      | PaymentStatus
                      | ""
                  );
                  setPagination((currentValue) => ({
                    ...currentValue,
                    page: 1
                  }));
                }}
              >
                <option value="">All payments</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setPagination((currentValue) => ({
                    ...currentValue,
                    page: 1
                  }));
                }}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setPagination((currentValue) => ({
                    ...currentValue,
                    page: 1
                  }));
                }}
              />
            </div>

            <div className="clear-filter-group">
              <button
                type="button"
                className="clear-button"
                onClick={clearFilters}
              >
                Clear All
              </button>
            </div>
          </div>
        </form>

        {isLoading ? (
          <LoadingSpinner message="Loading invoices..." />
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <h3>No invoices found</h3>
            <p>
              Create an invoice or change the current
              filters.
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
                    <th>Date</th>
                    <th>School</th>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((invoice, index) => (
                    <tr key={invoice._id}>
                      <td>
                        {(pagination.page - 1) *
                          pagination.limit +
                          index +
                          1}
                      </td>

                      <td>
                        <strong>
                          {invoice.invoiceNumber}
                        </strong>
                      </td>

                      <td>
                        {new Date(
                          invoice.invoiceDate
                        ).toLocaleDateString("en-IN")}
                      </td>

                      <td>
                        <div className="school-name-cell">
                          <strong>
                            {invoice.schoolCode}
                          </strong>
                          <span>
                            {invoice.schoolName}
                          </span>
                        </div>
                      </td>

                      <td>{invoice.studentName}</td>

                      <td>
                        {invoice.className}
                        {invoice.section
                          ? ` - ${invoice.section}`
                          : ""}
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(
                            invoice.grandTotal
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getPaymentStatusClass(
                            invoice.paymentStatus
                          )}`}
                        >
                          {invoice.paymentStatus.replaceAll(
                            "_",
                            " "
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getInvoiceStatusClass(
                            invoice.invoiceStatus
                          )}`}
                        >
                          {invoice.invoiceStatus}
                        </span>
                      </td>

                      <td>
                        <div className="invoice-actions">
                          <button
                            type="button"
                            className="invoice-action-button"
                            onClick={() =>
                              void handleViewInvoice(
                                invoice._id
                              )
                            }
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="invoice-action-button"
                            disabled={
                              invoice.invoiceStatus ===
                              "CANCELLED"
                            }
                            onClick={() =>
                              void handleEditInvoice(
                                invoice._id
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="invoice-action-button"
                            onClick={() =>
                              handlePrintInvoice(invoice)
                            }
                          >
                            Print
                          </button>

                          <button
                            type="button"
                            className="invoice-action-button"
                            onClick={() =>
                              handlePdfInvoice(invoice)
                            }
                          >
                            PDF
                          </button>

                          <button
                            type="button"
                            className="invoice-action-button invoice-delete-button"
                            disabled={
                              invoice.invoiceStatus ===
                              "CANCELLED"
                            }
                            onClick={() =>
                              openCancellationModal(
                                invoice
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-card-view">
              {invoices.map((invoice) => (
                <div className="data-card invoice-card" key={invoice._id}>
                  <div className="data-card-header">
                    <div>
                      <div className="invoice-number">{invoice.invoiceNumber}</div>
                      <div className="invoice-date">
                        {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                    <span
                      className={`badge status-badge ${getInvoiceStatusClass(
                        invoice.invoiceStatus
                      )}`}
                    >
                      {invoice.invoiceStatus}
                    </span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">School</span>
                    <span className="value">{invoice.schoolName}</span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">Student</span>
                    <span className="value student-name">{invoice.studentName}</span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">Class</span>
                    <span className="value">
                      {invoice.className}
                      {invoice.section ? ` - ${invoice.section}` : ""}
                    </span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">Total</span>
                    <span className="value total-amount">
                      {formatCurrency(invoice.grandTotal)}
                    </span>
                  </div>

                  <div className="data-card-item">
                    <span className="label">Payment</span>
                    <span className="value">
                      <span
                        className={`status-badge ${getPaymentStatusClass(
                          invoice.paymentStatus
                        )}`}
                      >
                        {invoice.paymentStatus.replaceAll("_", " ")}
                      </span>
                    </span>
                  </div>

                  <div className="data-card-actions">
                    <button
                      type="button"
                      className="invoice-action-button"
                      onClick={() => void handleViewInvoice(invoice._id)}
                    >
                      View
                    </button>

                    <button
                      type="button"
                      className="invoice-action-button"
                      disabled={invoice.invoiceStatus === "CANCELLED"}
                      onClick={() => void handleEditInvoice(invoice._id)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="invoice-action-button"
                      onClick={() => handlePrintInvoice(invoice)}
                    >
                      Print
                    </button>

                    <button
                      type="button"
                      className="invoice-action-button"
                      onClick={() => handlePdfInvoice(invoice)}
                    >
                      PDF
                    </button>

                    <button
                      type="button"
                      className="invoice-action-button invoice-delete-button"
                      disabled={invoice.invoiceStatus === "CANCELLED"}
                      onClick={() => openCancellationModal(invoice)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pagination-section">
              <p>
                Showing {invoices.length} of{" "}
                {pagination.total} invoices
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

      {isFormModalOpen && (
        <Modal
          title={
            formMode === "EDIT"
              ? "Edit Invoice"
              : "Create Invoice"
          }
          onClose={closeFormModal}
        >
          <form onSubmit={handleCompletedSubmit}>
            <div className="form-grid">
              <div className="form-field form-field-full">
                <label htmlFor="invoiceSchool">
                  School <span>*</span>
                </label>

                <select
                  id="invoiceSchool"
                  value={formData.schoolId}
                  onChange={(event) =>
                    void handleSchoolChange(
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select school
                  </option>

                  {schools
                    .filter(
                      (school) =>
                        school.status === "ACTIVE" ||
                        school._id ===
                          formData.schoolId
                    )
                    .map((school) => (
                      <option
                        key={school._id}
                        value={school._id}
                      >
                        {school.schoolName} (
                        {school.schoolCode})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="placeOfOrder">
                  Place of Order <span>*</span>
                </label>

                <select
                  id="placeOfOrder"
                  value={formData.placeOfOrder}
                  onChange={(event) => {
                    const selectedPlace =
                      event.target.value as CreateInvoiceInput["placeOfOrder"];

                    updateFormField(
                      "placeOfOrder",
                      selectedPlace
                    );

                    if (
                      selectedPlace !==
                      "SPECIALIZED_SCHOOL_STORE"
                    ) {
                      updateFormField(
                        "specializedStoreName",
                        ""
                      );
                    }
                  }}
                  required
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
                </select>
              </div>

              {formData.placeOfOrder ===
                "SPECIALIZED_SCHOOL_STORE" && (
                <div className="form-field">
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

              <div className="form-field">
                <label htmlFor="studentName">
                  Student Name <span>*</span>
                </label>

                <input
                  id="studentName"
                  value={formData.studentName}
                  onChange={(event) =>
                    updateFormField(
                      "studentName",
                      event.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="className">
                  Class <span>*</span>
                </label>

                <input
                  id="className"
                  value={formData.className}
                  onChange={(event) =>
                    updateFormField(
                      "className",
                      event.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="section">
                  Section
                </label>

                <input
                  id="section"
                  value={formData.section}
                  onChange={(event) =>
                    updateFormField(
                      "section",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="parentName">
                  Parent Name
                </label>

                <input
                  id="parentName"
                  value={formData.parentName}
                  onChange={(event) =>
                    updateFormField(
                      "parentName",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="contactNumber">
                  Contact Number
                </label>

                <input
                  id="contactNumber"
                  value={formData.contactNumber}
                  onChange={(event) =>
                    updateFormField(
                      "contactNumber",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    updateFormField(
                      "email",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="paymentMode">
                  Payment Mode
                </label>

                <select
                  id="paymentMode"
                  value={formData.paymentMode}
                  onChange={(event) =>
                    updateFormField(
                      "paymentMode",
                      event.target
                        .value as PaymentMode
                    )
                  }
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="ONLINE">
                    Online
                  </option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="paymentReference">
                  Payment Reference
                </label>

                <input
                  id="paymentReference"
                  value={
                    formData.paymentReference
                  }
                  onChange={(event) =>
                    updateFormField(
                      "paymentReference",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="paidAmount">
                  Paid Amount
                </label>

                <input
                  id="paidAmount"
                  type="number"
                  min="0"
                  max={
                    calculatedSummary.grandTotal
                  }
                  step="0.01"
                  value={formData.paidAmount}
                  onChange={(event) =>
                    updateFormField(
                      "paidAmount",
                      Number(event.target.value) ||
                        0
                    )
                  }
                />
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="remarks">
                  Remarks
                </label>

                <input
                  id="remarks"
                  value={formData.remarks}
                  onChange={(event) =>
                    updateFormField(
                      "remarks",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="variant-section">
              <div className="variant-heading">
                <div>
                  <h3>Invoice Items</h3>
                  <p>
                    Select products and sizes for
                    this invoice.
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  disabled={
                    !formData.schoolId ||
                    isLoadingProducts
                  }
                  onClick={addInvoiceItem}
                >
                  + Add Item
                </button>
              </div>

              {isLoadingProducts ? (
                <LoadingSpinner message="Loading products..." />
              ) : (
                <div className="table-responsive">
                  <table className="data-table invoice-item-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Size</th>
                        <th>Gender</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>GST</th>
                        <th>Total</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {formData.items.map(
                        (item, index) => {
                          const product =
                            products.find(
                              (currentProduct) =>
                                currentProduct._id ===
                                item.productId
                            );

                          const variant =
                            product?.variants.find(
                              (currentVariant) =>
                                currentVariant._id ===
                                item.variantId
                            );

                          const taxableAmount =
                            variant
                              ? roundCurrency(
                                  variant.unitPrice *
                                    item.quantity
                                )
                              : 0;

                          const gstAmount = variant
                            ? roundCurrency(
                                taxableAmount *
                                  (variant.gstPercentage /
                                    100)
                              )
                            : 0;

                          const total =
                            roundCurrency(
                              taxableAmount +
                                gstAmount
                            );

                          return (
                            <tr key={index}>
                              <td>
                                <select
                                  value={
                                    item.productId
                                  }
                                  onChange={(event) =>
                                    updateInvoiceItem(
                                      index,
                                      "productId",
                                      event.target.value
                                    )
                                  }
                                  required
                                >
                                  <option value="">
                                    Select product
                                  </option>

                                  {products.map(
                                    (
                                      currentProduct
                                    ) => (
                                      <option
                                        key={
                                          currentProduct._id
                                        }
                                        value={
                                          currentProduct._id
                                        }
                                      >
                                        {
                                          currentProduct.productName
                                        }
                                      </option>
                                    )
                                  )}
                                </select>
                              </td>

                              <td>
                                <select
                                  value={
                                    item.variantId
                                  }
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
                                  <option value="">
                                    Select size
                                  </option>

                                  {product?.variants.map(
                                    (
                                      currentVariant
                                    ) => (
                                      <option
                                        key={
                                          currentVariant._id
                                        }
                                        value={
                                          currentVariant._id
                                        }
                                      >
                                        {
                                          currentVariant.size
                                        }
                                      </option>
                                    )
                                  )}
                                </select>
                              </td>

                              <td>
                                {product?.gender ??
                                  "—"}
                              </td>

                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={
                                    item.quantity
                                  }
                                  onChange={(event) =>
                                    updateInvoiceItem(
                                      index,
                                      "quantity",
                                      event.target.value
                                    )
                                  }
                                />
                              </td>

                              <td>
                                {variant
                                  ? formatCurrency(
                                      variant.unitPrice
                                    )
                                  : "—"}
                              </td>

                              <td>
                                {variant
                                  ? `${variant.gstPercentage}%`
                                  : "—"}
                              </td>

                              <td>
                                <strong>
                                  {formatCurrency(
                                    total
                                  )}
                                </strong>
                              </td>

                              <td>
                                <button
                                  type="button"
                                  className="remove-row-button"
                                  disabled={
                                    formData.items
                                      .length === 1
                                  }
                                  onClick={() =>
                                    removeInvoiceItem(
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
              )}
            </div>

            <div className="invoice-summary">
              <div>
                <span>Taxable Amount</span>
                <strong>
                  {formatCurrency(
                    calculatedSummary.taxableAmount
                  )}
                </strong>
              </div>

              <div>
                <span>Total GST</span>
                <strong>
                  {formatCurrency(
                    calculatedSummary.gstAmount
                  )}
                </strong>
              </div>

              <div>
                <span>Round Off</span>
                <strong>
                  {formatCurrency(
                    calculatedSummary.roundOff
                  )}
                </strong>
              </div>

              <div className="invoice-grand-total">
                <span>Grand Total</span>
                <strong>
                  {formatCurrency(
                    calculatedSummary.grandTotal
                  )}
                </strong>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={isSubmitting}
                onClick={closeFormModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="secondary-button"
                disabled={isSubmitting}
                onClick={() =>
                  void submitInvoice("DRAFT")
                }
              >
                {formMode === "EDIT"
                  ? "Update as Draft"
                  : "Save Draft"}
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : formMode === "EDIT"
                    ? "Update Invoice"
                    : "Generate Invoice"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {isViewModalOpen && (
        <Modal
          title="Invoice Details"
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedInvoice(null);
          }}
        >
          {isLoadingInvoice ||
          !selectedInvoice ? (
            <LoadingSpinner message="Loading invoice..." />
          ) : (
            <div className="invoice-view">
              <div className="invoice-view-header">
                <div>
                  <h3>
                    {selectedInvoice.invoiceNumber}
                  </h3>

                  <p>
                    {new Date(
                      selectedInvoice.invoiceDate
                    ).toLocaleDateString("en-IN")}
                  </p>
                </div>

                <span
                  className={`status-badge ${getInvoiceStatusClass(
                    selectedInvoice.invoiceStatus
                  )}`}
                >
                  {selectedInvoice.invoiceStatus}
                </span>
              </div>

              <div className="invoice-view-grid">
                <div>
                  <span>School</span>
                  <strong>
                    {selectedInvoice.schoolName}
                  </strong>
                </div>

                <div>
                  <span>Student</span>
                  <strong>
                    {selectedInvoice.studentName}
                  </strong>
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
                  <strong>
                    {selectedInvoice.parentName ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Contact</span>
                  <strong>
                    {selectedInvoice.contactNumber ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Payment</span>
                  <strong>
                    {selectedInvoice.paymentMode} –{" "}
                    {selectedInvoice.paymentStatus.replaceAll(
                      "_",
                      " "
                    )}
                  </strong>
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>S.No.</th>
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
                    {selectedInvoice.items.map(
                      (item, index) => (
                        <tr key={item._id}>
                          <td>{index + 1}</td>
                          <td>
                            {item.productName}
                          </td>
                          <td>{item.gender}</td>
                          <td>{item.size}</td>
                          <td>{item.quantity}</td>
                          <td>
                            {formatCurrency(
                              item.unitPrice
                            )}
                          </td>
                          <td>
                            {item.gstPercentage}%
                          </td>
                          <td>
                            <strong>
                              {formatCurrency(
                                item.totalAmount
                              )}
                            </strong>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="invoice-summary">
                <div>
                  <span>Taxable Amount</span>
                  <strong>
                    {formatCurrency(
                      selectedInvoice.taxableAmount
                    )}
                  </strong>
                </div>

                <div>
                  <span>Total GST</span>
                  <strong>
                    {formatCurrency(
                      selectedInvoice.totalGstAmount
                    )}
                  </strong>
                </div>

                <div>
                  <span>Round Off</span>
                  <strong>
                    {formatCurrency(
                      selectedInvoice.roundOff
                    )}
                  </strong>
                </div>

                <div className="invoice-grand-total">
                  <span>Grand Total</span>
                  <strong>
                    {formatCurrency(
                      selectedInvoice.grandTotal
                    )}
                  </strong>
                </div>
              </div>

              {selectedInvoice.invoiceStatus ===
                "CANCELLED" && (
                <div className="cancelled-information">
                  <strong>
                    Cancellation Reason
                  </strong>
                  <p>
                    {selectedInvoice.cancellationReason}
                  </p>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    handlePrintInvoice(
                      selectedInvoice
                    )
                  }
                >
                  Print
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    handlePdfInvoice(
                      selectedInvoice
                    )
                  }
                >
                  PDF
                </button>

                <button
                  type="button"
                  className="primary-button"
                  disabled={
                    selectedInvoice.invoiceStatus ===
                    "CANCELLED"
                  }
                  onClick={() => {
                    setIsViewModalOpen(false);

                    void handleEditInvoice(
                      selectedInvoice._id
                    );
                  }}
                >
                  Edit Invoice
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {isCancelModalOpen &&
        invoiceToCancel && (
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
                <strong>
                  Cancel{" "}
                  {invoiceToCancel.invoiceNumber}?
                </strong>

                <p>
                  This invoice will remain in
                  billing history but will be
                  excluded from active sales and
                  production reports.
                </p>
              </div>

              <div className="form-field">
                <label htmlFor="cancellationReason">
                  Cancellation Reason{" "}
                  <span>*</span>
                </label>

                <textarea
                  id="cancellationReason"
                  rows={4}
                  value={cancellationReason}
                  onChange={(event) =>
                    setCancellationReason(
                      event.target.value
                    )
                  }
                  placeholder="Explain why this invoice is being cancelled"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
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
                  className="danger-button"
                  disabled={
                    isCancelling ||
                    cancellationReason.trim()
                      .length < 3
                  }
                  onClick={() =>
                    void handleCancelInvoice()
                  }
                >
                  {isCancelling
                    ? "Cancelling..."
                    : "Cancel Invoice"}
                </button>
              </div>
            </div>
          </Modal>
        )}
    </section>
  );
}