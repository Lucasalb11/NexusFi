import type { Request, Response, NextFunction } from "express";

/**
 * Auth middleware: prefers session-verified address, falls back to x-stellar-address.
 *
 * Verified: POST /api/auth/verify after signing challenge with Freighter.
 * Demo: x-stellar-address header (no verification — insecure in production).
 */
export function demoAuth(req: Request, _res: Response, next: NextFunction) {
  const verified = (req.session as any)?.verifiedAddress as string | undefined;
  const headerAddress = req.headers["x-stellar-address"] as string | undefined;

  if (verified) {
    (req as any).stellarAddress = verified;
    (req as any).authVerified = true;
  } else if (headerAddress) {
    (req as any).stellarAddress = headerAddress;
    (req as any).authVerified = false;
  } else {
    (req as any).stellarAddress =
      "GBZXN3PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI";
    (req as any).authVerified = false;
  }

  next();
}

export function getStellarAddress(req: Request): string {
  return (req as any).stellarAddress;
}
