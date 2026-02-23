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

const router = Router();

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

    res.json({
      success: true,
      bridge: tx,
      explorerUrls: {
        burn: tx.burnTxHash?.startsWith("sol:")
          ? `https://explorer.solana.com/tx/${tx.burnTxHash.slice(4)}?cluster=devnet`
          : tx.burnTxHash?.startsWith("0x")
            ? `https://sepolia.etherscan.io/tx/${tx.burnTxHash}`
            : `https://stellar.expert/explorer/testnet/tx/${tx.burnTxHash}`,
        mint: tx.mintTxHash?.startsWith("sol:")
          ? `https://explorer.solana.com/tx/${tx.mintTxHash.slice(4)}?cluster=devnet`
          : tx.mintTxHash?.startsWith("0x")
            ? `https://sepolia.etherscan.io/tx/${tx.mintTxHash}`
            : `https://stellar.expert/explorer/testnet/tx/${tx.mintTxHash}`,
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
