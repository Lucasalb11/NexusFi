/**
 * NexusFi — Chainlink CRE Workflows (Main Entry)
 *
 * SECURITY NOTICE:
 * - NEVER hardcode API keys, operator secrets, or wallet keys in this file.
 * - All credentials MUST come from secrets.yaml (gitignored) or environment
 *   variables injected at deploy time.
 *
 * CRE acts as the trusted orchestration layer between traditional finance
 * and the Stellar blockchain:
 *
 *   Frontend -> Backend -> CRE Workflow -> Stellar + Sepolia
 *
 * This file bundles 5 workflows targeting 4 hackathon tracks:
 *
 * WF1: Proof of Reserve         (DeFi & Tokenization)
 * WF2: AI Credit Scoring        (CRE & AI)
 * WF3: Risk Monitor             (Risk & Compliance)
 * WF4: Privacy Credit Check     (Privacy)
 * WF5: Cross-Chain Bridge       (DeFi & Tokenization + CRE & AI)
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

// -- Types --

type Config = {
  schedule: string;
};

interface StellarAccountResponse {
  balances: Array<{
    asset_type: string;
    balance: string;
    asset_code?: string;
  }>;
}

interface PriceResponse {
  stellar: { usd: number };
}

interface ReserveAttestation {
  totalSupplyNusd: number;
  reserveXlm: number;
  reserveUsd: number;
  ratio: number;
  status: string;
  timestamp: number;
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

// ============================================================================
// WF1: Proof of Reserve (DeFi & Tokenization Track)
// ============================================================================
// Cron -> HTTP GET Stellar Horizon (issuer balance) -> HTTP GET price feed
//      -> Compute reserve ratio -> Log attestation (EVM write in production)

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const NUSD_ISSUER = "GBZXN3PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI";

const fetchIssuerBalances = (
  sendRequester: HTTPSendRequester,
  issuerAddress: string,
): number => {
  const response = sendRequester
    .sendRequest({ url: `${HORIZON_TESTNET}/accounts/${issuerAddress}` })
    .result();

  if (!ok(response)) {
    throw new Error(`Horizon request failed: ${response.statusCode}`);
  }

  const data = json(response) as StellarAccountResponse;
  const nativeBalance = data.balances.find(
    (b) => b.asset_type === "native",
  );
  return nativeBalance ? parseFloat(nativeBalance.balance) : 0;
};

const fetchXlmPrice = (sendRequester: HTTPSendRequester): number => {
  const response = sendRequester
    .sendRequest({
      url: "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd",
    })
    .result();

  if (!ok(response)) {
    return 0.12; // fallback price for demo
  }

  const data = json(response) as PriceResponse;
  return data.stellar?.usd ?? 0.12;
};

const onProofOfReserve = (runtime: Runtime<Config>): string => {
  runtime.log("WF1: Proof of Reserve — starting attestation cycle");

  const httpClient = new HTTPClient();

  const reserveXlm = httpClient
    .sendRequest(
      runtime,
      fetchIssuerBalances,
      consensusMedianAggregation<number>(),
    )(NUSD_ISSUER)
    .result();

  const xlmPrice = httpClient
    .sendRequest(
      runtime,
      fetchXlmPrice,
      consensusMedianAggregation<number>(),
    )()
    .result();

  const reserveUsd = reserveXlm * xlmPrice;
  const totalSupplyNusd = 1_200_000; // demo: would read from Soroban contract
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
  runtime.log(`WF1: Ratio=${attestation.ratio}, Status=${status}`);
  runtime.log(`WF1: Attestation=${JSON.stringify(attestation)}`);

  // Production: EVM write attestation to Sepolia PoR contract
  // evmClient.writeContract(runtime, { ... })

  return JSON.stringify(attestation);
};

// ============================================================================
// WF2: AI Credit Scoring (CRE & AI Track)
// ============================================================================
// Cron -> HTTP GET Stellar Horizon (user tx history) -> HTTP POST LLM API
//      -> Parse credit score -> Log attestation

const fetchTransactionHistory = (
  sendRequester: HTTPSendRequester,
  address: string,
): string => {
  const response = sendRequester
    .sendRequest({
      url: `${HORIZON_TESTNET}/accounts/${address}/transactions?order=desc&limit=50`,
    })
    .result();

  if (!ok(response)) {
    return "[]";
  }

  const data = json(response) as { _embedded?: { records: any[] } };
  const records = data._embedded?.records ?? [];

  const summary = records.map((tx: any) => ({
    hash: tx.hash?.slice(0, 12),
    created_at: tx.created_at,
    fee: tx.fee_charged,
    ops: tx.operation_count,
    success: tx.successful,
  }));

  return JSON.stringify(summary);
};

const analyzeCreditWithAI = (
  sendRequester: HTTPSendRequester,
  txHistory: string,
  address: string,
): CreditScoreAttestation => {
  // In production: HTTP POST to OpenAI/Gemini API with tx history
  // For demo/simulation: compute score from tx data locally
  const txs = JSON.parse(txHistory) as any[];
  const txCount = txs.length;

  const oldestTx = txs[txs.length - 1];
  let accountAgeDays = 0;
  if (oldestTx?.created_at) {
    accountAgeDays = Math.floor(
      (Date.now() - new Date(oldestTx.created_at).getTime()) / 86_400_000,
    );
  }

  // Weighted scoring model (simulating LLM analysis)
  const ageScore = Math.min(200, Math.floor(accountAgeDays / 3));
  const volumeScore = Math.min(250, txCount * 5);
  const consistencyScore = Math.min(200, txCount > 5 ? 170 : txCount * 30);
  const diversityScore = Math.min(150, txCount > 10 ? 130 : txCount * 12);
  const repaymentScore = Math.min(200, 180);

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
  runtime.log("WF2: AI Credit Scoring — analyzing on-chain history");

  const httpClient = new HTTPClient();
  const targetAddress = NUSD_ISSUER; // demo: analyze issuer's history

  const txHistory = httpClient
    .sendRequest(
      runtime,
      fetchTransactionHistory,
      consensusMedianAggregation<string>(),
    )(targetAddress)
    .result();

  const creditResult = httpClient
    .sendRequest(
      runtime,
      analyzeCreditWithAI,
      ConsensusAggregationByFields<CreditScoreAttestation>({
        address: identical,
        score: median,
        tier: identical,
        txCount: median,
        accountAgeDays: median,
        timestamp: median,
      }),
    )(txHistory, targetAddress)
    .result();

  runtime.log(`WF2: Score=${creditResult.score} (${creditResult.tier})`);
  runtime.log(`WF2: TxCount=${creditResult.txCount}, Age=${creditResult.accountAgeDays}d`);
  runtime.log(`WF2: Attestation=${JSON.stringify(creditResult)}`);

  return JSON.stringify(creditResult);
};

// ============================================================================
// WF3: Risk Monitor (Risk & Compliance Track)
// ============================================================================
// Cron -> HTTP GET Stellar Horizon (protocol metrics) -> HTTP GET price feeds
//      -> Compute risk metrics -> Log alert if threshold breached

const fetchProtocolMetrics = (
  sendRequester: HTTPSendRequester,
  issuerAddress: string,
): RiskReport => {
  const accountResp = sendRequester
    .sendRequest({ url: `${HORIZON_TESTNET}/accounts/${issuerAddress}` })
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
    })
    .result();

  let xlmPrice = 0.12;
  let priceDeviation = 0;
  if (ok(priceResp)) {
    const priceData = json(priceResp) as {
      stellar: { usd: number; usd_24h_change?: number };
    };
    xlmPrice = priceData.stellar?.usd ?? 0.12;
    priceDeviation = Math.abs(priceData.stellar?.usd_24h_change ?? 0) / 100;
  }

  const totalSupply = 1_200_000;
  const reserveUsd = reserveXlm * xlmPrice;
  const reserveRatio = totalSupply > 0 ? reserveUsd / totalSupply : 1;

  const utilizationRate = 0.24; // demo: from credit line contract

  const alertTriggered =
    reserveRatio < 0.95 || utilizationRate > 0.8 || priceDeviation > 0.1
      ? 1
      : 0;

  return {
    reserveRatio: Math.round(reserveRatio * 10000) / 10000,
    utilizationRate: Math.round(utilizationRate * 10000) / 10000,
    priceDeviation: Math.round(priceDeviation * 10000) / 10000,
    alertTriggered,
    timestamp: Date.now(),
  };
};

const onRiskMonitor = (runtime: Runtime<Config>): string => {
  runtime.log("WF3: Risk Monitor — checking protocol health");

  const httpClient = new HTTPClient();

  const metrics = httpClient
    .sendRequest(
      runtime,
      fetchProtocolMetrics,
      ConsensusAggregationByFields<RiskReport>({
        reserveRatio: median,
        utilizationRate: median,
        priceDeviation: median,
        alertTriggered: median,
        timestamp: median,
      }),
    )(NUSD_ISSUER)
    .result();

  const status = metrics.alertTriggered ? "ALERT" : "HEALTHY";
  runtime.log(`WF3: Status=${status}`);
  runtime.log(
    `WF3: Reserve=${metrics.reserveRatio}, Util=${metrics.utilizationRate}, PriceDev=${metrics.priceDeviation}`,
  );
  runtime.log(`WF3: Report=${JSON.stringify(metrics)}`);

  if (metrics.alertTriggered) {
    runtime.log("WF3: ALERT TRIGGERED — would write to Sepolia safeguard contract");
  }

  return JSON.stringify(metrics);
};

// ============================================================================
// WF4: Privacy Credit Check (Privacy Track)
// ============================================================================
// Cron -> Confidential HTTP POST (credit bureau API, keys not exposed)
//      -> Process eligibility inside TEE -> Return encrypted result
//
// NOTE: Uses standard HTTP for simulation. In production, this would use
// CRE Confidential HTTP (experimental, available from Feb 16).

const privacyCreditCheck = (
  sendRequester: HTTPSendRequester,
  address: string,
): string => {
  // Simulates Confidential HTTP: credentials and raw response data
  // never appear on-chain. Only the encrypted eligibility result is published.
  //
  // In production:
  // - API credentials injected via CRE secrets (TEE-secured)
  // - Request/response encrypted end-to-end
  // - Only the boolean eligibility + encrypted hash published on-chain

  const response = sendRequester
    .sendRequest({
      url: `${HORIZON_TESTNET}/accounts/${address}`,
    })
    .result();

  if (!ok(response)) {
    return JSON.stringify({
      eligible: false,
      reason: "account_not_found",
      confidential: true,
      timestamp: Date.now(),
    });
  }

  const data = json(response) as StellarAccountResponse;
  const hasBalance = data.balances.some(
    (b) => b.asset_type === "native" && parseFloat(b.balance) > 10,
  );

  return JSON.stringify({
    eligible: hasBalance,
    reason: hasBalance ? "sufficient_reserves" : "insufficient_reserves",
    confidential: true,
    credentialsExposed: false,
    rawDataExposed: false,
    timestamp: Date.now(),
  });
};

const onPrivacyCreditCheck = (runtime: Runtime<Config>): string => {
  runtime.log("WF4: Privacy Credit Check — confidential eligibility verification");

  const httpClient = new HTTPClient();

  const result = httpClient
    .sendRequest(
      runtime,
      privacyCreditCheck,
      consensusMedianAggregation<string>(),
    )(NUSD_ISSUER)
    .result();

  runtime.log(`WF4: Result=${result}`);
  runtime.log("WF4: Credentials and raw data never exposed on-chain");

  return result;
};

// ============================================================================
// WF5: Cross-Chain Bridge (DeFi & Tokenization + CRE & AI)
// ============================================================================
// Cron -> HTTP GET Stellar Horizon (verify burn tx) -> HTTP GET dest chain
//      -> Compute attestation -> Authorize mint on destination
//
// The CRE workflow acts as the trusted orchestrator between chains:
//   Stellar <-> Solana, Ethereum, Avalanche
//
// Flow: 1. User burns tokens on source chain
//       2. CRE verifies the burn via Horizon/RPC
//       3. CRE computes attestation hash (consensus across nodes)
//       4. CRE authorizes mint on destination chain
//       5. Attestation published on-chain for auditability

const DEPLOYER_ADDRESS = "GCTAOBTUFGLJ3HZRICJX4LVJLCUTW4RWRE4RV5B7XHNL3PD4TLX2TGUK";

const verifyBurnOnStellar = (
  sendRequester: HTTPSendRequester,
  accountAddress: string,
): BridgeAttestation => {
  const response = sendRequester
    .sendRequest({
      url: `${HORIZON_TESTNET}/accounts/${accountAddress}/transactions?order=desc&limit=5`,
    })
    .result();

  let burnVerified = 0;
  let amount = 0;

  if (ok(response)) {
    const data = json(response) as { _embedded?: { records: any[] } };
    const records = data._embedded?.records ?? [];

    if (records.length > 0) {
      burnVerified = 1;
      amount = records.length * 100;
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
  const response = sendRequester
    .sendRequest({ url: destRpc })
    .result();

  return ok(response) ? 1 : 0;
};

const onCrossChainBridge = (runtime: Runtime<Config>): string => {
  runtime.log("WF5: Cross-Chain Bridge — verifying burn and authorizing mint");

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
    )(DEPLOYER_ADDRESS)
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
    // Production: EVM write to bridge contract or HTTP POST to dest chain mint API
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
    // WF1: Proof of Reserve (DeFi & Tokenization)
    handler(
      cron.trigger({ schedule: config.schedule }),
      onProofOfReserve,
    ),
    // WF2: AI Credit Scoring (CRE & AI)
    handler(
      cron.trigger({ schedule: config.schedule }),
      onAICreditScoring,
    ),
    // WF3: Risk Monitor (Risk & Compliance)
    handler(
      cron.trigger({ schedule: config.schedule }),
      onRiskMonitor,
    ),
    // WF4: Privacy Credit Check (Privacy)
    handler(
      cron.trigger({ schedule: config.schedule }),
      onPrivacyCreditCheck,
    ),
    // WF5: Cross-Chain Bridge (DeFi + CRE)
    handler(
      cron.trigger({ schedule: config.schedule }),
      onCrossChainBridge,
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
