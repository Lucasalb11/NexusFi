"use client";

import type { ReactNode } from "react";
import { WalletProvider } from "@/context/WalletContext";

// Keep provider mounted during prerender; passkey-kit itself is loaded lazily
// inside WalletContext actions, so this is safe for SSR/SSG.

export function Providers({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
