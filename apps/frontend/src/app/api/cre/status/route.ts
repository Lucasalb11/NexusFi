import { getWorkflowStatus } from "@/server/cre-bridge";
import { handle } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(async () => getWorkflowStatus());
}
