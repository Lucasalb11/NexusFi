zimport { Router } from "express";
import * as StellarSdk from "@stellar/stellar-sdk";

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

    walletStore.set(keyId, {
      userId,
      contractId,
      createdAt: new Date().toISOString(),
    });

    console.log(`Passkey wallet registered: ${keyId} -> ${contractId} (user: ${userId})`);

    res.json({ success: true, keyId, contractId });
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

export default router;
