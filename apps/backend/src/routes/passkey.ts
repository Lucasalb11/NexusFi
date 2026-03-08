import { Router } from "express";
import * as StellarSdk from "@stellar/stellar-sdk";
import { mint, getBalance } from "../services/tokens.js";
import { fundAccountWithXLM } from "../services/stellar.js";

const router: Router = Router();

const RPC_URL = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

const walletStore = new Map<
  string,
  { userId: string; contractId: string; createdAt: string }
>();

router.post("/submit", async (req, res) => {
  try {
    const { xdr: txXdr } = req.body;
    if (!txXdr) {
      return res.status(400).json({ error: "Missing xdr" });
    }

    const rpc = new StellarSdk.rpc.Server(RPC_URL);
    const tx = StellarSdk.TransactionBuilder.fromXDR(txXdr, NETWORK_PASSPHRASE);
    const result = await rpc.sendTransaction(tx);

    if (result.status === "ERROR") {
      return res.status(400).json({
        error: "Transaction rejected",
        detail: result,
      });
    }

    let finalResult = result;
    if (result.status === "PENDING") {
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const check = await rpc.getTransaction(result.hash);
        if (check.status === "SUCCESS") {
          finalResult = check as any;
          break;
        }
        if (check.status === "FAILED") {
          return res.status(400).json({
            error: "Transaction failed on-chain",
            hash: result.hash,
          });
        }
      }
    }

    res.json({
      success: true,
      hash: result.hash,
      status: (finalResult as any).status ?? "PENDING",
    });
  } catch (err: any) {
    console.error("Passkey submit error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { keyId, contractId } = req.body;
    if (!keyId || !contractId) {
      return res.status(400).json({ error: "Missing keyId or contractId" });
    }

    let userId = req.session?.userId;
    if (!userId) {
      userId = crypto.randomUUID();
      req.session!.userId = userId;
    }

    const createdAt = new Date().toISOString();
    walletStore.set(keyId, { userId, contractId, createdAt });

    console.log(`Passkey wallet registered: ${keyId} -> ${contractId} (user: ${userId})`);

    // Respond immediately — airdrop runs in background so the frontend isn't blocked
    res.json({ success: true, keyId, contractId, createdAt });

    // Fire-and-forget: mint starting balance + fund XLM
    Promise.all([
      mintStartingBalance(contractId),
      fundAccountWithXLM(contractId, "100"),
    ]).catch((err) =>
      console.error(`Airdrop background error for ${contractId}:`, err.message),
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/lookup/:keyId", async (req, res) => {
  try {
    const { keyId } = req.params;
    const entry = walletStore.get(keyId);

    if (!entry) {
      return res.status(404).json({ error: "Wallet not found for this passkey" });
    }

    req.session!.userId = entry.userId;

    res.json({
      keyId,
      contractId: entry.contractId,
      createdAt: entry.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/wallets", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const wallets = Array.from(walletStore.entries())
      .filter(([, data]) => data.userId === userId)
      .map(([keyId, data]) => ({
        keyId,
        contractId: data.contractId,
        createdAt: data.createdAt,
      }));
    res.json({ wallets, count: wallets.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/logout", (req, res) => {
  req.session?.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

/**
 * POST /api/passkey/airdrop
 *
 * Mints 10,000 nUSD and 10,000 nBRL to the wallet if it has zero balance.
 * Idempotent: skips mint for tokens the wallet already holds.
 * Call this after createAccount AND signIn so every wallet has a starting balance.
 */
router.post("/airdrop", async (req, res) => {
  try {
    const { contractId } = req.body;
    if (!contractId) {
      return res.status(400).json({ error: "Missing contractId" });
    }

    const [airdrop, xlmHash] = await Promise.all([
      mintStartingBalance(contractId),
      fundAccountWithXLM(contractId, "100"),
    ]);
    res.json({ success: true, contractId, airdrop, xlmFunded: !!xlmHash });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** Mint 10,000 nUSD + 10,000 nBRL if the wallet balance is 0 for each token. */
async function mintStartingBalance(contractId: string) {
  const AIRDROP_AMOUNT = 10_000;
  const result: Record<string, any> = {};

  for (const symbol of ["nUSD", "nBRL"] as const) {
    try {
      // Check existing balance — skip mint if wallet already has tokens
      let currentBalance = 0;
      try {
        const bal = await getBalance(symbol, contractId);
        currentBalance = Number(bal.raw);
      } catch {
        currentBalance = 0; // treat read error as zero balance
      }

      if (currentBalance > 0) {
        result[symbol] = { skipped: true, reason: "already has balance" };
        console.log(`Airdrop skipped ${symbol} for ${contractId} — already has balance`);
        continue;
      }

      const { hash } = await mint(symbol, contractId, AIRDROP_AMOUNT);
      result[symbol] = { minted: AIRDROP_AMOUNT, txHash: hash };
      console.log(`Airdrop: minted ${AIRDROP_AMOUNT} ${symbol} to ${contractId} — tx: ${hash}`);
    } catch (err: any) {
      result[symbol] = { error: err.message };
      console.warn(`Airdrop mint failed for ${symbol} → ${contractId}:`, err.message);
    }
  }

  return result;
}

export default router;
