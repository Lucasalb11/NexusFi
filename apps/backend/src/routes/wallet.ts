import { Router } from "express";
import {
  getAccount,
  getTransactions,
  getAccountBalance,
  fundTestnetAccount,
} from "../services/stellar.js";
import { getStellarAddress } from "../middleware/auth.js";

const router = Router();

router.get("/balance", async (req, res) => {
  try {
    const address = getStellarAddress(req);
    const balance = await getAccountBalance(address);
    res.json({ address, balance, token: "nUSD" });
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
    const { to, amount } = req.body;
    if (!to || !amount) {
      return res.status(400).json({ error: "Missing 'to' or 'amount'" });
    }

    // Demo: simulate successful transfer
    res.json({
      success: true,
      txHash: `demo-tx-${Date.now().toString(36)}`,
      from: getStellarAddress(req),
      to,
      amount,
      token: "nUSD",
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
