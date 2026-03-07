"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  CreditCard,
  Activity,
  Shield,
  RefreshCw,
  Lock,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import BalanceCard from "@/components/BalanceCard";
import { PremiumHeroSection } from "@/components/PremiumTopNav";
import AssetList from "@/components/AssetList";
import TransactionList from "@/components/TransactionList";
import {
  MOCK_CHANGE_24H,
  MOCK_TRANSACTIONS,
  MOCK_RISK_METRICS,
} from "@/lib/mock-data";
import { useWallet } from "@/context/WalletContext";
import { api } from "@/lib/api";
import { shortenAddress } from "@/lib/format";

const QUICK_ACTIONS = [
  { href: "/wallet?action=send",     icon: ArrowUpRight,   label: "Send" },
  { href: "/wallet?action=receive",  icon: ArrowDownLeft,  label: "Receive" },
  { href: "/bridge",                 icon: ArrowLeftRight, label: "Bridge" },
  { href: "/credit",                 icon: CreditCard,     label: "Credit" },
] as const;

type RiskData = {
  reserveRatio: number;
  utilizationRate: number;
  protocolTvl: number;
  alertTriggered: boolean;
  timestamp: string;
};

type BalanceData = {
  xlm: string;
  tokens: Record<string, { raw: string; formatted: string }>;
  available?: Array<{
    symbol: string;
    name: string;
    contractId: string;
    fiatCurrency: string;
  }>;
};

export default function DashboardPage() {
  const { address, network } = useWallet();
  const [risk, setRisk] = useState(MOCK_RISK_METRICS);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [balance, setBalance] = useState(0);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  const fetchBalance = useCallback(async () => {
    setLoadingBalance(true);
    try {
      const data = await api.get<BalanceData>("/api/wallet/balance");
      setBalanceData(data);
      const total = Object.entries(data.tokens ?? {}).reduce(
        (sum, [, v]) => sum + (parseFloat(v?.formatted ?? "0") || 0),
        0,
      );
      setBalance(total || parseFloat(data.xlm ?? "0") || 0);
    } catch {
      setBalance(0);
      setBalanceData(null);
    } finally {
      setLoadingBalance(false);
    }
  }, []);

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
      // fallback to mock
    } finally {
      setLoadingRisk(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchRisk();
  }, [fetchBalance, fetchRisk]);

  const initials = address ? address.slice(0, 2) : "NF";

  return (
    <div className="space-y-6 pt-6 pb-4">
      <PremiumHeroSection />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-text-muted text-xs uppercase tracking-widest">Welcome back</p>
          <h1 className="text-lg font-serif font-semibold mt-0.5">
            {address ? shortenAddress(address, 6) : "NexusFi"}
          </h1>
          {network && (
            <p className="text-[10px] text-text-muted tracking-wider mt-0.5">
              {network}
            </p>
          )}
        </div>
        <div className="w-9 h-9 rounded-lg border border-accent/30 bg-bg-card flex items-center justify-center">
          <span className="text-accent font-serif font-semibold text-sm">{initials}</span>
        </div>
      </motion.div>

      <BalanceCard balance={balance} change24h={MOCK_CHANGE_24H} />

      <div className="grid grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(({ href, icon: Icon, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.04 }}
          >
            <Link href={href} className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 rounded-xl border border-border/40 bg-bg-card flex items-center justify-center">
                <Icon size={18} className="text-accent" />
              </div>
              <span className="text-[10px] text-text-secondary font-medium tracking-wide">
                {label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Confidential HTTP feature card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
      >
        <Link
          href="/confidential"
          className="flex items-center gap-3 p-4 rounded-xl border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
            <Lock size={15} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-accent">Confidential HTTP</p>
            <p className="text-[10px] text-text-muted tracking-wide mt-0.5">
              TEE-secured API calls via Chainlink CCC
            </p>
          </div>
          <ChevronRight size={14} className="text-accent/60 group-hover:text-accent transition-colors shrink-0" />
        </Link>
      </motion.div>

      <AssetList
        xlm={balanceData?.xlm ?? "0"}
        tokens={balanceData?.tokens ?? {}}
        available={balanceData?.available ?? []}
        loading={loadingBalance}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-success" />
          <span className="text-xs font-medium uppercase tracking-wider">Protocol Health</span>
          <button
            onClick={fetchRisk}
            disabled={loadingRisk}
            className="ml-auto p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <RefreshCw
              size={13}
              className={`text-text-muted ${loadingRisk ? "animate-spin" : ""}`}
            />
          </button>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md uppercase tracking-wider ${
            risk.status === "healthy"
              ? "text-success bg-success/10"
              : "text-danger bg-danger/10"
          }`}>
            {risk.status}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-text-muted text-[10px] uppercase tracking-widest">Reserve</p>
            <p className="text-sm font-semibold tabular-nums mt-0.5">
              {(risk.reserveRatio * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-text-muted text-[10px] uppercase tracking-widest">Utilization</p>
            <p className="text-sm font-semibold tabular-nums mt-0.5">
              {(risk.utilizationRate * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-text-muted text-[10px] uppercase tracking-widest">TVL</p>
            <p className="text-sm font-semibold tabular-nums mt-0.5">
              ${(risk.protocolTvl / 1_000_000).toFixed(2)}M
            </p>
          </div>
        </div>
        <p className="text-[10px] text-text-muted mt-3 tracking-wide">
          Verified by Chainlink CRE — Risk & Compliance
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium uppercase tracking-widest flex items-center gap-2 text-text-secondary">
            <Activity size={14} className="text-accent" />
            Recent Activity
          </h2>
          <Link href="/wallet" className="text-[11px] text-accent font-medium tracking-wide">
            View all
          </Link>
        </div>
        <TransactionList transactions={MOCK_TRANSACTIONS} limit={4} />
      </motion.div>
    </div>
  );
}
