import { simulateProofOfReserve } from "@/server/cre-bridge";
import { handle } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(async () => {
    const reserve =
      process.env.NUSD_RESERVE_ADDRESS ??
      process.env.MOONPAY_TREASURY_ADDRESS ??
      "GBZXN3PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI";
    return { workflow: "wf1-proof-of-reserve", track: "DeFi & Tokenization", ...(await simulateProofOfReserve(reserve)) };
  });
}
