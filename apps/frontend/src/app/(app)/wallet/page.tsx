"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Copy,
  Check,
  Search,
  Camera,
  ScanLine,
  QrCode,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import clsx from "clsx";
import TransactionList from "@/components/TransactionList";
import { MOCK_TRANSACTIONS } from "@/lib/mock-data";
import { useWallet } from "@/context/WalletContext";
import { shortenAddress } from "@/lib/format";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

type Tab = "history" | "send" | "receive";

type ParsedQrPayment = {
  to: string;
  amount?: number;
  token?: string;
};

function isValidTransferAddress(value: string) {
  // Stellar addresses and contract ids in this app are uppercase and long enough.
  return /^[A-Z0-9]{20,}$/.test(value.trim());
}

function parsePaymentQrPayload(payload: string): ParsedQrPayment {
  const text = payload.trim();
  if (!text) {
    throw new Error("Empty QR content");
  }

  const fromUrl = (() => {
    try {
      const url = new URL(text.replace(/^nexusfi:\/\//, "https://nexusfi.local/"));
      const to = url.searchParams.get("to")?.trim() ?? "";
      const amountRaw = url.searchParams.get("amount");
      const token = url.searchParams.get("token") ?? undefined;
      if (!to) return null;
      const amount = amountRaw ? Number(amountRaw) : undefined;
      return {
        to,
        amount: Number.isFinite(amount) ? amount : undefined,
        token,
      };
    } catch {
      return null;
    }
  })();

  if (fromUrl) {
    if (!isValidTransferAddress(fromUrl.to)) {
      throw new Error("Invalid recipient address in QR");
    }
    return fromUrl;
  }

  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as {
        type?: string;
        to?: string;
        amount?: number;
        token?: string;
      };
      const to = parsed.to?.trim() ?? "";
      if (parsed.type !== "nexusfi-payment-request" || !to) {
        throw new Error("Invalid NexusFi QR payload");
      }
      if (!isValidTransferAddress(to)) {
        throw new Error("Invalid recipient address in QR");
      }
      return {
        to,
        amount: typeof parsed.amount === "number" ? parsed.amount : undefined,
        token: parsed.token,
      };
    } catch {
      throw new Error("Could not parse QR payload");
    }
  }

  if (isValidTransferAddress(text)) {
    return { to: text };
  }

  throw new Error("Unsupported QR format");
}

export default function WalletPage() {
  const { address } = useWallet();
  const walletAddress = address ?? "";

  const [tab, setTab] = useState<Tab>("history");
  const [copied, setCopied] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [requestAmount, setRequestAmount] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scannerStatus, setScannerStatus] = useState("Align the QR code inside camera frame");
  const [scanSuccessNotice, setScanSuccessNotice] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isReadingRef = useRef(false);

  const receiveQrPayload = useMemo(() => {
    const amount = Number(requestAmount);
    const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : undefined;

    return JSON.stringify({
      type: "nexusfi-payment-request",
      v: 1,
      to: walletAddress,
      token: "nUSD",
      amount: safeAmount,
      createdAt: new Date().toISOString(),
    });
  }, [walletAddress, requestAmount]);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stopScanner = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    isReadingRef.current = false;
    setScannerOpen(false);
  };

  const applyScannedPayment = (payload: string) => {
    const parsed = parsePaymentQrPayload(payload);
    setSendTo(parsed.to);

    if (typeof parsed.amount === "number" && parsed.amount > 0) {
      setSendAmount(String(parsed.amount));
    }

    setTab("send");
    setScanSuccessNotice(
      typeof parsed.amount === "number" && parsed.amount > 0
        ? "QR loaded: recipient and amount filled."
        : "QR loaded: recipient filled.",
    );
    stopScanner();
  };

  const openScanner = async () => {
    setScannerError(null);
    setScannerStatus("Starting camera...");
    setScannerOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      mediaStreamRef.current = stream;

      if (!videoRef.current) {
        throw new Error("Camera view not ready");
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const BarcodeDetectorCtor = (
        window as Window & {
          BarcodeDetector?: new (options?: { formats?: string[] }) => {
            detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
          };
        }
      ).BarcodeDetector;

      if (!BarcodeDetectorCtor) {
        throw new Error("QR scanning is not supported in this browser");
      }

      const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
      setScannerStatus("Point camera to a NexusFi QR");

      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || isReadingRef.current) return;
        isReadingRef.current = true;
        try {
          const found = await detector.detect(videoRef.current);
          const value = found[0]?.rawValue;
          if (value) {
            applyScannedPayment(value);
          }
        } catch {
          // Keep reading attempts alive while user adjusts camera.
        } finally {
          isReadingRef.current = false;
        }
      }, 350);
    } catch (err: any) {
      setScannerError(err?.message ?? "Failed to open camera");
      setScannerOpen(false);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    }
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

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
              <div className="glass rounded-xl p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium">Pay another NexusFi user</p>
                  <p className="text-[10px] text-text-muted">Type address or scan QR with camera</p>
                </div>
                <button
                  type="button"
                  onClick={openScanner}
                  className="px-3 py-2 rounded-lg border border-border/30 text-xs font-medium flex items-center gap-2 hover:border-accent/50 transition-colors"
                >
                  <Camera size={14} />
                  Scan QR
                </button>
              </div>

              {scanSuccessNotice && (
                <div className="p-3 rounded-lg text-xs bg-success/10 border border-success/20 text-success">
                  {scanSuccessNotice}
                </div>
              )}

              {scannerOpen && (
                <div className="glass rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium flex items-center gap-2">
                      <ScanLine size={14} />
                      Scan NexusFi QR
                    </p>
                    <button
                      type="button"
                      onClick={stopScanner}
                      className="p-1.5 rounded-md hover:bg-bg-elevated/50 transition-colors"
                      aria-label="Close scanner"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-border/30 bg-black/80">
                    <video
                      ref={videoRef}
                      className="w-full h-56 object-cover"
                      muted
                      playsInline
                    />
                  </div>
                  <p className="text-[11px] text-text-muted">{scannerStatus}</p>
                </div>
              )}

              {scannerError && (
                <div className="p-3 rounded-lg text-xs bg-danger/10 border border-danger/20 text-danger">
                  {scannerError}. Try using Chrome on mobile or paste recipient address manually.
                </div>
              )}

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
            <div className="w-full glass rounded-xl p-4 space-y-2">
              <label className="text-[10px] text-text-muted uppercase tracking-widest block">
                Request amount (optional nUSD)
              </label>
              <input
                type="number"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full p-3 rounded-lg bg-bg-primary border border-border/40 text-sm font-semibold focus:border-accent/50 outline-none transition-colors tabular-nums"
              />
              <p className="text-[10px] text-text-muted">
                This amount will be encoded in QR so another NexusFi user can pay instantly.
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="bg-white rounded-xl p-4">
                <QRCodeSVG
                  value={receiveQrPayload}
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
              Share this QR to receive from another NexusFi user. It contains your wallet and optional amount.
            </p>

            <div className="w-full glass rounded-xl p-3 flex items-center gap-2">
              <QrCode size={14} className="text-text-muted shrink-0" />
              <p className="text-[10px] text-text-muted break-all">{receiveQrPayload}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
