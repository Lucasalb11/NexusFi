import { Router } from "express";
import {
  simulateProofOfReserve,
  simulateAICreditScoring,
  simulateRiskMonitor,
  getWorkflowStatus,
} from "../services/cre-bridge.js";
import { getStellarAddress } from "../middleware/auth.js";

const router: Router = Router();

router.get("/status", async (_req, res) => {
  try {
    const status = getWorkflowStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/proof-of-reserve", async (_req, res) => {
  try {
    const issuer =
      process.env.NUSD_ISSUER_ADDRESS ??
      "GBZXN3PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI";
    const result = await simulateProofOfReserve(issuer);
    res.json({
      workflow: "wf1-proof-of-reserve",
      track: "DeFi & Tokenization",
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/credit-score", async (req, res) => {
  try {
    const address = getStellarAddress(req);
    const result = await simulateAICreditScoring(address);
    res.json({
      workflow: "wf2-ai-credit-scoring",
      track: "CRE & AI",
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/risk", async (_req, res) => {
  try {
    const metrics = await simulateRiskMonitor();
    res.json({
      workflow: "wf3-risk-monitor",
      track: "Risk & Compliance",
      ...metrics,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/privacy-check", async (req, res) => {
  try {
    const address = getStellarAddress(req);

    // Demo: simulates Confidential HTTP call — credentials never exposed
    res.json({
      workflow: "wf4-privacy-credit",
      track: "Privacy",
      address,
      eligible: true,
      encryptedResult: `enc:${Buffer.from(`eligible-${address.slice(0, 8)}`).toString("base64")}`,
      confidentialHttp: true,
      credentialsExposed: false,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
