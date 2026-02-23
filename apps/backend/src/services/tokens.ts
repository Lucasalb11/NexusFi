import { invokeContractReadNative, invokeContractWrite, scVal } from "./soroban.js";

export type TokenSymbol = "nUSD" | "nBRL";

export interface TokenConfig {
  symbol: TokenSymbol;
  name: string;
  contractId: string;
  decimals: number;
  fiatCurrency: string;
}

const TOKENS: Record<TokenSymbol, TokenConfig | null> = {
  nUSD: process.env.NUSD_CONTRACT_ID
    ? {
        symbol: "nUSD",
        name: "NexusFi USD",
        contractId: process.env.NUSD_CONTRACT_ID,
        decimals: 7,
        fiatCurrency: "USD",
      }
    : null,
  nBRL: process.env.NBRL_CONTRACT_ID
    ? {
        symbol: "nBRL",
        name: "NexusFi BRL",
        contractId: process.env.NBRL_CONTRACT_ID,
        decimals: 7,
        fiatCurrency: "BRL",
      }
    : null,
};

export function getToken(symbol: TokenSymbol): TokenConfig {
  const t = TOKENS[symbol];
  if (!t) throw new Error(`Token ${symbol} not configured`);
  return t;
}

export function getAllTokens(): TokenConfig[] {
  return Object.values(TOKENS).filter(Boolean) as TokenConfig[];
}

function toRaw(amount: number, decimals: number): bigint {
  return BigInt(Math.round(amount * 10 ** decimals));
}

function fromRaw(raw: bigint | number | string, decimals: number): number {
  return Number(raw) / 10 ** decimals;
}

export async function getBalance(
  symbol: TokenSymbol,
  address: string,
): Promise<{ raw: string; formatted: string }> {
  const token = getToken(symbol);
  const result = await invokeContractReadNative(token.contractId, "balance", [
    scVal.address(address),
  ]);
  const raw = String(result ?? 0);
  return { raw, formatted: fromRaw(raw, token.decimals).toFixed(2) };
}

export async function getAllBalances(
  address: string,
): Promise<Record<TokenSymbol, { raw: string; formatted: string }>> {
  const result = {} as Record<TokenSymbol, { raw: string; formatted: string }>;
  for (const token of getAllTokens()) {
    try {
      result[token.symbol] = await getBalance(token.symbol, address);
    } catch {
      result[token.symbol] = { raw: "0", formatted: "0.00" };
    }
  }
  return result;
}

export async function mint(
  symbol: TokenSymbol,
  to: string,
  amount: number,
): Promise<{ hash: string; rawAmount: string }> {
  const token = getToken(symbol);
  const rawAmount = toRaw(amount, token.decimals);
  const { hash } = await invokeContractWrite(token.contractId, "mint", [
    scVal.address(to),
    scVal.i128(rawAmount),
  ]);
  return { hash, rawAmount: rawAmount.toString() };
}

export async function burn(
  symbol: TokenSymbol,
  from: string,
  amount: number,
): Promise<{ hash: string; rawAmount: string }> {
  const token = getToken(symbol);
  const rawAmount = toRaw(amount, token.decimals);
  const { hash } = await invokeContractWrite(token.contractId, "burn", [
    scVal.address(from),
    scVal.i128(rawAmount),
  ]);
  return { hash, rawAmount: rawAmount.toString() };
}

export async function transfer(
  symbol: TokenSymbol,
  from: string,
  to: string,
  amount: number,
): Promise<{ hash: string; rawAmount: string }> {
  const token = getToken(symbol);
  const rawAmount = toRaw(amount, token.decimals);
  const { hash } = await invokeContractWrite(token.contractId, "transfer", [
    scVal.address(from),
    scVal.address(to),
    scVal.i128(rawAmount),
  ]);
  return { hash, rawAmount: rawAmount.toString() };
}

export async function getTotalSupply(symbol: TokenSymbol): Promise<string> {
  const token = getToken(symbol);
  const result = await invokeContractReadNative(
    token.contractId,
    "total_supply",
    [],
  );
  return String(result ?? 0);
}
