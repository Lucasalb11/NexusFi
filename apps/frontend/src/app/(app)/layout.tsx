"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { useWallet } from "@/context/WalletContext";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.replace("/login");
    }
  }, [isConnected, router]);

  if (!isConnected) return null;

  return (
    <div className="min-h-screen pb-24">
      <main className="max-w-lg mx-auto px-4 safe-top">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
