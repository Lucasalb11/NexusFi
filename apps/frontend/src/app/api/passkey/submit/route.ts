import * as StellarSdk from "@stellar/stellar-sdk";
import { RelayError } from "@/server/relay";
import { body, handle } from "@/server/http";
import { NETWORK_PASSPHRASE, sorobanRpc } from "@/server/stellar";

export const maxDuration = 60;

/**
 * Forwards an already-signed transaction (the passkey wallet deployment built by passkey-kit).
 * The server adds no signature, so this can't spend anything of ours.
 */
export function POST(req: Request) {
  return handle(async () => {
    const { xdr } = await body(req);
    if (typeof xdr !== "string" || xdr.length > 20_000) throw new RelayError("Missing xdr");
    const tx = StellarSdk.TransactionBuilder.fromXDR(xdr, NETWORK_PASSPHRASE);
    const sent = await sorobanRpc.sendTransaction(tx);
    if (sent.status === "ERROR") throw new RelayError("Transaction rejected");
    for (let i = 0; i < 30; i++) {
      const check = await sorobanRpc.getTransaction(sent.hash);
      if (check.status === "SUCCESS") return { success: true, hash: sent.hash, status: "SUCCESS" };
      if (check.status === "FAILED") throw new RelayError("Transaction failed on-chain");
      await new Promise((r) => setTimeout(r, 1000));
    }
    return { success: true, hash: sent.hash, status: "PENDING" };
  });
}
