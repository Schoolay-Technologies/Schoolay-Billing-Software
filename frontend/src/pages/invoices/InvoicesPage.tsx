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
        .map((currentError) => currentError.message)
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

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

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

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${invoice.invoiceNumber}</title>

          <style>
            @page {
              size: A4;
              margin: 12mm;
            }

            body {
              font-family: Arial, sans-serif;
              color: #111827;
              margin: 0;
            }

            .invoice {
              width: 100%;
            }

            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #111827;
              padding-bottom: 14px;
            }

            h1, h2, p {
              margin: 0;
            }

            .company h1 {
              font-size: 22px;
            }

            .company p {
              margin-top: 5px;
              font-size: 12px;
            }

            .invoice-meta {
              text-align: right;
            }

            .invoice-meta h2 {
              margin-bottom: 6px;
            }

            .details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-top: 20px;
            }

            .box {
              border: 1px solid #d1d5db;
              padding: 12px;
            }

            .box p {
              margin: 5px 0;
              font-size: 13px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th,
            td {
              border: 1px solid #d1d5db;
              padding: 8px;
              font-size: 12px;
              text-align: left;
            }

            th {
              background: #f3f4f6;
            }

            .summary {
              width: 340px;
              margin-left: auto;
              margin-top: 18px;
            }

            .summary div {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
            }

            .grand-total {
              border-top: 2px solid #111827;
              font-size: 16px;
              font-weight: bold;
            }

            .cancelled {
              color: #b91c1c;
              border: 3px solid #b91c1c;
              padding: 8px 14px;
              font-weight: bold;
              transform: rotate(-8deg);
              display: inline-block;
              margin-top: 10px;
            }
          </style>
        </head>

        <body>
          <div class="invoice">
            <div class="header">
              <div class="company">
                <h1>SCHOOLAY TECHNOLOGIES PVT. LTD.</h1>
                <p>543/1, 1st Main Road, Ramaiah Layout</p>
                <p>Dodda Banaswadi, Bengaluru</p>
                <p>Mobile: 8088438290</p>
                <p>Email: customersupport@schoolay.com</p>
              </div>

              <div class="invoice-meta">
                <h2>INVOICE</h2>
                <p><strong>${invoice.invoiceNumber}</strong></p>
                <p>${new Date(
                  invoice.invoiceDate
                ).toLocaleDateString("en-IN")}</p>

                ${
                  invoice.invoiceStatus ===
                  "CANCELLED"
                    ? `<div class="cancelled">CANCELLED</div>`
                    : ""
                }
              </div>
            </div>

            <div class="details">
              <div class="box">
                <p><strong>Student:</strong> ${
                  invoice.studentName
                }</p>

                <p><strong>Class:</strong> ${
                  invoice.className
                }${
                  invoice.section
                    ? ` - ${invoice.section}`
                    : ""
                }</p>

                <p><strong>Parent:</strong> ${
                  invoice.parentName || "—"
                }</p>

                <p><strong>Contact:</strong> ${
                  invoice.contactNumber || "—"
                }</p>
              </div>

              <div class="box">
                <p><strong>School:</strong> ${
                  invoice.schoolName
                }</p>

                <p><strong>School Code:</strong> ${
                  invoice.schoolCode
                }</p>

                <p><strong>Payment Mode:</strong> ${
                  invoice.paymentMode
                }</p>

                <p><strong>Payment Status:</strong> ${
                  invoice.paymentStatus
                }</p>
              </div>
            </div>

            <table>
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
                ${itemRows}
              </tbody>
            </table>

            <div class="summary">
              <div>
                <span>Taxable Amount</span>
                <strong>${formatCurrency(
                  invoice.taxableAmount
                )}</strong>
              </div>

              <div>
                <span>Total GST</span>
                <strong>${formatCurrency(
                  invoice.totalGstAmount
                )}</strong>
              </div>

              <div>
                <span>Round Off</span>
                <strong>${formatCurrency(
                  invoice.roundOff
                )}</strong>
              </div>

              <div class="grand-total">
                <span>Grand Total</span>
                <strong>${formatCurrency(
                  invoice.grandTotal
                )}</strong>
              </div>
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
        <form
          className="filter-section invoice-filters"
          onSubmit={handleSearchSubmit}
        >
          <div className="search-group">
            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Invoice number, student, class or phone"
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
            <option value="">
              All invoice statuses
            </option>
            <option value="DRAFT">Draft</option>
            <option value="COMPLETED">
              Completed
            </option>
            <option value="CANCELLED">
              Cancelled
            </option>
          </select>

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
            <option value="">
              All payment statuses
            </option>
            <option value="PENDING">
              Pending
            </option>
            <option value="PARTIALLY_PAID">
              Partially Paid
            </option>
            <option value="PAID">Paid</option>
          </select>

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

          <button
            type="button"
            className="text-button"
            onClick={clearFilters}
          >
            Clear
          </button>
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