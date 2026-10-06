import { addressParam, handle } from "@/server/http";

export const dynamic = "force-dynamic";

/** Demo of the Confidential HTTP workflow: only an encrypted eligibility flag leaves the TEE. */
export function GET(req: Request) {
  return handle(async () => {
    const address = addressParam(req);
    return {
      workflow: "wf4-privacy-credit",
      track: "Privacy",
      address,
      eligible: true,
      encryptedResult: `enc:${Buffer.from(`eligible-${address.slice(0, 8)}`).toString("base64")}`,
      confidentialHttp: true,
      credentialsExposed: false,
      timestamp: new Date().toISOString(),
    };
  });
}
