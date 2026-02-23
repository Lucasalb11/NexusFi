import { Router } from "express";
import { simulateAICreditScoring } from "../services/cre-bridge.js";
import { getStellarAddress } from "../middleware/auth.js";

const router = Router();

router.get("/score", async (req, res) => {
  try {
    const address = getStellarAddress(req);
    const result = await simulateAICreditScoring(address);
    res.json({
      address,
      ...result,
      workflow: "wf2-ai-credit-scoring",
      track: "CRE & AI",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/info", async (req, res) => {
  try {
    const address = getStellarAddress(req);
    // Demo: return mock credit line info
    res.json({
      address,
      hasCredit: true,
      limit: 5000,
      used: 1230,
      available: 3770,
      interestRateBps: 800,
      scoreAtOpening: 782,
      token: "nUSD",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/use", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    const address = getStellarAddress(req);

    // Demo: simulate credit usage
    res.json({
      success: true,
      address,
      amountUsed: amount,
      newUsed: 1230 + amount,
      newAvailable: 3770 - amount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/repay", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    const address = getStellarAddress(req);

    res.json({
      success: true,
      address,
      amountRepaid: amount,
      newUsed: Math.max(0, 1230 - amount),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
