/**
 * seed-testnet-xlm.ts — resume from step 4 (XLM transfers + extra token transfers)
 * Uses the accounts created by seed-testnet.ts
 */

import "dotenv/config";
import { Keypair, TransactionBuilder, Operation, Asset, Memo } from "@stellar/stellar-sdk";
import { horizon, NETWORK_PASSPHRASE } from "../src/services/stellar.js";
import { transfer } from "../src/services/tokens.js";

const STELLAR_EXPLORER = "https://stellar.expert/explorer/testnet";
function explorer(hash: string) { console.log(`  🔗 ${STELLAR_EXPLORER}/tx/${hash}`); }
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// Accounts from the previous seed run
const ALICE_SECRET = process.env.ALICE_SECRET ?? "";
const BOB_SECRET = process.env.BOB_SECRET ?? "";
const CAROL_SECRET = process.env.CAROL_SECRET ?? "";

async function sendXLM(fromKp: Keypair, toAddress: string, amount: string, memo?: string) {
  const source = await horizon.loadAccount(fromKp.publicKey());
  const txb = new TransactionBuilder(source, { fee: "100", networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(Operation.payment({ destination: toAddress, asset: Asset.native(), amount }));
  if (memo) txb.addMemo(Memo.text(memo));
  const tx = txb.setTimeout(30).build();
  tx.sign(fromKp);
  const result = await horizon.submitTransaction(tx);
  const hash = (result as any).hash ?? "ok";
  console.log(`  ↗  Sent ${amount} XLM  memo="${memo ?? ""}"  tx: ${hash}`);
  explorer(hash);
  return hash;
}

async function main() {
  if (!ALICE_SECRET || !BOB_SECRET || !CAROL_SECRET) {
    console.error("Set ALICE_SECRET, BOB_SECRET, CAROL_SECRET env vars (from seed-testnet.ts output)");
    process.exit(1);
  }

  const alice = Keypair.fromSecret(ALICE_SECRET);
  const bob   = Keypair.fromSecret(BOB_SECRET);
  const carol = Keypair.fromSecret(CAROL_SECRET);

  console.log("Accounts:");
  console.log(`  Alice: ${alice.publicKey()}`);
  console.log(`  Bob:   ${bob.publicKey()}`);
  console.log(`  Carol: ${carol.publicKey()}`);

  console.log("\n── Step 4: XLM transfers ──");
  await sendXLM(alice, bob.publicKey(),   "10",  "coffee");    await sleep(2000);
  await sendXLM(bob,   carol.publicKey(), "25",  "groceries"); await sleep(2000);
  await sendXLM(carol, alice.publicKey(), "5",   "refund");    await sleep(2000);
  await sendXLM(alice, carol.publicKey(), "15",  "lunch");     await sleep(2000);
  await sendXLM(bob,   alice.publicKey(), "8",   "taxi");      await sleep(2000);

  console.log("\n── Step 5: Extra token transfers ──");
  const batches = [
    { from: alice, to: bob.publicKey(),   sym: "nUSD" as const, amt: 100 },
    { from: bob,   to: carol.publicKey(), sym: "nUSD" as const, amt: 200 },
    { from: carol, to: alice.publicKey(), sym: "nBRL" as const, amt: 800 },
    { from: alice, to: carol.publicKey(), sym: "nUSD" as const, amt: 75  },
    { from: bob,   to: alice.publicKey(), sym: "nBRL" as const, amt: 3000 },
  ];

  for (const b of batches) {
    console.log(`\n  ${b.sym}: ${b.from.publicKey().slice(0,6)}… → ${b.to.slice(0,6)}… (${b.amt})`);
    const r = await transfer(b.sym, b.from.publicKey(), b.to, b.amt);
    explorer(r.hash);
    await sleep(3000);
  }

  console.log("\n✅ Done! Check the explorer links above.");
}

main().catch((err) => { console.error("❌", err.message ?? err); process.exit(1); });
