interface SendInvoiceLinkSmsInput {
  mobileNumber: string;
  invoiceUrl: string;
}

function normalizeIndianMobileNumber(
  value: string
): string {
  const digits =
    value.replace(
      /\D/g,
      ""
    );

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    return digits;
  }

  throw new Error(
    "Invalid customer mobile number."
  );
}

interface TwoFactorResponse {
  Status?: string;
  Details?: string;
  status?: string;
  message?: string;
}

export async function sendInvoiceLinkSms(
  input: SendInvoiceLinkSmsInput
): Promise<void> {
  const apiKey =
    process.env.TWO_FACTOR_API_KEY;

  const senderId =
    process.env.TWO_FACTOR_SENDER_ID;

  if (!apiKey) {
    throw new Error(
      "TWO_FACTOR_API_KEY is not configured."
    );
  }

  if (!senderId) {
    throw new Error(
      "TWO_FACTOR_SENDER_ID is not configured."
    );
  }

  const mobileNumber =
    normalizeIndianMobileNumber(
      input.mobileNumber
    );

  /*
   * IMPORTANT:
   * This message should match the
   * transactional SMS/DLT template
   * approved in your 2Factor account.
   */
  const message =
    `Dear Parent, your Schoolay payment is confirmed. ` +
    `View invoice: ${input.invoiceUrl} ` +
    `- Schoolay`;

  const endpoint =
    `https://2factor.in/API/V1/` +
    `${encodeURIComponent(apiKey)}/` +
    `ADDON_SERVICES/SEND/TSMS`;

  const response =
    await fetch(
      endpoint,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            From:
              senderId,

            To:
              mobileNumber,

            Msg:
              message
          })
      }
    );

  const responseText =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `2Factor SMS request failed: ${responseText}`
    );
  }

  let responseData:
    TwoFactorResponse | null =
    null;

  try {
    responseData =
      JSON.parse(
        responseText
      ) as TwoFactorResponse;
  } catch {
    /*
     * Some provider responses
     * may not be JSON.
     */
  }

  const providerStatus =
    responseData?.Status ??
    responseData?.status;

  if (
    providerStatus &&
    providerStatus
      .toLowerCase() ===
      "error"
  ) {
    throw new Error(
      responseData?.Details ??
      responseData?.message ??
      "2Factor rejected the SMS."
    );
  }
}