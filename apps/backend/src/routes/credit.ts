import { Router } from "express";
import { simulateAICreditScoring } from "../services/cre-bridge.js";
import { invokeContractReadNative, invokeContractWrite, scVal } from "../services/soroban.js";
import { getStellarAddress } from "../middleware/auth.js";
import crypto from "crypto";

const router: Router = Router();

const CREDIT_SCORE_CONTRACT = process.env.CREDIT_SCORE_CONTRACT_ID;
const CREDIT_LINE_CONTRACT = process.env.CREDIT_LINE_CONTRACT_ID;

router.get("/score", async (req, res) => {
  try {
    const address = getStellarAddress(req);
    const result = await simulateAICreditScoring(address);

    let onChain = false;
    let onChainError: string | undefined;
    let contract: string | undefined;

    if (CREDIT_SCORE_CONTRACT) {
      try {
        const metadataHash = crypto.createHash("sha256")
          .update(JSON.stringify(result))
          .digest();
        const timestamp = BigInt(Math.floor(Date.now() / 1000));

        await invokeContractWrite(CREDIT_SCORE_CONTRACT, "set_score", [
          scVal.address(address),
          scVal.u32(result.score),
          scVal.u64(timestamp),
          scVal.bytes32(metadataHash),
        ]);

        onChain = true;
        contract = CREDIT_SCORE_CONTRACT;
      } catch (err: any) {
        onChainError = err.message;
      }
    }

    res.json({
      address,
      ...result,
      onChain,
      onChainError,
      contract,
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

    if (CREDIT_LINE_CONTRACT) {
      try {
        const raw = await invokeContractReadNative(CREDIT_LINE_CONTRACT, "get_credit_info", [
          scVal.address(address),
        ]);

        if (raw) {
          const limitRaw = Number(raw.limit ?? 0);
          const usedRaw = Number(raw.used ?? 0);
          return res.json({
            address,
            hasCredit: true,
            limit: limitRaw / 1e7,
            used: usedRaw / 1e7,
            available: (limitRaw - usedRaw) / 1e7,
            interestRateBps: Number(raw.interest_rate_bps ?? 0),
            scoreAtOpening: Number(raw.score_at_opening ?? 0),
            token: "nUSD",
            source: "on-chain",
            contract: CREDIT_LINE_CONTRACT,
          });
        }
      } catch {
        // No credit line on-chain yet, fall through
      }
    }

    res.json({
      address,
      hasCredit: false,
      limit: 0,
      used: 0,
      available: 0,
      interestRateBps: 0,
      scoreAtOpening: 0,
      token: "nUSD",
      source: "none",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/open", async (req, res) => {
  try {
    const address = getStellarAddress(req);
    if (!CREDIT_LINE_CONTRACT || !CREDIT_SCORE_CONTRACT) {
      return res.status(503).json({ error: "Contracts not configured" });
    }

    let score = 500;
    try {
      const raw = await invokeContractReadNative(CREDIT_SCORE_CONTRACT, "get_score", [
        scVal.address(address),
      ]);
      if (raw) {
        score = Number(raw.score ?? 500);
      }
    } catch {
      const simResult = await simulateAICreditScoring(address);
      score = simResult.score;
    }

    const timestamp = BigInt(Math.floor(Date.now() / 1000));
    const { hash } = await invokeContractWrite(CREDIT_LINE_CONTRACT, "open_credit_line", [
      scVal.address(address),
      scVal.u32(score),
      scVal.u64(timestamp),
    ]);

    res.json({
      success: true,
      txHash: hash,
      address,
      score,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      timestamp: new Date().toISOString(),
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
    if (!CREDIT_LINE_CONTRACT) {
      return res.status(503).json({ error: "Contract not configured" });
    }

    const address = getStellarAddress(req);
    const rawAmount = BigInt(Math.round(Number(amount) * 1e7));

    const { hash } = await invokeContractWrite(CREDIT_LINE_CONTRACT, "use_credit", [
      scVal.address(address),
      scVal.i128(rawAmount),
    ]);

    res.json({
      success: true,
      txHash: hash,
      address,
      amountUsed: amount,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
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
    if (!CREDIT_LINE_CONTRACT) {
      return res.status(503).json({ error: "Contract not configured" });
    }

    const address = getStellarAddress(req);
    const rawAmount = BigInt(Math.round(Number(amount) * 1e7));

    const { hash } = await invokeContractWrite(CREDIT_LINE_CONTRACT, "repay", [
      scVal.address(address),
      scVal.i128(rawAmount),
    ]);

    res.json({
      success: true,
      txHash: hash,
      address,
      amountRepaid: amount,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
