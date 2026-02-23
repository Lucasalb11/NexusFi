"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";

export default function Home() {
  const { isConnected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [isConnected, router]);

  return null;
}
