"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  RefreshCw,
  Zap,
  ExternalLink,
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
  hash?: string;         // real Stellar tx hash — enables explorer link
  explorerUrl?: string;  // override URL if not testnet/stellar
};

const TX_CONFIG = {
  send:         { icon: ArrowUpRight,  color: "text-danger",  sign: "-" },
  receive:      { icon: ArrowDownLeft, color: "text-success", sign: "+" },
  credit_use:   { icon: CreditCard,    color: "text-warning", sign: "-" },
  credit_repay: { icon: RefreshCw,     color: "text-success", sign: "-" },
  deposit:      { icon: Zap,           color: "text-accent",  sign: "+" },
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
    <div className="space-y-1">
      {items.map((tx, i) => {
        const config = TX_CONFIG[tx.type];
        const Icon = config.icon;

        const explorerHref =
          tx.explorerUrl ??
          (tx.hash
            ? `https://stellar.expert/explorer/testnet/tx/${tx.hash}`
            : null);

        return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg-card/40 transition-colors group"
          >
            <div
              className={clsx(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                "bg-bg-elevated/80 border border-border/20",
              )}
            >
              <Icon size={16} className={config.color} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {shortenAddress(tx.counterparty)}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-text-muted">
                  {timeAgo(tx.timestamp)}
                  {tx.status === "pending" && (
                    <span className="ml-1 text-warning">· pending</span>
                  )}
                  {tx.status === "failed" && (
                    <span className="ml-1 text-danger">· failed</span>
                  )}
                </p>
                {explorerHref && (
                  <a
                    href={explorerHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-[10px] text-accent hover:underline"
                  >
                    <ExternalLink size={9} />
                    Explorer
                  </a>
                )}
              </div>
            </div>

            <p className={clsx("text-sm font-semibold tabular-nums shrink-0", config.color)}>
              {config.sign}
              {formatCurrency(tx.amount)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
