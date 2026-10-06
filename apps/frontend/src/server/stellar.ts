import {
  Horizon,
  rpc,
  Networks,
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
} from "@stellar/stellar-sdk";

const HORIZON_URL =
  process.env.HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const SOROBAN_RPC_URL =
  process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE =
  process.env.SOROBAN_NETWORK_PASSPHRASE ?? Networks.TESTNET;

const horizon = new Horizon.Server(HORIZON_URL);
const sorobanRpc = new rpc.Server(SOROBAN_RPC_URL);

export async function getAccount(publicKey: string) {
  try {
    const account = await horizon.loadAccount(publicKey);
    return {
      id: account.id,
      sequence: account.sequence,
      balances: account.balances.map((b: any) => ({
        type: b.asset_type,
        balance: b.balance,
        ...(b.asset_type !== "native"
          ? { asset_code: b.asset_code, asset_issuer: b.asset_issuer }
          : {}),
      })),
    };
  } catch {
    return null;
  }
}

export async function getTransactions(publicKey: string, limit = 20) {
  try {
    const txs = await horizon
      .transactions()
      .forAccount(publicKey)
      .order("desc")
      .limit(limit)
      .call();

    return txs.records.map((tx: any) => ({
      id: tx.id,
      hash: tx.hash,
      created_at: tx.created_at,
      source_account: tx.source_account,
      fee_charged: tx.fee_charged,
      operation_count: tx.operation_count,
      memo: tx.memo,
      successful: tx.successful,
    }));
  } catch {
    return [];
  }
}

export async function getOperations(publicKey: string, limit = 50) {
  try {
    const ops = await horizon
      .operations()
      .forAccount(publicKey)
      .order("desc")
      .limit(limit)
      .call();

    return ops.records.map((op: any) => ({
      id: op.id,
      type: op.type,
      created_at: op.created_at,
      source_account: op.source_account,
      transaction_hash: op.transaction_hash,
    }));
  } catch {
    return [];
  }
}

export async function getAccountBalance(publicKey: string): Promise<string> {
  const account = await getAccount(publicKey);
  if (!account) return "0";
  const native = account.balances.find((b: any) => b.type === "native");
  return native?.balance ?? "0";
}

export async function fundTestnetAccount(publicKey: string): Promise<boolean> {
  try {
    await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fund any Stellar address with XLM on testnet.
 * - G... accounts: uses Friendbot
 * - C... contracts: sends XLM from deployer keypair via Horizon payment
 */
export async function fundAccountWithXLM(
  address: string,
  amount = "100",
): Promise<string | null> {
  try {
    if (address.startsWith("G")) {
      const r = await fetch(`https://friendbot.stellar.org?addr=${address}`);
      if (r.ok) return "friendbot";
      return null;
    }

    // Soroban contract address (C...) — send from deployer
    const secretKey = process.env.SOROBAN_SECRET_KEY;
    if (!secretKey) {
      console.warn("fundAccountWithXLM: SOROBAN_SECRET_KEY not set");
      return null;
    }

    const keypair = Keypair.fromSecret(secretKey);
    const source = await horizon.loadAccount(keypair.publicKey());

    const tx = new TransactionBuilder(source, {
      fee: "100000",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: address,
          asset: Asset.native(),
          amount,
        }),
      )
      .setTimeout(30)
      .build();

    tx.sign(keypair);
    const result = await horizon.submitTransaction(tx);
    const hash = (result as any).hash ?? (result as any).id ?? "ok";
    console.log(`Funded ${address} with ${amount} XLM — tx: ${hash}`);
    return hash;
  } catch (err: any) {
    console.warn(`fundAccountWithXLM failed for ${address}:`, err.message);
    return null;
  }
}

export { horizon, sorobanRpc, NETWORK_PASSPHRASE, HORIZON_URL, SOROBAN_RPC_URL };
