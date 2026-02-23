"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Loader2, ChevronRight, Shield, Zap, Brain } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [connecting, setConnecting] = useState(false);
  const router = useRouter();

  const handleConnect = async () => {
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 1500));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-6 safe-top safe-bottom">
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="w-20 h-20 rounded-3xl gradient-accent flex items-center justify-center mb-6 animate-pulse-glow"
        >
          <span className="text-white text-3xl font-bold">N</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold mb-2"
        >
          Nexus<span className="text-gradient">Fi</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-text-secondary text-center text-sm max-w-xs mb-8"
        >
          Decentralized banking powered by Stellar and Chainlink CRE
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 w-full max-w-xs mb-8"
        >
          {[
            { icon: Shield, text: "Fully decentralized & verifiable" },
            { icon: Brain, text: "AI-powered credit scoring" },
            { icon: Zap, text: "Instant transactions on Stellar" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 text-sm text-text-secondary"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-accent" />
              </div>
              {text}
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="pb-8 space-y-3 w-full max-w-sm mx-auto"
      >
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="w-full py-4 rounded-2xl gradient-accent text-white font-semibold flex items-center justify-center gap-3 disabled:opacity-70 transition-opacity shadow-lg shadow-accent/20"
        >
          {connecting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet size={20} />
              Connect Wallet
              <ChevronRight size={16} />
            </>
          )}
        </button>

        <p className="text-center text-xs text-text-muted">
          Demo mode — no real wallet required
        </p>
      </motion.div>
    </div>
  );
}
