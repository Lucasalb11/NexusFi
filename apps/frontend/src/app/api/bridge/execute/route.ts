import crypto from "crypto";
import { submitUserTx, RelayError, isStellarAddress } from "@/server/relay";
import { cappedMint } from "@/server/faucet";
import { body, handle } from "@/server/http";

export const maxDuration = 60;

const CHAINS = ["stellar", "solana", "ethereum", "avalanche"] as const;
type Chain = (typeof CHAINS)[number];
const FEE_BPS: Record<string, number> = {
  "stellar->solana": 15, "stellar->ethereum": 25, "stellar->avalanche": 20,
  "solana->stellar": 15, "ethereum->stellar": 25, "avalanche->stellar": 20,
};
/** Incoming bridges are simulated (no other chain is checked), so they're capped like the faucet. */
const MAX_INCOMING = 1_000;

const demoHash = (chain: Chain) =>
  chain === "solana" ? `sol:demo-${crypto.randomBytes(32).toString("hex")}` : `0xdemo${crypto.randomBytes(32).toString("hex")}`;

/**
 * Stellar -> other: the user's wallet signs a burn (via /api/tx/prepare), which is relayed here;
 * the destination mint is simulated. Other -> Stellar: the source lock is simulated and the
 * Stellar mint is real but capped.
 */
export function POST(req: Request) {
  return handle(async () => {
    const b = await body(req);
    const sourceChain = b.sourceChain as Chain;
    const destChain = b.destChain as Chain;
    if (!CHAINS.includes(sourceChain) || !CHAINS.includes(destChain) || sourceChain === destChain) {
      throw new RelayError("Unsupported route");
    }
    if (sourceChain !== "stellar" && destChain !== "stellar") throw new RelayError("One side must be Stellar");
    const feeBps = FEE_BPS[`${sourceChain}->${destChain}`] ?? 30;
    const id = `bridge-${crypto.randomBytes(12).toString("hex")}`;

    if (sourceChain === "stellar") {
      const burned = await submitUserTx(b.xdr);
      if (burned.action !== "burn" || !burned.token) throw new RelayError("Expected a signed token burn");
      const amount = Number(burned.rawAmount) / 1e7;
      const net = amount - (amount * feeBps) / 10_000;
      return {
        success: true,
        bridge: { id, status: "completed", sourceChain, destChain, token: burned.token, amount, netAmount: net, burnTxHash: burned.hash, mintTxHash: demoHash(destChain) },
        stellarExplorerUrl: `https://stellar.expert/explorer/testnet/tx/${burned.hash}`,
        explorerUrls: { burn: `https://stellar.expert/explorer/testnet/tx/${burned.hash}` },
        demoNotice: `The burn on Stellar is real; the mint on ${destChain} is simulated.`,
      };
    }

    const token = b.token === "nBRL" ? "nBRL" : "nUSD";
    if (!isStellarAddress(b.destAddress)) throw new RelayError("Invalid destination address");
    const requested = Number(b.amount);
    if (!Number.isFinite(requested) || requested <= 0) throw new RelayError("Invalid amount");
    const net = Math.min(requested, MAX_INCOMING) * (1 - feeBps / 10_000);
    const { minted, hash } = await cappedMint(token, b.destAddress, net);
    if (!hash) throw new RelayError("This wallet already holds the demo maximum.");
    return {
      success: true,
      bridge: { id, status: "completed", sourceChain, destChain, token, amount: requested, netAmount: minted, burnTxHash: demoHash(sourceChain), mintTxHash: hash },
      stellarExplorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      explorerUrls: { mint: `https://stellar.expert/explorer/testnet/tx/${hash}` },
      demoNotice: `The lock on ${sourceChain} is simulated; the mint on Stellar is real (capped for the demo).`,
    };
  });
}
