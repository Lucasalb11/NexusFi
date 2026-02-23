import {
  Account,
  Contract,
  Keypair,
  TransactionBuilder,
  nativeToScVal,
  Address,
  xdr,
  rpc,
} from "@stellar/stellar-sdk";
import { sorobanRpc, NETWORK_PASSPHRASE } from "./stellar.js";

/**
 * Invoke a Soroban contract method (read-only simulation).
 */
export async function invokeContractRead(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = [],
) {
  const account = new Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    "0",
  );

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await sorobanRpc.simulateTransaction(tx);

  if (rpc.Api.isSimulationSuccess(simResult) && simResult.result) {
    return simResult.result.retval;
  }

  throw new Error(`Contract simulation failed for ${method}`);
}

/**
 * Invoke a Soroban contract method that writes state.
 * Requires SOROBAN_SECRET_KEY env var.
 */
export async function invokeContractWrite(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = [],
) {
  const secretKey = process.env.SOROBAN_SECRET_KEY;
  if (!secretKey) throw new Error("SOROBAN_SECRET_KEY not configured");

  const keypair = Keypair.fromSecret(secretKey);
  const publicKey = keypair.publicKey();

  const account = await sorobanRpc.getAccount(publicKey);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: "10000000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const simResult = await sorobanRpc.simulateTransaction(tx);

  if (!rpc.Api.isSimulationSuccess(simResult)) {
    throw new Error(`Simulation failed for ${method}`);
  }

  const preparedTx = rpc.assembleTransaction(tx, simResult).build();
  preparedTx.sign(keypair);

  const sendResult = await sorobanRpc.sendTransaction(preparedTx);

  if (sendResult.status === "ERROR") {
    throw new Error(`Transaction failed: ${sendResult.status}`);
  }

  let getResult = await sorobanRpc.getTransaction(sendResult.hash);
  while (getResult.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1000));
    getResult = await sorobanRpc.getTransaction(sendResult.hash);
  }

  if (getResult.status === "SUCCESS") {
    return { hash: sendResult.hash, result: getResult };
  }

  throw new Error(`Transaction ${sendResult.hash} failed: ${getResult.status}`);
}

export const scVal = {
  address: (addr: string) =>
    nativeToScVal(Address.fromString(addr), { type: "address" }),
  i128: (val: bigint) => nativeToScVal(val, { type: "i128" }),
  u32: (val: number) => nativeToScVal(val, { type: "u32" }),
  u64: (val: bigint) => nativeToScVal(val, { type: "u64" }),
  string: (val: string) => nativeToScVal(val, { type: "string" }),
  bytes32: (buf: Buffer) => xdr.ScVal.scvBytes(buf),
};
