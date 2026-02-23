"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Copy,
  Check,
  Search,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import clsx from "clsx";
import TransactionList from "@/components/TransactionList";
import { MOCK_TRANSACTIONS, MOCK_ADDRESS } from "@/lib/mock-data";
import { shortenAddress, formatCurrency } from "@/lib/format";

type Tab = "history" | "send" | "receive";

export default function WalletPage() {
  const [tab, setTab] = useState<Tab>("history");
  const [copied, setCopied] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");

  const copyAddress = async () => {
    await navigator.clipboard.writeText(MOCK_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Demo: Would send ${formatCurrency(Number(sendAmount))} nUSD to ${sendTo}`);
    setSendTo("");
    setSendAmount("");
  };

  return (
    <div className="space-y-6 pt-6">
      <h1 className="text-xl font-bold">Wallet</h1>

      <div className="flex gap-2 p-1 rounded-2xl bg-bg-card">
        {(["history", "send", "receive"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all capitalize",
              tab === t
                ? "bg-accent text-white shadow-lg"
                : "text-text-muted hover:text-text-secondary",
            )}
          >
            {t === "history" ? "History" : t === "send" ? "Send" : "Receive"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-bg-card border border-border/30 mb-4">
              <Search size={16} className="text-text-muted" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="flex-1 text-sm outline-none placeholder:text-text-muted"
              />
            </div>
            <TransactionList transactions={MOCK_TRANSACTIONS} />
          </motion.div>
        )}

        {tab === "send" && (
          <motion.div
            key="send"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <form onSubmit={handleSend} className="space-y-4">
              <div className="glass rounded-2xl p-4 space-y-4">
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider block mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                    placeholder="G..."
                    className="w-full p-3 rounded-xl bg-bg-primary border border-border/50 text-sm font-mono focus:border-accent outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider block mb-2">
                    Amount (nUSD)
                  </label>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full p-3 rounded-xl bg-bg-primary border border-border/50 text-2xl font-bold focus:border-accent outline-none transition-colors tabular-nums"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!sendTo || !sendAmount}
                className="w-full py-4 rounded-2xl gradient-accent text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                <ArrowUpRight size={18} />
                Send nUSD
              </button>
            </form>
          </motion.div>
        )}

        {tab === "receive" && (
          <motion.div
            key="receive"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="glass rounded-3xl p-6">
              <div className="bg-white rounded-2xl p-4">
                <QRCodeSVG
                  value={MOCK_ADDRESS}
                  size={200}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#0A0A0F"
                />
              </div>
            </div>

            <button
              onClick={copyAddress}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:bg-bg-elevated/80 transition-colors"
            >
              {copied ? (
                <Check size={16} className="text-success" />
              ) : (
                <Copy size={16} className="text-text-muted" />
              )}
              <span className="text-sm font-mono">
                {shortenAddress(MOCK_ADDRESS, 8)}
              </span>
            </button>

            <p className="text-xs text-text-muted text-center max-w-xs">
              Share this address to receive nUSD on the Stellar network
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
