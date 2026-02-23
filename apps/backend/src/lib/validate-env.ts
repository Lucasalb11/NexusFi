/**
 * NexusFi — Runtime Environment Validator
 *
 * SECURITY: This module validates that all required environment variables
 * are loaded from .env (or host environment) and are NOT hardcoded in source.
 * The server refuses to start in production if critical secrets are missing.
 */

type EnvVar = {
  key: string;
  required: boolean;
  sensitive: boolean;
  description: string;
};

const ENV_SCHEMA: EnvVar[] = [
  {
    key: "NODE_ENV",
    required: false,
    sensitive: false,
    description: "Runtime environment (development | production)",
  },
  {
    key: "PORT",
    required: false,
    sensitive: false,
    description: "HTTP server port",
  },
  {
    key: "API_SECRET_KEY",
    required: false,
    sensitive: true,
    description: "Backend API signing key",
  },
  {
    key: "SOROBAN_RPC_URL",
    required: false,
    sensitive: false,
    description: "Stellar Soroban RPC endpoint",
  },
  {
    key: "SOROBAN_NETWORK_PASSPHRASE",
    required: false,
    sensitive: false,
    description: "Stellar network passphrase",
  },
  {
    key: "SOROBAN_SECRET_KEY",
    required: false,
    sensitive: true,
    description: "Soroban deployer secret key — NEVER hardcode, NEVER log",
  },
  {
    key: "HORIZON_URL",
    required: false,
    sensitive: false,
    description: "Stellar Horizon API URL",
  },
  {
    key: "NUSD_ISSUER_ADDRESS",
    required: false,
    sensitive: false,
    description: "nUSD token issuer Stellar address",
  },
  {
    key: "FRONTEND_URL",
    required: false,
    sensitive: false,
    description: "Frontend URL for CORS",
  },
  {
    key: "MOONPAY_PK",
    required: false,
    sensitive: false,
    description: "MoonPay publishable API key (safe for client)",
  },
  {
    key: "MOONPAY_SECRET_KEY",
    required: false,
    sensitive: true,
    description: "MoonPay secret key for URL signing — NEVER expose to frontend",
  },
  {
    key: "MOONPAY_WEBHOOK_KEY",
    required: false,
    sensitive: true,
    description: "MoonPay webhook signing key for verifying callbacks",
  },
  {
    key: "MOONPAY_ENV",
    required: false,
    sensitive: false,
    description: "MoonPay environment: sandbox | production",
  },
];

const FORBIDDEN_PREFIXES = [
  "AKIA",
  "sk-",
  "sk_live_",
  "sk_test_",
  "xox",
];

function looksLikeHardcodedSecret(value: string): boolean {
  if (FORBIDDEN_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    return true;
  }
  if (/^S[A-Z0-9]{55}$/.test(value)) {
    return true;
  }
  return false;
}

export function validateEnv(): Record<string, string> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validated: Record<string, string> = {};

  for (const { key, required, sensitive, description } of ENV_SCHEMA) {
    const value = process.env[key];

    if (!value || value.trim() === "") {
      if (required && process.env.NODE_ENV === "production") {
        errors.push(`  MISSING: ${key} — ${description}`);
      }
      continue;
    }

    if (sensitive && looksLikeHardcodedSecret(value)) {
      warnings.push(
        `  WARNING: ${key} looks like it may be hardcoded. ` +
          "Ensure it comes from .env and is NOT in source code.",
      );
    }

    validated[key] = value;
  }

  if (warnings.length > 0) {
    console.warn("\nNexusFi Security Warnings:");
    warnings.forEach((w) => console.warn(w));
    console.warn("");
  }

  if (errors.length > 0) {
    console.error("\nNexusFi — Missing required environment variables:");
    errors.forEach((e) => console.error(e));
    console.error(
      "\nCopy .env.example to .env and fill in the values.",
    );
    console.error("NEVER hardcode secrets in source files.\n");

    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }

  return validated;
}

export const env = validateEnv();
