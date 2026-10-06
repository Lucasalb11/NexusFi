import crypto from "crypto";
import { simulateAICreditScoring } from "@/server/cre-bridge";
import { invokeContractWrite, scVal } from "@/server/soroban";
import { addressParam, handle } from "@/server/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Computes the score from the address's public history and records it on-chain.
 * Anyone can trigger it for any address, but the score is derived from chain data,
 * so a caller can't choose the value.
 */
export function GET(req: Request) {
  return handle(async () => {
    const address = addressParam(req);
    const result = await simulateAICreditScoring(address);
    const contract = process.env.CREDIT_SCORE_CONTRACT_ID;
    let onChain = false;
    let txHash: string | undefined;
    if (contract) {
      try {
        const metadataHash = crypto.createHash("sha256").update(JSON.stringify(result)).digest();
        const write = await invokeContractWrite(contract, "set_score", [
          scVal.address(address),
          scVal.u32(result.score),
          scVal.u64(BigInt(Math.floor(Date.now() / 1000))),
          scVal.bytes32(metadataHash),
        ]);
        onChain = true;
        txHash = write.hash;
      } catch (err) {
        console.warn("[credit/score] set_score failed", (err as Error).message);
      }
    }
    return {
      address,
      ...result,
      onChain,
      contract: onChain ? contract : undefined,
      txHash,
      explorerUrl: txHash ? `https://stellar.expert/explorer/testnet/tx/${txHash}` : undefined,
      workflow: "wf2-ai-credit-scoring",
      track: "CRE & AI",
    };
  });
}
