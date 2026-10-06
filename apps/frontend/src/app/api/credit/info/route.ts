import { invokeContractReadNative, scVal } from "@/server/soroban";
import { addressParam, handle } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(async () => {
    const address = addressParam(req);
    const contract = process.env.CREDIT_LINE_CONTRACT_ID;
    if (contract) {
      try {
        const raw = await invokeContractReadNative(contract, "get_credit_info", [scVal.address(address)]);
        if (raw) {
          const limit = Number(raw.limit ?? 0);
          const used = Number(raw.used ?? 0);
          return {
            address,
            hasCredit: true,
            limit: limit / 1e7,
            used: used / 1e7,
            available: (limit - used) / 1e7,
            interestRateBps: Number(raw.interest_rate_bps ?? 0),
            scoreAtOpening: Number(raw.score_at_opening ?? 0),
            token: "nUSD",
            source: "on-chain",
            contract,
          };
        }
      } catch {
        // no credit line yet
      }
    }
    return { address, hasCredit: false, limit: 0, used: 0, available: 0, interestRateBps: 0, scoreAtOpening: 0, token: "nUSD", source: "none" };
  });
}
