import axios from "axios";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useParams
} from "react-router-dom";

import {
  getPublicCamp,
  submitPublicCampOrder
} from "../../api/camp.api";

import type {
  PublicCamp,
  PublicCampOrderInput,
  PublicCampOrderItemInput,
  PublicCampOrderResult
} from "../../types/camp.types";

interface PublicOrderItemForm {
  productId: string;
  variantId: string;
  quantity: number;
}

interface PublicCampForm {
  studentName: string;
  className: string;
  section: string;

  parentName: string;
  contactNumber: string;
  email: string;

  items: PublicOrderItemForm[];

  remarks: string;
}

function createEmptyForm():
  PublicCampForm {
  return {
    studentName: "",
    className: "",
    section: "",

    parentName: "",
    contactNumber: "",
    email: "",

    items: [
      {
        productId: "",
        variantId: "",
        quantity: 1
      }
    ],

    remarks: ""
  };
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

function formatCurrency(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }
  ).format(value);
}

function getErrorMessage(
  error: unknown
): string {
  if (
    axios.isAxiosError(error)
  ) {
    const responseData =
      error.response?.data as
        | {
            message?: string;
            errors?: Array<{
              message?: string;
            }>;
          }
        | undefined;

    if (
      responseData?.errors &&
      responseData.errors.length > 0
    ) {
      return responseData.errors
        .map(
          (currentError) =>
            currentError.message
        )
        .filter(
          (
            message
          ): message is string =>
            Boolean(message)
        )
        .join(", ");
    }

    return (
      responseData?.message ??
      "Unable to complete the request."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

export default function PublicCampOrderPage() {
  const {
    token
  } = useParams<{
    token: string;
  }>();

  const [
    camp,
    setCamp
  ] = useState<
    PublicCamp | null
  >(null);

  const [
    formData,
    setFormData
  ] = useState<PublicCampForm>(
    createEmptyForm()
  );

  const [
    orderResult,
    setOrderResult
  ] = useState<
    PublicCampOrderResult | null
  >(null);

  const [
    isLoading,
    setIsLoading
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage
  ] = useState("");

  const loadCamp =
    useCallback(async () => {
      if (!token) {
        setErrorMessage(
          "The camp link is invalid."
        );

        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const response =
          await getPublicCamp(
            token
          );

        setCamp(
          response.data
        );
      } catch (error) {
        setErrorMessage(
          getErrorMessage(error)
        );
      } finally {
        setIsLoading(false);
      }
    }, [token]);

  useEffect(() => {
    void loadCamp();
  }, [loadCamp]);

  const selectedProductIds =
    useMemo(
      () =>
        formData.items
          .map(
            (item) =>
              item.productId
          )
          .filter(Boolean),
      [formData.items]
    );

  function updateFormField(
    field:
      | "studentName"
      | "className"
      | "section"
      | "parentName"
      | "contactNumber"
      | "email"
      | "remarks",
    value: string
  ): void {
    setFormData(
      (current) => ({
        ...current,
        [field]: value
      })
    );
  }

  function updateOrderItem(
    index: number,
    changes:
      Partial<PublicOrderItemForm>
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

  function handleProductChange(
    index: number,
    productId: string
  ): void {
    updateOrderItem(
      index,
      {
        productId,
        variantId: ""
      }
    );
  }

  function addOrderItem(): void {
    if (
      camp &&
      selectedProductIds.length >=
        camp.products.length
    ) {
      setErrorMessage(
        "All available products have already been added."
      );

      return;
    }

    setFormData(
      (current) => ({
        ...current,

        items: [
          ...current.items,
          {
            productId: "",
            variantId: "",
            quantity: 1
          }
        ]
      })
    );
  }

  function removeOrderItem(
    index: number
  ): void {
    setFormData(
      (current) => ({
        ...current,

        items:
          current.items.length === 1
            ? current.items
            : current.items.filter(
                (
                  _item,
                  itemIndex
                ) =>
                  itemIndex !== index
              )
      })
    );
  }

  function validateForm():
    string | null {
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
      return "Enter the student's class.";
    }

    if (
      formData.parentName
        .trim()
        .length < 2
    ) {
      return "Enter the parent name.";
    }

    const contactNumber =
      formData.contactNumber
        .replace(/\s+/g, "")
        .trim();

    if (
      contactNumber.length < 8
    ) {
      return "Enter a valid contact number.";
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      return "Enter a valid email address.";
    }

    if (
      formData.items.length === 0
    ) {
      return "Add at least one uniform item.";
    }

    const uniqueProductIds =
      new Set<string>();

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
        uniqueProductIds.has(
          item.productId
        )
      ) {
        return "The same product cannot be added more than once.";
      }

      uniqueProductIds.add(
        item.productId
      );

      if (!item.variantId) {
        return `Select a size for item ${
          index + 1
        }.`;
      }

      if (
        !Number.isInteger(
          item.quantity
        ) ||
        item.quantity < 1 ||
        item.quantity > 10
      ) {
        return `Quantity for item ${
          index + 1
        } must be between 1 and 10.`;
      }
    }

    return null;
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    if (!token) {
      setErrorMessage(
        "The camp link is invalid."
      );

      return;
    }

    const validationError =
      validateForm();

    if (validationError) {
      setErrorMessage(
        validationError
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      return;
    }

    const items:
      PublicCampOrderItemInput[] =
      formData.items.map(
        (item) => ({
          productId:
            item.productId,

          variantId:
            item.variantId,

          quantity:
            item.quantity
        })
      );

    const payload:
      PublicCampOrderInput = {
      studentName:
        formData.studentName.trim(),

      className:
        formData.className.trim(),

      section:
        formData.section.trim(),

      parentName:
        formData.parentName.trim(),

      contactNumber:
        formData.contactNumber.trim(),

      email:
        formData.email.trim(),

      items,

      remarks:
        formData.remarks.trim()
    };

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response =
        await submitPublicCampOrder(
          token,
          payload
        );

      setOrderResult(
        response.data
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function submitAnotherOrder():
    void {
    setOrderResult(null);

    setFormData(
      createEmptyForm()
    );

    setErrorMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  if (isLoading) {
    return (
      <main className="public-camp-page">
        <div className="public-camp-loading">
          <div className="public-camp-spinner" />

          <h2>
            Loading camp details
          </h2>

          <p>
            Please wait while the order
            form is prepared.
          </p>
        </div>
      </main>
    );
  }

  if (
    errorMessage &&
    !camp
  ) {
    return (
      <main className="public-camp-page">
        <section className="public-camp-error-card">
          <div className="public-camp-error-icon">
            !
          </div>

          <h1>
            Camp unavailable
          </h1>

          <p>
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadCamp()
            }
            className="public-camp-primary-button"
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  if (!camp) {
    return null;
  }

  if (orderResult) {
    return (
      <main className="public-camp-page">
        <section className="public-camp-success-card">
          <div className="public-camp-success-icon">
            ✓
          </div>

          <p className="public-camp-success-eyebrow">
            Requirement submitted
          </p>

          <h1>
            Thank you,{" "}
            {orderResult.studentName}
          </h1>

          <p className="public-camp-success-description">
            Your uniform requirement has
            been received successfully.
          </p>

          <div className="public-camp-invoice-box">
            <div>
              <span>
                Invoice Number
              </span>

              <strong>
                {
                  orderResult.invoiceNumber
                }
              </strong>
            </div>

            <div>
              <span>
                School
              </span>

              <strong>
                {
                  orderResult.schoolName
                }
              </strong>
            </div>

            <div>
              <span>
                Invoice Amount
              </span>

              <strong>
                {formatCurrency(
                  orderResult.grandTotal
                )}
              </strong>
            </div>

            <div>
              <span>
                Payment Status
              </span>

              <strong>
                {
                  orderResult.paymentStatus
                }
              </strong>
            </div>
          </div>

          <p className="public-camp-save-message">
            Please save or take a
            screenshot of this invoice
            number for reference.
          </p>

          <button
            type="button"
            className="public-camp-secondary-button"
            onClick={
              submitAnotherOrder
            }
          >
            Submit Another Order
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="public-camp-page">
      <header className="public-camp-header">
        <div className="public-camp-brand">
          <div className="public-camp-logo">
            S
          </div>

          <div>
            <strong>
              Schoolay
            </strong>

            <span>
              Billing Software
            </span>
          </div>
        </div>
      </header>

      <div className="public-camp-container">
        <section className="public-camp-hero">
          <span className="public-camp-code">
            {camp.campCode}
          </span>

          <h1>
            {camp.campName}
          </h1>

          <p>
            {camp.schoolName}
          </p>

          <div className="public-camp-date-box">
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
        </section>

        {camp.instructions && (
          <section className="public-camp-instructions">
            <strong>
              Instructions
            </strong>

            <p>
              {camp.instructions}
            </p>
          </section>
        )}

        {errorMessage && (
          <div className="public-camp-alert">
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={(event) =>
            void handleSubmit(event)
          }
          className="public-camp-form"
        >
          <section className="public-camp-section">
            <div className="public-camp-section-title">
              <span>
                1
              </span>

              <div>
                <h2>
                  Student Details
                </h2>

                <p>
                  Enter the student's
                  school information.
                </p>
              </div>
            </div>

            <div className="public-camp-form-grid">
              <div className="public-camp-field public-camp-field-full">
                <label htmlFor="publicStudentName">
                  Student Name{" "}
                  <span>*</span>
                </label>

                <input
                  id="publicStudentName"
                  value={
                    formData.studentName
                  }
                  onChange={(event) =>
                    updateFormField(
                      "studentName",
                      event.target.value
                    )
                  }
                  autoComplete="name"
                  placeholder="Enter student name"
                  required
                />
              </div>

              <div className="public-camp-field">
                <label htmlFor="publicClassName">
                  Class{" "}
                  <span>*</span>
                </label>

                <input
                  id="publicClassName"
                  value={
                    formData.className
                  }
                  onChange={(event) =>
                    updateFormField(
                      "className",
                      event.target.value
                    )
                  }
                  placeholder="Example: 6"
                  required
                />
              </div>

              <div className="public-camp-field">
                <label htmlFor="publicSection">
                  Section
                </label>

                <input
                  id="publicSection"
                  value={
                    formData.section
                  }
                  onChange={(event) =>
                    updateFormField(
                      "section",
                      event.target.value
                    )
                  }
                  placeholder="Example: A"
                />
              </div>
            </div>
          </section>

          <section className="public-camp-section">
            <div className="public-camp-section-title">
              <span>
                2
              </span>

              <div>
                <h2>
                  Parent Details
                </h2>

                <p>
                  Provide contact details
                  for order updates.
                </p>
              </div>
            </div>

            <div className="public-camp-form-grid">
              <div className="public-camp-field public-camp-field-full">
                <label htmlFor="publicParentName">
                  Parent Name{" "}
                  <span>*</span>
                </label>

                <input
                  id="publicParentName"
                  value={
                    formData.parentName
                  }
                  onChange={(event) =>
                    updateFormField(
                      "parentName",
                      event.target.value
                    )
                  }
                  autoComplete="name"
                  placeholder="Enter parent name"
                  required
                />
              </div>

              <div className="public-camp-field">
                <label htmlFor="publicContactNumber">
                  Mobile Number{" "}
                  <span>*</span>
                </label>

                <input
                  id="publicContactNumber"
                  type="tel"
                  inputMode="tel"
                  value={
                    formData.contactNumber
                  }
                  onChange={(event) =>
                    updateFormField(
                      "contactNumber",
                      event.target.value
                    )
                  }
                  autoComplete="tel"
                  placeholder="Enter mobile number"
                  required
                />
              </div>

              <div className="public-camp-field">
                <label htmlFor="publicEmail">
                  Email
                </label>

                <input
                  id="publicEmail"
                  type="email"
                  inputMode="email"
                  value={
                    formData.email
                  }
                  onChange={(event) =>
                    updateFormField(
                      "email",
                      event.target.value
                    )
                  }
                  autoComplete="email"
                  placeholder="Optional"
                />
              </div>
            </div>
          </section>

          <section className="public-camp-section">
            <div className="public-camp-section-heading">
              <div className="public-camp-section-title">
                <span>
                  3
                </span>

                <div>
                  <h2>
                    Uniform Items
                  </h2>

                  <p>
                    Select the product,
                    size, and quantity.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="public-camp-add-button"
                onClick={
                  addOrderItem
                }
                disabled={
                  selectedProductIds.length >=
                  camp.products.length
                }
              >
                + Add Item
              </button>
            </div>

            <div className="public-camp-item-list">
              {formData.items.map(
                (
                  item,
                  index
                ) => {
                  const selectedProduct =
                    camp.products.find(
                      (product) =>
                        product.productId ===
                        item.productId
                    );

                  return (
                    <article
                      className="public-camp-item-card"
                      key={index}
                    >
                      <div className="public-camp-item-header">
                        <strong>
                          Item {index + 1}
                        </strong>

                        {formData.items
                          .length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeOrderItem(
                                index
                              )
                            }
                            className="public-camp-remove-button"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="public-camp-form-grid">
                        <div className="public-camp-field public-camp-field-full">
                          <label>
                            Product{" "}
                            <span>*</span>
                          </label>

                          <select
                            value={
                              item.productId
                            }
                            onChange={(event) =>
                              handleProductChange(
                                index,
                                event.target
                                  .value
                              )
                            }
                            required
                          >
                            <option value="">
                              Select product
                            </option>

                            {camp.products.map(
                              (product) => {
                                const usedElsewhere =
                                  formData.items.some(
                                    (
                                      currentItem,
                                      currentIndex
                                    ) =>
                                      currentIndex !==
                                        index &&
                                      currentItem.productId ===
                                        product.productId
                                  );

                                return (
                                  <option
                                    key={
                                      product.productId
                                    }
                                    value={
                                      product.productId
                                    }
                                    disabled={
                                      usedElsewhere
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
                                );
                              }
                            )}
                          </select>
                        </div>

                        <div className="public-camp-field">
                          <label>
                            Size{" "}
                            <span>*</span>
                          </label>

                          <select
                            value={
                              item.variantId
                            }
                            disabled={
                              !selectedProduct
                            }
                            onChange={(event) =>
                              updateOrderItem(
                                index,
                                {
                                  variantId:
                                    event.target
                                      .value
                                }
                              )
                            }
                            required
                          >
                            <option value="">
                              Select size
                            </option>

                            {selectedProduct?.variants.map(
                              (variant) => (
                                <option
                                  key={
                                    variant.variantId
                                  }
                                  value={
                                    variant.variantId
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

                        <div className="public-camp-field">
  <label>
    Quantity <span>*</span>
  </label>

  <div className="public-camp-quantity-control">
    <button
      type="button"
      className="public-camp-quantity-button"
      disabled={item.quantity <= 1}
      onClick={() =>
        updateOrderItem(
          index,
          {
            quantity:
              Math.max(
                1,
                item.quantity - 1
              )
          }
        )
      }
    >
      −
    </button>

    <input
      type="number"
      min="1"
      max="10"
      step="1"
      inputMode="numeric"
      value={item.quantity}
      onChange={(event) => {
        const parsedValue =
          Number(
            event.target.value
          );

        updateOrderItem(
          index,
          {
            quantity:
              Number.isFinite(
                parsedValue
              )
                ? Math.min(
                    10,
                    Math.max(
                      1,
                      Math.floor(
                        parsedValue
                      )
                    )
                  )
                : 1
          }
        );
      }}
      required
    />

    <button
      type="button"
      className="public-camp-quantity-button"
      disabled={item.quantity >= 10}
      onClick={() =>
        updateOrderItem(
          index,
          {
            quantity:
              Math.min(
                10,
                item.quantity + 1
              )
          }
        )
      }
    >
      +
    </button>
  </div>
</div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          </section>

          <section className="public-camp-section">
            <div className="public-camp-section-title">
              <span>
                4
              </span>

              <div>
                <h2>
                  Additional Information
                </h2>

                <p>
                  Add any special order
                  instructions.
                </p>
              </div>
            </div>

            <div className="public-camp-field">
              <label htmlFor="publicRemarks">
                Remarks
              </label>

              <textarea
                id="publicRemarks"
                rows={4}
                value={
                  formData.remarks
                }
                onChange={(event) =>
                  updateFormField(
                    "remarks",
                    event.target.value
                  )
                }
                placeholder="Optional remarks"
              />
            </div>
          </section>

          <div className="public-camp-submit-section">
            <p>
              By submitting, you confirm
              that the student and size
              details entered are
              correct.
            </p>

            <button
              type="submit"
              className="public-camp-primary-button"
              disabled={
                isSubmitting
              }
            >
              {isSubmitting
                ? "Submitting Order..."
                : "Submit Uniform Requirement"}
            </button>
          </div>
        </form>
      </div>

      <footer className="public-camp-footer">
        Powered by Schoolay Technologies
      </footer>
    </main>
  );
}