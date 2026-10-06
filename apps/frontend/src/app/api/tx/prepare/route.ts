import { buildUserTx } from "@/server/relay";
import { body, handle } from "@/server/http";

/** Step 1 of a send/burn: an unsigned transaction for the wallet to authorize. */
export function POST(req: Request) {
  return handle(async () => ({ xdr: await buildUserTx(await body(req)) }));
}
