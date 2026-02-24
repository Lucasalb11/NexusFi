import { Router } from "express";
import {
  getAccount,
  getTransactions,
  getAccountBalance,
  fundTestnetAccount,
} from "../services/stellar.js";
import {
  getAllBalances,
  transfer,
  getAllTokens,
  type TokenSymbol,
} from "../services/tokens.js";
import { getStellarAddress } from "../middleware/auth.js";

const router: Router = Router();

router.get("/balance", async (req, res) => {
  try {
    const address = getStellarAddress(req);
    const xlm = await getAccountBalance(address);
    const tokens = await getAllBalances(address);
    const available = getAllTokens().map((t) => ({
      symbol: t.symbol,
      name: t.name,
      contractId: t.contractId,
      fiatCurrency: t.fiatCurrency,
    }));

    res.json({ address, xlm, tokens, available });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/account", async (req, res) => {
  try {
    const address = getStellarAddress(req);
    const account = await getAccount(address);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    res.json(account);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    const address = getStellarAddress(req);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const txs = await getTransactions(address, limit);
    res.json({ address, transactions: txs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/send", async (req, res) => {
  try {
    const { to, amount, token } = req.body;
    if (!to || !amount) {
      return res.status(400).json({ error: "Missing 'to' or 'amount'" });
    }

    const symbol: TokenSymbol = token === "nBRL" ? "nBRL" : "nUSD";
    const from = getStellarAddress(req);

    const { hash, rawAmount } = await transfer(symbol, from, to, Number(amount));

    res.json({
      success: true,
      txHash: hash,
      from,
      to,
      amount: Number(amount),
      rawAmount,
      token: symbol,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/fund-testnet", async (req, res) => {
  try {
    const address = getStellarAddress(req);
    const success = await fundTestnetAccount(address);
    res.json({ success, address });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
