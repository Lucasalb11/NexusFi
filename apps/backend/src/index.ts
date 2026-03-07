/**
 * NexusFi — Backend Entry Point
 *
 * SECURITY: All secrets (API keys, Soroban keys, Chainlink credentials)
 * MUST come from environment variables loaded via .env (gitignored).
 * The validate-env module enforces this at startup — the server will
 * refuse to start in production if required secrets are missing.
 *
 * NEVER hardcode keys in this file or any source file.
 * NEVER log secret values. NEVER return them in API responses.
 */

import "dotenv/config";
import express, { type RequestHandler } from "express";
import cors from "cors";
import session from "express-session";
import { env } from "./lib/validate-env.js";
import { demoAuth } from "./middleware/auth.js";
import walletRoutes from "./routes/wallet.js";
import creditRoutes from "./routes/credit.js";
import depositRoutes from "./routes/deposit.js";
import { moonpayWebhookHandler } from "./routes/deposit.js";
import creRoutes from "./routes/cre.js";
import bridgeRoutes from "./routes/bridge.js";
import passkeyRoutes from "./routes/passkey.js";
import authRoutes from "./routes/auth.js";

const app = express();
const port = env.PORT ?? 3001;

const DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3002",
];

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL ?? "http://localhost:3000"
        : (origin: string | undefined, cb: (err: Error | null, allow?: boolean | string) => void) => {
            if (!origin || DEV_ORIGINS.includes(origin)) {
              cb(null, origin ?? true);
            } else {
              cb(null, false);
            }
          },
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

// MoonPay webhook MUST use raw body for signature verification (before express.json)
app.post(
  "/api/deposit/webhook",
  express.raw({ type: "application/json" }),
  (req, _res, next) => {
    const rawBody = (req as any).body?.toString?.() ?? "";
    (req as any).rawBody = rawBody;
    try {
      (req as any).body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      (req as any).body = {};
    }
    next();
  },
  moonpayWebhookHandler,
);

app.use(express.json());
const SESSION_SECRET = process.env.SESSION_SECRET ?? "nexusfi-dev-secret-change-in-production";
if (process.env.NODE_ENV === "production" && SESSION_SECRET === "nexusfi-dev-secret-change-in-production") {
  console.error("FATAL: SESSION_SECRET must be set in production. Generate: openssl rand -hex 32");
  process.exit(1);
}
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }) as unknown as RequestHandler,
);
app.use(demoAuth);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/credit", creditRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/cre", creRoutes);
app.use("/api/bridge", bridgeRoutes);
app.use("/api/passkey", passkeyRoutes);

app.listen(port, () => {
  console.log(`NexusFi Backend running at http://localhost:${port}`);
  console.log(`  /health            — Health check`);
  console.log(`  /api/auth/*        — Challenge/signature auth`);
  console.log(`  /api/wallet/*      — Wallet operations`);
  console.log(`  /api/credit/*      — Credit scoring & card`);
  console.log(`  /api/deposit/*     — Deposit/Withdraw`);
  console.log(`  /api/bridge/*      — Cross-chain bridge (CRE)`);
  console.log(`  /api/passkey/*     — Passkey smart wallet`);
  console.log(`  /api/cre/*         — CRE workflow status`);
});
