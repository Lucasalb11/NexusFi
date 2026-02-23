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
import { MOCK_USER, MOCK_ADDRESS } from "@/lib/mock-data";
import { shortenAddress } from "@/lib/format";

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(MOCK_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = [
    {
      title: "Account",
      items: [
        { icon: Shield, label: "Security", value: "2FA Enabled" },
        { icon: Bell, label: "Notifications", value: "On" },
        { icon: Moon, label: "Theme", value: "Dark" },
        { icon: Globe, label: "Network", value: "Stellar Testnet" },
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
          href: `https://stellar.expert/explorer/testnet/account/${MOCK_ADDRESS}`,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 pt-6">
      <h1 className="text-xl font-bold">Settings</h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-full gradient-accent flex items-center justify-center">
          <User size={24} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{MOCK_USER.name}</p>
          <button
            onClick={copyAddress}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            <span className="font-mono">
              {shortenAddress(MOCK_ADDRESS, 8)}
            </span>
            {copied ? (
              <Check size={12} className="text-success" />
            ) : (
              <Copy size={12} />
            )}
          </button>
        </div>
      </motion.div>

      {sections.map(({ title, items }, si) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + si * 0.1 }}
        >
          <h3 className="text-sm font-semibold text-text-secondary px-1 mb-2">
            {title}
          </h3>
          <div className="glass rounded-2xl overflow-hidden">
            {items.map(({ icon: Icon, label, value }, i) => (
              <button
                key={label}
                className="w-full flex items-center gap-3 p-4 hover:bg-bg-elevated/50 transition-colors text-left"
                style={{
                  borderTop: i > 0 ? "1px solid rgb(var(--color-border) / 0.3)" : undefined,
                }}
              >
                <Icon size={18} className="text-text-muted" />
                <span className="flex-1 text-sm">{label}</span>
                {value && (
                  <span className="text-xs text-text-muted">{value}</span>
                )}
                <ChevronRight size={14} className="text-text-muted" />
              </button>
            ))}
          </div>
        </motion.div>
      ))}

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full py-3 rounded-2xl border border-danger/30 text-danger text-sm font-medium flex items-center justify-center gap-2 hover:bg-danger/5 transition-colors"
      >
        <LogOut size={16} />
        Disconnect Wallet
      </motion.button>

      <p className="text-center text-xs text-text-muted pb-4">
        NexusFi v0.1.0 — Powered by Stellar + Chainlink CRE
      </p>
    </div>
  );
}
