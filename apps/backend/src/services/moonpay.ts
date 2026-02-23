/**
 * MoonPay Integration Service
 *
 * Handles on-ramp (PIX/SWIFT → USDC on Stellar) and off-ramp
 * (USDC on Stellar → PIX/SWIFT fiat) via MoonPay's widget SDK.
 *
 * SECURITY:
 * - MOONPAY_SECRET_KEY is used server-side only for URL signing.
 * - NEVER expose the secret key to the frontend.
 * - The publishable key (MOONPAY_PK) is safe for client-side use.
 */

import crypto from "crypto";

const MOONPAY_PK = process.env.MOONPAY_PK ?? "";
const MOONPAY_SK = process.env.MOONPAY_SECRET_KEY ?? "";
const MOONPAY_WEBHOOK_KEY = process.env.MOONPAY_WEBHOOK_KEY ?? "";

const MOONPAY_BASE_URL = process.env.MOONPAY_ENV === "production"
  ? "https://buy.moonpay.com"
  : "https://buy-sandbox.moonpay.com";

const MOONPAY_SELL_URL = process.env.MOONPAY_ENV === "production"
  ? "https://sell.moonpay.com"
  : "https://sell-sandbox.moonpay.com";

export type PaymentMethod = "pix" | "swift" | "card" | "sepa";

export type MoonPayBuyParams = {
  walletAddress: string;
  currencyCode: string;
  baseCurrencyCode: string;
  baseCurrencyAmount?: number;
  paymentMethod?: PaymentMethod;
  email?: string;
  externalTransactionId?: string;
  stellarMemo?: string;
};

export type MoonPaySellParams = {
  walletAddress: string;
  currencyCode: string;
  quoteCurrencyCode: string;
  baseCurrencyAmount?: number;
  paymentMethod?: PaymentMethod;
  externalTransactionId?: string;
};

/**
 * Sign a MoonPay widget URL with the secret key.
 * Required when passing walletAddress or other sensitive params.
 */
function signUrl(url: string): string {
  if (!MOONPAY_SK) return url;

  const urlObj = new URL(url);
  const signature = crypto
    .createHmac("sha256", MOONPAY_SK)
    .update(urlObj.search)
    .digest("base64");

  return `${url}&signature=${encodeURIComponent(signature)}`;
}

/**
 * Build a signed MoonPay buy (on-ramp) widget URL.
 *
 * Supported currency codes on Stellar:
 * - "xlm" — native XLM
 * - "usdc_xlm" — USDC on Stellar network
 */
export function buildBuyWidgetUrl(params: MoonPayBuyParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("apiKey", MOONPAY_PK);
  searchParams.set("currencyCode", params.currencyCode);
  searchParams.set("walletAddress", params.walletAddress);
  searchParams.set("baseCurrencyCode", params.baseCurrencyCode);
  searchParams.set("colorCode", "#8B5CF6");
  searchParams.set("theme", "dark");

  if (params.baseCurrencyAmount) {
    searchParams.set("baseCurrencyAmount", String(params.baseCurrencyAmount));
  }
  if (params.email) {
    searchParams.set("email", params.email);
  }
  if (params.externalTransactionId) {
    searchParams.set("externalTransactionId", params.externalTransactionId);
  }
  if (params.stellarMemo) {
    searchParams.set("walletAddressTag", params.stellarMemo);
  }

  // Map NexusFi payment methods to MoonPay's payment method names
  if (params.paymentMethod) {
    const methodMap: Record<PaymentMethod, string> = {
      pix: "pix",
      swift: "bank_transfer",
      card: "credit_debit_card",
      sepa: "sepa_bank_transfer",
    };
    searchParams.set("paymentMethod", methodMap[params.paymentMethod]);
  }

  const rawUrl = `${MOONPAY_BASE_URL}?${searchParams.toString()}`;
  return signUrl(rawUrl);
}

/**
 * Build a signed MoonPay sell (off-ramp) widget URL.
 */
export function buildSellWidgetUrl(params: MoonPaySellParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("apiKey", MOONPAY_PK);
  searchParams.set("baseCurrencyCode", params.currencyCode);
  searchParams.set("quoteCurrencyCode", params.quoteCurrencyCode);
  searchParams.set("walletAddress", params.walletAddress);
  searchParams.set("colorCode", "#8B5CF6");
  searchParams.set("theme", "dark");

  if (params.baseCurrencyAmount) {
    searchParams.set("baseCurrencyAmount", String(params.baseCurrencyAmount));
  }
  if (params.externalTransactionId) {
    searchParams.set("externalTransactionId", params.externalTransactionId);
  }

  if (params.paymentMethod) {
    const methodMap: Record<PaymentMethod, string> = {
      pix: "pix",
      swift: "bank_transfer",
      card: "credit_debit_card",
      sepa: "sepa_bank_transfer",
    };
    searchParams.set("paymentMethod", methodMap[params.paymentMethod]);
  }

  const rawUrl = `${MOONPAY_SELL_URL}?${searchParams.toString()}`;
  return signUrl(rawUrl);
}

/**
 * Verify MoonPay webhook signature.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  if (!MOONPAY_WEBHOOK_KEY) return false;

  const expected = crypto
    .createHmac("sha256", MOONPAY_WEBHOOK_KEY)
    .update(payload)
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}

/**
 * Get available payment methods for a given country/currency.
 */
export function getAvailableMethods(countryCode: string): {
  onRamp: PaymentMethod[];
  offRamp: PaymentMethod[];
} {
  const methods: Record<string, { onRamp: PaymentMethod[]; offRamp: PaymentMethod[] }> = {
    BR: {
      onRamp: ["pix", "card"],
      offRamp: ["pix"],
    },
    US: {
      onRamp: ["card", "swift"],
      offRamp: ["swift"],
    },
    GB: {
      onRamp: ["card", "swift"],
      offRamp: ["swift"],
    },
    // EU countries
    DE: { onRamp: ["sepa", "card"], offRamp: ["sepa"] },
    FR: { onRamp: ["sepa", "card"], offRamp: ["sepa"] },
    ES: { onRamp: ["sepa", "card"], offRamp: ["sepa"] },
    IT: { onRamp: ["sepa", "card"], offRamp: ["sepa"] },
    PT: { onRamp: ["sepa", "card"], offRamp: ["sepa"] },
    NL: { onRamp: ["sepa", "card"], offRamp: ["sepa"] },
  };

  return methods[countryCode] ?? { onRamp: ["card"], offRamp: [] };
}

export { MOONPAY_PK, MOONPAY_BASE_URL, MOONPAY_SELL_URL };
