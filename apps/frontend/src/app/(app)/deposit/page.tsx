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

export const dynamic = "force-dynamic";

type Mode = "deposit" | "withdraw";
type Step = "method" | "amount" | "moonpay" | "processing" | "done";
type PaymentMethod = "pix" | "swift" | "card" | "sepa";

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: typeof QrCode;
  fiat: string;
  fiatSymbol: string;
  region: string;
  flag: string;
  processingTime: string;
  badge?: string;
}[] = [
  {
    id: "pix",
    label: "PIX",
    description: "Instant bank transfer",
    icon: QrCode,
    fiat: "BRL",
    fiatSymbol: "R$",
    region: "Brazil",
    flag: "🇧🇷",
    processingTime: "~1 min",
    badge: "Instant",
  },
  {
    id: "card",
    label: "Card",
    description: "Visa / Mastercard",
    icon: CreditCard,
    fiat: "USD",
    fiatSymbol: "$",
    region: "Global",
    flag: "🌐",
    processingTime: "~5 min",
  },
  {
    id: "sepa",
    label: "SEPA",
    description: "EU bank transfer",
    icon: Globe,
    fiat: "EUR",
    fiatSymbol: "€",
    region: "Europe",
    flag: "🇪🇺",
    processingTime: "1–2 days",
  },
  {
    id: "swift",
    label: "SWIFT / Wire",
    description: "International wire transfer",
    icon: Building2,
    fiat: "USD",
    fiatSymbol: "$",
    region: "Global",
    flag: "🏦",
    processingTime: "1–3 days",
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
  const [txError, setTxError] = useState<string | null>(null);

  const currentMethod = PAYMENT_METHODS.find((m) => m.id === selectedMethod);
  const fiat = currentMethod?.fiat ?? "USD";
  const presets = PRESET_AMOUNTS[fiat] ?? PRESET_AMOUNTS.USD;

  const fiatSymbol: Record<string, string> = {
    BRL: "R$",
    USD: "$",
    EUR: "€",
  };
  const isSandbox = process.env.NEXT_PUBLIC_MOONPAY_ENV !== "production";

  const reset = useCallback(() => {
    setStep("method");
    setSelectedMethod(null);
    setAmount("");
    setWidgetUrl(null);
    setTxHash(null);
    setLoading(false);
    setTxError(null);
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
    } catch (err: any) {
      setTxError(err?.message ?? "Failed to get payment URL");
      setLoading(false);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleMoonPayComplete = () => {
    setStep("processing");
    setTimeout(() => setStep("done"), 2000);
  };

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
        <h1 className="text-lg font-serif font-semibold">
          {mode === "deposit" ? "Deposit" : "Withdraw"}
        </h1>
        {step !== "method" && step !== "moonpay" && (
          <button
            onClick={reset}
            className="text-[11px] text-text-muted hover:text-text-secondary tracking-wide"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-bg-card border border-border/20">
        {(["deposit", "withdraw"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); reset(); }}
            className={clsx(
              "flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 uppercase tracking-wider",
              mode === m
                ? "bg-accent text-bg-primary"
                : "text-text-muted hover:text-text-secondary",
            )}
          >
            {m === "deposit" ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
            {m === "deposit" ? "Deposit" : "Withdraw"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === "method" && (
          <motion.div
            key="method"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {isSandbox && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20 text-[11px] text-warning tracking-wide">
                <Zap size={11} />
                Sandbox mode — no real money is moved
              </div>
            )}

            <p className="text-xs text-text-secondary tracking-wide">
              {mode === "deposit"
                ? "Select a payment method to add funds"
                : "Select how to receive your fiat"}
            </p>

            {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl glass hover:bg-bg-elevated/40 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg border border-border/30 bg-bg-elevated flex items-center justify-center shrink-0 text-xl">
                    {method.flag}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{method.label}</p>
                      {method.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-success/15 text-success tracking-wider">
                          {method.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted tracking-wide">
                      {method.description} · {method.region}
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      <span className="font-medium text-text-secondary">{method.fiatSymbol} {method.fiat}</span>
                      {" · "}{method.processingTime}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-text-muted group-hover:text-accent transition-colors" />
                </button>
            ))}

            <div className="flex items-center justify-center gap-2 pt-2">
              <img src="/moonpay-logo.svg" alt="MoonPay" className="h-4 opacity-40" onError={(e) => (e.currentTarget.style.display = "none")} />
              <p className="text-center text-[10px] text-text-muted tracking-wider">
                Powered by MoonPay · USDC on Stellar
              </p>
            </div>
          </motion.div>
        )}

        {step === "amount" && currentMethod && (
          <motion.form
            key="amount"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleAmountSubmit}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-card/50 border border-border/20">
              <div className="w-7 h-7 rounded-md border border-border/30 bg-bg-elevated flex items-center justify-center">
                {(() => { const I = currentMethod.icon; return <I size={14} className="text-accent" />; })()}
              </div>
              <div>
                <p className="text-sm font-medium">{currentMethod.label}</p>
                <p className="text-[10px] text-text-muted">{currentMethod.processingTime}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep("method")}
                className="ml-auto text-[11px] text-accent tracking-wide"
              >
                Change
              </button>
            </div>

            <div className="glass rounded-xl p-6">
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-3">
                Amount ({fiat})
              </label>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-semibold text-text-muted">
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
                  className="w-full text-3xl font-semibold outline-none tabular-nums placeholder:text-text-muted/20"
                />
              </div>
              <div className="flex gap-2 mt-4">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className={clsx(
                      "flex-1 py-2 rounded-lg text-xs font-medium transition-all tracking-wide",
                      amount === String(preset)
                        ? "bg-accent text-bg-primary"
                        : "bg-bg-primary text-text-secondary border border-border/20 hover:border-accent/30",
                    )}
                  >
                    {fiatSymbol[fiat]}{preset}
                  </button>
                ))}
              </div>
            </div>

            {txError && (
              <p className="text-sm text-red-400 text-center p-3 rounded-lg bg-red-400/10">
                {txError}
              </p>
            )}
            <div className="glass rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Zap size={13} className="text-accent" />
                <span className="text-text-secondary text-xs">
                  {mode === "deposit" ? "You will receive" : "You will sell"}
                </span>
                <span className="ml-auto text-xs font-semibold">USDC on Stellar</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield size={13} className="text-success" />
                <span className="text-text-secondary text-xs">Reserve verified by</span>
                <span className="ml-auto text-accent text-xs font-medium">Chainlink CRE</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 size={13} className="text-text-muted" />
                <span className="text-text-secondary text-xs">Provider</span>
                <span className="ml-auto text-xs font-medium">MoonPay</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!amount || Number(amount) <= 0 || loading}
              className="w-full py-4 rounded-xl bg-accent text-bg-primary font-semibold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-sm tracking-wide"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <ExternalLink size={16} />
                  Continue to MoonPay
                </>
              )}
            </button>
          </motion.form>
        )}

        {step === "moonpay" && widgetUrl && (
          <motion.div
            key="moonpay"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-secondary tracking-wide">Complete payment via MoonPay</p>
              <button
                onClick={reset}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={14} className="text-text-muted" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-border/20 bg-bg-card">
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
              className="w-full py-3 rounded-lg glass text-xs font-medium hover:bg-bg-elevated/60 transition-colors flex items-center justify-center gap-2 tracking-wide"
            >
              <CheckCircle2 size={14} className="text-success" />
              I completed the payment
            </button>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col items-center justify-center py-16 space-y-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <Loader2 size={40} className="text-accent" />
            </motion.div>
            <p className="text-base font-serif font-semibold">Processing</p>
            <p className="text-xs text-text-muted text-center max-w-xs leading-relaxed tracking-wide">
              {mode === "deposit"
                ? "Verifying reserves via Chainlink CRE and minting stablecoins."
                : "Burning stablecoins and processing fiat release."}
            </p>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 size={56} className="text-success" />
            </motion.div>
            <p className="text-base font-serif font-semibold">
              {mode === "deposit" ? "Deposit Confirmed" : "Withdrawal Confirmed"}
            </p>
            <p className="text-xs text-text-muted text-center max-w-xs leading-relaxed tracking-wide">
              {mode === "deposit"
                ? `Your ${currentMethod?.label ?? ""} payment has been processed. Stablecoins minted to your wallet.`
                : `Stablecoins burned. Fiat will be sent to your ${currentMethod?.label ?? ""} account.`}
            </p>
            {txHash && (
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] text-text-muted">
                  Reference ID
                </p>
                <p className="text-[10px] text-text-muted font-mono break-all px-4 text-center max-w-xs">
                  {txHash}
                </p>
              </div>
            )}
            <button
              onClick={reset}
              className="mt-4 px-6 py-3 rounded-lg glass text-xs font-medium hover:bg-bg-elevated/60 transition-colors tracking-wide"
            >
              {mode === "deposit" ? "Make Another Deposit" : "Withdraw More"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
