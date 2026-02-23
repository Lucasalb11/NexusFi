import { Router } from "express";
import { getStellarAddress } from "../middleware/auth.js";
import {
  buildBuyWidgetUrl,
  buildSellWidgetUrl,
  verifyWebhookSignature,
  getAvailableMethods,
  MOONPAY_PK,
  type PaymentMethod,
} from "../services/moonpay.js";

const router = Router();

/**
 * GET /api/deposit/config
 * Returns MoonPay publishable key and available methods.
 */
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
 * POST /api/deposit/buy-url
 * Generate a signed MoonPay buy (on-ramp) widget URL.
 * User selects PIX, SWIFT, card, etc. — this returns the signed URL
 * for the MoonPay widget to be embedded in an iframe or opened.
 *
 * Flow: User pays fiat (PIX/SWIFT) → MoonPay → USDC arrives on Stellar
 *       → CRE WF1 verifies reserves → nUSD minted to user
 */
router.post("/buy-url", async (req, res) => {
  try {
    const { amount, fiatCurrency, paymentMethod, email } = req.body;
    const address = getStellarAddress(req);

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const externalId = `nexusfi-buy-${Date.now().toString(36)}`;

    const widgetUrl = buildBuyWidgetUrl({
      walletAddress: address,
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
      address,
      currencyCode: "usdc_xlm",
      fiatCurrency: fiatCurrency ?? "brl",
      paymentMethod: paymentMethod ?? "pix",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/deposit/sell-url
 * Generate a signed MoonPay sell (off-ramp) widget URL.
 *
 * Flow: User burns nUSD → USDC sent to MoonPay → fiat via PIX/SWIFT
 *       → CRE WF1 updates reserves
 */
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
 * POST /api/deposit/webhook
 * MoonPay calls this when a transaction completes.
 * We verify signature, then trigger CRE PoR workflow and mint/burn nUSD.
 */
router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["moonpay-signature-v2"] as string;
    const rawBody = JSON.stringify(req.body);

    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const { type, data } = req.body;

    if (type === "transaction_updated" && data?.status === "completed") {
      const txId = data.externalTransactionId ?? data.id;
      const isBuy = txId?.startsWith("nexusfi-buy");
      const amount = data.cryptoTransactionId
        ? data.baseCurrencyAmount
        : data.quoteCurrencyAmount;

      console.log(
        `MoonPay ${isBuy ? "BUY" : "SELL"} completed: ${amount} — tx: ${txId}`,
      );

      // In production:
      // 1. Verify tx on Stellar Horizon
      // 2. Trigger CRE WF1 (Proof of Reserve) to update attestation
      // 3. Mint nUSD (buy) or burn nUSD (sell) via Soroban contract
    }

    res.json({ received: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/deposit/mint (kept for demo/fallback)
 */
router.post("/mint", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    const address = getStellarAddress(req);
    await new Promise((r) => setTimeout(r, 500));

    res.json({
      success: true,
      address,
      amountDeposited: amount,
      nusdMinted: amount,
      verifiedBy: "CRE Proof of Reserve Workflow",
      provider: "MoonPay (simulated)",
      txHash: `demo-mint-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/deposit/withdraw (kept for demo/fallback)
 */
router.post("/withdraw", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    const address = getStellarAddress(req);
    await new Promise((r) => setTimeout(r, 500));

    res.json({
      success: true,
      address,
      nusdBurned: amount,
      fiatReleased: amount,
      verifiedBy: "CRE Proof of Reserve Workflow",
      provider: "MoonPay (simulated)",
      txHash: `demo-burn-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
