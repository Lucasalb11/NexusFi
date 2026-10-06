import { buildBuyWidgetUrl, type PaymentMethod } from "@/server/moonpay";
import { RelayError, isStellarAddress } from "@/server/relay";
import { body, handle } from "@/server/http";

export function POST(req: Request) {
  return handle(async () => {
    const { amount, fiatCurrency, paymentMethod, address } = await body(req);
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) throw new RelayError("Invalid amount");
    if (!isStellarAddress(address)) throw new RelayError("Invalid address");
    if (!process.env.MOONPAY_PK) throw new RelayError("MoonPay isn't configured on this deployment.", 503);
    const fiat = typeof fiatCurrency === "string" ? fiatCurrency : "brl";
    const method = (typeof paymentMethod === "string" ? paymentMethod : "pix") as PaymentMethod;
    const externalId = `nexusfi-buy-${Buffer.from(address).toString("base64url")}-${Date.now().toString(36)}`;
    const widgetUrl = buildBuyWidgetUrl({
      walletAddress: process.env.MOONPAY_TREASURY_ADDRESS ?? address,
      currencyCode: "usdc_xlm",
      baseCurrencyCode: fiat,
      baseCurrencyAmount: n,
      paymentMethod: method,
      externalTransactionId: externalId,
    });
    return { widgetUrl, externalTransactionId: externalId, address, currencyCode: "usdc_xlm", fiatCurrency: fiat, paymentMethod: method };
  });
}
