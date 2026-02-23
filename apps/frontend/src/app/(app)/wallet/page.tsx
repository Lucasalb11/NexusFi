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
import { MOCK_TRANSACTIONS } from "@/lib/mock-data";
import { useWallet } from "@/context/WalletContext";
import { shortenAddress } from "@/lib/format";
import { api } from "@/lib/api";

type Tab = "history" | "send" | "receive";

export default function WalletPage() {
  const { address } = useWallet();
  const walletAddress = address ?? "";

  const [tab, setTab] = useState<Tab>("history");
  const [copied, setCopied] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendTo || !sendAmount) return;

    setSending(true);
    setSendResult(null);
    try {
      const result = await api.post<{ txHash: string; explorerUrl: string }>("/api/wallet/send", {
        to: sendTo,
        amount: Number(sendAmount),
        token: "nUSD",
      });
      setSendResult(result.txHash);
      setSendTo("");
      setSendAmount("");
    } catch (err: any) {
      setSendResult(`Error: ${err.message ?? "Failed to send"}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 pt-6">
      <h1 className="text-lg font-serif font-semibold">Wallet</h1>

      <div className="flex gap-1 p-1 rounded-xl bg-bg-card border border-border/20">
        {(["history", "send", "receive"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all uppercase tracking-wider",
              tab === t
                ? "bg-accent text-bg-primary"
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="flex items-center gap-2 p-3 rounded-xl bg-bg-card border border-border/20 mb-4">
              <Search size={14} className="text-text-muted" />
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <form onSubmit={handleSend} className="space-y-4">
              <div className="glass rounded-xl p-4 space-y-4">
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                    placeholder="G..."
                    className="w-full p-3 rounded-lg bg-bg-primary border border-border/40 text-sm font-mono focus:border-accent/50 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2">
                    Amount (nUSD)
                  </label>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full p-3 rounded-lg bg-bg-primary border border-border/40 text-2xl font-semibold focus:border-accent/50 outline-none transition-colors tabular-nums"
                  />
                </div>
              </div>

              {sendResult && (
                <div className={`p-3 rounded-lg text-xs font-mono break-all ${
                  sendResult.startsWith("Error")
                    ? "bg-danger/10 border border-danger/20 text-danger"
                    : "bg-success/10 border border-success/20 text-success"
                }`}>
                  {sendResult.startsWith("Error")
                    ? sendResult
                    : (
                      <>
                        Sent successfully.{" "}
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${sendResult}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          View on Explorer
                        </a>
                      </>
                    )}
                </div>
              )}

              <button
                type="submit"
                disabled={!sendTo || !sendAmount || sending}
                className="w-full py-4 rounded-xl bg-accent text-bg-primary font-semibold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-sm tracking-wide"
              >
                {sending ? (
                  <span className="animate-pulse">Sending...</span>
                ) : (
                  <>
                    <ArrowUpRight size={16} />
                    Send nUSD
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {tab === "receive" && (
          <motion.div
            key="receive"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="glass rounded-2xl p-6">
              <div className="bg-white rounded-xl p-4">
                <QRCodeSVG
                  value={walletAddress}
                  size={200}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#080C15"
                />
              </div>
            </div>

            <button
              onClick={copyAddress}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg glass hover:bg-bg-elevated/80 transition-colors"
            >
              {copied ? (
                <Check size={14} className="text-success" />
              ) : (
                <Copy size={14} className="text-text-muted" />
              )}
              <span className="text-sm font-mono">
                {shortenAddress(walletAddress, 8)}
              </span>
            </button>

            <p className="text-[11px] text-text-muted text-center max-w-xs tracking-wide">
              Share this address to receive nUSD or nBRL on Stellar
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
