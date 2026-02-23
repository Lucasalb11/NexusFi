import type { Request, Response, NextFunction } from "express";

/**
 * Demo auth middleware. In production, this would verify a Stellar keypair
 * signature to authenticate requests. For the hackathon demo, we accept
 * a simple x-demo-address header.
 */
export function demoAuth(req: Request, _res: Response, next: NextFunction) {
  const address =
    req.headers["x-stellar-address"] as string | undefined;

  if (!address) {
    (req as any).stellarAddress =
      "GBZXN3PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI";
  } else {
    (req as any).stellarAddress = address;
  }

  next();
}

export function getStellarAddress(req: Request): string {
  return (req as any).stellarAddress;
}
