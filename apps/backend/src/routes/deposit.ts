import { Router } from "express";
import { getStellarAddress } from "../middleware/auth.js";
import { mint, burn, type TokenSymbol } from "../services/tokens.js";
import {
  buildBuyWidgetUrl,
  buildSellWidgetUrl,
  verifyWebhookSignature,
  getAvailableMethods,
  MOONPAY_PK,
  type PaymentMethod,
} from "../services/moonpay.js";

const router: Router = Router();

router.get("/config", async (req, res) => {
  try {
    const country = (req.query.country as string) ?? "BR";
    const methods = getAvailableMethods(country);

    res.json({
      moonpayPk: MOONPAY_PK,
      supportedCurrencies: {
        onRamp: ["usdc_xlm", "xlm"],
        offRamp: ["usdc_xlm", "xlm"],
      },
      supportedFiat: {
        onRamp: ["brl", "usd", "eur", "gbp"],
        offRamp: ["brl", "usd", "eur", "gbp"],
      },
      methods,
      stellarNetwork: "testnet",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Decode user address from externalTransactionId (nexusfi-buy-{base64addr}-{ts})
 */
function decodeUserFromExternalId(externalId: string): string | null {
  const match = externalId.match(/^nexusfi-buy-([A-Za-z0-9_-]+)-([a-z0-9]+)$/);
  if (!match) return null;
  try {
    return Buffer.from(match[1], "base64url").toString("utf8");
  } catch {
    return null;
  }
}

router.post("/buy-url", async (req, res) => {
  try {
    const { amount, fiatCurrency, paymentMethod, email } = req.body;
    const userAddress = getStellarAddress(req);

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const treasuryAddress = process.env.MOONPAY_TREASURY_ADDRESS;
    const walletAddress = treasuryAddress ?? userAddress;
    const userB64 = Buffer.from(userAddress, "utf8").toString("base64url");
    const externalId = `nexusfi-buy-${userB64}-${Date.now().toString(36)}`;

    const widgetUrl = buildBuyWidgetUrl({
      walletAddress,
      currencyCode: "usdc_xlm",
      baseCurrencyCode: fiatCurrency ?? "brl",
      baseCurrencyAmount: amount,
      paymentMethod: (paymentMethod as PaymentMethod) ?? "pix",
      email,
      externalTransactionId: externalId,
    });

    res.json({
      widgetUrl,
      externalTransactionId: externalId,
      address: userAddress,
      currencyCode: "usdc_xlm",
      fiatCurrency: fiatCurrency ?? "brl",
      paymentMethod: paymentMethod ?? "pix",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/sell-url", async (req, res) => {
  try {
    const { amount, fiatCurrency, paymentMethod } = req.body;
    const address = getStellarAddress(req);

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const externalId = `nexusfi-sell-${Date.now().toString(36)}`;

    const widgetUrl = buildSellWidgetUrl({
      walletAddress: address,
      currencyCode: "usdc_xlm",
      quoteCurrencyCode: fiatCurrency ?? "brl",
      baseCurrencyAmount: amount,
      paymentMethod: (paymentMethod as PaymentMethod) ?? "pix",
      externalTransactionId: externalId,
    });

    res.json({
      widgetUrl,
      externalTransactionId: externalId,
      address,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * MoonPay webhook handler. Uses req.rawBody for signature verification (must be
 * set by middleware that preserves raw body before express.json parses it).
 */
export async function moonpayWebhookHandler(req: any, res: any) {
  try {
    const signature = req.headers["moonpay-signature-v2"] as string;
    const rawBody = req.rawBody ?? "";

    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const { type, data } = req.body;

    if (type === "transaction_updated" && data?.status === "completed") {
      const txId = data.externalTransactionId ?? data.id;
      const isBuy = txId?.startsWith("nexusfi-buy");
      // Buy: baseCurrency=fiat, quoteCurrency=crypto → use quoteCurrencyAmount
      // Sell: baseCurrency=crypto, quoteCurrency=fiat → use baseCurrencyAmount
      const cryptoAmount = isBuy
        ? (data.quoteCurrencyAmount ?? data.baseCurrencyAmount)
        : (data.baseCurrencyAmount ?? data.quoteCurrencyAmount);
      const payloadWalletAddress = data.walletAddress;
      const fiat = (data.baseCurrencyCode ?? data.quoteCurrencyCode ?? "usd").toUpperCase();
      const symbol: TokenSymbol = fiat === "BRL" ? "nBRL" : "nUSD";

      // Idempotency: skip if already processed
      if (processedWebhookIds.has(txId)) {
        return res.json({ received: true, duplicate: true });
      }
      addProcessedId(txId);

      // Buy with treasury: USDC goes to treasury, we mint nUSD to user (from externalId)
      // Buy without treasury: USDC goes to user, we do NOT mint (avoid double-credit)
      // Sell: user sold crypto from their wallet, we burn nUSD from that wallet
      const mintOrBurnAddress = isBuy
        ? (decodeUserFromExternalId(txId) ?? (process.env.MOONPAY_TREASURY_ADDRESS ? null : payloadWalletAddress))
        : payloadWalletAddress;

      console.log(
        `MoonPay ${isBuy ? "BUY" : "SELL"} completed: ${cryptoAmount} ${symbol} — tx: ${txId}`,
      );

      if (mintOrBurnAddress && cryptoAmount) {
        if (isBuy) {
          if (process.env.MOONPAY_TREASURY_ADDRESS) {
            const { hash } = await mint(symbol, mintOrBurnAddress, Number(cryptoAmount));
            console.log(`Minted ${cryptoAmount} ${symbol} to ${mintOrBurnAddress} — tx: ${hash}`);
          }
          // else: no treasury = MoonPay sends USDC to user directly, no mint
        } else {
          const { hash } = await burn(symbol, mintOrBurnAddress, Number(cryptoAmount));
          console.log(`Burned ${cryptoAmount} ${symbol} from ${mintOrBurnAddress} — tx: ${hash}`);
        }
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("MoonPay webhook error:", err);
    res.status(500).json({ error: err.message });
  }
}

const MAX_PROCESSED_WEBHOOK_IDS = 10_000;
const processedWebhookIds = new Set<string>();
function addProcessedId(id: string) {
  processedWebhookIds.add(id);
  if (processedWebhookIds.size > MAX_PROCESSED_WEBHOOK_IDS) {
    const arr = [...processedWebhookIds];
    processedWebhookIds.clear();
    arr.slice(-MAX_PROCESSED_WEBHOOK_IDS / 2).forEach((x) => processedWebhookIds.add(x));
  }
}

router.post("/mint", async (req, res) => {
  try {
    const { amount, token } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const symbol: TokenSymbol = token === "nBRL" ? "nBRL" : "nUSD";
    const address = getStellarAddress(req);
    const { hash, rawAmount } = await mint(symbol, address, Number(amount));

    res.json({
      success: true,
      address,
      token: symbol,
      amountMinted: Number(amount),
      rawAmount,
      txHash: hash,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/withdraw", async (req, res) => {
  try {
    const { amount, token } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const symbol: TokenSymbol = token === "nBRL" ? "nBRL" : "nUSD";
    const address = getStellarAddress(req);
    const { hash, rawAmount } = await burn(symbol, address, Number(amount));

    res.json({
      success: true,
      address,
      token: symbol,
      amountBurned: Number(amount),
      rawAmount,
      txHash: hash,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
