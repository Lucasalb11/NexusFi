"use client";

import { useCallback } from "react";
import { api } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";

export type RelayParams =
  | { action: "transfer"; token: "nUSD" | "nBRL"; to: string; amount: number }
  | { action: "burn"; token: "nUSD" | "nBRL"; amount: number }
  | { action: "use_credit" | "repay"; amount: number };

export type RelayResult = { txHash: string; explorerUrl: string };

/**
 * Money moves only with the owner's passkey: the server builds the call, the wallet signs its
 * authorization here (biometric prompt), and the server relays it, paying the network fee.
 */
export function useRelay() {
  const { address, signWithPasskey } = useWallet();

  /** Builds and signs; returns the signed XDR without submitting (the bridge submits it itself). */
  const sign = useCallback(
    async (params: RelayParams): Promise<string> => {
      if (!address) throw new Error("Connect your wallet first");
      const { xdr } = await api.post<{ xdr: string }>("/api/tx/prepare", { ...params, from: address });
      return signWithPasskey(xdr);
    },
    [address, signWithPasskey],
  );

  const run = useCallback(
    async (params: RelayParams): Promise<RelayResult> => {
      const signed = await sign(params);
      return api.post<RelayResult>("/api/tx/submit", { xdr: signed });
    },
    [sign],
  );

  return { sign, run };
}
