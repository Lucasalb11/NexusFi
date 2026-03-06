"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import PremiumTopNav from "@/components/PremiumTopNav";
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
      <PremiumTopNav />
      <main className="max-w-lg mx-auto px-4 pt-20 safe-top">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
