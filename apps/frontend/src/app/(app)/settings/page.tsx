"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { shortenAddress } from "@/lib/format";

export default function SettingsPage() {
  const { address, network, disconnect } = useWallet();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const walletAddress = address ?? "";

  const copyAddress = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    disconnect();
    router.replace("/login");
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

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={handleDisconnect}
        className="w-full py-3 rounded-xl border border-danger/20 text-danger text-xs font-medium flex items-center justify-center gap-2 hover:bg-danger/5 transition-colors tracking-wide"
      >
        <LogOut size={14} />
        Disconnect Wallet
      </motion.button>

      <p className="text-center text-[10px] text-text-muted pb-4 tracking-widest uppercase">
        NexusFi v0.1.0 — Stellar + Chainlink CRE
      </p>
    </div>
  );
}
