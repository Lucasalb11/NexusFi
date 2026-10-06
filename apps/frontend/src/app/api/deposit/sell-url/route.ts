import { buildSellWidgetUrl, type PaymentMethod } from "@/server/moonpay";
import { RelayError, isStellarAddress } from "@/server/relay";
import { body, handle } from "@/server/http";

export function POST(req: Request) {
  return handle(async () => {
    const { amount, fiatCurrency, paymentMethod, address } = await body(req);
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) throw new RelayError("Invalid amount");
    if (!isStellarAddress(address)) throw new RelayError("Invalid address");
    if (!process.env.MOONPAY_PK) throw new RelayError("MoonPay isn't configured on this deployment.", 503);
    const externalId = `nexusfi-sell-${Date.now().toString(36)}`;
    const widgetUrl = buildSellWidgetUrl({
      walletAddress: address,
      currencyCode: "usdc_xlm",
      quoteCurrencyCode: typeof fiatCurrency === "string" ? fiatCurrency : "brl",
      baseCurrencyAmount: n,
      paymentMethod: (typeof paymentMethod === "string" ? paymentMethod : "pix") as PaymentMethod,
      externalTransactionId: externalId,
    });
    return { widgetUrl, externalTransactionId: externalId, address };
  });
}
