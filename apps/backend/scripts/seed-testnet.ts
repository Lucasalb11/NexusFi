/**
 * seed-testnet.ts
 *
 * Generates a realistic transaction history on Stellar Testnet for demo/video purposes.
 * Creates 3 test accounts, funds them with XLM + nUSD/nBRL, then makes transfers between them.
 *
 * Usage:
 *   cd apps/backend
 *   npx tsx scripts/seed-testnet.ts
 *
 * Accounts are stored in TEST_ACCOUNTS env var (printed at the end).
 */

import "dotenv/config";
import {
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
} from "@stellar/stellar-sdk";
import { horizon, NETWORK_PASSPHRASE } from "../src/services/stellar.js";
import { mint, transfer } from "../src/services/tokens.js";

const STELLAR_EXPLORER = "https://stellar.expert/explorer/testnet";

function log(msg: string) {
  console.log(`\n${"─".repeat(60)}\n${msg}`);
}
function explorer(hash: string) {
  console.log(`  🔗 ${STELLAR_EXPLORER}/tx/${hash}`);
}
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ────────────────────────────────────────────────────────────
// 1. Create / fund classic Stellar accounts via Friendbot
// ────────────────────────────────────────────────────────────
async function createAndFundAccount(label: string): Promise<Keypair> {
  const kp = Keypair.random();
  console.log(`\n[${label}]  ${kp.publicKey()}`);

  const r = await fetch(`https://friendbot.stellar.org?addr=${kp.publicKey()}`);
  if (!r.ok) throw new Error(`Friendbot failed for ${label}: ${await r.text()}`);
  const data: any = await r.json();
  console.log(`  ✅ Funded via Friendbot  — tx: ${data.id ?? "ok"}`);
  if (data.id) explorer(data.id);

  return kp;
}

// ────────────────────────────────────────────────────────────
// 2. Mint nUSD/nBRL to an address
// ────────────────────────────────────────────────────────────
async function mintTokens(address: string, nusd: number, nbrl: number) {
  const nusdTx = await mint("nUSD", address, nusd);
  console.log(`  💵 Minted ${nusd} nUSD`);
  explorer(nusdTx.hash);

  await sleep(3000); // let ledger close

  const nbrlTx = await mint("nBRL", address, nbrl);
  console.log(`  🇧🇷 Minted ${nbrl} nBRL`);
  explorer(nbrlTx.hash);
}

// ────────────────────────────────────────────────────────────
// 3. XLM transfer between classic accounts via Horizon
// ────────────────────────────────────────────────────────────
async function sendXLM(
  fromKp: Keypair,
  toAddress: string,
  amount: string,
  memo?: string,
) {
  const source = await horizon.loadAccount(fromKp.publicKey());
  const txb = new TransactionBuilder(source, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  }).addOperation(
    Operation.payment({
      destination: toAddress,
      asset: Asset.native(),
      amount,
    }),
  );
  if (memo) txb.addMemo(Memo.text(memo));
  const tx = txb.setTimeout(30).build();
  tx.sign(fromKp);
  const result = await horizon.submitTransaction(tx);
  const hash = (result as any).hash ?? (result as any).id ?? "ok";
  console.log(`  ↗  Sent ${amount} XLM to ${toAddress.slice(0, 8)}… — tx: ${hash}`);
  explorer(hash);
  return hash;
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────
async function main() {
  console.log("═".repeat(60));
  console.log(" NexusFi — Testnet Seed Script");
  console.log(" Generating demo transaction history on Stellar Testnet");
  console.log("═".repeat(60));

  // Step 1: Create 3 test accounts
  log("Step 1 — Creating test accounts (Friendbot)");
  const alice = await createAndFundAccount("alice");
  await sleep(2000);
  const bob = await createAndFundAccount("bob");
  await sleep(2000);
  const carol = await createAndFundAccount("carol");
  await sleep(2000);

  // Step 2: Mint tokens
  log("Step 2 — Minting nUSD + nBRL to each account");

  console.log("\n  [alice]");
  await mintTokens(alice.publicKey(), 5000, 25000);
  await sleep(3000);

  console.log("\n  [bob]");
  await mintTokens(bob.publicKey(), 3000, 15000);
  await sleep(3000);

  console.log("\n  [carol]");
  await mintTokens(carol.publicKey(), 8000, 40000);
  await sleep(3000);

  // Step 3: Token transfers (admin_transfer on-chain)
  log("Step 3 — Token transfers between accounts");

  console.log("\n  alice → bob: 500 nUSD (payment)");
  const t1 = await transfer("nUSD", alice.publicKey(), bob.publicKey(), 500);
  explorer(t1.hash);
  await sleep(3000);

  console.log("\n  bob → carol: 1000 nBRL (remittance)");
  const t2 = await transfer("nBRL", bob.publicKey(), carol.publicKey(), 1000);
  explorer(t2.hash);
  await sleep(3000);

  console.log("\n  carol → alice: 250 nUSD (repayment)");
  const t3 = await transfer("nUSD", carol.publicKey(), alice.publicKey(), 250);
  explorer(t3.hash);
  await sleep(3000);

  console.log("\n  alice → carol: 5000 nBRL (exchange)");
  const t4 = await transfer("nBRL", alice.publicKey(), carol.publicKey(), 5000);
  explorer(t4.hash);
  await sleep(3000);

  console.log("\n  bob → alice: 2000 nBRL (bill split)");
  const t5 = await transfer("nBRL", bob.publicKey(), alice.publicKey(), 2000);
  explorer(t5.hash);
  await sleep(3000);

  // Step 4: XLM transfers for on-chain realism
  log("Step 4 — XLM transfers (native Stellar payments)");

  await sendXLM(alice, bob.publicKey(), "10", "coffee");
  await sleep(2000);
  await sendXLM(bob, carol.publicKey(), "25", "groceries");
  await sleep(2000);
  await sendXLM(carol, alice.publicKey(), "5", "refund");
  await sleep(2000);

  // Step 5: More token transfers for volume
  log("Step 5 — Additional transfers for tx history volume");

  const batches = [
    { from: alice, to: bob.publicKey(), sym: "nUSD" as const, amt: 100 },
    { from: bob, to: carol.publicKey(), sym: "nUSD" as const, amt: 200 },
    { from: carol, to: alice.publicKey(), sym: "nBRL" as const, amt: 800 },
    { from: alice, to: carol.publicKey(), sym: "nUSD" as const, amt: 75 },
    { from: bob, to: alice.publicKey(), sym: "nBRL" as const, amt: 3000 },
  ];

  for (const b of batches) {
    console.log(`\n  ${b.sym}: ${b.from.publicKey().slice(0, 6)}… → ${b.to.slice(0, 6)}… (${b.amt})`);
    const r = await transfer(b.sym, b.from.publicKey(), b.to, b.amt);
    explorer(r.hash);
    await sleep(3000);
  }

  // ─── Summary ───────────────────────────────────────────────
  log("✅ DONE — Test accounts summary");

  console.log(`
┌─ Alice ─────────────────────────────────────────────────────
│  Public:  ${alice.publicKey()}
│  Secret:  ${alice.secret()}
│  Explorer: ${STELLAR_EXPLORER}/account/${alice.publicKey()}
│
├─ Bob ───────────────────────────────────────────────────────
│  Public:  ${bob.publicKey()}
│  Secret:  ${bob.secret()}
│  Explorer: ${STELLAR_EXPLORER}/account/${bob.publicKey()}
│
├─ Carol ─────────────────────────────────────────────────────
│  Public:  ${carol.publicKey()}
│  Secret:  ${carol.secret()}
│  Explorer: ${STELLAR_EXPLORER}/account/${carol.publicKey()}
└─────────────────────────────────────────────────────────────

Add to apps/backend/.env:
TEST_ACCOUNT_ALICE=${alice.publicKey()}
TEST_ACCOUNT_BOB=${bob.publicKey()}
TEST_ACCOUNT_CAROL=${carol.publicKey()}
`);
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message ?? err);
  process.exit(1);
});
