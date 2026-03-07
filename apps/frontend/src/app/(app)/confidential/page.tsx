"use client";

/**
 * Confidential HTTP — powered by Chainlink Confidential Compute (CCC)
 *
 * Architecture (from the CCC whitepaper):
 *   1. User encrypts API credentials under the CCC threshold public key (client-side).
 *   2. Application assembles an encrypted computation request.
 *   3. Oracle DON verifies the request, assigns it to a Compute Enclave.
 *   4. Decryption DON re-encrypts credential key-shares to the enclave's ephemeral key.
 *   5. Enclave decrypts credentials, executes the HTTPS request, discards secrets.
 *   6. Enclave produces a hardware TEE attestation over the response.
 *   7. Oracle DON verifies the attestation and quorum-signs the result.
 *
 * Ref: https://research.chain.link/confidential-compute.pdf  §4.1 Confidential Connectivity
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Loader2,
  X,
  Copy,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  Cpu,
  Network,
  KeyRound,
  FileJson,
  Globe,
  Clock,
  AlertCircle,
  Fingerprint,
  Server,
} from "lucide-react";
import clsx from "clsx";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "request" | "vault" | "history";
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type CredentialType = "api_key" | "bearer" | "basic" | "oauth2";
type RevealPolicy = "full" | "fields" | "hash";
type RequestStep = "build" | "credentials" | "policy" | "confirm" | "processing" | "result";
type HistoryStatus = "success" | "failed" | "pending";

type Header = { id: string; key: string; value: string };
type Credential = {
  id: string;
  name: string;
  type: CredentialType;
  encryptedBlob: string;
  createdAt: string;
  lastUsed: string | null;
  provider: string;
};
type HistoryItem = {
  id: string;
  url: string;
  method: Method;
  status: HistoryStatus;
  statusCode: number | null;
  credentialName: string;
  attestationHash: string;
  enclaveId: string;
  timestamp: string;
  revealedFields: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CCC_MASTER_KEY =
  "0x04a3b8f9d2c1e5...b7f2 (CCC Threshold Public Key)";

const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  api_key:  "API Key",
  bearer:   "Bearer Token",
  basic:    "Basic Auth",
  oauth2:   "OAuth 2.0",
};

const CREDENTIAL_TYPE_ICONS: Record<CredentialType, typeof KeyRound> = {
  api_key: KeyRound,
  bearer:  Lock,
  basic:   Fingerprint,
  oauth2:  Shield,
};

const PROCESSING_STEPS = [
  {
    id: "encrypt",
    label: "Encrypting credentials",
    sub: "Under CCC threshold public key",
    icon: Lock,
  },
  {
    id: "oracle",
    label: "Oracle DON — request verified",
    sub: "Quorum of oracle nodes assigned enclave",
    icon: Network,
  },
  {
    id: "decrypt_nodes",
    label: "Decryption DON — key re-share",
    sub: "Key shares re-encrypted to enclave's ephemeral key",
    icon: KeyRound,
  },
  {
    id: "tee",
    label: "TEE enclave executing",
    sub: "Confidential HTTPS request inside secure hardware",
    icon: Cpu,
  },
  {
    id: "attest",
    label: "Hardware attestation generated",
    sub: "TEE proves correct execution to Oracle DON",
    icon: ShieldCheck,
  },
];

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: "h1",
    url: "https://api.bloomberg.com/v2/rates/USD-BRL",
    method: "GET",
    status: "success",
    statusCode: 200,
    credentialName: "Bloomberg API",
    attestationHash: "0xab12cd34ef56...9012",
    enclaveId: "enc-aws-sgx-0x4f2a",
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    revealedFields: ["$.rate", "$.timestamp"],
  },
  {
    id: "h2",
    url: "https://api.clearbit.com/v1/kyc/verify",
    method: "POST",
    status: "success",
    statusCode: 200,
    credentialName: "Clearbit KYC",
    attestationHash: "0x8a7c1d9e2f30...4456",
    enclaveId: "enc-gcp-sgx-0x9b3e",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    revealedFields: ["$.isVerified"],
  },
  {
    id: "h3",
    url: "https://data.refinitiv.com/portfolio/weights",
    method: "GET",
    status: "failed",
    statusCode: 403,
    credentialName: "Refinitiv Feed",
    attestationHash: "",
    enclaveId: "enc-aws-sgx-0x4f2a",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    revealedFields: [],
  },
];

const MOCK_VAULT: Credential[] = [
  {
    id: "c1",
    name: "Bloomberg API",
    type: "api_key",
    encryptedBlob: "0xCCC::AES256GCM::enc::7f3a9b2c1d4e5f6a...",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    lastUsed: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    provider: "Bloomberg",
  },
  {
    id: "c2",
    name: "Clearbit KYC",
    type: "bearer",
    encryptedBlob: "0xCCC::AES256GCM::enc::2a4d6e8f1b3c5e7a...",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    provider: "Clearbit",
  },
  {
    id: "c3",
    name: "Refinitiv Feed",
    type: "oauth2",
    encryptedBlob: "0xCCC::AES256GCM::enc::9c8d7e6f5a4b3c2d...",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    provider: "Refinitiv",
  },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function shortHash(h: string) {
  return h.length > 16 ? `${h.slice(0, 10)}...${h.slice(-6)}` : h;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-bg-card border border-border/20">
      {(["request", "vault", "history"] as Tab[]).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={clsx(
            "flex-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-all uppercase tracking-wider",
            tab === t
              ? "bg-accent text-bg-primary"
              : "text-text-muted hover:text-text-secondary"
          )}
        >
          {t === "request" ? "Request" : t === "vault" ? "Vault" : "History"}
        </button>
      ))}
    </div>
  );
}

/** Floating label badge shown on encrypted items */
function EncryptedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-success/10 border border-success/20 text-success text-[9px] font-bold uppercase tracking-wider">
      <Lock size={8} />
      Encrypted
    </span>
  );
}

/** The 5-step pipeline visual from the whitepaper */
function PipelineViz({ active }: { active: number }) {
  return (
    <div className="space-y-3 w-full">
      {PROCESSING_STEPS.map((step, idx) => {
        const done    = idx < active;
        const current = idx === active;
        const pending = idx > active;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-start gap-3">
            {/* Connector line */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={clsx(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-500",
                  done    ? "bg-success/20 border border-success/30"  :
                  current ? "bg-accent/20 border border-accent/40"    :
                            "bg-bg-elevated border border-border/30"
                )}
              >
                {done ? (
                  <CheckCircle2 size={13} className="text-success" />
                ) : current ? (
                  <Loader2 size={13} className="animate-spin text-accent" />
                ) : (
                  <Icon size={13} className="text-text-muted" />
                )}
              </div>
              {idx < PROCESSING_STEPS.length - 1 && (
                <div
                  className={clsx(
                    "w-px flex-1 min-h-[16px] my-1 transition-colors duration-700",
                    done ? "bg-success/40" : "bg-border/30"
                  )}
                />
              )}
            </div>

            {/* Label */}
            <div className={clsx("pb-3 transition-opacity duration-300", pending ? "opacity-30" : "opacity-100")}>
              <p className={clsx(
                "text-xs font-medium transition-colors",
                current ? "text-accent" : done ? "text-text-primary" : "text-text-secondary"
              )}>
                {step.label}
              </p>
              <p className="text-[10px] text-text-muted tracking-wide mt-0.5">{step.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── REQUEST TAB ──────────────────────────────────────────────────────────────

function RequestTab() {
  const [step, setStep]               = useState<RequestStep>("build");
  const [url, setUrl]                 = useState("");
  const [method, setMethod]           = useState<Method>("GET");
  const [headers, setHeaders]         = useState<Header[]>([]);
  const [body, setBody]               = useState("");
  const [selectedCred, setSelectedCred] = useState<Credential | null>(null);
  const [revealPolicy, setRevealPolicy] = useState<RevealPolicy>("fields");
  const [revealFields, setRevealFields] = useState("");
  const [pipelineStep, setPipelineStep] = useState(0);
  const [result, setResult]           = useState<{
    statusCode: number;
    data: string;
    attestation: {
      enclaveId: string;
      cloudProvider: string;
      attestationHash: string;
      oracleSigners: number;
      executedAt: string;
    };
  } | null>(null);
  const [copied, setCopied]           = useState(false);

  const addHeader = () =>
    setHeaders((h) => [...h, { id: crypto.randomUUID(), key: "", value: "" }]);
  const removeHeader = (id: string) =>
    setHeaders((h) => h.filter((x) => x.id !== id));
  const updateHeader = (id: string, field: "key" | "value", val: string) =>
    setHeaders((h) => h.map((x) => (x.id === id ? { ...x, [field]: val } : x)));

  const reset = useCallback(() => {
    setStep("build");
    setUrl("");
    setMethod("GET");
    setHeaders([]);
    setBody("");
    setSelectedCred(null);
    setRevealPolicy("fields");
    setRevealFields("");
    setPipelineStep(0);
    setResult(null);
  }, []);

  const handleSubmit = async () => {
    setStep("processing");
    setPipelineStep(0);

    for (let i = 0; i <= PROCESSING_STEPS.length - 1; i++) {
      await new Promise<void>((r) => setTimeout(r, 750 + i * 400));
      setPipelineStep(i + 1);
    }

    setResult({
      statusCode: 200,
      data: JSON.stringify(
        revealPolicy === "hash"
          ? { hash: "0x" + Math.random().toString(16).slice(2, 34) }
          : revealPolicy === "fields" && revealFields
          ? { rate: 5.12, timestamp: new Date().toISOString() }
          : {
              rate: 5.12,
              bid: 5.11,
              ask: 5.13,
              timestamp: new Date().toISOString(),
              source: "Bloomberg L.P.",
            },
        null,
        2
      ),
      attestation: {
        enclaveId:     "enc-aws-nitro-0x4f2a8c1d",
        cloudProvider: "AWS Nitro (us-east-1)",
        attestationHash:
          "0x" + Math.random().toString(16).slice(2, 18) + Math.random().toString(16).slice(2, 18),
        oracleSigners: 7,
        executedAt:    new Date().toISOString(),
      },
    });
    setStep("result");
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Build step ──────────────────────────────────────────────────────────────
  if (step === "build") {
    return (
      <motion.div
        key="build"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <p className="text-xs text-text-muted tracking-wide">
          Your API credentials are never transmitted in plaintext — they are
          encrypted inside a TEE (Trusted Execution Environment) via Chainlink
          Confidential Compute.
        </p>

        {/* URL + Method */}
        <div className="glass rounded-xl p-4 space-y-3">
          <label className="text-[10px] text-text-muted uppercase tracking-widest">Endpoint</label>
          <div className="flex gap-2">
            {/* Method selector */}
            <div className="relative">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as Method)}
                className="appearance-none bg-bg-elevated border border-border/40 rounded-lg px-3 pr-7 py-2.5 text-xs font-bold text-accent focus:border-accent/50 outline-none cursor-pointer"
              >
                {(["GET", "POST", "PUT", "PATCH", "DELETE"] as Method[]).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ChevronDown
                size={10}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>

            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.provider.com/endpoint"
              className="flex-1 p-2.5 rounded-lg bg-bg-primary border border-border/40 text-xs focus:border-accent/50 outline-none transition-colors font-mono placeholder:text-text-muted/40"
            />
          </div>
        </div>

        {/* Headers */}
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-text-muted uppercase tracking-widest">Headers</label>
            <button
              onClick={addHeader}
              className="flex items-center gap-1 text-[10px] text-accent font-medium tracking-wide"
            >
              <Plus size={11} /> Add
            </button>
          </div>
          {headers.length === 0 ? (
            <p className="text-xs text-text-muted italic">No custom headers</p>
          ) : (
            <div className="space-y-2">
              {headers.map((h) => (
                <div key={h.id} className="flex gap-2 items-center">
                  <input
                    value={h.key}
                    onChange={(e) => updateHeader(h.id, "key", e.target.value)}
                    placeholder="Key"
                    className="flex-1 p-2 rounded-lg bg-bg-primary border border-border/30 text-xs focus:border-accent/40 outline-none font-mono placeholder:text-text-muted/30"
                  />
                  <input
                    value={h.value}
                    onChange={(e) => updateHeader(h.id, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-1 p-2 rounded-lg bg-bg-primary border border-border/30 text-xs focus:border-accent/40 outline-none font-mono placeholder:text-text-muted/30"
                  />
                  <button
                    onClick={() => removeHeader(h.id)}
                    className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors"
                  >
                    <X size={12} className="text-danger" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        {(method === "POST" || method === "PUT" || method === "PATCH") && (
          <div className="glass rounded-xl p-4 space-y-3">
            <label className="text-[10px] text-text-muted uppercase tracking-widest flex items-center gap-2">
              <FileJson size={11} /> Request Body (JSON)
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={'{\n  "key": "value"\n}'}
              rows={5}
              className="w-full p-3 rounded-lg bg-bg-primary border border-border/30 text-xs font-mono focus:border-accent/40 outline-none transition-colors resize-none placeholder:text-text-muted/30"
            />
          </div>
        )}

        <button
          onClick={() => setStep("credentials")}
          disabled={!url}
          className="w-full py-4 rounded-xl bg-accent text-bg-primary font-semibold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed text-sm tracking-wide"
        >
          Attach Credentials
          <ChevronRight size={15} />
        </button>
      </motion.div>
    );
  }

  // ── Credentials step ────────────────────────────────────────────────────────
  if (step === "credentials") {
    return (
      <motion.div
        key="creds"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep("build")}
            className="text-[11px] text-text-muted hover:text-text-secondary tracking-wide"
          >
            ← Back
          </button>
          <span className="text-[10px] text-text-muted">·</span>
          <span className="text-[11px] text-text-muted font-mono truncate max-w-[180px]">{url}</span>
        </div>

        <p className="text-xs text-text-muted tracking-wide">
          Select the credentials to attach. They are stored in your encrypted
          Vault and will never be decrypted outside the TEE enclave.
        </p>

        <div className="space-y-2">
          {MOCK_VAULT.map((cred) => {
            const Icon = CREDENTIAL_TYPE_ICONS[cred.type];
            const selected = selectedCred?.id === cred.id;
            return (
              <button
                key={cred.id}
                onClick={() => setSelectedCred(selected ? null : cred)}
                className={clsx(
                  "w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left border",
                  selected
                    ? "bg-accent/10 border-accent/30"
                    : "glass border-transparent hover:border-border/50"
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-bg-elevated border border-border/30 flex items-center justify-center shrink-0">
                  <Icon size={15} className={selected ? "text-accent" : "text-text-muted"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{cred.name}</p>
                    <EncryptedBadge />
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {CREDENTIAL_TYPE_LABELS[cred.type]}
                    {cred.lastUsed && ` · Used ${timeAgo(cred.lastUsed)}`}
                  </p>
                </div>
                {selected && <CheckCircle2 size={16} className="text-accent shrink-0" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setStep("policy")}
          disabled={!selectedCred}
          className="w-full py-4 rounded-xl bg-accent text-bg-primary font-semibold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed text-sm tracking-wide"
        >
          Set Reveal Policy
          <ChevronRight size={15} />
        </button>
      </motion.div>
    );
  }

  // ── Policy step ─────────────────────────────────────────────────────────────
  if (step === "policy") {
    return (
      <motion.div
        key="policy"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep("credentials")}
            className="text-[11px] text-text-muted hover:text-text-secondary tracking-wide"
          >
            ← Back
          </button>
        </div>

        <p className="text-xs text-text-muted tracking-wide">
          The CCC enclave will only expose what you allow. Private fields remain
          sealed inside the hardware — not even oracle nodes see them.
        </p>

        <div className="space-y-2">
          {(
            [
              {
                id: "full" as RevealPolicy,
                label: "Full Response",
                desc: "Entire API response posted onchain",
                icon: Globe,
                warn: true,
              },
              {
                id: "fields" as RevealPolicy,
                label: "Selected Fields",
                desc: "Only specified JSONPath fields are revealed",
                icon: Eye,
                warn: false,
              },
              {
                id: "hash" as RevealPolicy,
                label: "Hash Only",
                desc: "Only a hash of the response is posted — maximum privacy",
                icon: EyeOff,
                warn: false,
              },
            ] as const
          ).map(({ id, label, desc, icon: Icon, warn }) => (
            <button
              key={id}
              onClick={() => setRevealPolicy(id)}
              className={clsx(
                "w-full flex items-start gap-3 p-4 rounded-xl transition-all text-left border",
                revealPolicy === id
                  ? "bg-accent/10 border-accent/30"
                  : "glass border-transparent hover:border-border/50"
              )}
            >
              <div
                className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 shrink-0",
                  revealPolicy === id
                    ? "bg-accent/20"
                    : "bg-bg-elevated border border-border/30"
                )}
              >
                <Icon
                  size={14}
                  className={revealPolicy === id ? "text-accent" : "text-text-muted"}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{label}</p>
                  {warn && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-bold uppercase tracking-wider">
                      Less Private
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted mt-0.5 tracking-wide">{desc}</p>
              </div>
              {revealPolicy === id && (
                <CheckCircle2 size={15} className="text-accent shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>

        {revealPolicy === "fields" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="glass rounded-xl p-4 space-y-2"
          >
            <label className="text-[10px] text-text-muted uppercase tracking-widest">
              JSONPath Fields (one per line)
            </label>
            <textarea
              value={revealFields}
              onChange={(e) => setRevealFields(e.target.value)}
              placeholder={"$.rate\n$.timestamp"}
              rows={3}
              className="w-full p-3 rounded-lg bg-bg-primary border border-border/30 text-xs font-mono focus:border-accent/40 outline-none resize-none placeholder:text-text-muted/30"
            />
          </motion.div>
        )}

        <button
          onClick={() => setStep("confirm")}
          className="w-full py-4 rounded-xl bg-accent text-bg-primary font-semibold flex items-center justify-center gap-2 text-sm tracking-wide"
        >
          Review & Confirm
          <ChevronRight size={15} />
        </button>
      </motion.div>
    );
  }

  // ── Confirm step ────────────────────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <motion.div
        key="confirm"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep("policy")}
            className="text-[11px] text-text-muted hover:text-text-secondary tracking-wide"
          >
            ← Back
          </button>
        </div>

        {/* Summary */}
        <div className="glass rounded-xl divide-y divide-border/20">
          <div className="p-4 flex items-center justify-between">
            <span className="text-[10px] text-text-muted uppercase tracking-widest">Endpoint</span>
            <span className="text-xs font-mono text-text-primary max-w-[200px] truncate">{url}</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <span className="text-[10px] text-text-muted uppercase tracking-widest">Method</span>
            <span className="text-xs font-bold text-accent">{method}</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <span className="text-[10px] text-text-muted uppercase tracking-widest">Credential</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">{selectedCred?.name}</span>
              <EncryptedBadge />
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <span className="text-[10px] text-text-muted uppercase tracking-widest">Reveal Policy</span>
            <span className="text-xs font-medium capitalize">{revealPolicy}</span>
          </div>
        </div>

        {/* CCC info */}
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <Cpu size={13} className="text-accent" />
            <p className="text-xs font-semibold text-accent">Chainlink Confidential Compute</p>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed tracking-wide">
            Credentials are encrypted under the CCC threshold public key before leaving this device.
            The decryption DON will re-encrypt key shares to the assigned enclave&apos;s ephemeral key.
            Your raw credentials are <strong className="text-text-secondary">never visible</strong> to any oracle node.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-text-muted font-mono break-all">
              Master PK: {CCC_MASTER_KEY}
            </span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-xl bg-accent text-bg-primary font-semibold flex items-center justify-center gap-2 text-sm tracking-wide"
        >
          <Lock size={15} />
          Submit Confidential Request
        </button>
      </motion.div>
    );
  }

  // ── Processing step ─────────────────────────────────────────────────────────
  if (step === "processing") {
    return (
      <motion.div
        key="processing"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-4 space-y-6"
      >
        <div className="text-center space-y-1">
          <p className="text-sm font-serif font-semibold">Processing in TEE</p>
          <p className="text-[11px] text-text-muted tracking-wide">
            Chainlink Confidential Compute Pipeline
          </p>
        </div>

        <PipelineViz active={pipelineStep} />

        <p className="text-center text-[10px] text-text-muted tracking-wider">
          Your credentials never leave the enclave in plaintext
        </p>
      </motion.div>
    );
  }

  // ── Result step ─────────────────────────────────────────────────────────────
  if (step === "result" && result) {
    return (
      <motion.div
        key="result"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4"
      >
        {/* Status banner */}
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-success/10 border border-success/20">
          <ShieldCheck size={16} className="text-success shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-success">TEE Attestation Verified</p>
            <p className="text-[10px] text-text-muted mt-0.5">
              Oracle DON quorum-signed — {result.attestation.oracleSigners}/10 signers
            </p>
          </div>
          <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-lg">
            {result.statusCode}
          </span>
        </div>

        {/* Response data */}
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <FileJson size={11} /> Response
              {revealPolicy !== "full" && (
                <span className="px-1.5 py-0.5 rounded bg-bg-elevated text-text-muted text-[9px] border border-border/30">
                  {revealPolicy === "hash" ? "Hash only" : "Filtered"}
                </span>
              )}
            </label>
            <button
              onClick={copyResult}
              className="flex items-center gap-1 text-[10px] text-text-muted hover:text-accent transition-colors"
            >
              {copied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="text-xs font-mono text-text-primary bg-bg-primary rounded-lg p-3 overflow-x-auto border border-border/20 leading-relaxed">
            {result.data}
          </pre>
        </div>

        {/* Attestation card */}
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Fingerprint size={13} className="text-accent" />
            <span className="text-[10px] text-text-muted uppercase tracking-widest">
              TEE Attestation
            </span>
          </div>

          {[
            { label: "Enclave ID",      value: result.attestation.enclaveId, mono: true },
            { label: "Cloud Provider",  value: result.attestation.cloudProvider, mono: false },
            { label: "Attest. Hash",    value: shortHash(result.attestation.attestationHash), mono: true },
            { label: "Oracle Signers",  value: `${result.attestation.oracleSigners}/10`, mono: false },
            {
              label: "Executed At",
              value: new Date(result.attestation.executedAt).toLocaleTimeString(),
              mono: false,
            },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <span className="text-text-muted">{label}</span>
              <span className={clsx("text-text-secondary", mono && "font-mono")}>{value}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button className="flex-1 py-3 rounded-xl glass text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-bg-elevated/60 transition-colors tracking-wide">
            <ExternalLink size={12} className="text-accent" />
            Verify Onchain
          </button>
          <button
            onClick={reset}
            className="flex-1 py-3 rounded-xl bg-accent text-bg-primary text-xs font-semibold tracking-wide"
          >
            New Request
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
}

// ─── VAULT TAB ────────────────────────────────────────────────────────────────

function VaultTab() {
  const [credentials, setCredentials] = useState<Credential[]>(MOCK_VAULT);
  const [showAdd, setShowAdd]         = useState(false);
  const [newName, setNewName]         = useState("");
  const [newType, setNewType]         = useState<CredentialType>("api_key");
  const [newValue, setNewValue]       = useState("");
  const [showValue, setShowValue]     = useState(false);
  const [encrypting, setEncrypting]   = useState(false);
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newName || !newValue) return;
    setEncrypting(true);
    await new Promise<void>((r) => setTimeout(r, 1200));

    const blob =
      "0xCCC::AES256GCM::enc::" +
      Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, "0")
      ).join("");

    setCredentials((prev) => [
      {
        id: crypto.randomUUID(),
        name: newName,
        type: newType,
        encryptedBlob: blob,
        createdAt: new Date().toISOString(),
        lastUsed: null,
        provider: newName,
      },
      ...prev,
    ]);
    setNewName("");
    setNewValue("");
    setEncrypting(false);
    setShowAdd(false);
  };

  const handleDelete = (id: string) =>
    setCredentials((c) => c.filter((x) => x.id !== id));

  return (
    <motion.div
      key="vault"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Master key info */}
      <div className="glass rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Server size={13} className="text-accent" />
          <span className="text-[10px] text-text-muted uppercase tracking-widest">
            CCC Threshold Master Key
          </span>
        </div>
        <p className="text-[10px] font-mono text-text-muted break-all leading-relaxed">
          {CCC_MASTER_KEY}
        </p>
        <p className="text-[10px] text-text-muted tracking-wide">
          All credentials are encrypted under this threshold public key.
          Decryption requires a quorum of the Decryption DON — no single node
          can decrypt alone.
        </p>
      </div>

      {/* Credentials list */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-widest text-text-secondary">
          Encrypted Credentials ({credentials.length})
        </h3>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-[11px] text-accent font-medium tracking-wide"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      <div className="space-y-2">
        {credentials.map((cred) => {
          const Icon     = CREDENTIAL_TYPE_ICONS[cred.type];
          const expanded = expandedId === cred.id;
          return (
            <div key={cred.id} className="glass rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(expanded ? null : cred.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-bg-elevated/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-bg-elevated border border-border/30 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{cred.name}</p>
                    <EncryptedBadge />
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {CREDENTIAL_TYPE_LABELS[cred.type]}
                    {cred.lastUsed
                      ? ` · Last used ${timeAgo(cred.lastUsed)}`
                      : " · Never used"}
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  className={clsx(
                    "text-text-muted transition-transform shrink-0",
                    expanded && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border/20"
                  >
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1">
                          Encrypted Blob (ciphertext)
                        </label>
                        <p className="text-[10px] font-mono text-text-secondary bg-bg-primary rounded-lg p-2 border border-border/20 break-all">
                          {cred.encryptedBlob}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-text-muted">
                        <span>Added {timeAgo(cred.createdAt)}</span>
                        <button
                          onClick={() => handleDelete(cred.id)}
                          className="flex items-center gap-1 text-danger hover:text-danger/80 transition-colors font-medium"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Add credential sheet */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => !encrypting && setShowAdd(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary rounded-t-2xl border-t border-border/30 max-w-lg mx-auto"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Add Credential</p>
                  <button
                    onClick={() => !encrypting && setShowAdd(false)}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X size={14} className="text-text-muted" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">
                      Name
                    </label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Bloomberg API"
                      className="w-full p-3 rounded-lg bg-bg-primary border border-border/40 text-sm focus:border-accent/50 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">
                      Type
                    </label>
                    <div className="relative">
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as CredentialType)}
                        className="w-full appearance-none bg-bg-primary border border-border/40 rounded-lg px-3 pr-8 py-3 text-sm focus:border-accent/50 outline-none"
                      >
                        {Object.entries(CREDENTIAL_TYPE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">
                      Secret Value
                    </label>
                    <div className="relative">
                      <input
                        type={showValue ? "text" : "password"}
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder="Paste your API key or token"
                        className="w-full p-3 pr-10 rounded-lg bg-bg-primary border border-border/40 text-sm font-mono focus:border-accent/50 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowValue((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                      >
                        {showValue ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-success/5 border border-success/15">
                    <Lock size={12} className="text-success mt-0.5 shrink-0" />
                    <p className="text-[10px] text-text-muted leading-relaxed tracking-wide">
                      The value will be encrypted client-side under the CCC
                      threshold public key before being stored. It will never be
                      accessible in plaintext outside the TEE.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={!newName || !newValue || encrypting}
                  className="w-full py-4 rounded-xl bg-accent text-bg-primary font-semibold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed text-sm tracking-wide"
                >
                  {encrypting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Encrypting under CCC key...
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      Encrypt & Store
                    </>
                  )}
                </button>
                <div className="pb-4" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── HISTORY TAB ──────────────────────────────────────────────────────────────

function HistoryTab() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {MOCK_HISTORY.length === 0 && (
        <p className="text-xs text-text-muted text-center py-12 tracking-wide">
          No confidential requests yet.
        </p>
      )}

      {MOCK_HISTORY.map((item) => {
        const ok  = item.status === "success";
        const exp = expanded === item.id;

        return (
          <div key={item.id} className="glass rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(exp ? null : item.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-bg-elevated/30 transition-colors"
            >
              {/* Status dot */}
              <div
                className={clsx(
                  "w-2 h-2 rounded-full shrink-0",
                  ok ? "bg-success" : item.status === "pending" ? "bg-warning animate-pulse" : "bg-danger"
                )}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-accent">{item.method}</span>
                  <p className="text-xs font-medium truncate">
                    {new URL(item.url).hostname}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-text-muted">{timeAgo(item.timestamp)}</span>
                  {ok && (
                    <span className="flex items-center gap-0.5 text-[10px] text-success">
                      <ShieldCheck size={9} /> Attested
                    </span>
                  )}
                  {!ok && (
                    <span className="flex items-center gap-0.5 text-[10px] text-danger">
                      <AlertCircle size={9} /> {item.statusCode ?? "Error"}
                    </span>
                  )}
                </div>
              </div>

              <ChevronDown
                size={13}
                className={clsx(
                  "text-text-muted transition-transform shrink-0",
                  exp && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {exp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border/20"
                >
                  <div className="p-4 space-y-3">
                    <div className="text-[10px] space-y-2">
                      <div className="flex justify-between">
                        <span className="text-text-muted uppercase tracking-wider">URL</span>
                        <span className="font-mono text-text-secondary max-w-[200px] truncate">{item.url}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted uppercase tracking-wider">Credential</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-text-secondary">{item.credentialName}</span>
                          <EncryptedBadge />
                        </div>
                      </div>
                      {item.revealedFields.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-text-muted uppercase tracking-wider">Revealed</span>
                          <span className="font-mono text-text-secondary">
                            {item.revealedFields.join(", ")}
                          </span>
                        </div>
                      )}
                      {ok && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-text-muted uppercase tracking-wider">Enclave</span>
                            <span className="font-mono text-text-secondary">{item.enclaveId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted uppercase tracking-wider">Attest. Hash</span>
                            <span className="font-mono text-text-secondary">{shortHash(item.attestationHash)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {ok && (
                      <button className="flex items-center gap-1.5 text-[10px] text-accent font-medium tracking-wide">
                        <ExternalLink size={10} /> Verify Attestation Onchain
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfidentialPage() {
  const [tab, setTab] = useState<Tab>("request");

  return (
    <div className="space-y-5 pt-6 pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-1"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Lock size={13} className="text-accent" />
          </div>
          <h1 className="text-lg font-serif font-semibold">Confidential HTTP</h1>
        </div>
        <p className="text-[10px] text-text-muted uppercase tracking-widest pl-9.5">
          Powered by Chainlink Confidential Compute · TEE + Threshold Crypto
        </p>
      </motion.div>

      {/* Architecture pill */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
      >
        {[
          { label: "Encrypt",       icon: Lock,        color: "text-accent"  },
          { label: "Oracle DON",    icon: Network,     color: "text-warning" },
          { label: "Decrypt DON",   icon: KeyRound,    color: "text-warning" },
          { label: "TEE Enclave",   icon: Cpu,         color: "text-success" },
          { label: "Attestation",   icon: ShieldCheck, color: "text-success" },
        ].map(({ label, icon: Icon, color }, i, arr) => (
          <div key={label} className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-bg-card border border-border/30">
              <Icon size={10} className={color} />
              <span className="text-[9px] font-medium tracking-wider text-text-secondary">{label}</span>
            </div>
            {i < arr.length - 1 && (
              <ChevronRight size={10} className="text-border/60 shrink-0" />
            )}
          </div>
        ))}
      </motion.div>

      {/* Tab bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12 }}
      >
        <TabBar tab={tab} onChange={setTab} />
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "request" && (
          <motion.div
            key="tab-request"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RequestTab />
          </motion.div>
        )}
        {tab === "vault" && (
          <motion.div
            key="tab-vault"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <VaultTab />
          </motion.div>
        )}
        {tab === "history" && (
          <motion.div
            key="tab-history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <HistoryTab />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <p className="text-center text-[9px] text-text-muted tracking-widest pt-2 uppercase">
        <Clock size={9} className="inline mr-1" />
        Credentials sealed · Need-to-know principle · Forward-secure per request
      </p>
    </div>
  );
}
