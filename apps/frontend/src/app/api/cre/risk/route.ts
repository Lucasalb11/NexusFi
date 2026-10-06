import { simulateRiskMonitor } from "@/server/cre-bridge";
import { handle } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(async () => ({ workflow: "wf3-risk-monitor", track: "Risk & Compliance", ...(await simulateRiskMonitor()) }));
}
