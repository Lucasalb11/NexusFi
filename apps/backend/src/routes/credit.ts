import { Router } from "express";
import { simulateAICreditScoring } from "../services/cre-bridge.js";
import {
  invokeContractReadNative,
  invokeContractWrite,
  buildUserSignedTransaction,
  submitSignedTransaction,
  scVal,
} from "../services/soroban.js";
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
    let txHash: string | undefined;
    let explorerUrl: string | undefined;

    if (CREDIT_SCORE_CONTRACT) {
      try {
        const metadataHash = crypto.createHash("sha256")
          .update(JSON.stringify(result))
          .digest();
        const timestamp = BigInt(Math.floor(Date.now() / 1000));

        const writeResult = await invokeContractWrite(CREDIT_SCORE_CONTRACT, "set_score", [
          scVal.address(address),
          scVal.u32(result.score),
          scVal.u64(timestamp),
          scVal.bytes32(metadataHash),
        ]);

        onChain = true;
        contract = CREDIT_SCORE_CONTRACT;
        txHash = writeResult.hash;
        explorerUrl = `https://stellar.expert/explorer/testnet/tx/${writeResult.hash}`;
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
      txHash,
      explorerUrl,
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

/**
 * Build unsigned use_credit transaction for user to sign via Freighter.
 * use_credit requires user.require_auth() — backend cannot sign on behalf of user.
 */
router.post("/use-unsigned", async (req, res) => {
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

    const xdr = await buildUserSignedTransaction(
      CREDIT_LINE_CONTRACT,
      "use_credit",
      [scVal.address(address), scVal.i128(rawAmount)],
      address,
    );

    res.json({
      xdr,
      address,
      amount,
      nextStep: "Sign with Freighter and POST to /api/credit/submit-signed",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Build unsigned repay transaction for user to sign via Freighter.
 */
router.post("/repay-unsigned", async (req, res) => {
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

    const xdr = await buildUserSignedTransaction(
      CREDIT_LINE_CONTRACT,
      "repay",
      [scVal.address(address), scVal.i128(rawAmount)],
      address,
    );

    res.json({
      xdr,
      address,
      amount,
      nextStep: "Sign with Freighter and POST to /api/credit/submit-signed",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Submit a transaction signed by the user (via Freighter).
 */
router.post("/submit-signed", async (req, res) => {
  try {
    const { xdr: signedXdr } = req.body;
    if (!signedXdr || typeof signedXdr !== "string") {
      return res.status(400).json({ error: "Missing xdr" });
    }

    const { hash } = await submitSignedTransaction(signedXdr);

    res.json({
      success: true,
      txHash: hash,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** @deprecated Use /use-unsigned + Freighter sign + /submit-signed. use_credit requires user auth. */
router.post("/use", async (_req, res) => {
  res.status(400).json({
    error: "use_credit requires user signature. Use POST /api/credit/use-unsigned to get XDR, sign with Freighter, then POST to /api/credit/submit-signed.",
  });
});

/** @deprecated Use /repay-unsigned + Freighter sign + /submit-signed. repay requires user auth. */
router.post("/repay", async (_req, res) => {
  res.status(400).json({
    error: "repay requires user signature. Use POST /api/credit/repay-unsigned to get XDR, sign with Freighter, then POST to /api/credit/submit-signed.",
  });
});

export default router;
