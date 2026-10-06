import { cappedMint, topUpXlm } from "@/server/faucet";
import { RelayError, isStellarAddress } from "@/server/relay";
import { body, handle } from "@/server/http";

export const maxDuration = 60;

/** Starting balance for a new wallet: tops up to 10,000 nUSD/nBRL and a few XLM, never more. */
export function POST(req: Request) {
  return handle(async () => {
    const { contractId } = await body(req);
    if (!isStellarAddress(contractId)) throw new RelayError("Missing contractId");
    const airdrop: Record<string, unknown> = {};
    for (const symbol of ["nUSD", "nBRL"] as const) {
      try {
        airdrop[symbol] = await cappedMint(symbol, contractId, 10_000);
      } catch (err) {
        console.warn("[airdrop]", symbol, (err as Error).message);
        airdrop[symbol] = { error: "mint failed" };
      }
    }
    const xlm = await topUpXlm(contractId);
    return { success: true, contractId, airdrop, xlmFunded: !!xlm };
  });
}
