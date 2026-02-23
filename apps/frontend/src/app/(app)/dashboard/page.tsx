"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CreditCard,
  Activity,
  Shield,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import BalanceCard from "@/components/BalanceCard";
import TransactionList from "@/components/TransactionList";
import {
  MOCK_BALANCE,
  MOCK_CHANGE_24H,
  MOCK_TRANSACTIONS,
  MOCK_RISK_METRICS,
} from "@/lib/mock-data";
import { api } from "@/lib/api";

const QUICK_ACTIONS = [
  { href: "/wallet?action=send", icon: ArrowUpRight, label: "Send", color: "from-violet-600 to-purple-600" },
  { href: "/wallet?action=receive", icon: ArrowDownLeft, label: "Receive", color: "from-emerald-600 to-teal-600" },
  { href: "/deposit", icon: Plus, label: "Deposit", color: "from-blue-600 to-indigo-600" },
  { href: "/credit", icon: CreditCard, label: "Credit", color: "from-amber-600 to-orange-600" },
] as const;

type RiskData = {
  reserveRatio: number;
  utilizationRate: number;
  protocolTvl: number;
  alertTriggered: boolean;
  timestamp: string;
};

export default function DashboardPage() {
  const [risk, setRisk] = useState(MOCK_RISK_METRICS);
  const [loadingRisk, setLoadingRisk] = useState(false);

  const fetchRisk = useCallback(async () => {
    setLoadingRisk(true);
    try {
      const data = await api.get<RiskData>("/api/cre/risk");
      setRisk({
        reserveRatio: data.reserveRatio,
        utilizationRate: data.utilizationRate,
        protocolTvl: data.protocolTvl,
        lastCheck: data.timestamp,
        status: data.alertTriggered ? ("alert" as const) : ("healthy" as const),
      });
    } catch {
      // use mock data fallback
    } finally {
      setLoadingRisk(false);
    }
  }, []);

  useEffect(() => {
    fetchRisk();
  }, [fetchRisk]);

  return (
    <div className="space-y-6 pt-6 pb-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-text-muted text-sm">Welcome back</p>
          <h1 className="text-xl font-bold">NexusFi</h1>
        </div>
        <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center">
          <span className="text-white font-bold text-sm">LO</span>
        </div>
      </motion.div>

      <BalanceCard balance={MOCK_BALANCE} change24h={MOCK_CHANGE_24H} />

      <div className="grid grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(({ href, icon: Icon, label, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <Link href={href} className="flex flex-col items-center gap-2">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
              >
                <Icon size={20} className="text-white" />
              </div>
              <span className="text-xs text-text-secondary font-medium">
                {label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className="text-success" />
          <span className="text-sm font-medium">Protocol Health</span>
          <button
            onClick={fetchRisk}
            disabled={loadingRisk}
            className="ml-auto p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <RefreshCw
              size={14}
              className={`text-text-muted ${loadingRisk ? "animate-spin" : ""}`}
            />
          </button>
          <span className="text-xs text-success font-medium px-2 py-0.5 rounded-full bg-success/10">
            {risk.status}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-text-muted text-[10px] uppercase tracking-wider">Reserve</p>
            <p className="text-sm font-semibold tabular-nums">
              {(risk.reserveRatio * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-text-muted text-[10px] uppercase tracking-wider">Utilization</p>
            <p className="text-sm font-semibold tabular-nums">
              {(risk.utilizationRate * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-text-muted text-[10px] uppercase tracking-wider">TVL</p>
            <p className="text-sm font-semibold tabular-nums">
              ${(risk.protocolTvl / 1_000_000).toFixed(2)}M
            </p>
          </div>
        </div>
        <p className="text-[10px] text-text-muted mt-2">
          Verified by Chainlink CRE WF3 (Risk & Compliance)
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Activity size={16} className="text-accent" />
            Recent Activity
          </h2>
          <Link href="/wallet" className="text-xs text-accent font-medium">
            View all
          </Link>
        </div>
        <TransactionList transactions={MOCK_TRANSACTIONS} limit={4} />
      </motion.div>
    </div>
  );
}
