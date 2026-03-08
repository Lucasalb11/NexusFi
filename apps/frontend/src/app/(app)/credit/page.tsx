"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Shield,
  Clock,
  TrendingUp,
  ChevronRight,
  Loader2,
  BarChart3,
  CreditCard,
  RefreshCw,
  Zap,
  ExternalLink,
} from "lucide-react";
import CreditCardVisual from "@/components/CreditCardVisual";
import CreditScoreGauge from "@/components/CreditScoreGauge";
import { formatCurrency, shortenAddress } from "@/lib/format";
import { api } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";
import {
  MOCK_CREDIT_SCORE,
  MOCK_CREDIT_LIMIT,
  MOCK_CREDIT_USED,
} from "@/lib/mock-data";

export const dynamic = "force-dynamic";

type ScoreResponse = {
  score: number;
  reasoning: string;
  factors: {
    accountAge: number;
    transactionVolume: number;
    consistency: number;
    diversity: number;
    repaymentHistory: number;
  };
  timestamp: string;
  workflow: string;
  track: string;
  onChain?: boolean;
  txHash?: string;
  explorerUrl?: string;
  contract?: string;
};

type CreditInfo = {
  hasCredit: boolean;
  limit: number;
  used: number;
  available: number;
  interestRateBps: number;
  scoreAtOpening: number;
};

async function signWithFreighter(xdr: string): Promise<string> {
  const { signTransaction } = await import("@stellar/freighter-api");
  const result = await signTransaction(xdr, {
    networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015",
  });
  if (result?.error) throw new Error(result.error.message ?? "Freighter signing failed");
  if (!result?.signedTxXdr) throw new Error("Freighter not installed. Install the Freighter extension.");
  return result.signedTxXdr;
}

export default function CreditPage() {
  const { address } = useWallet();
  const [analyzing, setAnalyzing] = useState(false);
  const [score, setScore] = useState(MOCK_CREDIT_SCORE);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [factors, setFactors] = useState<ScoreResponse["factors"] | null>(null);
  const [scoreExplorerUrl, setScoreExplorerUrl] = useState<string | null>(null);
  const [scoreOnChain, setScoreOnChain] = useState(false);
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [useAmount, setUseAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [useLoading, setUseLoading] = useState(false);
  const [repayLoading, setRepayLoading] = useState(false);
  const [openLoading, setOpenLoading] = useState(false);
  const [openTxHash, setOpenTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const cardLastFour = address ? address.slice(-4) : "0000";
  const cardName = address ? shortenAddress(address, 4).toUpperCase() : "NEXUSFI USER";

  const creditLimit = creditInfo?.limit ?? MOCK_CREDIT_LIMIT;
  const creditUsed = creditInfo?.used ?? MOCK_CREDIT_USED;
  const available = creditLimit - creditUsed;

  useEffect(() => {
    (async () => {
      try {
        const info = await api.get<CreditInfo>("/api/credit/info");
        if (info.hasCredit) setCreditInfo(info);
      } catch {
        // fallback to mock
      }
    })();
  }, []);

  const handleOpenCreditLine = useCallback(async () => {
    setOpenLoading(true);
    setTxError(null);
    try {
      const result = await api.post<{ success: boolean; txHash: string; score: number; explorerUrl: string }>(
        "/api/credit/open", {},
      );
      setOpenTxHash(result.txHash);
      const info = await api.get<CreditInfo>("/api/credit/info");
      if (info.hasCredit) setCreditInfo(info);
    } catch (err: any) {
      setTxError(err?.message ?? "Failed to open credit line");
    } finally {
      setOpenLoading(false);
    }
  }, []);

  const requestAnalysis = useCallback(async () => {
    setAnalyzing(true);
    try {
      const data = await api.get<ScoreResponse>("/api/credit/score");
      setScore(data.score);
      setReasoning(data.reasoning);
      setFactors(data.factors);
      if (data.explorerUrl) setScoreExplorerUrl(data.explorerUrl);
      setScoreOnChain(!!data.onChain);
    } catch {
      setScore(Math.min(1000, score + Math.floor(Math.random() * 30)));
    } finally {
      setAnalyzing(false);
    }
  }, [score]);

  const handleUseCredit = useCallback(async () => {
    const amount = Number(useAmount);
    if (!amount || amount <= 0) return;
    setUseLoading(true);
    setTxError(null);
    try {
      const { xdr } = await api.post<{ xdr: string }>("/api/credit/use-unsigned", { amount });
      const signedXdr = await signWithFreighter(xdr);
      await api.post("/api/credit/submit-signed", { xdr: signedXdr });
      setUseAmount("");
      const info = await api.get<CreditInfo>("/api/credit/info");
      if (info.hasCredit) setCreditInfo(info);
    } catch (err: any) {
      setTxError(err?.message ?? "Failed to use credit");
    } finally {
      setUseLoading(false);
    }
  }, [useAmount]);

  const handleRepay = useCallback(async () => {
    const amount = Number(repayAmount);
    if (!amount || amount <= 0) return;
    setRepayLoading(true);
    setTxError(null);
    try {
      const { xdr } = await api.post<{ xdr: string }>("/api/credit/repay-unsigned", { amount });
      const signedXdr = await signWithFreighter(xdr);
      await api.post("/api/credit/submit-signed", { xdr: signedXdr });
      setRepayAmount("");
      const info = await api.get<CreditInfo>("/api/credit/info");
      if (info.hasCredit) setCreditInfo(info);
    } catch (err: any) {
      setTxError(err?.message ?? "Failed to repay");
    } finally {
      setRepayLoading(false);
    }
  }, [repayAmount]);

  const factorsList = factors
    ? [
        { icon: Clock, label: "Account Age", value: `${factors.accountAge}/200`, impact: factors.accountAge >= 160 ? "high" : "medium" },
        { icon: TrendingUp, label: "Transaction Volume", value: `${factors.transactionVolume}/250`, impact: factors.transactionVolume >= 200 ? "high" : "medium" },
        { icon: BarChart3, label: "Consistency", value: `${factors.consistency}/200`, impact: factors.consistency >= 160 ? "high" : "medium" },
        { icon: Shield, label: "Repayment History", value: `${factors.repaymentHistory}/200`, impact: factors.repaymentHistory >= 160 ? "high" : "medium" },
      ]
    : [
        { icon: Clock, label: "Account Age", value: "2.4 years", impact: "high" },
        { icon: TrendingUp, label: "Transaction Volume", value: "$45,200", impact: "high" },
        { icon: Shield, label: "Repayment History", value: "100%", impact: "high" },
      ];

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-serif font-semibold">Credit</h1>
        <div className="flex items-center gap-1.5 text-accent text-[11px] font-medium tracking-wider">
          <Brain size={13} />
          AI Assessment
        </div>
      </div>

      <CreditCardVisual
        name={cardName}
        lastFour={cardLastFour}
        limit={creditLimit}
        used={creditUsed}
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Limit</p>
          <p className="text-sm font-semibold mt-1">{formatCurrency(creditLimit)}</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Used</p>
          <p className="text-sm font-semibold mt-1 text-warning">{formatCurrency(creditUsed)}</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Available</p>
          <p className="text-sm font-semibold mt-1 text-success">{formatCurrency(available)}</p>
        </div>
      </div>

      {!creditInfo?.hasCredit && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 space-y-3"
        >
          <h3 className="text-xs font-medium uppercase tracking-widest text-text-secondary">
            Activate Credit Line
          </h3>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Your AI credit score determines your limit. The backend signs the Soroban transaction on your behalf using the admin key.
          </p>
          {txError && <p className="text-[11px] text-red-400">{txError}</p>}
          {openTxHash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${openTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-accent hover:underline"
            >
              <ExternalLink size={11} />
              View on Stellar Explorer
            </a>
          )}
          <button
            onClick={handleOpenCreditLine}
            disabled={openLoading}
            className="w-full py-3 rounded-lg bg-accent text-bg-primary text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 tracking-wide"
          >
            {openLoading ? (
              <><Loader2 size={14} className="animate-spin" /> Opening on Soroban...</>
            ) : (
              <><Zap size={14} /> Open Credit Line</>
            )}
          </button>
        </motion.div>
      )}

      {creditInfo?.hasCredit && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-widest text-text-secondary">
              Use Credit / Repay
            </h3>
            <span className="flex items-center gap-1 text-[10px] text-success tracking-wide">
              <Shield size={10} /> On-chain
            </span>
          </div>
          <p className="text-[11px] text-text-muted">
            Requires Freighter to sign. use_credit and repay need your wallet signature.
          </p>
          {txError && (
            <p className="text-[11px] text-red-400">{txError}</p>
          )}
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <input
                type="number"
                placeholder="Use amount"
                value={useAmount}
                onChange={(e) => setUseAmount(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-bg-primary border border-border/30 text-sm"
              />
              <button
                onClick={handleUseCredit}
                disabled={useLoading || !useAmount}
                className="px-4 py-2 rounded-lg bg-accent text-bg-primary text-xs font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {useLoading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                Use
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <input
                type="number"
                placeholder="Repay amount"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-bg-primary border border-border/30 text-sm"
              />
              <button
                onClick={handleRepay}
                disabled={repayLoading || !repayAmount}
                className="px-4 py-2 rounded-lg bg-success/20 text-success text-xs font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {repayLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Repay
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-medium uppercase tracking-widest text-text-secondary">
            AI Credit Score
          </h2>
          <span className="text-[10px] text-text-muted tracking-wide">Chainlink CRE + LLM</span>
        </div>

        <CreditScoreGauge score={score} />

        {reasoning && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] text-text-secondary mt-4 p-3 rounded-lg bg-bg-primary/50 border border-border/20 leading-relaxed"
          >
            {reasoning}
          </motion.p>
        )}

        <button
          onClick={requestAnalysis}
          disabled={analyzing}
          className="w-full mt-4 py-3 rounded-lg bg-accent text-bg-primary text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity uppercase tracking-wider"
        >
          {analyzing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Analyzing on-chain history...
            </>
          ) : (
            <>
              <Brain size={14} />
              Re-analyze Credit Score
            </>
          )}
        </button>

        {/* On-chain attestation links */}
        {scoreOnChain && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 rounded-lg bg-success/5 border border-success/15 space-y-2"
          >
            <p className="text-[10px] text-success font-medium uppercase tracking-widest flex items-center gap-1.5">
              <Shield size={10} />
              Score attested on-chain
            </p>
            <div className="space-y-1.5">
              {scoreExplorerUrl && (
                <a
                  href={scoreExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] text-accent hover:underline"
                >
                  <ExternalLink size={11} />
                  Stellar Explorer — set_score tx
                </a>
              )}
              <a
                href="https://sepolia.etherscan.io/address/0x15fc6ae953e024d975e77382eeec56a9101f9f88"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-accent hover:underline transition-colors"
              >
                <ExternalLink size={11} />
                Sepolia — Chainlink CRE Forwarder
              </a>
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <h3 className="text-xs font-medium uppercase tracking-widest text-text-secondary px-1">
          Score Factors
        </h3>
        {factorsList.map(({ icon: Icon, label, value, impact }) => (
          <div key={label} className="flex items-center gap-3 p-3 rounded-xl glass">
            <div className="w-8 h-8 rounded-lg border border-border/30 bg-bg-elevated flex items-center justify-center">
              <Icon size={14} className="text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-[11px] text-text-muted">{value}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-[11px] capitalize tracking-wide ${impact === "high" ? "text-success" : "text-warning"}`}>
                {impact}
              </span>
              <ChevronRight size={12} className="text-text-muted" />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
