/**
 * Fund a wallet (contract or account) with nUSD and nBRL on Stellar Testnet.
 * Uses the backend's SOROBAN_SECRET_KEY and token contracts.
 *
 * Usage: yarn workspace backend fund-wallet [address]
 * Example: yarn workspace backend fund-wallet CBLAC337TEOE452FFNO53D5H7VWEVP2DYBIWZ2AZUG2SBZBSWKYBTODA
 *
 * Note: XLM cannot be sent to a contract address (C...) via Friendbot; only
 * classic accounts (G...) can be funded with XLM that way. This script only mints nUSD and nBRL.
 */

import "dotenv/config";
import { mint } from "../src/services/tokens.js";

const TARGET =
  process.argv[2] ?? "CBLAC337TEOE452FFNO53D5H7VWEVP2DYBIWZ2AZUG2SBZBSWKYBTODA";
const NUSD_AMOUNT = 500;
const NBRL_AMOUNT = 500;

async function main() {
  console.log(`Funding ${TARGET} with ${NUSD_AMOUNT} nUSD and ${NBRL_AMOUNT} nBRL...\n`);

  try {
    const nusd = await mint("nUSD", TARGET, NUSD_AMOUNT);
    console.log(`nUSD: minted ${NUSD_AMOUNT} → tx ${nusd.hash}`);
    console.log(`  https://stellar.expert/explorer/testnet/tx/${nusd.hash}`);

    const nbrl = await mint("nBRL", TARGET, NBRL_AMOUNT);
    console.log(`nBRL: minted ${NBRL_AMOUNT} → tx ${nbrl.hash}`);
    console.log(`  https://stellar.expert/explorer/testnet/tx/${nbrl.hash}`);

    console.log("\nDone. Refresh the wallet in the app to see the new balances.");
  } catch (err: any) {
    console.error("Error:", err?.message ?? err);
    process.exit(1);
  }
}

main();
