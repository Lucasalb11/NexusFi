import { simulateAICreditScoring } from "@/server/cre-bridge";
import { addressParam, handle } from "@/server/http";

export const dynamic = "force-dynamic";

/** Read-only score preview (nothing is written on-chain). */
export function GET(req: Request) {
  return handle(async () => ({
    workflow: "wf2-ai-credit-scoring",
    track: "CRE & AI",
    ...(await simulateAICreditScoring(addressParam(req))),
  }));
}
