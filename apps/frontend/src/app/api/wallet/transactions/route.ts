import { getTransactions } from "@/server/stellar";
import { addressParam, handle } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(async () => {
    const address = addressParam(req);
    const limit = Math.min(Number(new URL(req.url).searchParams.get("limit")) || 20, 100);
    return { address, transactions: await getTransactions(address, limit) };
  });
}
