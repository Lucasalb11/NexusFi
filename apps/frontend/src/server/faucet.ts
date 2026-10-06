/**
 * Every server-side mint goes through here, capped by the recipient's balance, so public
 * endpoints (airdrop, demo deposit, incoming bridge) can't print unlimited demo tokens.
 */
import { Asset, Keypair, Operation, StrKey, TransactionBuilder, xdr } from "@stellar/stellar-sdk";
import { getBalance, mint, type TokenSymbol } from "./tokens";
import { horizon, sorobanRpc, NETWORK_PASSPHRASE } from "./stellar";

/** A wallet never holds more than this from server mints (in whole tokens). */
export const MINT_CEILING = 10_000;

/** Mints up to `amount`, never taking the recipient above MINT_CEILING. Returns 0 if already there. */
export async function cappedMint(symbol: TokenSymbol, to: string, amount: number) {
  const current = Number((await getBalance(symbol, to)).raw) / 1e7;
  const allowed = Math.min(amount, MINT_CEILING - current);
  if (allowed <= 0) return { minted: 0 as number, hash: null as string | null };
  const minted = Math.floor(allowed * 100) / 100;
  const { hash } = await mint(symbol, to, minted);
  return { minted, hash };
}

/** XLM sent to a new passkey wallet, and only while it holds less than 1 XLM. */
const XLM_TOP_UP = "5";

/**
 * Funds a new wallet with a little XLM. G-accounts go to Friendbot (free); C-wallets get a
 * small payment from the admin, only if the contract exists on-chain and is nearly empty.
 */
export async function topUpXlm(address: string): Promise<string | null> {
  try {
    if (StrKey.isValidEd25519PublicKey(address)) {
      const r = await fetch(`https://friendbot.stellar.org?addr=${address}`);
      return r.ok ? "friendbot" : null;
    }
    if (!StrKey.isValidContract(address)) return null;
    // Must be a deployed contract, otherwise anyone could send us random addresses.
    await sorobanRpc.getContractData(address, xdr.ScVal.scvLedgerKeyContractInstance());
    const native = await sorobanRpc
      .getSACBalance(address, Asset.native(), NETWORK_PASSPHRASE)
      .then((r) => Number(r.balanceEntry?.amount ?? 0) / 1e7)
      .catch(() => 0);
    if (native >= 1) return null;

    const secret = process.env.SOROBAN_SECRET_KEY;
    if (!secret) return null;
    const keypair = Keypair.fromSecret(secret);
    const source = await horizon.loadAccount(keypair.publicKey());
    const tx = new TransactionBuilder(source, { fee: "100000", networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(Operation.payment({ destination: address, asset: Asset.native(), amount: XLM_TOP_UP }))
      .setTimeout(30)
      .build();
    tx.sign(keypair);
    const result = await horizon.submitTransaction(tx);
    return (result as { hash?: string }).hash ?? "ok";
  } catch (err) {
    console.warn("[topUpXlm]", (err as Error).message);
    return null;
  }
}
