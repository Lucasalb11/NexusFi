/**
 * CRE Bridge Service
 *
 * Simulates CRE workflow results for the demo. In production, these would be
 * triggered via CRE CLI or come from actual Chainlink DON attestations.
 */

import { getTransactions, getAccountBalance } from "./stellar.js";

export type ProofOfReserve = {
  timestamp: string;
  totalSupply: number;
  reserves: number;
  reserveRatio: number;
  attestationHash: string;
  status: "healthy" | "warning" | "critical";
};

export type CreditScoreResult = {
  score: number;
  reasoning: string;
  factors: {
    accountAge: number;
    transactionVolume: number;
    consistency: number;
    diversity: number;
    repaymentHistory: number;
  };
  timestamp: string;
  attestationHash: string;
};

export type RiskMetrics = {
  reserveRatio: number;
  utilizationRate: number;
  protocolTvl: number;
  priceDeviation: number;
  alertTriggered: boolean;
  timestamp: string;
};

/**
 * Simulate CRE WF1: Proof of Reserve
 *
 * In production:
 *   CRE cron -> HTTP GET Horizon (issuer USDC balance)
 *            -> HTTP GET MoonPay tx status API
 *            -> Compute reserve ratio (USDC reserves vs nUSD supply)
 *            -> EVM write attestation to Sepolia
 *
 * MoonPay flow: User pays PIX/SWIFT → MoonPay → USDC on Stellar
 *               CRE verifies USDC reserves back nUSD 1:1
 */
export async function simulateProofOfReserve(
  issuerAddress: string,
): Promise<ProofOfReserve> {
  let reserves = 0;
  try {
    const balanceStr = await getAccountBalance(issuerAddress);
    reserves = parseFloat(balanceStr);
  } catch {
    reserves = 1_250_000; // demo fallback
  }

  const totalSupply = 1_200_000; // demo: from contract query
  const reserveRatio = reserves > 0 ? reserves / totalSupply : 1.02;

  const status =
    reserveRatio >= 1.0
      ? "healthy"
      : reserveRatio >= 0.95
        ? "warning"
        : "critical";

  return {
    timestamp: new Date().toISOString(),
    totalSupply,
    reserves,
    reserveRatio: Math.round(reserveRatio * 10000) / 10000,
    attestationHash: `0x${Buffer.from(Date.now().toString()).toString("hex").padEnd(64, "0")}`,
    status,
  };
}

/**
 * Simulate CRE WF2: AI Credit Scoring
 *
 * In production: CRE -> HTTP GET Horizon (tx history) -> HTTP POST LLM -> parse score -> EVM write
 */
export async function simulateAICreditScoring(
  userAddress: string,
): Promise<CreditScoreResult> {
  let txCount = 0;
  let accountAgeYears = 0;

  try {
    const txs = await getTransactions(userAddress, 50);
    txCount = txs.length;
    if (txs.length > 0) {
      const oldest = new Date(txs[txs.length - 1].created_at);
      accountAgeYears =
        (Date.now() - oldest.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    }
  } catch {
    txCount = 25;
    accountAgeYears = 2.4;
  }

  const accountAgeScore = Math.min(200, Math.floor(accountAgeYears * 80));
  const volumeScore = Math.min(250, txCount * 5);
  const consistencyScore = Math.min(200, Math.floor(Math.random() * 50) + 150);
  const diversityScore = Math.min(150, Math.floor(Math.random() * 30) + 120);
  const repaymentScore = Math.min(200, Math.floor(Math.random() * 20) + 180);

  const totalScore = Math.min(
    1000,
    accountAgeScore +
      volumeScore +
      consistencyScore +
      diversityScore +
      repaymentScore,
  );

  const tier =
    totalScore >= 800
      ? "Excellent"
      : totalScore >= 600
        ? "Good"
        : totalScore >= 400
          ? "Fair"
          : "Poor";

  return {
    score: totalScore,
    reasoning: `Credit score ${totalScore}/1000 (${tier}). Analysis based on ${txCount} transactions over ${accountAgeYears.toFixed(1)} years on Stellar. Strong on-chain history with consistent activity and good repayment behavior.`,
    factors: {
      accountAge: accountAgeScore,
      transactionVolume: volumeScore,
      consistency: consistencyScore,
      diversity: diversityScore,
      repaymentHistory: repaymentScore,
    },
    timestamp: new Date().toISOString(),
    attestationHash: `0x${Buffer.from(`score-${totalScore}-${Date.now()}`).toString("hex").padEnd(64, "0")}`,
  };
}

/**
 * Simulate CRE WF3: Risk Monitor
 *
 * In production: CRE cron -> HTTP GET metrics -> compute risk -> EVM write alert
 */
export async function simulateRiskMonitor(): Promise<RiskMetrics> {
  const reserveRatio = 1.0 + Math.random() * 0.05;
  const utilizationRate = 0.2 + Math.random() * 0.15;
  const protocolTvl = 1_000_000 + Math.floor(Math.random() * 500_000);
  const priceDeviation = Math.random() * 0.03;

  const alertTriggered =
    reserveRatio < 0.95 || utilizationRate > 0.8 || priceDeviation > 0.05;

  return {
    reserveRatio: Math.round(reserveRatio * 10000) / 10000,
    utilizationRate: Math.round(utilizationRate * 10000) / 10000,
    protocolTvl,
    priceDeviation: Math.round(priceDeviation * 10000) / 10000,
    alertTriggered,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get CRE workflow status summary.
 */
export function getWorkflowStatus() {
  return {
    workflows: [
      {
        id: "wf1-proof-of-reserve",
        name: "Proof of Reserve",
        track: "DeFi & Tokenization",
        schedule: "*/30 * * * * *",
        status: "active",
        lastRun: new Date().toISOString(),
      },
      {
        id: "wf2-ai-credit-scoring",
        name: "AI Credit Scoring",
        track: "CRE & AI",
        schedule: "on-demand",
        status: "active",
        lastRun: new Date().toISOString(),
      },
      {
        id: "wf3-risk-monitor",
        name: "Risk Monitor",
        track: "Risk & Compliance",
        schedule: "*/30 * * * * *",
        status: "active",
        lastRun: new Date().toISOString(),
      },
      {
        id: "wf4-privacy-credit",
        name: "Privacy Credit Check",
        track: "Privacy",
        schedule: "on-demand",
        status: "active",
        lastRun: new Date().toISOString(),
      },
    ],
    network: "Stellar Testnet + Ethereum Sepolia",
    creVersion: "@chainlink/cre-sdk@1.0.9",
  };
}
