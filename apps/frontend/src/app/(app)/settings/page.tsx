"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Bell,
  Moon,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  Wallet,
  Plus,
  Loader2,
  CheckCircle,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { shortenAddress } from "@/lib/format";

export default function SettingsPage() {
  const {
    address,
    network,
    wallets,
    setActiveWallet,
    addWallet,
    disconnect,
    isLoading,
    error,
  } = useWallet();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const walletAddress = address ?? "";

  const copyAddress = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = async () => {
    await disconnect();
    router.replace("/login");
  };

  const handleAddWallet = async () => {
    if (!newWalletName.trim()) return;
    const contractId = await addWallet(newWalletName.trim());
    if (contractId) {
      setNewWalletName("");
      setShowAddWallet(false);
    }
  };

  const sections = [
    {
      title: "Account",
      items: [
        { icon: Shield, label: "Security", value: "Freighter" },
        { icon: Bell, label: "Notifications", value: "On" },
        { icon: Moon, label: "Theme", value: "Dark" },
        { icon: Globe, label: "Network", value: network ?? "Stellar Testnet" },
      ],
    },
    {
      title: "About",
      items: [
        { icon: HelpCircle, label: "Help Center", value: "" },
        {
          icon: ExternalLink,
          label: "View on Stellar Expert",
          value: "",
          href: `https://stellar.expert/explorer/testnet/account/${walletAddress}`,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 pt-6">
      <h1 className="text-lg font-serif font-semibold">Settings</h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-5 flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-lg border border-accent/30 bg-bg-card flex items-center justify-center">
          <User size={20} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">
            {walletAddress ? shortenAddress(walletAddress, 6) : "Not Connected"}
          </p>
          <button
            onClick={copyAddress}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors mt-0.5"
          >
            <span className="font-mono">
              {shortenAddress(walletAddress, 8)}
            </span>
            {copied ? (
              <Check size={11} className="text-success" />
            ) : (
              <Copy size={11} />
            )}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <h3 className="text-xs font-medium uppercase tracking-widest text-text-secondary px-1 mb-2">
          Wallets
        </h3>
        <div className="glass rounded-xl overflow-hidden">
          {wallets.length === 0 ? (
            <div className="p-4 text-sm text-text-muted text-center">
              Apenas a wallet ativa é exibida. Faça login para ver todas.
            </div>
          ) : (
            wallets.map((w, i) => {
              const isActive = w.contractId === walletAddress;
              return (
                <button
                  key={w.keyId}
                  type="button"
                  onClick={() => !isActive && setActiveWallet(w.contractId)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-bg-elevated/40 transition-colors text-left disabled:opacity-70"
                  style={{
                    borderTop: i > 0 ? "1px solid rgb(var(--color-border) / 0.2)" : undefined,
                  }}
                >
                  <Wallet size={16} className="text-text-muted shrink-0" />
                  <span className="flex-1 text-sm font-mono truncate">
                    {shortenAddress(w.contractId, 8)}
                  </span>
                  {isActive ? (
                    <span className="flex items-center gap-1.5 text-[11px] text-success">
                      <CheckCircle size={12} />
                      Ativa
                    </span>
                  ) : (
                    <span className="text-[11px] text-accent">Usar esta</span>
                  )}
                  <ChevronRight size={13} className="text-text-muted shrink-0" />
                </button>
              );
            })
          )}
          <button
            type="button"
            onClick={() => setShowAddWallet(true)}
            className="w-full flex items-center gap-3 p-4 hover:bg-bg-elevated/40 transition-colors text-left border-t border-border/20"
          >
            <Plus size={16} className="text-accent shrink-0" />
            <span className="flex-1 text-sm text-accent font-medium">Adicionar wallet</span>
            <ChevronRight size={13} className="text-text-muted shrink-0" />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAddWallet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
            onClick={() => !isLoading && setShowAddWallet(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="glass rounded-xl p-5 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold mb-3">Nova wallet com Passkey</h3>
              <p className="text-xs text-text-muted mb-4">
                Crie uma nova passkey para associar outra wallet à sua conta.
              </p>
              {error && (
                <p className="text-xs text-danger mb-3">{error}</p>
              )}
              <input
                type="text"
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                placeholder="Nome para esta wallet"
                className="w-full p-3 rounded-lg bg-bg-primary border border-border/40 text-sm focus:border-accent/50 outline-none transition-colors mb-4"
                onKeyDown={(e) => e.key === "Enter" && handleAddWallet()}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => !isLoading && setShowAddWallet(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border/40 text-sm font-medium hover:bg-bg-elevated/40 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddWallet}
                  disabled={isLoading || !newWalletName.trim()}
                  className="flex-1 py-2.5 rounded-lg bg-accent text-bg-primary text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Criar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {sections.map(({ title, items }, si) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + si * 0.08 }}
        >
          <h3 className="text-xs font-medium uppercase tracking-widest text-text-secondary px-1 mb-2">
            {title}
          </h3>
          <div className="glass rounded-xl overflow-hidden">
            {items.map(({ icon: Icon, label, value, href }, i) => {
              const Wrapper = href ? "a" : "button";
              const extraProps = href
                ? { href, target: "_blank", rel: "noopener noreferrer" }
                : {};
              return (
                <Wrapper
                  key={label}
                  className="w-full flex items-center gap-3 p-4 hover:bg-bg-elevated/40 transition-colors text-left"
                  style={{
                    borderTop: i > 0 ? "1px solid rgb(var(--color-border) / 0.2)" : undefined,
                  }}
                  {...(extraProps as any)}
                >
                  <Icon size={16} className="text-text-muted" />
                  <span className="flex-1 text-sm">{label}</span>
                  {value && (
                    <span className="text-[11px] text-text-muted tracking-wide">{value}</span>
                  )}
                  <ChevronRight size={13} className="text-text-muted" />
                </Wrapper>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Confidential Tools */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h3 className="text-xs font-medium uppercase tracking-widest text-text-secondary px-1 mb-2">
          Advanced
        </h3>
        <Link
          href="/confidential"
          className="flex items-center gap-3 p-4 glass rounded-xl hover:bg-bg-elevated/40 transition-colors"
        >
          <Lock size={16} className="text-accent shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Confidential HTTP</p>
            <p className="text-[10px] text-text-muted mt-0.5 tracking-wide">
              Chainlink Confidential Compute · TEE-secured API calls
            </p>
          </div>
          <ChevronRight size={13} className="text-text-muted" />
        </Link>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={handleDisconnect}
        className="w-full py-3 rounded-xl border border-danger/20 text-danger text-xs font-medium flex items-center justify-center gap-2 hover:bg-danger/5 transition-colors tracking-wide"
      >
        <LogOut size={14} />
        Desconectar
      </motion.button>

      <p className="text-center text-[10px] text-text-muted pb-4 tracking-widest uppercase">
        NexusFi v0.1.0 — Stellar + Chainlink CRE
      </p>
    </div>
  );
}
