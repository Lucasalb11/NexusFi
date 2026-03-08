"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Fingerprint,
  Loader2,
  ChevronRight,
  Shield,
  Zap,
  Brain,
  AlertCircle,
  UserPlus,
  LogIn,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { shortenAddress } from "@/lib/format";

export const dynamic = "force-dynamic";

type Mode = "choice" | "create" | "signin";

export default function LoginPage() {
  const { createAccount, signIn, disconnect, isLoading, error, address, isConnected } = useWallet();
  const [mode, setMode] = useState<Mode>("choice");
  const [username, setUsername] = useState("");
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!username.trim()) return;
    const addr = await createAccount(username.trim());
    if (addr) {
      setNavigating(true);
      router.push("/dashboard");
    }
  };

  const handleSignIn = async () => {
    const addr = await signIn();
    if (addr) {
      setNavigating(true);
      router.push("/dashboard");
    }
  };

  const handleContinue = () => {
    setNavigating(true);
    router.push("/dashboard");
  };

  const busy = isLoading || navigating;

  return (
    <div className="min-h-screen flex flex-col justify-between px-6 safe-top safe-bottom">
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="w-16 h-16 rounded-2xl border border-accent/30 bg-bg-card flex items-center justify-center mb-8"
        >
          <span className="text-accent text-2xl font-serif font-bold">N</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-serif font-semibold mb-2 tracking-tight"
        >
          Nexus<span className="text-gradient">Fi</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-text-secondary text-center text-sm max-w-xs mb-10 leading-relaxed"
        >
          Institutional-grade decentralized banking on Stellar, secured by Chainlink
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 w-full max-w-xs mb-8"
        >
          {[
            { icon: Fingerprint, text: "Passkey authentication — no seed phrase" },
            { icon: Shield, text: "On-chain smart wallet on Stellar" },
            { icon: Brain, text: "AI credit scoring via Chainlink CRE" },
            { icon: Zap, text: "Cross-chain bridge to Solana & Ethereum" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 text-sm text-text-secondary"
            >
              <div className="w-8 h-8 rounded-lg border border-border/40 bg-bg-card flex items-center justify-center shrink-0">
                <Icon size={14} className="text-accent" />
              </div>
              <span className="tracking-wide text-xs">{text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="pb-8 space-y-3 w-full max-w-sm mx-auto"
      >
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20">
            <AlertCircle size={14} className="text-danger shrink-0 mt-0.5" />
            <p className="text-xs text-danger leading-relaxed">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isConnected && address ? (
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <Fingerprint size={16} className="text-success" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-success font-medium">Smart Wallet Connected</p>
                  <p className="text-[10px] text-text-muted font-mono truncate">
                    {shortenAddress(address, 8)}
                  </p>
                </div>
              </div>

              <button
                onClick={handleContinue}
                disabled={busy}
                className="w-full py-4 rounded-xl bg-accent text-bg-primary font-semibold flex items-center justify-center gap-3 disabled:opacity-70 transition-opacity text-sm tracking-wide"
              >
                {navigating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Enter NexusFi
                    <ChevronRight size={14} />
                  </>
                )}
              </button>

              <button
                onClick={disconnect}
                disabled={busy}
                className="w-full py-3 rounded-xl border border-border/30 text-text-muted font-medium flex items-center justify-center gap-2 disabled:opacity-40 hover:border-danger/30 hover:text-danger transition-colors text-xs tracking-wide"
              >
                <LogOut size={14} />
                Disconnect Account
              </button>
            </motion.div>
          ) : mode === "choice" ? (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <button
                onClick={() => setMode("create")}
                disabled={busy}
                className="w-full py-4 rounded-xl bg-accent text-bg-primary font-semibold flex items-center justify-center gap-3 disabled:opacity-70 transition-opacity text-sm tracking-wide"
              >
                <UserPlus size={18} />
                Create Account
              </button>

              <button
                onClick={handleSignIn}
                disabled={busy}
                className="w-full py-4 rounded-xl border border-accent/30 text-accent font-semibold flex items-center justify-center gap-3 disabled:opacity-70 transition-opacity text-sm tracking-wide"
              >
                {busy ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign In with Passkey
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <div className="glass rounded-xl p-4">
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  autoFocus
                  className="w-full p-3 rounded-lg bg-bg-primary border border-border/40 text-sm focus:border-accent/50 outline-none transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={busy || !username.trim()}
                className="w-full py-4 rounded-xl bg-accent text-bg-primary font-semibold flex items-center justify-center gap-3 disabled:opacity-30 transition-opacity text-sm tracking-wide"
              >
                {busy ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating Smart Wallet...
                  </>
                ) : (
                  <>
                    <Fingerprint size={18} />
                    Create with Passkey
                  </>
                )}
              </button>

              <button
                onClick={() => setMode("choice")}
                disabled={busy}
                className="w-full py-2 text-xs text-text-muted tracking-wide"
              >
                Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[10px] text-text-muted tracking-wide pt-1">
          Passkey smart wallet on Stellar Testnet — biometric authentication
        </p>
      </motion.div>
    </div>
  );
}
