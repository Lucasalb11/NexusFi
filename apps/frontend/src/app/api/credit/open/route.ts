import { simulateAICreditScoring } from "@/server/cre-bridge";
import { invokeContractReadNative, invokeContractWrite, scVal } from "@/server/soroban";
import { RelayError, isStellarAddress } from "@/server/relay";
import { body, handle } from "@/server/http";

export const maxDuration = 60;

/**
 * Opens a credit line sized by the address's recorded score. Opening a line moves no funds;
 * spending it (use_credit) still needs the owner's passkey signature through the relay.
 */
export function POST(req: Request) {
  return handle(async () => {
    const { address } = await body(req);
    if (!isStellarAddress(address)) throw new RelayError("Invalid address");
    const line = process.env.CREDIT_LINE_CONTRACT_ID;
    const scoreContract = process.env.CREDIT_SCORE_CONTRACT_ID;
    if (!line || !scoreContract) throw new RelayError("Contracts not configured", 503);

    let score: number;
    try {
      const raw = await invokeContractReadNative(scoreContract, "get_score", [scVal.address(address)]);
      score = Number(raw?.score ?? 500);
    } catch {
      score = (await simulateAICreditScoring(address)).score;
    }
    const { hash } = await invokeContractWrite(line, "open_credit_line", [
      scVal.address(address),
      scVal.u32(score),
      scVal.u64(BigInt(Math.floor(Date.now() / 1000))),
    ]);
    return { success: true, txHash: hash, address, score, explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}` };
  });
}
