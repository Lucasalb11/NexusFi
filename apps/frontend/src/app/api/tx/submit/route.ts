import { submitUserTx } from "@/server/relay";
import { body, handle } from "@/server/http";

export const maxDuration = 60;

/** Step 2: relay the wallet-signed transaction (fee paid by the relay). */
export function POST(req: Request) {
  return handle(async () => {
    const r = await submitUserTx((await body(req)).xdr);
    return {
      success: true,
      txHash: r.hash,
      action: r.action,
      token: r.token,
      from: r.from,
      to: r.to,
      amount: Number(r.rawAmount) / 1e7,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${r.hash}`,
    };
  });
}
