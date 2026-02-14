import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexusFi",
  description: "NexusFi - Decentralized Finance on Stellar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
