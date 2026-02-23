"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/format";

type Props = {
  balance: number;
  change24h?: number;
};

export default function BalanceCard({ balance, change24h = 0 }: Props) {
  const [visible, setVisible] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl gradient-card p-6 border border-border/30"
    >
      <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-purple-600/10 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <span className="text-text-secondary text-sm">Total balance</span>
          <button
            onClick={() => setVisible(!visible)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            {visible ? (
              <Eye size={18} className="text-text-muted" />
            ) : (
              <EyeOff size={18} className="text-text-muted" />
            )}
          </button>
        </div>

        <motion.p
          key={visible ? "show" : "hide"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-4xl font-bold tracking-tight mb-3"
        >
          {visible ? formatCurrency(balance) : "••••••"}
        </motion.p>

        {visible && change24h !== 0 && (
          <div className="flex items-center gap-1.5">
            <TrendingUp
              size={14}
              className={change24h > 0 ? "text-success" : "text-danger"}
            />
            <span
              className={`text-sm font-medium ${change24h > 0 ? "text-success" : "text-danger"}`}
            >
              {change24h > 0 ? "+" : ""}
              {change24h.toFixed(2)}%
            </span>
            <span className="text-text-muted text-sm">24h</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
