"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Shield,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Lock,
  Users,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Cpu,
  Globe,
  ChevronRight,
  ArrowLeft,
  Scale,
  FileText,
  Vote,
  Database,
} from "lucide-react";
import PublicHeader from "@/components/PublicHeader";

export const dynamic = "force-dynamic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Reserve health meter ─────────────────────────────────────────────────────

function ReserveMeter({ ratio }: { ratio: number }) {
  const pct = Math.min(100, ratio * 100);
  const color =
    ratio >= 1.05 ? "rgb(52,199,140)" : ratio >= 1.0 ? "rgb(191,163,107)" : "rgb(239,98,98)";
  const label =
    ratio >= 1.05 ? "Healthy" : ratio >= 1.0 ? "Warning" : "Critical";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">nUSD Reserve Ratio</span>
        <span className="font-semibold" style={{ color }}>{label}</span>
      </div>
      <div className="h-2.5 rounded-full bg-bg-elevated overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">0%</span>
        <span className="font-mono font-semibold text-text-primary">
          {(ratio * 100).toFixed(1)}%
        </span>
        <span className="text-text-muted">≥ 100%</span>
      </div>
    </div>
  );
}

// ─── Stat box ─────────────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-accent" />
        </div>
      </div>
      <p className="font-serif text-2xl font-bold text-gradient mb-1">{value}</p>
      <p className="text-text-secondary text-xs font-medium">{label}</p>
      {sub && <p className="text-text-muted text-[11px] mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Parameter row ────────────────────────────────────────────────────────────

function ParamRow({
  label,
  value,
  description,
  status,
}: {
  label: string;
  value: string;
  description: string;
  status?: "healthy" | "warning" | "neutral";
}) {
  const statusColor =
    status === "healthy"
      ? "text-success"
      : status === "warning"
        ? "text-warning"
        : "text-text-muted";

  return (
    <div className="flex items-center gap-4 py-4 border-b border-border/20 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-sm font-medium truncate">{label}</p>
        <p className="text-text-muted text-xs mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-semibold font-mono ${statusColor}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GovernancePage() {
  // Live data (in production: fetched from on-chain / CRE attestation API)
  const reserveRatio = 1.142; // 114.2% — healthy
  const utilizationRate = 0.24; // 24%
  const totalSupplyNusd = 1_200_000;
  const reserveXlm = 11_400_000;
  const xlmPriceUsd = 0.12;
  const reserveUsd = reserveXlm * xlmPriceUsd;
  const lastAttestation = "2026-03-07 18:42 UTC";

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <PublicHeader />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-6 text-center overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-8 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgb(191,163,107), transparent)" }}
        />
        <div className="relative max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-accent font-medium mb-8 border-accent/20"
          >
            <Scale className="w-3 h-3" />
            Protocol Governance
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5"
          >
            Open.{" "}
            <span className="text-gradient">Transparent.</span>
            <br />
            Community-Governed.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-text-secondary text-lg leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Every protocol parameter, reserve ratio, and fee structure is visible on-chain.
            NexusFi has no hidden decisions — governance is verifiable by anyone, anywhere.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/login"
              className="flex items-center gap-2 px-6 py-3 gradient-accent rounded-xl text-sm font-semibold text-bg-primary shadow-lg shadow-accent/20 hover:opacity-90 transition-opacity"
            >
              Launch App
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 glass rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── LIVE PROTOCOL STATS ──────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-bg-secondary/30 border-y border-border/30">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="mb-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-1">
                  Live Protocol Metrics
                </p>
                <h2 className="font-serif text-2xl font-bold text-text-primary">
                  Real-Time Protocol Health
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted glass px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Updated {lastAttestation}
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                icon: Shield,
                label: "Reserve Ratio",
                value: `${(reserveRatio * 100).toFixed(1)}%`,
                sub: "Target ≥ 100%",
              },
              {
                icon: Database,
                label: "nUSD Supply",
                value: `$${(totalSupplyNusd / 1e6).toFixed(1)}M`,
                sub: "Total circulating",
              },
              {
                icon: TrendingUp,
                label: "Credit Utilization",
                value: `${(utilizationRate * 100).toFixed(0)}%`,
                sub: "Protocol-wide",
              },
              {
                icon: RefreshCw,
                label: "Last Attestation",
                value: "30s ago",
                sub: "Chainlink CRE WF1",
              },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.07}>
                <StatBox {...stat} />
              </FadeIn>
            ))}
          </div>

          {/* Reserve health bar */}
          <FadeIn delay={0.2}>
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-text-primary text-sm font-semibold mb-0.5">
                    nUSD Collateralization
                  </p>
                  <p className="text-text-muted text-xs">
                    Verified by Chainlink CRE Proof of Reserve (WF1) — every 30 seconds
                  </p>
                </div>
                <a
                  href="https://chain.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-accent text-xs hover:underline"
                >
                  Verify on-chain
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <ReserveMeter ratio={reserveRatio} />

              <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-border/20">
                {[
                  { label: "XLM Reserve", value: `${(reserveXlm / 1e6).toFixed(1)}M XLM` },
                  { label: "USD Value", value: `$${(reserveUsd / 1e6).toFixed(2)}M` },
                  { label: "nUSD Supply", value: `$${(totalSupplyNusd / 1e6).toFixed(1)}M` },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-text-primary text-sm font-semibold font-mono">{item.value}</p>
                    <p className="text-text-muted text-[11px] mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── PROTOCOL PARAMETERS ──────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="mb-10">
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">
              On-Chain Parameters
            </p>
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-2">
              Protocol Parameters
            </h2>
            <p className="text-text-secondary text-sm">
              All parameters are set by community governance and enforced by Soroban smart contracts.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6">
            <FadeIn delay={0.05}>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Shield className="w-4 h-4 text-accent" />
                  <p className="text-text-primary text-sm font-semibold">Reserve & Collateral</p>
                </div>
                <div className="space-y-1">
                  <ParamRow
                    label="Minimum Reserve Ratio"
                    value="100%"
                    description="Below this, nUSD minting is paused by Chainlink CRE WF3"
                    status="healthy"
                  />
                  <ParamRow
                    label="Warning Threshold"
                    value="95%"
                    description="Risk Monitor triggers community alert"
                    status="neutral"
                  />
                  <ParamRow
                    label="Current Reserve"
                    value="114.2%"
                    description="Verified 30s ago by CRE Proof of Reserve"
                    status="healthy"
                  />
                  <ParamRow
                    label="XLM Price Oracle"
                    value="CoinGecko"
                    description="Median aggregated across Chainlink CRE nodes"
                    status="neutral"
                  />
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="w-4 h-4 text-accent" />
                  <p className="text-text-primary text-sm font-semibold">Credit Parameters</p>
                </div>
                <div className="space-y-1">
                  <ParamRow
                    label="Max Credit Utilization"
                    value="80%"
                    description="Protocol-wide cap; CRE triggers pause if exceeded"
                    status="healthy"
                  />
                  <ParamRow
                    label="Current Utilization"
                    value="24%"
                    description="24% of total credit capacity used"
                    status="healthy"
                  />
                  <ParamRow
                    label="Credit Score Range"
                    value="0 – 1000"
                    description="AI model by Chainlink CRE WF2; on-chain attestation"
                    status="neutral"
                  />
                  <ParamRow
                    label="Minimum Score for Credit"
                    value="400"
                    description="Score below Fair tier — no credit line issued"
                    status="neutral"
                  />
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.12}>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Globe className="w-4 h-4 text-accent" />
                  <p className="text-text-primary text-sm font-semibold">Fee Structure</p>
                </div>
                <div className="space-y-1">
                  <ParamRow
                    label="Annual Fee"
                    value="$0.00"
                    description="No annual card fee — ever"
                    status="healthy"
                  />
                  <ParamRow
                    label="Transfer Fee"
                    value="0.1%"
                    description="On-chain Stellar transaction fee (Soroban)"
                    status="neutral"
                  />
                  <ParamRow
                    label="Bridge Fee"
                    value="0.25%"
                    description="Cross-chain bridge; CRE consensus required"
                    status="neutral"
                  />
                  <ParamRow
                    label="Late Payment Fee"
                    value="1.5%/mo"
                    description="Applied to overdue credit balance automatically"
                    status="neutral"
                  />
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Lock className="w-4 h-4 text-accent" />
                  <p className="text-text-primary text-sm font-semibold">Security Parameters</p>
                </div>
                <div className="space-y-1">
                  <ParamRow
                    label="CRE Attestation Interval"
                    value="30s"
                    description="Proof of Reserve + Risk Monitor cadence"
                    status="healthy"
                  />
                  <ParamRow
                    label="Oracle Quorum"
                    value="f+1"
                    description="Byzantine-fault-tolerant consensus across nodes"
                    status="healthy"
                  />
                  <ParamRow
                    label="Multi-Sig Threshold"
                    value="3 / 5"
                    description="Protocol parameter changes require 3-of-5 signers"
                    status="neutral"
                  />
                  <ParamRow
                    label="Timelock (param changes)"
                    value="48h"
                    description="All governance changes delayed for community review"
                    status="neutral"
                  />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── GOVERNANCE PROCESS ───────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-bg-secondary/30 border-y border-border/30">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="mb-12">
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">
              How We Govern
            </p>
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-3">
              Governance Process
            </h2>
            <p className="text-text-secondary text-sm max-w-2xl leading-relaxed">
              Protocol changes follow a structured, transparent process. Every decision is
              proposed publicly, debated by the community, and enforced on-chain via multi-sig.
            </p>
          </FadeIn>

          <div className="space-y-5">
            {[
              {
                number: "01",
                icon: FileText,
                title: "Proposal",
                description:
                  "Any community member can propose a protocol change. Proposals are published on-chain with full rationale, impact analysis, and proposed parameter values.",
                status: "Active",
              },
              {
                number: "02",
                icon: Users,
                title: "Community Discussion",
                description:
                  "A 72-hour open discussion period. Community members can comment, question, and suggest amendments. All discussion is public and permanent.",
                status: "Active",
              },
              {
                number: "03",
                icon: Vote,
                title: "On-Chain Vote",
                description:
                  "Voting opens for 5 days. Token holders vote proportionally. Quorum: 10% of circulating supply. Passing threshold: 66% majority.",
                status: "Coming Soon",
              },
              {
                number: "04",
                icon: RefreshCw,
                title: "48h Timelock",
                description:
                  "Approved changes enter a 48-hour timelock. Community can veto with emergency multi-sig if a critical flaw is discovered post-vote.",
                status: "Active",
              },
              {
                number: "05",
                icon: CheckCircle2,
                title: "Execution",
                description:
                  "Multi-sig executes the change on-chain. Chainlink CRE immediately adopts new parameters. All changes are fully auditable in transaction history.",
                status: "Active",
              },
            ].map((step, i) => (
              <FadeIn key={step.number} delay={i * 0.07}>
                <div className="glass rounded-xl p-5 flex items-start gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-bg-primary font-bold text-xs shadow-lg shadow-accent/20">
                    {step.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <step.icon className="w-4 h-4 text-accent" />
                      <p className="text-text-primary text-sm font-semibold">{step.title}</p>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          step.status === "Coming Soon"
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                    <p className="text-text-muted text-xs leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRANSPARENCY & AUDITS ────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="mb-10">
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">
              Trust by Design
            </p>
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-3">
              Transparency & Audits
            </h2>
            <p className="text-text-secondary text-sm max-w-xl leading-relaxed">
              Security is not a feature — it&apos;s a foundation. Everything is open, verified, and auditable.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Cpu,
                title: "Chainlink CRE Workflows",
                description: "5 live workflows on staging. WF1 (Reserve), WF2 (Credit AI), WF3 (Risk), WF4 (Privacy), WF5 (Bridge) — all source code public.",
                link: null,
                badge: "Live on Staging",
              },
              {
                icon: Shield,
                title: "Soroban Smart Contracts",
                description: "nUSD, nBRL, Credit Score, and Credit Line contracts deployed on Stellar Testnet. All open-source Rust code.",
                link: null,
                badge: "Testnet",
              },
              {
                icon: Globe,
                title: "EVM Contracts (Sepolia)",
                description: "ReserveAttestation, CreditScoreAttestation, RiskReport, and PrivacyCreditCheck — Chainlink Forwarder integrated.",
                link: null,
                badge: "Sepolia",
              },
              {
                icon: Lock,
                title: "Chainlink Privacy",
                description: "WF4 uses TEE-secured computation. Only boolean eligibility results published on-chain. Credentials never stored or transmitted in cleartext.",
                link: "https://chain.link/privacy",
                badge: null,
              },
              {
                icon: CheckCircle2,
                title: "Non-Custodial by Design",
                description: "NexusFi never holds user funds. Smart contracts enforce all rules. Your passkey = your wallet. No admin override.",
                link: null,
                badge: null,
              },
              {
                icon: AlertCircle,
                title: "Bug Bounty",
                description: "Responsible disclosure program coming soon. All critical findings will be publicly disclosed with full post-mortems.",
                link: null,
                badge: "Coming Soon",
              },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.06}>
                <div className="glass rounded-2xl p-6 h-full flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <item.icon className="w-4.5 h-4.5 text-accent" />
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-text-primary text-sm font-semibold mb-1.5">{item.title}</p>
                    <p className="text-text-muted text-xs leading-relaxed">{item.description}</p>
                  </div>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-accent text-xs font-medium hover:underline mt-auto"
                    >
                      Learn more
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-bg-secondary/30 border-t border-border/30">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Your Voice in the Protocol
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-8 max-w-xl mx-auto">
              NexusFi is governed by the people who use it. Open an account and become part
              of the community shaping the future of decentralized finance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="flex items-center gap-2 px-8 py-3.5 gradient-accent rounded-xl font-semibold text-bg-primary shadow-lg shadow-accent/20 hover:opacity-90 transition-opacity text-sm"
              >
                Open Account
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 px-8 py-3.5 glass rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/30 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg gradient-accent flex items-center justify-center">
              <Shield className="w-3 h-3 text-bg-primary" />
            </div>
            <span className="font-serif font-bold text-gradient">NexusFi</span>
            <span className="text-border/60 ml-2">© 2026 · Chainlink Convergence Hackathon</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              All systems operational
            </span>
            <Link href="/" className="hover:text-text-primary transition-colors">Home</Link>
            <a
              href="https://chain.link/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-primary transition-colors"
            >
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
