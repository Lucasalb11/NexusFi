"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  RefreshCw,
  Zap,
} from "lucide-react";
import { formatCurrency, timeAgo, shortenAddress } from "@/lib/format";
import clsx from "clsx";

export type Transaction = {
  id: string;
  type: "send" | "receive" | "credit_use" | "credit_repay" | "deposit";
  amount: number;
  counterparty: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
};

const TX_CONFIG = {
  send: { icon: ArrowUpRight, color: "text-danger", sign: "-" },
  receive: { icon: ArrowDownLeft, color: "text-success", sign: "+" },
  credit_use: { icon: CreditCard, color: "text-warning", sign: "-" },
  credit_repay: { icon: RefreshCw, color: "text-success", sign: "-" },
  deposit: { icon: Zap, color: "text-accent-light", sign: "+" },
} as const;

type Props = {
  transactions: Transaction[];
  limit?: number;
};

export default function TransactionList({ transactions, limit }: Props) {
  const items = limit ? transactions.slice(0, limit) : transactions;

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted text-sm">
        No transactions yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((tx, i) => {
        const config = TX_CONFIG[tx.type];
        const Icon = config.icon;
        return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-bg-card/50 transition-colors"
          >
            <div
              className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                "bg-bg-card border border-border/30",
              )}
            >
              <Icon size={18} className={config.color} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {shortenAddress(tx.counterparty)}
              </p>
              <p className="text-xs text-text-muted">
                {timeAgo(tx.timestamp)}
                {tx.status === "pending" && (
                  <span className="ml-1 text-warning">pending</span>
                )}
              </p>
            </div>

            <p
              className={clsx("text-sm font-semibold tabular-nums", config.color)}
            >
              {config.sign}
              {formatCurrency(tx.amount)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
