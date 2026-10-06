/**
 * Relay for user-signed token operations.
 *
 * Money only moves when the owner's wallet authorizes it on-chain: the server builds a
 * transfer/burn, the browser signs the wallet's auth entry with the passkey, and the server
 * re-wraps that call in a transaction paid by FEE_PAYER_SECRET. The fee payer has no role in
 * any contract, and only an allowlist of user-authorized calls is relayed (token transfer/burn,
 * credit use/repay), so a crafted transaction can't spend anyone else's balance or reach
 * admin functions.
 */
import {
  Address,
  Contract,
  Keypair,
  Operation,
  StrKey,
  TransactionBuilder,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import { sorobanRpc, NETWORK_PASSPHRASE } from "./stellar";
import { getAllTokens, getToken, type TokenSymbol } from "./tokens";
import { scVal } from "./soroban";

export type RelayAction = "transfer" | "burn" | "use_credit" | "repay";

/** Calls the relay accepts: args[0] is always the user whose auth is required. */
const TOKEN_FNS = { transfer: 2, burn: 1 } as const; // value = index of the amount argument
const CREDIT_FNS = { use_credit: 1, repay: 1 } as const;

function allowed(contractId: string): { kind: "token"; token: TokenSymbol; fns: Record<string, number> } | { kind: "credit"; fns: Record<string, number> } | null {
  const token = getAllTokens().find((t) => t.contractId === contractId);
  if (token) return { kind: "token", token: token.symbol, fns: TOKEN_FNS };
  if (contractId && contractId === process.env.CREDIT_LINE_CONTRACT_ID) return { kind: "credit", fns: CREDIT_FNS };
  return null;
}

/** Most a relayed transaction may cost the fee payer, in stroops (0.5 XLM). */
const MAX_FEE_STROOPS = 5_000_000;

export class RelayError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function isStellarAddress(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (StrKey.isValidEd25519PublicKey(value) || StrKey.isValidContract(value))
  );
}

function feePayer(): Keypair {
  const secret = process.env.FEE_PAYER_SECRET;
  if (!secret) throw new RelayError("The relay isn't configured on this deployment.", 503);
  return Keypair.fromSecret(secret);
}

function toRaw(amount: unknown): bigint {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0 || n > 1_000_000) throw new RelayError("Invalid amount");
  return BigInt(Math.round(n * 1e7));
}

/** Builds an unsigned transfer/burn for the owner's wallet to authorize. */
export async function buildUserTx(input: Record<string, unknown>): Promise<string> {
  const action = (["transfer", "burn", "use_credit", "repay"] as const).find((a) => a === input.action);
  if (!action) throw new RelayError("Unknown action");
  if (!isStellarAddress(input.from)) throw new RelayError("Invalid from address");
  if (action === "transfer" && !isStellarAddress(input.to)) throw new RelayError("Invalid to address");
  const amount = toRaw(input.amount);

  let contractId: string;
  if (action === "use_credit" || action === "repay") {
    const credit = process.env.CREDIT_LINE_CONTRACT_ID;
    if (!credit) throw new RelayError("Credit line isn't configured", 503);
    contractId = credit;
  } else {
    contractId = getToken(input.token === "nBRL" ? "nBRL" : "nUSD").contractId;
  }
  const args =
    action === "transfer"
      ? [scVal.address(input.from), scVal.address(input.to as string), scVal.i128(amount)]
      : [scVal.address(input.from), scVal.i128(amount)];

  const payer = feePayer();
  const account = await sorobanRpc.getAccount(payer.publicKey());
  const tx = new TransactionBuilder(account, { fee: "100000", networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(new Contract(contractId).call(action, ...args))
    .setTimeout(300)
    .build();
  const sim = await sorobanRpc.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new RelayError("This transaction would fail on-chain (check the balance or credit limit).");
  }
  return rpc.assembleTransaction(tx, sim).build().toXDR();
}

/**
 * Checks a wallet-signed transaction and submits it with the fee payer as source.
 * Returns the hash and what was relayed, so callers (e.g. the bridge) can act on it.
 */
export async function submitUserTx(signedXdr: unknown): Promise<{
  hash: string;
  action: RelayAction;
  token: TokenSymbol | null;
  from: string;
  to: string | undefined;
  rawAmount: bigint;
}> {
  if (typeof signedXdr !== "string" || signedXdr.length > 20_000) throw new RelayError("Missing xdr");

  let op: Operation.InvokeHostFunction;
  try {
    const parsed = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
    if (!("operations" in parsed) || parsed.operations.length !== 1) throw new Error();
    if (parsed.operations[0].type !== "invokeHostFunction") throw new Error();
    op = parsed.operations[0] as Operation.InvokeHostFunction;
  } catch {
    throw new RelayError("Expected a single contract call");
  }

  if (op.func.switch() !== xdr.HostFunctionType.hostFunctionTypeInvokeContract()) {
    throw new RelayError("Only contract calls are relayed");
  }
  const call = op.func.invokeContract();
  const contractId = Address.fromScAddress(call.contractAddress()).toString();
  const target = allowed(contractId);
  if (!target) throw new RelayError("This contract isn't relayed");
  const fn = call.functionName().toString() as RelayAction;
  const amountIndex = target.fns[fn];
  if (amountIndex === undefined) throw new RelayError("This function isn't relayed");

  const args = call.args().map((a) => scValToNative(a));
  if (args.length !== amountIndex + 1) throw new RelayError("Unexpected arguments");
  const from = String(args[0]);
  const to = fn === "transfer" ? String(args[1]) : undefined;
  const rawAmount = BigInt(args[amountIndex]);
  if (rawAmount <= 0n) throw new RelayError("Invalid amount");

  // The authorization must come from `from` itself, signed by its own credentials.
  const auth = op.auth ?? [];
  if (auth.length === 0) throw new RelayError("The wallet hasn't signed this transaction");
  for (const entry of auth) {
    if (entry.credentials().switch() !== xdr.SorobanCredentialsType.sorobanCredentialsAddress()) {
      throw new RelayError("Source-account authorization isn't accepted");
    }
    const signer = Address.fromScAddress(entry.credentials().address().address()).toString();
    if (signer !== from) throw new RelayError("Authorization doesn't match the sender");
  }

  const payer = feePayer();
  const account = await sorobanRpc.getAccount(payer.publicKey());
  const tx = new TransactionBuilder(account, { fee: "100000", networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(Operation.invokeHostFunction({ func: op.func, auth }))
    .setTimeout(60)
    .build();
  // Simulation enforces the signed auth entries: a forged or stale signature fails here.
  const sim = await sorobanRpc.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) throw new RelayError("The signed transaction doesn't validate");
  const prepared = rpc.assembleTransaction(tx, sim).build();
  if (Number(prepared.fee) > MAX_FEE_STROOPS) throw new RelayError("Fee too high", 400);
  prepared.sign(payer);

  const sent = await sorobanRpc.sendTransaction(prepared);
  if (sent.status === "ERROR") throw new RelayError("The network rejected the transaction", 502);
  for (let i = 0; i < 30; i++) {
    const res = await sorobanRpc.getTransaction(sent.hash);
    if (res.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return { hash: sent.hash, action: fn, token: target.kind === "token" ? target.token : null, from, to, rawAmount };
    }
    if (res.status === rpc.Api.GetTransactionStatus.FAILED) throw new RelayError("Transaction failed on-chain", 502);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new RelayError(`Timed out waiting for ${sent.hash}`, 504);
}
