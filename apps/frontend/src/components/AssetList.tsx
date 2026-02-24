"use client";

import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export type TokenBalance = { raw: string; formatted: string };
export type AvailableToken = {
  symbol: string;
  name: string;
  contractId: string;
  fiatCurrency: string;
};

type Props = {
  xlm: string;
  tokens: Record<string, TokenBalance>;
  available: AvailableToken[];
  loading?: boolean;
};

function formatXlm(value: string): string {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  });
}

export default function AssetList({ xlm, tokens, available, loading }: Props) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Coins size={14} className="text-accent" />
          <span className="text-xs font-medium uppercase tracking-wider">Your assets</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-white/5 animate-pulse"
              aria-hidden
            />
          ))}
        </div>
      </motion.div>
    );
  }

  const xlmAmount = formatXlm(xlm);
  const tokenRows = available.map((t) => {
    const bal = tokens[t.symbol];
    const amount = bal ? parseFloat(bal.formatted) : 0;
    return {
      symbol: t.symbol,
      name: t.name,
      fiatCurrency: t.fiatCurrency,
      amount,
      formatted: bal?.formatted ?? "0.00",
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Coins size={14} className="text-accent" />
        <span className="text-xs font-medium uppercase tracking-wider">Your assets</span>
      </div>
      <ul className="space-y-2">
        <li className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-bg-card/50 border border-border/20">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-text-primary">XLM</span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider">
              Stellar Lumens
            </span>
          </div>
          <span className="text-sm font-semibold tabular-nums font-serif">
            {xlmAmount} <span className="text-text-muted font-sans font-normal text-xs">XLM</span>
          </span>
        </li>
        {tokenRows.map((row) => (
          <li
            key={row.symbol}
            className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-bg-card/50 border border-border/20"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-text-primary">{row.symbol}</span>
              <span className="text-[10px] text-text-muted uppercase tracking-wider">
                {row.name}
              </span>
            </div>
            <span className="text-sm font-semibold tabular-nums font-serif">
              {formatCurrency(row.amount, row.fiatCurrency)}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
