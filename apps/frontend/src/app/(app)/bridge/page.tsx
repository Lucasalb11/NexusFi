"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight,
  ChevronDown,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Zap,
  Shield,
  Clock,
  Info,
  X,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";
import { api, ApiError } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Chain = {
  id: string;
  name: string;
  short: string;
  color: string;
  icon: string;
};

type Asset = {
  id: string;
  symbol: string;
  name: string;
};

type Step = "form" | "processing" | "done";

// ─── Static data ──────────────────────────────────────────────────────────────

// Chains supported by the backend bridge service
const CHAINS: Chain[] = [
  { id: "stellar",   name: "Stellar Testnet",   short: "XLM",  color: "#7B61FF", icon: "✦" },
  { id: "ethereum",  name: "Ethereum Sepolia",  short: "ETH",  color: "#627EEA", icon: "Ξ" },
  { id: "solana",    name: "Solana Devnet",     short: "SOL",  color: "#9945FF", icon: "◎" },
  { id: "avalanche", name: "Avalanche Fuji",    short: "AVAX", color: "#E84142", icon: "▲" },
];

const ASSETS: Asset[] = [
  { id: "nusd", symbol: "nUSD", name: "NexusFi USD" },
  { id: "nbrl", symbol: "nBRL", name: "NexusFi BRL" },
  { id: "usdc", symbol: "USDC", name: "USD Coin" },
  { id: "usdt", symbol: "USDT", name: "Tether" },
];

const BRIDGE_FEE_RATE = 0.003; // 0.3 %

const BRIDGE_TIMES: Record<string, string> = {
  "stellar-ethereum":   "30s–2 min",
  "stellar-solana":     "30s–2 min",
  "stellar-avalanche":  "30s–2 min",
  "ethereum-stellar":   "1–3 min",
  "solana-stellar":     "1–3 min",
  "avalanche-stellar":  "1–3 min",
};

function getBridgeTime(from: string, to: string) {
  return (
    BRIDGE_TIMES[`${from}-${to}`] ??
    BRIDGE_TIMES[`${to}-${from}`] ??
    "5–15 min"
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChainIcon({ chain, size = "md" }: { chain: Chain; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "w-7 h-7 text-sm" : size === "lg" ? "w-12 h-12 text-xl" : "w-9 h-9 text-base";
  return (
    <div
      className={`${dim} rounded-xl flex items-center justify-center font-bold shrink-0`}
      style={{
        backgroundColor: chain.color + "20",
        border: `1px solid ${chain.color}40`,
        color: chain.color,
      }}
    >
      {chain.icon}
    </div>
  );
}

function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary rounded-t-2xl border-t border-border/30 max-w-lg mx-auto"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-1 bg-border/60 rounded-full absolute left-1/2 -translate-x-1/2 top-3" />
                <p className="text-xs font-medium uppercase tracking-widest text-text-muted mt-2">
                  {title}
                </p>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors mt-2"
                >
                  <X size={14} className="text-text-muted" />
                </button>
              </div>
              <div className="space-y-2 pb-8">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default function BridgePage() {
  const [fromChain,   setFromChain]   = useState<Chain>(CHAINS[0]);
  const [toChain,     setToChain]     = useState<Chain>(CHAINS[1]);
  const [asset,       setAsset]       = useState<Asset>(ASSETS[0]);
  const [amount,      setAmount]      = useState("");
  const [step,        setStep]        = useState<Step>("form");
  const [progress,    setProgress]    = useState(0);
  const [txHash,      setTxHash]      = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);

  const [showFrom,  setShowFrom]  = useState(false);
  const [showTo,    setShowTo]    = useState(false);
  const [showAsset, setShowAsset] = useState(false);

  const num     = parseFloat(amount) || 0;
  const fee     = num * BRIDGE_FEE_RATE;
  const received = num - fee;
  const bridgeTime = getBridgeTime(fromChain.id, toChain.id);

  const PROGRESS_STEPS = [
    { label: "Transaction initiated",          threshold: 0   },
    { label: `Confirming on ${fromChain.name}`, threshold: 25  },
    { label: "Relaying via Chainlink CCIP",    threshold: 50  },
    { label: `Minting on ${toChain.name}`,     threshold: 75  },
    { label: "Transfer complete",              threshold: 100 },
  ];

  const swapChains = () => {
    setFromChain(toChain);
    setToChain(fromChain);
  };

  const handleBridge = async () => {
    setStep("processing");
    setProgress(0);
    setError(null);

    // Get the user's wallet address for destAddress (demo: reuse Stellar address)
    const destAddress = (() => {
      try {
        const raw = typeof window !== "undefined"
          ? localStorage.getItem("nexusfi_wallet")
          : null;
        return raw ? (JSON.parse(raw).address ?? "") : "";
      } catch {
        return "";
      }
    })() || "GBZXN3PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI";

    try {
      // Kick off the API call immediately — it does real on-chain work
      const apiPromise = api.post<{
        success: boolean;
        bridge: { burnTxHash?: string; mintTxHash?: string };
        stellarExplorerUrl?: string;
        explorerUrls: { burn?: string; mint?: string };
        demoNotice?: string;
      }>("/api/bridge/execute", {
        sourceChain: fromChain.id,
        destChain: toChain.id,
        token: asset.symbol,
        amount: num,
        destAddress,
      });

      // Animate progress milestones while waiting for the backend
      await new Promise<void>((r) => setTimeout(r, 700));
      setProgress(25);
      await new Promise<void>((r) => setTimeout(r, 900));
      setProgress(50);
      await new Promise<void>((r) => setTimeout(r, 800));
      setProgress(75);

      // Wait for the real result
      const result = await apiPromise;

      setProgress(100);

      const hash = result.bridge.burnTxHash ?? result.bridge.mintTxHash ?? null;
      setTxHash(hash);
      // stellarExplorerUrl is always the real on-chain Stellar tx hash
      setExplorerUrl(
        result.stellarExplorerUrl ??
        result.explorerUrls.burn ??
        result.explorerUrls.mint ??
        null,
      );
      setStep("done");
    } catch (err: any) {
      let msg = "Bridge failed. Please try again.";
      if (err instanceof ApiError) {
        try {
          const parsed = JSON.parse(err.message);
          msg = parsed.error ?? parsed.message ?? err.message;
        } catch {
          msg = err.message;
        }
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
      setStep("form");
      setProgress(0);
    }
  };

  const reset = useCallback(() => {
    setStep("form");
    setAmount("");
    setTxHash(null);
    setExplorerUrl(null);
    setError(null);
    setProgress(0);
  }, []);

  // Which step is currently "in-flight"
  const activeStepIdx = (() => {
    for (let i = PROGRESS_STEPS.length - 1; i >= 0; i--) {
      if (progress >= PROGRESS_STEPS[i].threshold) return i;
    }
    return 0;
  })();

  return (
    <div className="space-y-6 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-serif font-semibold">Bridge</h1>
          <p className="text-[10px] text-text-muted tracking-wider mt-0.5 uppercase">
            Cross-Chain Transfer
          </p>
        </div>
        {(step === "done") && (
          <button
            onClick={reset}
            className="text-[11px] text-text-muted hover:text-text-secondary tracking-wide transition-colors"
          >
            New Transfer
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ── FORM ──────────────────────────────────────────────────────────── */}
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Route selector */}
            <div className="glass rounded-2xl p-4 space-y-3">
              <p className="text-[10px] text-text-muted uppercase tracking-widest">Route</p>

              {/* From */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-text-muted tracking-wider">From</label>
                <button
                  onClick={() => setShowFrom(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-primary border border-border/30 hover:border-accent/30 transition-colors group"
                >
                  <ChainIcon chain={fromChain} size="sm" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{fromChain.name}</p>
                    <p className="text-[10px] text-text-muted">{fromChain.short}</p>
                  </div>
                  <ChevronDown size={14} className="text-text-muted group-hover:text-accent transition-colors" />
                </button>
              </div>

              {/* Swap arrow */}
              <div className="flex justify-center">
                <button
                  onClick={swapChains}
                  className="w-8 h-8 rounded-xl bg-bg-elevated border border-border/30 flex items-center justify-center hover:border-accent/40 hover:bg-accent/10 transition-all group"
                >
                  <ArrowLeftRight
                    size={13}
                    className="text-text-muted group-hover:text-accent transition-colors"
                  />
                </button>
              </div>

              {/* To */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-text-muted tracking-wider">To</label>
                <button
                  onClick={() => setShowTo(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-primary border border-border/30 hover:border-accent/30 transition-colors group"
                >
                  <ChainIcon chain={toChain} size="sm" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{toChain.name}</p>
                    <p className="text-[10px] text-text-muted">{toChain.short}</p>
                  </div>
                  <ChevronDown size={14} className="text-text-muted group-hover:text-accent transition-colors" />
                </button>
              </div>
            </div>

            {/* Asset + Amount */}
            <div className="glass rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-text-muted uppercase tracking-widest">
                  Amount
                </label>
                <button
                  onClick={() => setShowAsset(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors"
                >
                  <span className="text-accent font-semibold text-xs">{asset.symbol}</span>
                  <ChevronDown size={11} className="text-accent/70" />
                </button>
              </div>

              <div className="flex items-baseline gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="flex-1 text-4xl font-semibold outline-none tabular-nums placeholder:text-text-muted/20 bg-transparent"
                />
                <span className="text-sm text-text-muted font-medium">{asset.symbol}</span>
              </div>

              {/* Preset amounts */}
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(String(preset))}
                    className={clsx(
                      "py-2 rounded-lg text-xs font-medium transition-all tracking-wide",
                      amount === String(preset)
                        ? "bg-accent text-bg-primary"
                        : "bg-bg-primary text-text-secondary border border-border/20 hover:border-accent/30"
                    )}
                  >
                    {preset >= 1000 ? `${preset / 1000}k` : preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Live quote */}
            <AnimatePresence>
              {num > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass rounded-xl overflow-hidden"
                >
                  <div className="p-4 space-y-2.5">
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">
                      Quote
                    </p>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-text-muted">
                        <Zap size={11} className="text-accent" />
                        You receive
                      </span>
                      <span className="font-semibold tabular-nums text-text-primary">
                        {received.toFixed(4)}{" "}
                        <span className="text-accent">{asset.symbol}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-text-muted">
                        <Info size={11} />
                        Bridge fee (0.3%)
                      </span>
                      <span className="tabular-nums text-text-secondary">
                        −{fee.toFixed(4)} {asset.symbol}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-text-muted">
                        <Clock size={11} />
                        Est. time
                      </span>
                      <span className="text-text-secondary">{bridgeTime}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-text-muted">
                        <Shield size={11} className="text-success" />
                        Security
                      </span>
                      <span className="text-success font-medium">Chainlink CCIP</span>
                    </div>

                    {/* Visual route */}
                    <div className="pt-2 border-t border-border/20 flex items-center gap-2">
                      <div
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                        style={{
                          backgroundColor: fromChain.color + "20",
                          color: fromChain.color,
                        }}
                      >
                        {fromChain.icon} {fromChain.short}
                      </div>
                      <div className="flex-1 flex items-center gap-0.5 justify-center">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="flex-1 h-px bg-accent/30 rounded-full"
                          />
                        ))}
                        <span className="mx-1 text-accent text-[9px] font-semibold uppercase tracking-wider shrink-0">
                          CCIP
                        </span>
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="flex-1 h-px bg-accent/30 rounded-full"
                          />
                        ))}
                      </div>
                      <div
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                        style={{
                          backgroundColor: toChain.color + "20",
                          color: toChain.color,
                        }}
                      >
                        {toChain.icon} {toChain.short}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleBridge}
              disabled={!amount || num <= 0 || fromChain.id === toChain.id}
              className="w-full py-4 rounded-xl bg-accent text-bg-primary font-semibold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-sm tracking-wide"
            >
              <ArrowLeftRight size={16} />
              {num > 0
                ? `Bridge ${num} ${asset.symbol}`
                : `Bridge ${asset.symbol}`}
            </button>

            <p className="text-center text-[10px] text-text-muted tracking-wider">
              Powered by Chainlink CCIP — Cross-Chain Interoperability Protocol
            </p>
          </motion.div>
        )}

        {/* ── PROCESSING ────────────────────────────────────────────────────── */}
        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col items-center space-y-8 py-6"
          >
            {/* Chain route visual */}
            <div className="flex items-center gap-4 w-full max-w-xs">
              <div className="flex flex-col items-center gap-2">
                <ChainIcon chain={fromChain} size="lg" />
                <p className="text-xs text-text-muted font-medium">{fromChain.name}</p>
              </div>

              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-accent"
                      animate={{ opacity: [0.15, 1, 0.15], scale: [0.8, 1.1, 0.8] }}
                      transition={{
                        duration: 1.4,
                        delay: i * 0.18,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-accent font-bold tracking-widest uppercase">
                  CCIP
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <ChainIcon chain={toChain} size="lg" />
                <p className="text-xs text-text-muted font-medium">{toChain.name}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs space-y-4">
              <div className="w-full bg-border/30 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>

              {/* Step list */}
              <div className="space-y-3">
                {PROGRESS_STEPS.map((s, idx) => {
                  const done    = progress > s.threshold;
                  const current = idx === activeStepIdx && progress < 100;

                  return (
                    <div
                      key={s.label}
                      className={clsx(
                        "flex items-center gap-2.5 text-xs transition-all duration-300",
                        done || current ? "text-text-primary" : "text-text-muted"
                      )}
                    >
                      {done ? (
                        <CheckCircle2 size={13} className="text-success shrink-0" />
                      ) : current ? (
                        <Loader2 size={13} className="animate-spin text-accent shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-border/40 shrink-0" />
                      )}
                      <span className={current ? "text-accent font-medium" : ""}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-text-muted text-center leading-relaxed tracking-wide max-w-xs">
              Transferring{" "}
              <span className="text-text-secondary font-semibold">
                {num} {asset.symbol}
              </span>{" "}
              from {fromChain.name} → {toChain.name}
              <br />
              <span className="text-[10px]">Estimated: {bridgeTime}</span>
            </p>
          </motion.div>
        )}

        {/* ── DONE ──────────────────────────────────────────────────────────── */}
        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-5 py-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 14 }}
            >
              <CheckCircle2 size={60} className="text-success" />
            </motion.div>

            <div className="text-center space-y-1">
              <p className="text-base font-serif font-semibold">Bridge Complete</p>
              <p className="text-xs text-text-muted tracking-wide">
                {num} {asset.symbol} transferred to {toChain.name}
              </p>
            </div>

            {/* Summary card */}
            <div className="w-full glass rounded-xl divide-y divide-border/20">
              <div className="flex items-center gap-3 p-4">
                <ChainIcon chain={fromChain} size="sm" />
                <div className="flex-1">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Sent from</p>
                  <p className="text-sm font-medium">{fromChain.name}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {num} {asset.symbol}
                </span>
              </div>

              <div className="flex items-center gap-3 p-4">
                <ChainIcon chain={toChain} size="sm" />
                <div className="flex-1">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Received on</p>
                  <p className="text-sm font-medium">{toChain.name}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-success">
                  {received.toFixed(4)} {asset.symbol}
                </span>
              </div>

              <div className="flex items-center justify-between p-4">
                <span className="text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={11} className="text-success" />
                  Protocol
                </span>
                <span className="text-[11px] text-success font-medium">Chainlink CCIP</span>
              </div>
            </div>

            {txHash && (
              <a
                href={
                  explorerUrl ??
                  `https://stellar.expert/explorer/testnet/tx/${txHash}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-accent font-medium tracking-wide hover:underline"
              >
                <ExternalLink size={12} />
                View on Explorer
              </a>
            )}

            <button
              onClick={reset}
              className="w-full py-4 rounded-xl bg-accent text-bg-primary font-semibold text-sm tracking-wide transition-opacity hover:opacity-90"
            >
              Bridge More
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom sheets ─────────────────────────────────────────────────── */}
      <BottomSheet
        open={showFrom}
        onClose={() => setShowFrom(false)}
        title="From Chain"
      >
        {CHAINS.filter((c) => c.id !== toChain.id).map((chain) => (
          <button
            key={chain.id}
            onClick={() => { setFromChain(chain); setShowFrom(false); }}
            className={clsx(
              "w-full flex items-center gap-3 p-3.5 rounded-xl transition-colors text-left",
              fromChain.id === chain.id
                ? "bg-accent/10 border border-accent/20"
                : "hover:bg-bg-card/80"
            )}
          >
            <ChainIcon chain={chain} size="sm" />
            <div className="flex-1">
              <p className="text-sm font-medium">{chain.name}</p>
              <p className="text-[11px] text-text-muted">{chain.short}</p>
            </div>
            {fromChain.id === chain.id && (
              <CheckCircle2 size={14} className="text-accent" />
            )}
          </button>
        ))}
      </BottomSheet>

      <BottomSheet
        open={showTo}
        onClose={() => setShowTo(false)}
        title="To Chain"
      >
        {CHAINS.filter((c) => c.id !== fromChain.id).map((chain) => (
          <button
            key={chain.id}
            onClick={() => { setToChain(chain); setShowTo(false); }}
            className={clsx(
              "w-full flex items-center gap-3 p-3.5 rounded-xl transition-colors text-left",
              toChain.id === chain.id
                ? "bg-accent/10 border border-accent/20"
                : "hover:bg-bg-card/80"
            )}
          >
            <ChainIcon chain={chain} size="sm" />
            <div className="flex-1">
              <p className="text-sm font-medium">{chain.name}</p>
              <p className="text-[11px] text-text-muted">{chain.short}</p>
            </div>
            {toChain.id === chain.id && (
              <CheckCircle2 size={14} className="text-accent" />
            )}
          </button>
        ))}
      </BottomSheet>

      <BottomSheet
        open={showAsset}
        onClose={() => setShowAsset(false)}
        title="Select Asset"
      >
        {ASSETS.map((a) => (
          <button
            key={a.id}
            onClick={() => { setAsset(a); setShowAsset(false); }}
            className={clsx(
              "w-full flex items-center gap-3 p-3.5 rounded-xl transition-colors text-left",
              asset.id === a.id
                ? "bg-accent/10 border border-accent/20"
                : "hover:bg-bg-card/80"
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <span className="text-accent font-bold text-xs">{a.symbol.slice(0, 1)}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{a.symbol}</p>
              <p className="text-[11px] text-text-muted">{a.name}</p>
            </div>
            {asset.id === a.id && (
              <CheckCircle2 size={14} className="text-accent" />
            )}
          </button>
        ))}
      </BottomSheet>
    </div>
  );
}
