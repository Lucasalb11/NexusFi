"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// WalletProvider relies on passkey-kit / Stellar SDK which access browser-only
// APIs (WebAuthn, WebCrypto, etc.) at module evaluation time.  Importing it with
// ssr: false prevents ANY of that code from running during Next.js SSG prerender,
// eliminating the "Cannot read properties of null (reading 'useContext')" crash.
const WalletProvider = dynamic(
  () => import("../context/WalletContext").then((m) => m.WalletProvider),
  { ssr: false }
);

export function Providers({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
