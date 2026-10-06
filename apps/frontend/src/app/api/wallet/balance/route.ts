import { getAccountBalance } from "@/server/stellar";
import { getAllBalances, getAllTokens } from "@/server/tokens";
import { addressParam, handle } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(async () => {
    const address = addressParam(req);
    const [xlm, tokens] = await Promise.all([getAccountBalance(address), getAllBalances(address)]);
    const available = getAllTokens().map((t) => ({
      symbol: t.symbol,
      name: t.name,
      contractId: t.contractId,
      fiatCurrency: t.fiatCurrency,
    }));
    return { address, xlm, tokens, available };
  });
}
