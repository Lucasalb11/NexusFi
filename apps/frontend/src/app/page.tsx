"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Shield,
  Zap,
  Lock,
  TrendingUp,
  Globe,
  CreditCard,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Wifi,
  Eye,
  BarChart3,
  Cpu,
  RefreshCw,
  Users,
  ExternalLink,
  Star,
} from "lucide-react";
import PublicHeader from "@/components/PublicHeader";

// ─── Fade-in section wrapper ──────────────────────────────────────────────────

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
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Demo credit card (no props needed for landing) ──────────────────────────

function LandingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -12, rotateX: 4 }}
      animate={{ opacity: 1, rotateY: 0, rotateX: 0 }}
      transition={{ type: "spring", stiffness: 80, delay: 0.3 }}
      style={{ perspective: "1000px" }}
      className="w-full"
    >
      <div className="relative w-full max-w-sm mx-auto aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1c2a4a] via-[#0f1a30] to-[#070d1a]" />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 20% 30%, rgba(191,163,107,0.12) 0%, transparent 60%)",
        }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "linear-gradient(rgba(191,163,107,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(191,163,107,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        {/* Border */}
        <div className="absolute inset-0 rounded-2xl border border-accent/20" />

        <div className="relative z-10 flex flex-col justify-between h-full p-7">
          {/* Top row */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-accent text-[10px] uppercase tracking-[0.3em] font-semibold">
                NexusFi
              </p>
              <p className="text-white/40 text-[9px] mt-0.5 tracking-widest uppercase">
                Decentralized Credit
              </p>
            </div>
            <Wifi size={18} className="text-accent/50 rotate-90 mt-0.5" />
          </div>

          {/* Chip */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 rounded bg-gradient-to-br from-accent/80 to-accent/40 border border-accent/30" />
          </div>

          {/* Card number + holder */}
          <div>
            <p className="text-white/25 text-[9px] uppercase tracking-[0.2em] mb-1">Card Number</p>
            <p className="text-white/70 text-base tracking-[0.3em] font-mono font-light mb-4">
              •••• •••• •••• 9418
            </p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/25 text-[9px] uppercase tracking-[0.2em]">Holder</p>
                <p className="text-white/75 text-xs font-medium uppercase tracking-wider">
                  YOUR NAME HERE
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/25 text-[9px] uppercase tracking-[0.2em]">Available</p>
                <p className="text-accent text-sm font-semibold">$5,000.00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
          <motion.div
            className="h-full"
            style={{ background: "linear-gradient(90deg, rgb(191,163,107), rgb(212,190,140))" }}
            initial={{ width: 0 }}
            animate={{ width: "28%" }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 1 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="glass rounded-2xl p-6 flex flex-col gap-4 hover:border-accent/30 transition-colors duration-300 group">
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
          <Icon className="w-5 h-5 text-accent" />
        </div>
        {badge && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-1 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-text-primary text-sm mb-1.5">{title}</h3>
        <p className="text-text-muted text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Step ─────────────────────────────────────────────────────────────────────

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0 w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-bg-primary font-bold text-sm shadow-lg shadow-accent/20">
        {number}
      </div>
      <div className="pt-1.5">
        <h3 className="font-semibold text-text-primary text-sm mb-1">{title}</h3>
        <p className="text-text-muted text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden">
      <PublicHeader />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgb(191,163,107), transparent)" }}
        />

        <div className="relative max-w-3xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-accent font-medium mb-8 border-accent/20"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Powered by Chainlink × Stellar
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6"
          >
            <span className="text-text-primary">Your Bank.</span>
            <br />
            <span className="text-gradient">Decentralized.</span>
            <br />
            <span className="text-text-primary">Yours.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-text-secondary text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Bank-grade financial services without the bank. AI-powered credit scoring,
            Chainlink-secured privacy, and real-time proof of reserves — all on your terms.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 gradient-accent rounded-xl font-semibold text-bg-primary shadow-xl shadow-accent/20 hover:opacity-90 transition-opacity text-sm"
            >
              Open Your Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/governance"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 glass rounded-xl font-medium text-text-secondary hover:text-text-primary transition-colors text-sm"
            >
              View Governance
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-3 gap-4 max-w-lg mx-auto"
          >
            {[
              { value: "$2.4M", label: "Total Value Locked" },
              { value: "8,300+", label: "Active Users" },
              { value: "99.9%", label: "Uptime SLA" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl py-4 px-2">
                <p className="font-serif text-xl font-bold text-gradient">{stat.value}</p>
                <p className="text-text-muted text-[11px] mt-0.5 leading-tight">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-text-muted text-xs"
        >
          <span>Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-8 bg-gradient-to-b from-text-muted to-transparent"
          />
        </motion.div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────────────── */}
      <section className="py-8 border-y border-border/30 bg-bg-secondary/40">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {[
              { label: "Chainlink CRE", sub: "Compute & Privacy" },
              { label: "Stellar Network", sub: "Settlement Layer" },
              { label: "Soroban Smart Contracts", sub: "On-chain Logic" },
              { label: "Sepolia EVM", sub: "Cross-chain Attestation" },
              { label: "Passkey Auth", sub: "WebAuthn / FIDO2" },
            ].map((p) => (
              <div key={p.label} className="text-center">
                <p className="text-text-secondary text-xs font-semibold tracking-wide">{p.label}</p>
                <p className="text-text-muted text-[10px] mt-0.5">{p.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CREDIT CARD ──────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Card visual */}
            <FadeIn>
              <LandingCard />
            </FadeIn>

            {/* Benefits */}
            <FadeIn delay={0.15}>
              <div>
                <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-3">
                  DeFi Credit Card
                </p>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary mb-6 leading-tight">
                  The Credit Card That Works for You
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed mb-8">
                  No credit history? No problem. Our AI analyzes your on-chain activity to build
                  a verifiable credit score — then gives you a credit line you actually control.
                </p>

                <div className="space-y-4">
                  {[
                    {
                      icon: BarChart3,
                      title: "AI Credit Scoring",
                      desc: "Your on-chain history, analyzed by Chainlink CRE across decentralized nodes. No bank needed.",
                    },
                    {
                      icon: Lock,
                      title: "Privacy-First Transactions",
                      desc: "Chainlink's Trusted Execution Environment ensures your credentials and financial data never touch the blockchain.",
                    },
                    {
                      icon: Zap,
                      title: "Instant Cross-Chain Payments",
                      desc: "Send nUSD across Stellar, Ethereum, Polygon and more in seconds — backed by real reserves.",
                    },
                    {
                      icon: TrendingUp,
                      title: "Zero Hidden Fees",
                      desc: "Transparent on-chain fee structure. No annual fees, no surprise charges. Auditable by anyone.",
                    },
                    {
                      icon: Shield,
                      title: "100% Collateralized",
                      desc: "Every nUSD is backed by verifiable reserves, proven in real time via Proof of Reserve workflow.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mt-0.5">
                        <item.icon className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-text-primary text-sm font-medium mb-0.5">{item.title}</p>
                        <p className="text-text-muted text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 gradient-accent rounded-xl text-sm font-semibold text-bg-primary shadow-lg shadow-accent/20 hover:opacity-90 transition-opacity"
                  >
                    Apply Now — It's Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-3">
              Full Protocol Suite
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Everything Finance, Decentralized
            </h2>
            <p className="text-text-secondary text-sm max-w-xl mx-auto leading-relaxed">
              One platform, five financial primitives. No middlemen, no censorship, no custody risk.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: BarChart3,
                title: "AI Credit Scoring",
                description: "Chainlink CRE analyzes 50+ on-chain signals across decentralized oracle nodes. Tamper-proof, privacy-preserving credit assessment.",
                badge: "CRE & AI",
              },
              {
                icon: Lock,
                title: "Confidential Compute",
                description: "Chainlink TEE processes sensitive data inside a hardware-secured enclave. Your credentials and financial data never leave the enclave unencrypted.",
                badge: "Privacy",
              },
              {
                icon: Globe,
                title: "Cross-Chain Bridge",
                description: "Move nUSD between Stellar, Ethereum, Polygon, Solana and more. CRE verifies burns and authorizes mints across chains.",
                badge: "DeFi",
              },
              {
                icon: Shield,
                title: "Proof of Reserve",
                description: "Real-time attestation that every nUSD is 100% backed. CRE oracles verify reserves on Stellar Horizon every 30 seconds.",
                badge: "Live",
              },
              {
                icon: TrendingUp,
                title: "Risk Monitoring",
                description: "Automated circuit breakers protect the protocol. If reserve ratios drop below safe thresholds, minting is paused within seconds.",
                badge: "Compliance",
              },
              {
                icon: CreditCard,
                title: "Decentralized Credit Line",
                description: "Your credit line lives on-chain as a Soroban smart contract. Borrow, repay, and manage debt without a bank account.",
                badge: "DeFi",
              },
            ].map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 0.07}>
                <FeatureCard {...feature} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIVACY SECTION ──────────────────────────────────────────────── */}
      <section id="privacy" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <FadeIn>
              <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-3">
                Chainlink Privacy Computing
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary mb-6 leading-tight">
                Your Transactions Stay Private
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                Powered by Chainlink's Confidential Compute architecture. Your financial data,
                API credentials, and personal information are processed inside a hardware-secured
                Trusted Execution Environment (TEE) — never exposed on-chain.
              </p>

              <div className="space-y-5 mb-8">
                {[
                  {
                    step: "01",
                    title: "Encrypted at Source",
                    desc: "Your credentials are encrypted under the TEE's threshold public key before leaving your device.",
                  },
                  {
                    step: "02",
                    title: "Processed in Enclave",
                    desc: "The Chainlink oracle network routes computation to a hardware enclave. Credentials are decrypted only inside — then discarded.",
                  },
                  {
                    step: "03",
                    title: "Only Results On-Chain",
                    desc: "Only a cryptographic boolean (eligible: true/false) is published on-chain. No PII, no scores, no raw data — ever.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[10px] font-bold">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-medium mb-0.5">{item.title}</p>
                      <p className="text-text-muted text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a
                href="https://chain.link/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent text-sm font-medium hover:underline"
              >
                Learn about Chainlink Privacy
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </FadeIn>

            {/* Visual */}
            <FadeIn delay={0.15}>
              <div className="glass rounded-2xl p-8 space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-text-primary text-sm font-semibold">Trusted Execution Environment</p>
                    <p className="text-text-muted text-xs">Hardware-secured · Chainlink TEE</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-success text-xs">Active</span>
                  </div>
                </div>

                {[
                  { label: "Credentials on-chain", value: "Never", color: "text-success" },
                  { label: "PII stored on-chain", value: "Never", color: "text-success" },
                  { label: "Raw credit score on-chain", value: "Never", color: "text-success" },
                  { label: "Result published", value: "Boolean only", color: "text-accent" },
                  { label: "Hardware attestation", value: "TEE-signed", color: "text-accent" },
                  { label: "Oracle quorum required", value: "Yes (f+1)", color: "text-text-secondary" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                    <span className="text-text-muted text-xs">{row.label}</span>
                    <span className={`text-xs font-semibold ${row.color}`}>{row.value}</span>
                  </div>
                ))}

                <div className="pt-2 flex items-center gap-2 text-xs text-text-muted">
                  <Eye className="w-3.5 h-3.5 text-accent/60" />
                  <span>Compliant with GDPR · CCPA · LGPD</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── SECURITY ─────────────────────────────────────────────────────── */}
      <section id="security" className="py-24 px-6 bg-bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-3">
              Security Without Compromise
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Built Like a Bank. Trusted Like DeFi.
            </h2>
            <p className="text-text-secondary text-sm max-w-xl mx-auto leading-relaxed">
              We combine the security standards of institutional finance with the
              transparency and verifiability of decentralized protocols.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Shield,
                title: "Non-Custodial",
                desc: "Your keys, your assets. NexusFi never holds your funds. Smart contracts enforce all rules on-chain.",
              },
              {
                icon: RefreshCw,
                title: "Proof of Reserve",
                desc: "Every 30 seconds, Chainlink CRE verifies that nUSD reserves exceed 100% of supply. Public and on-chain.",
              },
              {
                icon: Users,
                title: "Multi-Sig Governance",
                desc: "Protocol parameters are controlled by a community multi-sig. No single point of control or failure.",
              },
              {
                icon: CheckCircle2,
                title: "Open Source",
                desc: "All Soroban contracts, CRE workflows, and backend code are publicly auditable on GitHub.",
              },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <div className="glass rounded-2xl p-6 text-center flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm mb-1.5">{item.title}</p>
                    <p className="text-text-muted text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-3">
              Getting Started
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Three Steps to Financial Freedom
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "1",
                title: "Create Your Passkey Wallet",
                description: "Sign up with a passkey — no seed phrases, no browser extensions. Your smart wallet is secured by your device's biometrics.",
              },
              {
                number: "2",
                title: "Build Your Credit Score",
                description: "Connect your Stellar address. Chainlink CRE analyzes your on-chain activity and computes a tamper-proof AI credit score.",
              },
              {
                number: "3",
                title: "Access Credit & Transact",
                description: "Receive a credit line backed by on-chain collateral. Send nUSD globally, bridge cross-chain, or hold in your DeFi wallet.",
              },
            ].map((step, i) => (
              <FadeIn key={step.number} delay={i * 0.1}>
                <div className="glass rounded-2xl p-6">
                  <Step {...step} />
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── GOVERNANCE CTA ───────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-bg-secondary/30 border-y border-border/30">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="glass rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-accent" />
                  <span className="text-accent text-xs font-semibold uppercase tracking-widest">Community Governed</span>
                </div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-text-primary mb-3">
                  A Protocol Built on Transparency
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  NexusFi is governed by its community. Protocol parameters, reserve ratios,
                  and fee structures are publicly visible and controlled by multi-sig governance.
                  No hidden decisions. No surprises.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <Link
                  href="/governance"
                  className="flex items-center justify-center gap-2 px-6 py-3 gradient-accent rounded-xl text-sm font-semibold text-bg-primary shadow-lg shadow-accent/20 hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  View Governance
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 px-6 py-3 glass-elevated rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap"
                >
                  Launch App
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(191,163,107,0.07), transparent 70%)" }}
        />
        <FadeIn className="relative max-w-2xl mx-auto">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-text-primary mb-5 leading-tight">
            Ready to Own Your
            <span className="text-gradient"> Financial Future?</span>
          </h2>
          <p className="text-text-secondary text-base leading-relaxed mb-10">
            Join thousands of users who have moved their finances on-chain.
            No banks. No borders. No permission required.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-10 py-4 gradient-accent rounded-xl font-semibold text-bg-primary shadow-2xl shadow-accent/25 hover:opacity-90 transition-opacity text-base"
          >
            Open Your Account — Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-text-muted text-xs mt-5">
            No credit check · No annual fees · Non-custodial · Open Source
          </p>
        </FadeIn>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/30 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-bg-primary" />
                </div>
                <span className="font-serif text-lg font-bold text-gradient">NexusFi</span>
              </div>
              <p className="text-text-muted text-xs leading-relaxed">
                Decentralized financial infrastructure built on Stellar and Chainlink.
                Your money, your rules.
              </p>
            </div>

            {[
              {
                title: "Product",
                links: [
                  { label: "Credit Card", href: "/login" },
                  { label: "Bridge", href: "/login" },
                  { label: "Wallet", href: "/login" },
                  { label: "Confidential", href: "/login" },
                ],
              },
              {
                title: "Protocol",
                links: [
                  { label: "Governance", href: "/governance" },
                  { label: "Proof of Reserve", href: "/governance" },
                  { label: "Treasury", href: "/governance" },
                  { label: "Risk Monitor", href: "/governance" },
                ],
              },
              {
                title: "Resources",
                links: [
                  { label: "Chainlink CRE", href: "https://chain.link", external: true },
                  { label: "Privacy Compute", href: "https://chain.link/privacy", external: true },
                  { label: "Stellar Network", href: "https://stellar.org", external: true },
                  { label: "Soroban Docs", href: "https://soroban.stellar.org", external: true },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
                  {col.title}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-muted hover:text-text-primary text-xs transition-colors flex items-center gap-1"
                        >
                          {link.label}
                          <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-text-muted hover:text-text-primary text-xs transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border/20 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
            <p>© 2026 NexusFi. Built for the Chainlink Convergence Hackathon.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                All systems operational
              </span>
              <span className="text-border/60">·</span>
              <a
                href="https://chain.link/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-primary transition-colors"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
