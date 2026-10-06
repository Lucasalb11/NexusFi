import { NextResponse } from "next/server";
import { verifyWebhookSignature, webhookConfigured } from "@/server/moonpay";
import { burn, type TokenSymbol } from "@/server/tokens";
import { cappedMint } from "@/server/faucet";
import { isStellarAddress } from "@/server/relay";

export const maxDuration = 60;

function userFromExternalId(id: string): string | null {
  const m = id.match(/^nexusfi-buy-([A-Za-z0-9_-]+)-([a-z0-9]+)$/);
  if (!m) return null;
  const addr = Buffer.from(m[1], "base64url").toString("utf8");
  return isStellarAddress(addr) ? addr : null;
}

/** MoonPay webhook. Only signed, fresh requests are processed; unsigned ones are refused. */
export async function POST(req: Request) {
  if (!webhookConfigured()) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("moonpay-signature-v2"))) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const { type, data } = JSON.parse(raw);
    if (type !== "transaction_updated" || data?.status !== "completed") return NextResponse.json({ received: true });

    const txId: string = data.externalTransactionId ?? data.id ?? "";
    const isBuy = txId.startsWith("nexusfi-buy");
    const amount = Number(isBuy ? data.quoteCurrencyAmount ?? data.baseCurrencyAmount : data.baseCurrencyAmount ?? data.quoteCurrencyAmount);
    const fiat = String(data.baseCurrencyCode ?? data.quoteCurrencyCode ?? "usd").toUpperCase();
    const symbol: TokenSymbol = fiat === "BRL" ? "nBRL" : "nUSD";
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ received: true });

    if (isBuy && process.env.MOONPAY_TREASURY_ADDRESS) {
      // Capped by balance, so a retried webhook can't credit the same purchase twice past the ceiling.
      const user = userFromExternalId(txId);
      if (user) await cappedMint(symbol, user, amount);
    } else if (!isBuy && isStellarAddress(data.walletAddress)) {
      await burn(symbol, data.walletAddress, amount);
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[moonpay webhook]", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
