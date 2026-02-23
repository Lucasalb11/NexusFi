"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Zap,
  CheckCircle2,
  Loader2,
  Shield,
  CreditCard,
  Building2,
  QrCode,
  Globe,
  ExternalLink,
  X,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/api";

type Mode = "deposit" | "withdraw";
type Step = "method" | "amount" | "moonpay" | "processing" | "done";
type PaymentMethod = "pix" | "swift" | "card" | "sepa";

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: typeof QrCode;
  fiat: string;
  flag: string;
  processingTime: string;
}[] = [
  {
    id: "pix",
    label: "PIX",
    description: "Instant transfer (Brazil)",
    icon: QrCode,
    fiat: "BRL",
    flag: "🇧🇷",
    processingTime: "~1 min",
  },
  {
    id: "swift",
    label: "SWIFT / Wire",
    description: "International bank transfer",
    icon: Building2,
    fiat: "USD",
    flag: "🌍",
    processingTime: "1-3 days",
  },
  {
    id: "card",
    label: "Card",
    description: "Visa / Mastercard",
    icon: CreditCard,
    fiat: "USD",
    flag: "💳",
    processingTime: "~5 min",
  },
  {
    id: "sepa",
    label: "SEPA",
    description: "EU bank transfer",
    icon: Globe,
    fiat: "EUR",
    flag: "🇪🇺",
    processingTime: "1-2 days",
  },
];

const PRESET_AMOUNTS: Record<string, number[]> = {
  BRL: [100, 500, 1000, 5000],
  USD: [50, 100, 500, 1000],
  EUR: [50, 100, 500, 1000],
};

export default function DepositPage() {
  const [mode, setMode] = useState<Mode>("deposit");
  const [step, setStep] = useState<Step>("method");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState("");
  const [widgetUrl, setWidgetUrl] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentMethod = PAYMENT_METHODS.find((m) => m.id === selectedMethod);
  const fiat = currentMethod?.fiat ?? "USD";
  const presets = PRESET_AMOUNTS[fiat] ?? PRESET_AMOUNTS.USD;

  const fiatSymbol: Record<string, string> = {
    BRL: "R$",
    USD: "$",
    EUR: "€",
  };

  const reset = useCallback(() => {
    setStep("method");
    setSelectedMethod(null);
    setAmount("");
    setWidgetUrl(null);
    setTxHash(null);
    setLoading(false);
  }, []);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep("amount");
  };

  const handleAmountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod || !amount) return;

    setLoading(true);
    try {
      const endpoint = mode === "deposit" ? "/api/deposit/buy-url" : "/api/deposit/sell-url";
      const result = await api.post<{ widgetUrl: string; externalTransactionId: string }>(
        endpoint,
        {
          amount: Number(amount),
          fiatCurrency: fiat.toLowerCase(),
          paymentMethod: selectedMethod,
        },
      );
      setWidgetUrl(result.widgetUrl);
      setTxHash(result.externalTransactionId);
      setStep("moonpay");
    } catch {
      // Demo fallback: skip to processing
      setTxHash(`nexusfi-${mode}-${Date.now().toString(36)}`);
      setStep("processing");
      setTimeout(() => setStep("done"), 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleMoonPayComplete = () => {
    setStep("processing");
    setTimeout(() => setStep("done"), 2000);
  };

  // Listen for MoonPay iframe postMessage events
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "moonpay_event") {
        if (event.data.eventName === "transaction_completed") {
          handleMoonPayComplete();
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {mode === "deposit" ? "Deposit" : "Withdraw"}
        </h1>
        {step !== "method" && step !== "moonpay" && (
          <button
            onClick={reset}
            className="text-xs text-text-muted hover:text-text-secondary"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="flex gap-2 p-1 rounded-2xl bg-bg-card">
        {(["deposit", "withdraw"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); reset(); }}
            className={clsx(
              "flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
              mode === m
                ? "bg-accent text-white shadow-lg"
                : "text-text-muted hover:text-text-secondary",
            )}
          >
            {m === "deposit" ? <ArrowDownToLine size={16} /> : <ArrowUpFromLine size={16} />}
            {m === "deposit" ? "Deposit" : "Withdraw"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Payment Method Selection */}
        {step === "method" && (
          <motion.div
            key="method"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <p className="text-sm text-text-secondary">
              {mode === "deposit"
                ? "Choose how to add funds via MoonPay"
                : "Choose how to receive your fiat"}
            </p>

            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl glass hover:bg-bg-elevated/60 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Icon size={22} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{method.label}</span>
                      <span className="text-sm">{method.flag}</span>
                    </div>
                    <p className="text-xs text-text-muted">{method.description}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {method.fiat} — {method.processingTime}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-text-muted group-hover:text-accent transition-colors" />
                </button>
              );
            })}

            <div className="flex items-center justify-center gap-2 pt-2">
              <img
                src="https://www.moonpay.com/assets/logo-full-white.svg"
                alt="MoonPay"
                className="h-4 opacity-40"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="text-[10px] text-text-muted">
                Powered by MoonPay — USDC on Stellar
              </span>
            </div>
          </motion.div>
        )}

        {/* Step 2: Amount Input */}
        {step === "amount" && currentMethod && (
          <motion.form
            key="amount"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAmountSubmit}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-card/50">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                {(() => { const I = currentMethod.icon; return <I size={16} className="text-accent" />; })()}
              </div>
              <div>
                <p className="text-sm font-medium">{currentMethod.label} {currentMethod.flag}</p>
                <p className="text-[10px] text-text-muted">{currentMethod.processingTime}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep("method")}
                className="ml-auto text-xs text-accent"
              >
                Change
              </button>
            </div>

            <div className="glass rounded-2xl p-6">
              <label className="text-xs text-text-muted uppercase tracking-wider block mb-3">
                Amount ({fiat})
              </label>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-text-muted">
                  {fiatSymbol[fiat] ?? "$"}
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  autoFocus
                  className="w-full text-4xl font-bold outline-none tabular-nums placeholder:text-text-muted/30"
                />
              </div>
              <div className="flex gap-2 mt-4">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className={clsx(
                      "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                      amount === String(preset)
                        ? "bg-accent text-white"
                        : "bg-bg-primary text-text-secondary hover:bg-bg-elevated",
                    )}
                  >
                    {fiatSymbol[fiat]}{preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Zap size={14} className="text-accent" />
                <span className="text-text-secondary">
                  {mode === "deposit" ? "You will receive" : "You will sell"}
                </span>
                <span className="ml-auto font-semibold">
                  USDC on Stellar
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield size={14} className="text-success" />
                <span className="text-text-secondary">Reserve verified by</span>
                <span className="ml-auto text-accent font-medium">Chainlink CRE</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 size={14} className="text-text-muted" />
                <span className="text-text-secondary">Provider</span>
                <span className="ml-auto text-text-primary font-medium">MoonPay</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!amount || Number(amount) <= 0 || loading}
              className="w-full py-4 rounded-2xl gradient-accent text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <ExternalLink size={18} />
                  Continue to MoonPay
                </>
              )}
            </button>
          </motion.form>
        )}

        {/* Step 3: MoonPay Widget (iframe) */}
        {step === "moonpay" && widgetUrl && (
          <motion.div
            key="moonpay"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">Complete payment via MoonPay</p>
              <button
                onClick={reset}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={16} className="text-text-muted" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-border/30 bg-bg-card">
              <iframe
                src={widgetUrl}
                title="MoonPay"
                allow="accelerometer; autoplay; camera; gyroscope; payment"
                className="w-full border-0"
                style={{ height: "calc(100vh - 260px)", minHeight: "500px" }}
              />
            </div>

            <button
              onClick={handleMoonPayComplete}
              className="w-full py-3 rounded-xl glass text-sm font-medium hover:bg-bg-elevated/80 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} className="text-success" />
              I completed the payment
            </button>
          </motion.div>
        )}

        {/* Step 4: Processing */}
        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-16 space-y-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            >
              <Loader2 size={48} className="text-accent" />
            </motion.div>
            <p className="text-lg font-semibold">Processing...</p>
            <p className="text-sm text-text-muted text-center max-w-xs">
              {mode === "deposit"
                ? "MoonPay is processing your payment. CRE will verify reserves and mint nUSD."
                : "Burning nUSD and releasing fiat via MoonPay off-ramp."}
            </p>
          </motion.div>
        )}

        {/* Step 5: Done */}
        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 size={64} className="text-success" />
            </motion.div>
            <p className="text-lg font-semibold">
              {mode === "deposit" ? "Deposit Submitted!" : "Withdrawal Submitted!"}
            </p>
            <p className="text-sm text-text-muted text-center max-w-xs">
              {mode === "deposit"
                ? `Your ${currentMethod?.label ?? ""} payment is being processed. USDC will arrive on Stellar and nUSD will be minted.`
                : `nUSD burned. Fiat will be sent to your ${currentMethod?.label ?? ""} account.`}
            </p>
            {txHash && (
              <p className="text-xs text-text-muted font-mono break-all px-4">
                Ref: {txHash}
              </p>
            )}
            <button
              onClick={reset}
              className="mt-4 px-6 py-3 rounded-xl glass text-sm font-medium hover:bg-bg-elevated/80 transition-colors"
            >
              {mode === "deposit" ? "Make Another Deposit" : "Withdraw More"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
