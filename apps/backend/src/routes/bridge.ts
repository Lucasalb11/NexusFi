import { Router } from "express";
import { getStellarAddress } from "../middleware/auth.js";
import {
  getBridgeQuote,
  executeBridge,
  getBridgeTransaction,
  getSupportedChains,
  type ChainId,
} from "../services/bridge.js";
import type { TokenSymbol } from "../services/tokens.js";

const router: Router = Router();

router.get("/chains", async (_req, res) => {
  try {
    const chains = getSupportedChains();
    res.json({ chains });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/quote", async (req, res) => {
  try {
    const { sourceChain, destChain, token, amount } = req.body;

    if (!sourceChain || !destChain || !amount || amount <= 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const symbol: TokenSymbol = token === "nBRL" ? "nBRL" : "nUSD";
    const quote = getBridgeQuote(
      sourceChain as ChainId,
      destChain as ChainId,
      symbol,
      Number(amount),
    );

    res.json(quote);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/execute", async (req, res) => {
  try {
    const { sourceChain, destChain, token, amount, destAddress } = req.body;

    if (!sourceChain || !destChain || !amount || !destAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const symbol: TokenSymbol = token === "nBRL" ? "nBRL" : "nUSD";
    const sourceAddress = getStellarAddress(req);

    const tx = await executeBridge(
      sourceChain as ChainId,
      destChain as ChainId,
      symbol,
      Number(amount),
      sourceAddress,
      destAddress,
    );

    // Build per-chain explorer URLs
    const toExplorerUrl = (hash: string | undefined) => {
      if (!hash) return undefined;
      if (hash.startsWith("sol:"))
        return `https://explorer.solana.com/tx/${hash.slice(4)}?cluster=devnet`;
      if (hash.startsWith("0x"))
        return `https://sepolia.etherscan.io/tx/${hash}`;
      return `https://stellar.expert/explorer/testnet/tx/${hash}`;
    };

    // stellarExplorerUrl always points to the real on-chain Stellar tx:
    //   stellar→other  →  burn tx  (admin_burn on nUSD/nBRL contract, real hash)
    //   other→stellar  →  mint tx  (mint on nUSD/nBRL contract, real hash)
    const stellarHash =
      sourceChain === "stellar" ? tx.burnTxHash : tx.mintTxHash;
    const stellarExplorerUrl = stellarHash && !stellarHash.startsWith("0x") && !stellarHash.startsWith("sol:")
      ? `https://stellar.expert/explorer/testnet/tx/${stellarHash}`
      : undefined;

    res.json({
      success: true,
      bridge: tx,
      demoNotice:
        destChain !== "stellar"
          ? "Mint on destination chain is simulated (demo). Production requires bridge contracts."
          : undefined,
      stellarExplorerUrl,   // always the real Stellar tx — use this for the main explorer link
      explorerUrls: {
        burn: toExplorerUrl(tx.burnTxHash),
        mint: toExplorerUrl(tx.mintTxHash),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/status/:id", async (req, res) => {
  try {
    const tx = getBridgeTransaction(req.params.id);
    if (!tx) {
      return res.status(404).json({ error: "Bridge transaction not found" });
    }
    res.json(tx);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
