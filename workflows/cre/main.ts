/**
 * NexusFi — Chainlink CRE Workflows (Main Entry)
 *
 * SECURITY NOTICE:
 * - NEVER hardcode API keys, operator secrets, or wallet keys in this file.
 * - All credentials MUST come from secrets.yaml (gitignored) or environment
 *   variables injected at deploy time via `runtime.getSecret()`.
 *
 * CRE acts as the trusted orchestration layer between traditional finance
 * and the Stellar blockchain:
 *
 *   Frontend -> Backend -> CRE Workflow -> Stellar Horizon + Sepolia EVM
 *
 * This file bundles 5 workflows targeting 4 hackathon tracks:
 *
 * WF1: Proof of Reserve         (DeFi & Tokenization)
 * WF2: AI Credit Scoring        (CRE & AI)
 * WF3: Risk Monitor             (Risk & Compliance)
 * WF4: Privacy Credit Check     (Privacy)
 * WF5: Cross-Chain Bridge       (DeFi & Tokenization + CRE & AI)
 *
 * ============================================================================
 * NexusFi CRE Workflows — Trigger Index Mapping
 *
 * Trigger 0 (1 in interactive) → WF1: Proof of Reserve
 * Trigger 1 (2 in interactive) → WF2: AI Credit Scoring
 * Trigger 2 (3 in interactive) → WF3: Risk Monitor
 * Trigger 3 (4 in interactive) → WF4: Privacy Credit Check
 * Trigger 4 (5 in interactive) → WF5: Cross-Chain Bridge
 * ============================================================================
 */

import {
  CronCapability,
  HTTPClient,
  handler,
  Runner,
  ok,
  json,
  consensusMedianAggregation,
  ConsensusAggregationByFields,
  median,
  identical,
  type Runtime,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk";
import { z } from "zod";

// ============================================================================
// Config Schema (Zod — validated by CRE runtime)
// ============================================================================

const configSchema = z.object({
  schedule: z.string().default("*/30 * * * * *"),
  reserveAddress: z
    .string()
    .default("GBZXN3PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI"),
  bridgeWatchAddress: z
    .string()
    .default("GCTAOBTUFGLJ3HZRICJX4LVJLCUTW4RWRE4RV5B7XHNL3PD4TLX2TGUK"),
});

type Config = z.infer<typeof configSchema>;

// ============================================================================
// Shared Constants
// ============================================================================

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";

// ============================================================================
// Shared Types
// ============================================================================

interface StellarAccountResponse {
  balances: Array<{
    asset_type: string;
    balance: string;
    asset_code?: string;
  }>;
}

interface ReserveAttestation {
  totalSupplyNusd: number;
  reserveXlm: number;
  reserveUsd: number;
  ratio: number;
  status: string;
  timestamp: number;
}

interface TxMetrics {
  txCount: number;
  accountAgeDays: number;
}

interface CreditScoreAttestation {
  address: string;
  score: number;
  tier: string;
  txCount: number;
  accountAgeDays: number;
  timestamp: number;
}

interface RiskReport {
  reserveRatio: number;
  utilizationRate: number;
  priceDeviation: number;
  alertTriggered: number;
  timestamp: number;
}

interface BridgeAttestation {
  bridgeId: string;
  sourceChain: string;
  destChain: string;
  token: string;
  amount: number;
  burnVerified: number;
  mintAuthorized: number;
  timestamp: number;
}

interface CreditEligibilityResult {
  eligible: boolean;
  reason: string;
  confidential: boolean;
  rawDataOnChain: boolean;
  credentialsOnChain: boolean;
  timestamp: number;
}

// ============================================================================
// WF1: Proof of Reserve (DeFi & Tokenization Track)
// ============================================================================
// Trigger: Cron every 30 seconds (staging) / 5 minutes (production)
// Logic:
//   1. Fetch XLM balance from Stellar Horizon (reserve treasury address)
//   2. Fetch XLM/USD price from CoinGecko
//   3. Consensus across CRE nodes (median aggregation)
//   4. Compare USD reserves vs nUSD total supply
//   5. Write attestation to Sepolia ReserveAttestation contract

const fetchReserveXlm = (
  sendRequester: HTTPSendRequester,
  reserveAddress: string,
): number => {
  const response = sendRequester
    .sendRequest({ url: `${HORIZON_TESTNET}/accounts/${reserveAddress}`, method: "GET" })
    .result();

  if (!ok(response)) {
    // Account not found or Horizon unavailable — return 0 so simulation continues
    return 0;
  }

  const data = json(response) as StellarAccountResponse;
  const native = data.balances.find((b) => b.asset_type === "native");
  return native ? parseFloat(native.balance) : 0;
};

const fetchXlmPrice = (sendRequester: HTTPSendRequester): number => {
  const response = sendRequester
    .sendRequest({
      url: "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd",
      method: "GET",
    })
    .result();

  if (!ok(response)) {
    return 0.12; // fallback price for demo
  }

  const data = json(response) as { stellar?: { usd?: number } };
  return data.stellar?.usd ?? 0.12;
};

const onProofOfReserve = (runtime: Runtime<Config>): string => {
  console.log("[WF1] Proof of Reserve");
  runtime.log("WF1: Proof of Reserve — starting attestation cycle");

  const { reserveAddress } = runtime.config;
  const httpClient = new HTTPClient();

  // Each CRE node independently fetches the reserve balance; median aggregation
  const reserveXlm = httpClient
    .sendRequest(
      runtime,
      fetchReserveXlm,
      consensusMedianAggregation<number>(),
    )(reserveAddress)
    .result();

  // Each node independently fetches XLM price; median aggregation
  const xlmPrice = httpClient
    .sendRequest(
      runtime,
      fetchXlmPrice,
      consensusMedianAggregation<number>(),
    )()
    .result();

  const reserveUsd = reserveXlm * xlmPrice;

  // TODO: Read totalSupplyNusd from Soroban contract via backend API or
  // Stellar RPC. Hardcoded to 1,200,000 for the demo.
  const totalSupplyNusd = 1_200_000;

  const ratio = totalSupplyNusd > 0 ? reserveUsd / totalSupplyNusd : 0;
  const status = ratio >= 1.0 ? "HEALTHY" : ratio >= 0.95 ? "WARNING" : "CRITICAL";

  const attestation: ReserveAttestation = {
    totalSupplyNusd,
    reserveXlm,
    reserveUsd: Math.round(reserveUsd * 100) / 100,
    ratio: Math.round(ratio * 10000) / 10000,
    status,
    timestamp: Date.now(),
  };

  runtime.log(`WF1: Reserve XLM=${reserveXlm}, USD=${attestation.reserveUsd}`);
  runtime.log(`WF1: nUSD Supply=${totalSupplyNusd}, Ratio=${attestation.ratio}, Status=${status}`);
  runtime.log(`WF1: Attestation=${JSON.stringify(attestation)}`);

  // Production: write attestation to Sepolia ReserveAttestation.sol
  // See contracts/evm/src/ReserveAttestation.sol for the ABI.
  // evmClient.writeReport(runtime, { ... })

  return JSON.stringify(attestation);
};

// ============================================================================
// WF2: AI Credit Scoring (CRE & AI Track)
// ============================================================================
// Trigger: Cron (or on-demand via HTTP trigger)
// Logic:
//   1. Fetch Stellar transaction metrics (count, account age) via Horizon
//   2. Aggregate numeric metrics with median consensus across nodes
//   3. Compute credit score using weighted model (simulating LLM analysis)
//   4. Write score to Sepolia CreditScoreAttestation contract
//
// Production: replace local scoring model with HTTP POST to Gemini/OpenAI
// using `runtime.getSecret("GEMINI_API_KEY")` for credential injection.

/**
 * Node-level function: fetches transaction count and account age from Horizon.
 * Returns numeric data suitable for median aggregation.
 */
const fetchTxMetrics = (
  sendRequester: HTTPSendRequester,
  address: string,
): TxMetrics => {
  const response = sendRequester
    .sendRequest({
      url: `${HORIZON_TESTNET}/accounts/${address}/transactions?order=desc&limit=50`,
      method: "GET",
    })
    .result();

  if (!ok(response)) {
    return { txCount: 0, accountAgeDays: 0 };
  }

  const data = json(response) as { _embedded?: { records: any[] } };
  const records = data._embedded?.records ?? [];
  const txCount = records.length;

  let accountAgeDays = 0;
  if (records.length > 0) {
    const oldest = records[records.length - 1];
    if (oldest?.created_at) {
      accountAgeDays = Math.floor(
        (Date.now() - new Date(oldest.created_at).getTime()) / 86_400_000,
      );
    }
  }

  return { txCount, accountAgeDays };
};

/**
 * Compute credit score from aggregated on-chain metrics.
 * In production: this would call a Gemini/OpenAI API via confidential HTTP
 * with the transaction data, then parse the LLM's structured response.
 */
const computeCreditScore = (
  metrics: TxMetrics,
  address: string,
): CreditScoreAttestation => {
  const { txCount, accountAgeDays } = metrics;

  // Weighted scoring model (simulating LLM-derived weights)
  const ageScore = Math.min(200, Math.floor(accountAgeDays / 3));
  const volumeScore = Math.min(250, txCount * 5);
  const consistencyScore = Math.min(200, txCount > 5 ? 170 : txCount * 30);
  const diversityScore = Math.min(150, txCount > 10 ? 130 : txCount * 12);
  const repaymentScore = Math.min(200, 180); // baseline — would come from LLM

  const score = Math.min(
    1000,
    ageScore + volumeScore + consistencyScore + diversityScore + repaymentScore,
  );

  const tier =
    score >= 800
      ? "Excellent"
      : score >= 600
        ? "Good"
        : score >= 400
          ? "Fair"
          : "Poor";

  return {
    address,
    score,
    tier,
    txCount,
    accountAgeDays,
    timestamp: Date.now(),
  };
};

const onAICreditScoring = (runtime: Runtime<Config>): string => {
  console.log("[WF2] AI Credit Scoring");
  runtime.log("WF2: AI Credit Scoring — analyzing on-chain transaction history");

  const { reserveAddress } = runtime.config;
  const httpClient = new HTTPClient();

  // Fetch numeric TX metrics with consensus (median aggregation on numbers)
  const txMetrics = httpClient
    .sendRequest(
      runtime,
      fetchTxMetrics,
      ConsensusAggregationByFields<TxMetrics>({
        txCount: median,
        accountAgeDays: median,
      }),
    )(reserveAddress)
    .result();

  // Compute score locally from aggregated metrics
  // Production: POST txMetrics to Gemini API with getSecret("GEMINI_API_KEY")
  const creditResult = computeCreditScore(txMetrics, reserveAddress);

  runtime.log(`WF2: Score=${creditResult.score} (${creditResult.tier})`);
  runtime.log(`WF2: TxCount=${creditResult.txCount}, Age=${creditResult.accountAgeDays}d`);
  runtime.log(`WF2: Attestation=${JSON.stringify(creditResult)}`);

  // Production: write score to Sepolia CreditScoreAttestation.sol
  // evmClient.writeReport(runtime, { ... })

  return JSON.stringify(creditResult);
};

// ============================================================================
// WF3: Risk Monitor (Risk & Compliance Track)
// ============================================================================
// Trigger: Cron every 30 seconds (staging) / 10 minutes (production)
// Logic:
//   1. Fetch reserve balance and XLM price from Horizon + CoinGecko
//   2. Compute reserve ratio, utilization rate, price deviation
//   3. If any metric exceeds threshold: alertTriggered = 1
//   4. Write risk report to Sepolia RiskReport contract
//   5. Production: trigger pause on nUSD minting if ratio < 0.90

const fetchRiskMetrics = (
  sendRequester: HTTPSendRequester,
  reserveAddress: string,
): RiskReport => {
  const accountResp = sendRequester
    .sendRequest({ url: `${HORIZON_TESTNET}/accounts/${reserveAddress}`, method: "GET" })
    .result();

  let reserveXlm = 0;
  if (ok(accountResp)) {
    const data = json(accountResp) as StellarAccountResponse;
    const native = data.balances.find((b) => b.asset_type === "native");
    reserveXlm = native ? parseFloat(native.balance) : 0;
  }

  const priceResp = sendRequester
    .sendRequest({
      url: "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd&include_24hr_change=true",
      method: "GET",
    })
    .result();

  let xlmPrice = 0.12;
  let priceDeviation = 0;
  if (ok(priceResp)) {
    const priceData = json(priceResp) as {
      stellar?: { usd?: number; usd_24h_change?: number };
    };
    xlmPrice = priceData.stellar?.usd ?? 0.12;
    priceDeviation = Math.abs(priceData.stellar?.usd_24h_change ?? 0) / 100;
  }

  // TODO: Read totalSupply and utilizationRate from Soroban contracts
  const totalSupply = 1_200_000;
  const reserveUsd = reserveXlm * xlmPrice;
  const reserveRatio = totalSupply > 0 ? reserveUsd / totalSupply : 1;
  const utilizationRate = 0.24; // demo: from credit_line contract

  const alertTriggered =
    reserveRatio < 0.95 || utilizationRate > 0.8 || priceDeviation > 0.1 ? 1 : 0;

  return {
    reserveRatio: Math.round(reserveRatio * 10000) / 10000,
    utilizationRate: Math.round(utilizationRate * 10000) / 10000,
    priceDeviation: Math.round(priceDeviation * 10000) / 10000,
    alertTriggered,
    timestamp: Date.now(),
  };
};

const onRiskMonitor = (runtime: Runtime<Config>): string => {
  console.log("[WF3] Risk Monitor");
  runtime.log("WF3: Risk Monitor — checking protocol health");

  const { reserveAddress } = runtime.config;
  const httpClient = new HTTPClient();

  const metrics = httpClient
    .sendRequest(
      runtime,
      fetchRiskMetrics,
      ConsensusAggregationByFields<RiskReport>({
        reserveRatio: median,
        utilizationRate: median,
        priceDeviation: median,
        alertTriggered: median,
        timestamp: median,
      }),
    )(reserveAddress)
    .result();

  const status = metrics.alertTriggered ? "ALERT" : "HEALTHY";
  runtime.log(`WF3: Status=${status}`);
  runtime.log(
    `WF3: Reserve=${metrics.reserveRatio}, Util=${metrics.utilizationRate}, PriceDev=${metrics.priceDeviation}`,
  );
  runtime.log(`WF3: Report=${JSON.stringify(metrics)}`);

  if (metrics.alertTriggered) {
    runtime.log("WF3: ALERT TRIGGERED — writing to Sepolia RiskReport contract");
    runtime.log("WF3: Production: would call Soroban pause() on nUSD contract");
    // Production: evmClient.writeReport(runtime, { ... })
    //             + Soroban pauseMinting() via backend API
  }

  return JSON.stringify(metrics);
};

// ============================================================================
// WF4: Privacy Credit Check (Privacy Track)
// ============================================================================
// Trigger: Cron / HTTP trigger
// Logic:
//   1. Retrieve API credentials securely from CRE secrets (runtime.getSecret)
//      — credentials are NEVER stored on-chain or in workflow source
//   2. Fetch account eligibility via HTTP (Horizon used for demo;
//      production: external credit bureau API)
//   3. Process eligibility ENTIRELY off-chain inside CRE TEE
//   4. Write ONLY the boolean result on-chain (no PII, no raw scores)
//
// PRIVACY GUARANTEE (production):
//   - Replace HTTPClient with ConfidentialHTTPClient (CRE SDK >= 1.1.x)
//   - ConfidentialHTTPClient runs inside a Trusted Execution Environment
//   - API credentials are injected via secrets.yaml (TEE-secured)
//   - Request + response data encrypted end-to-end, never visible on-chain
//   - Only the boolean eligibility + keccak256(address) published on-chain
//
// For demo/simulation: HTTPClient is used (same logic, without TEE guarantee)

const checkCreditEligibility = (
  sendRequester: HTTPSendRequester,
  address: string,
  apiKey: string, // injected from CRE secrets — never hardcoded
): CreditEligibilityResult => {
  // Production: POST to credit bureau API with TEE-secured credentials
  // const response = sendRequester.sendRequest({
  //   url: "https://api.credit-bureau.example/v1/eligibility",
  //   method: "POST",
  //   headers: { "Authorization": `Bearer ${apiKey}` },
  //   body: JSON.stringify({ userId: address }),
  // }).result();

  // Demo: use Stellar Horizon as the "credit bureau" data source
  // The API key is still fetched from secrets to demonstrate the pattern
  void apiKey; // suppress unused warning in demo mode

  const response = sendRequester
    .sendRequest({
      url: `${HORIZON_TESTNET}/accounts/${address}`,
      method: "GET",
    })
    .result();

  if (!ok(response)) {
    return {
      eligible: false,
      reason: "account_not_found",
      confidential: true,
      rawDataOnChain: false,
      credentialsOnChain: false,
      timestamp: Date.now(),
    };
  }

  const data = json(response) as StellarAccountResponse;
  // Eligibility criterion: native XLM balance > 10 XLM
  const eligible = data.balances.some(
    (b) => b.asset_type === "native" && parseFloat(b.balance) > 10,
  );

  return {
    eligible,
    reason: eligible ? "sufficient_on_chain_history" : "insufficient_on_chain_history",
    confidential: true,
    rawDataOnChain: false,    // individual score / bureau data never on-chain
    credentialsOnChain: false, // API key never on-chain
    timestamp: Date.now(),
  };
};

const onPrivacyCreditCheck = (runtime: Runtime<Config>): string => {
  console.log("[WF4] Privacy Credit Check");
  runtime.log("WF4: Privacy Credit Check — confidential eligibility verification");
  runtime.log("WF4: Credentials retrieved from CRE secrets (never on-chain)");

  // Retrieve API key from CRE secrets (TEE-secured)
  // In production: corresponds to `secrets.yaml` entry for CREDIT_API_KEY
  // Gracefully falls back to "" when the secret is not configured (simulation mode)
  let apiKey = "";
  try {
    const apiKeySecret = runtime.getSecret({ id: "CREDIT_API_KEY", namespace: "nexusfi" }).result();
    apiKey = apiKeySecret.value ?? "";
  } catch {
    runtime.log("WF4: CREDIT_API_KEY not configured — running in demo mode (no credentials)");
  }

  const { reserveAddress } = runtime.config;

  // Production: replace HTTPClient with ConfidentialHTTPClient (CRE SDK >= 1.1.x)
  // const confidentialHttp = new ConfidentialHTTPClient();
  const httpClient = new HTTPClient();

  const result = httpClient
    .sendRequest(
      runtime,
      checkCreditEligibility,
      ConsensusAggregationByFields<CreditEligibilityResult>({
        eligible: identical,
        reason: identical,
        confidential: identical,
        rawDataOnChain: identical,
        credentialsOnChain: identical,
        timestamp: median,
      }),
    )(reserveAddress, apiKey)
    .result();

  runtime.log(`WF4: Eligibility=${JSON.stringify(result)}`);
  runtime.log("WF4: Only boolean result published — no PII or raw scores on-chain");

  // Production: write keccak256(address) + eligible boolean to PrivacyCreditCheck.sol
  // evmClient.writeReport(runtime, { ... })

  return JSON.stringify(result);
};

// ============================================================================
// WF5: Cross-Chain Bridge (DeFi & Tokenization + CRE & AI)
// ============================================================================
// Trigger: Cron / on-demand
// Logic:
//   1. Verify burn transaction on Stellar Horizon (source chain)
//   2. Verify destination chain is responsive
//   3. Consensus across CRE nodes (median aggregation)
//   4. If burn verified AND dest ready: authorize mint
//   5. Write bridge attestation on-chain
//
// CRE acts as the trust layer between chains:
//   Stellar <-> Solana / Ethereum / Avalanche

const verifyBurnOnStellar = (
  sendRequester: HTTPSendRequester,
  accountAddress: string,
): BridgeAttestation => {
  const response = sendRequester
    .sendRequest({
      url: `${HORIZON_TESTNET}/accounts/${accountAddress}/transactions?order=desc&limit=5`,
      method: "GET",
    })
    .result();

  let burnVerified = 0;
  let amount = 0;

  if (ok(response)) {
    const data = json(response) as { _embedded?: { records: any[] } };
    const records = data._embedded?.records ?? [];

    if (records.length > 0) {
      burnVerified = 1;
      amount = records.length * 100; // demo: each tx = 100 nUSD
    }
  }

  return {
    bridgeId: `cre-bridge-${Date.now()}`,
    sourceChain: "stellar",
    destChain: "solana",
    token: "nUSD",
    amount,
    burnVerified,
    mintAuthorized: burnVerified,
    timestamp: Date.now(),
  };
};

const verifyDestChainReady = (
  sendRequester: HTTPSendRequester,
  destRpc: string,
): number => {
  const response = sendRequester.sendRequest({ url: destRpc, method: "GET" }).result();
  return ok(response) ? 1 : 0;
};

const onCrossChainBridge = (runtime: Runtime<Config>): string => {
  console.log("[WF5] Cross-Chain Bridge");
  runtime.log("WF5: Cross-Chain Bridge — verifying burn and authorizing mint");

  const { bridgeWatchAddress } = runtime.config;
  const httpClient = new HTTPClient();

  const attestation = httpClient
    .sendRequest(
      runtime,
      verifyBurnOnStellar,
      ConsensusAggregationByFields<BridgeAttestation>({
        bridgeId: identical,
        sourceChain: identical,
        destChain: identical,
        token: identical,
        amount: median,
        burnVerified: median,
        mintAuthorized: median,
        timestamp: median,
      }),
    )(bridgeWatchAddress)
    .result();

  const destReady = httpClient
    .sendRequest(
      runtime,
      verifyDestChainReady,
      consensusMedianAggregation<number>(),
    )("https://api.devnet.solana.com")
    .result();

  runtime.log(`WF5: Burn verified=${attestation.burnVerified}, Amount=${attestation.amount}`);
  runtime.log(`WF5: Dest chain (Solana Devnet) ready=${destReady}`);

  if (attestation.burnVerified && destReady) {
    runtime.log(
      `WF5: AUTHORIZED — Mint ${attestation.amount} ${attestation.token} on ${attestation.destChain}`,
    );
    // Production: write attestation to Sepolia bridge contract or Solana program
    // evmClient.writeReport(runtime, { ... })
  } else {
    runtime.log("WF5: Bridge NOT authorized — burn not verified or dest chain unavailable");
  }

  runtime.log(`WF5: Attestation=${JSON.stringify(attestation)}`);
  return JSON.stringify(attestation);
};

// ============================================================================
// Workflow Registration
// ============================================================================

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();

  return [
    // WF1: Proof of Reserve (DeFi & Tokenization) — every 5 minutes in production
    handler(
      cron.trigger({ schedule: config.schedule }),
      onProofOfReserve,
    ),
    // WF2: AI Credit Scoring (CRE & AI) — on-demand / same schedule for demo
    handler(
      cron.trigger({ schedule: config.schedule }),
      onAICreditScoring,
    ),
    // WF3: Risk Monitor (Risk & Compliance) — every 10 minutes in production
    handler(
      cron.trigger({ schedule: config.schedule }),
      onRiskMonitor,
    ),
    // WF4: Privacy Credit Check (Privacy) — on-demand / same schedule for demo
    handler(
      cron.trigger({ schedule: config.schedule }),
      onPrivacyCreditCheck,
    ),
    // WF5: Cross-Chain Bridge (DeFi + CRE) — on-demand / same schedule for demo
    handler(
      cron.trigger({ schedule: config.schedule }),
      onCrossChainBridge,
    ),
  ];
};

// ============================================================================
// Entry Point
// ============================================================================

export async function main() {
  // configSchema enables typed config validation (Zod)
  const runner = await Runner.newRunner({ configSchema });
  await runner.run(initWorkflow);
}

// CRE CLI requires main() to be called at module load time
main();
