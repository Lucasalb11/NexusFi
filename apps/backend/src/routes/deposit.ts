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

const router = Router();

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
      const cryptoAmount = data.cryptoTransactionId
        ? data.baseCurrencyAmount
        : data.quoteCurrencyAmount;
      const walletAddress = data.walletAddress;
      const fiat = (data.baseCurrencyCode ?? "usd").toUpperCase();
      const symbol: TokenSymbol = fiat === "BRL" ? "nBRL" : "nUSD";

      console.log(
        `MoonPay ${isBuy ? "BUY" : "SELL"} completed: ${cryptoAmount} ${symbol} — tx: ${txId}`,
      );

      if (walletAddress && cryptoAmount) {
        if (isBuy) {
          const { hash } = await mint(symbol, walletAddress, Number(cryptoAmount));
          console.log(`Minted ${cryptoAmount} ${symbol} to ${walletAddress} — tx: ${hash}`);
        } else {
          const { hash } = await burn(symbol, walletAddress, Number(cryptoAmount));
          console.log(`Burned ${cryptoAmount} ${symbol} from ${walletAddress} — tx: ${hash}`);
        }
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("MoonPay webhook error:", err);
    res.status(500).json({ error: err.message });
  }
});

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
