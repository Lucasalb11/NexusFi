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
import express from "express";
import cors from "cors";
import { env } from "./lib/validate-env.js";
import { demoAuth } from "./middleware/auth.js";
import walletRoutes from "./routes/wallet.js";
import creditRoutes from "./routes/credit.js";
import depositRoutes from "./routes/deposit.js";
import creRoutes from "./routes/cre.js";

const app = express();
const port = env.PORT ?? 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    methods: ["GET", "POST"],
  }),
);
app.use(express.json());
app.use(demoAuth);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/wallet", walletRoutes);
app.use("/api/credit", creditRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/cre", creRoutes);

app.listen(port, () => {
  console.log(`NexusFi Backend running at http://localhost:${port}`);
  console.log(`  /health            — Health check`);
  console.log(`  /api/wallet/*      — Wallet operations`);
  console.log(`  /api/credit/*      — Credit scoring & card`);
  console.log(`  /api/deposit/*     — Deposit/Withdraw`);
  console.log(`  /api/cre/*         — CRE workflow status`);
});
