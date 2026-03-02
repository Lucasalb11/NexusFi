/**
 * Auth routes — challenge/response signature verification.
 *
 * Flow: 1) GET /challenge → { challenge }  2) User signs with Freighter
 *       3) POST /verify { address, signature } → session stores verified address
 */
import { Router } from "express";
import { Keypair } from "@stellar/stellar-sdk";
import crypto from "crypto";

const router: Router = Router();
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const challenges = new Map<string, { challenge: string; expiresAt: number }>();

router.get("/challenge", (_req, res) => {
  const challenge = crypto.randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;
  challenges.set(challenge, { challenge, expiresAt });
  res.json({ challenge, expiresAt });
});

router.post("/verify", (req, res) => {
  try {
    const { address, signature } = req.body;
    if (!address || !signature) {
      return res.status(400).json({ error: "Missing address or signature" });
    }

    const challenge = req.body.challenge as string;
    const stored = challenge ? challenges.get(challenge) : null;
    if (!stored || Date.now() > stored.expiresAt) {
      return res.status(400).json({ error: "Invalid or expired challenge" });
    }
    challenges.delete(challenge);

    const keypair = Keypair.fromPublicKey(address);
    const challengeBuf = Buffer.from(stored.challenge, "base64url");
    const sigBuf = Buffer.from(String(signature), "base64");
    const isValid = keypair.verify(challengeBuf, sigBuf);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    (req.session as any).verifiedAddress = address;
    res.json({ verified: true, address });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Verification failed" });
  }
});

router.post("/logout", (req, res) => {
  delete (req.session as any).verifiedAddress;
  res.json({ ok: true });
});

export default router;
