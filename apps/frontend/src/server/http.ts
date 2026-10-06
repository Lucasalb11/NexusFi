import { NextResponse } from "next/server";
import { RelayError, isStellarAddress } from "./relay";

/** Runs a handler and turns errors into JSON without leaking internals. */
export async function handle(fn: () => Promise<unknown>) {
  try {
    return NextResponse.json(await fn());
  } catch (err) {
    if (err instanceof RelayError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[api]", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}

/** The address a read is about. Reads are public chain data, so no session is needed. */
export function addressParam(req: Request): string {
  const address = new URL(req.url).searchParams.get("address");
  if (!isStellarAddress(address)) throw new RelayError("Send ?address=<G... or C...>");
  return address;
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    throw new RelayError("Invalid JSON");
  }
}
