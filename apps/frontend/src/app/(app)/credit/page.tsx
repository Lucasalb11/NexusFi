"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Shield,
  Clock,
  TrendingUp,
  ChevronRight,
  Loader2,
  Sparkles,
  BarChart3,
} from "lucide-react";
import CreditCardVisual from "@/components/CreditCardVisual";
import CreditScoreGauge from "@/components/CreditScoreGauge";
import { formatCurrency } from "@/lib/format";
import { api } from "@/lib/api";
import {
  MOCK_CREDIT_SCORE,
  MOCK_CREDIT_LIMIT,
  MOCK_CREDIT_USED,
  MOCK_USER,
} from "@/lib/mock-data";

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
};

export default function CreditPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [score, setScore] = useState(MOCK_CREDIT_SCORE);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [factors, setFactors] = useState<ScoreResponse["factors"] | null>(null);

  const requestAnalysis = useCallback(async () => {
    setAnalyzing(true);
    try {
      const data = await api.get<ScoreResponse>("/api/credit/score");
      setScore(data.score);
      setReasoning(data.reasoning);
      setFactors(data.factors);
    } catch {
      setScore(Math.min(1000, score + Math.floor(Math.random() * 30)));
    } finally {
      setAnalyzing(false);
    }
  }, [score]);

  const available = MOCK_CREDIT_LIMIT - MOCK_CREDIT_USED;

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
        <h1 className="text-xl font-bold">Credit</h1>
        <div className="flex items-center gap-1.5 text-accent text-xs font-medium">
          <Brain size={14} />
          AI Powered
        </div>
      </div>

      <CreditCardVisual
        name={MOCK_USER.name}
        lastFour={MOCK_USER.cardLastFour}
        limit={MOCK_CREDIT_LIMIT}
        used={MOCK_CREDIT_USED}
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-3 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Limit</p>
          <p className="text-sm font-bold mt-1">{formatCurrency(MOCK_CREDIT_LIMIT)}</p>
        </div>
        <div className="glass rounded-2xl p-3 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Used</p>
          <p className="text-sm font-bold mt-1 text-warning">{formatCurrency(MOCK_CREDIT_USED)}</p>
        </div>
        <div className="glass rounded-2xl p-3 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Available</p>
          <p className="text-sm font-bold mt-1 text-success">{formatCurrency(available)}</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            AI Credit Score
          </h2>
          <span className="text-xs text-text-muted">via CRE + LLM</span>
        </div>

        <CreditScoreGauge score={score} />

        {reasoning && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-text-secondary mt-3 p-3 rounded-xl bg-bg-primary/50"
          >
            {reasoning}
          </motion.p>
        )}

        <button
          onClick={requestAnalysis}
          disabled={analyzing}
          className="w-full mt-4 py-3 rounded-xl gradient-accent text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
        >
          {analyzing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing on-chain history...
            </>
          ) : (
            <>
              <Brain size={16} />
              Re-analyze Credit Score
            </>
          )}
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <h3 className="text-sm font-semibold text-text-secondary px-1">Score Factors</h3>
        {factorsList.map(({ icon: Icon, label, value, impact }) => (
          <div key={label} className="flex items-center gap-3 p-3 rounded-2xl glass">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Icon size={16} className="text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-text-muted">{value}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-xs capitalize ${impact === "high" ? "text-success" : "text-warning"}`}>{impact}</span>
              <ChevronRight size={14} className="text-text-muted" />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
