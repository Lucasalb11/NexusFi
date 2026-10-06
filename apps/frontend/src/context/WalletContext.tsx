"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";

export type WalletEntry = {
  keyId: string;
  contractId: string;
  createdAt: string;
};

type WalletState = {
  address: string | null;
  keyId: string | null;
  wallets: WalletEntry[];
  network: string;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  createAccount: (username: string) => Promise<string | null>;
  signIn: () => Promise<string | null>;
  addWallet: (username: string) => Promise<string | null>;
  setActiveWallet: (contractId: string) => void;
  refreshWallets: () => Promise<void>;
  disconnect: () => void;
  /** Signs the wallet's authorization in an unsigned transaction (passkey prompt); returns signed XDR. */
  signWithPasskey: (xdr: string) => Promise<string>;
};

const WalletContext = createContext<WalletState>({
  address: null,
  keyId: null,
  wallets: [],
  network: "TESTNET",
  isConnected: false,
  isLoading: false,
  error: null,
  createAccount: async () => null,
  signIn: async () => null,
  addWallet: async () => null,
  setActiveWallet: () => {},
  refreshWallets: async () => {},
  disconnect: () => {},
  signWithPasskey: async () => {
    throw new Error("No wallet connected");
  },
});

const STORAGE_KEY = "nexusfi_wallet";
/** Every wallet created or connected on this device. The server keeps no record of wallets. */
const WALLETS_KEY = "nexusfi_wallets";

function readWallets(): WalletEntry[] {
  try {
    const list = JSON.parse(localStorage.getItem(WALLETS_KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";
const WASM_HASH =
  process.env.NEXT_PUBLIC_WALLET_WASM_HASH ??
  "ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90";

async function getPasskeyKit() {
  const { PasskeyKit } = await import("passkey-kit");
  return new PasskeyKit({
    rpcUrl: RPC_URL,
    networkPassphrase: NETWORK_PASSPHRASE,
    walletWasmHash: WASM_HASH,
  });
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [keyId, setKeyId] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kitRef = useRef<any>(null);

  const refreshWallets = useCallback(async () => {
    const list = readWallets();
    if (list.length > 0) setWallets(list);
  }, []);

  const persist = useCallback((addr: string, kid: string, createdAt?: string) => {
    setAddress(addr);
    setKeyId(kid);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ address: addr, keyId: kid, createdAt: createdAt ?? new Date().toISOString() }),
    );
    const list = readWallets().filter((w) => w.contractId !== addr);
    list.push({ keyId: kid, contractId: addr, createdAt: createdAt ?? new Date().toISOString() });
    localStorage.setItem(WALLETS_KEY, JSON.stringify(list));
    setWallets(list);
  }, []);

  const setActiveWallet = useCallback(
    (contractId: string) => {
      const entry = wallets.find((w) => w.contractId === contractId);
      if (entry) {
        persist(entry.contractId, entry.keyId);
      }
    },
    [wallets, persist]
  );

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setAddress(data.address ?? null);
        setKeyId(data.keyId ?? null);
        // Seed wallets from localStorage so the list shows immediately before the server responds
        if (data.address && data.keyId) {
          setWallets([{
            keyId: data.keyId,
            contractId: data.address,
            createdAt: data.createdAt ?? new Date().toISOString(),
          }]);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (address) refreshWallets();
  }, [address, refreshWallets]);

  const createAccount = useCallback(async (username: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    let keyIdBase64: string;
    let contractId: string;
    let signedTx: { toXDR: () => string };

    try {
      const kit = await getPasskeyKit();
      kitRef.current = kit;

      const result = await kit.createWallet("NexusFi", username);
      keyIdBase64 = result.keyIdBase64;
      contractId = result.contractId;
      signedTx = result.signedTx;
    } catch (err: any) {
      const msg = err?.message ?? "Failed to create account";
      console.error("Passkey create error:", msg);
      setError(
        "Falha ao criar passkey ou ao conectar na rede Stellar. Verifique sua conexão."
      );
      setIsLoading(false);
      return null;
    }

    try {
      const xdr = signedTx.toXDR();
      await api.post("/api/passkey/submit", { xdr });
      persist(contractId, keyIdBase64);
      await refreshWallets();
      // Trigger airdrop in background — gives the wallet its starting balance
      api.post("/api/passkey/airdrop", { contractId }).catch(() => {});
      setIsLoading(false);
      return contractId;
    } catch (err: any) {
      const msg = err?.message ?? "Failed to create account";
      console.error("Passkey submit/register error:", msg);
      setError(
        "Falha ao comunicar com o servidor. Tente novamente."
      );
      setIsLoading(false);
      return null;
    }
  }, [persist, refreshWallets]);

  const signIn = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const kit = await getPasskeyKit();
      kitRef.current = kit;

      // passkey-kit derives the wallet address from the passkey on-chain; no server lookup needed.
      const { keyIdBase64, contractId } = await kit.connectWallet();

      persist(contractId, keyIdBase64);
      await refreshWallets();
      // Trigger airdrop — idempotent, skips if wallet already has balance
      api.post("/api/passkey/airdrop", { contractId }).catch(() => {});
      setIsLoading(false);
      return contractId;
    } catch (err: any) {
      const msg = err?.message ?? "Failed to sign in";
      console.error("Passkey connect error:", msg);
      setError(msg);
      setIsLoading(false);
      return null;
    }
  }, [persist, refreshWallets]);

  const addWallet = useCallback(async (username: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    let keyIdBase64: string;
    let contractId: string;
    let signedTx: { toXDR: () => string };

    try {
      const kit = await getPasskeyKit();
      kitRef.current = kit;

      const result = await kit.createWallet("NexusFi", username);
      keyIdBase64 = result.keyIdBase64;
      contractId = result.contractId;
      signedTx = result.signedTx;
    } catch (err: any) {
      const msg = err?.message ?? "Failed to create wallet";
      console.error("Passkey add wallet error:", msg);
      setError(
        "Falha ao criar passkey ou ao conectar na rede Stellar. Verifique sua conexão."
      );
      setIsLoading(false);
      return null;
    }

    try {
      const xdr = signedTx.toXDR();
      await api.post("/api/passkey/submit", { xdr });
      persist(contractId, keyIdBase64);
      await refreshWallets();
      api.post("/api/passkey/airdrop", { contractId }).catch(() => {});
      setIsLoading(false);
      return contractId;
    } catch (err: any) {
      const msg = err?.message ?? "Failed to add wallet";
      console.error("Passkey submit/register error:", msg);
      setError(
        "Falha ao comunicar com o servidor. Tente novamente."
      );
      setIsLoading(false);
      return null;
    }
  }, [persist, refreshWallets]);

  const disconnect = useCallback(async () => {
    setAddress(null);
    setKeyId(null);
    setWallets([]);
    setError(null);
    kitRef.current = null;
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const signWithPasskey = useCallback(
    async (xdr: string): Promise<string> => {
      if (!keyId) throw new Error("Connect your wallet first");
      let kit = kitRef.current;
      if (!kit?.wallet) {
        kit = await getPasskeyKit();
        await kit.connectWallet({ keyId });
        kitRef.current = kit;
      }
      const signed = await kit.sign(xdr, { keyId });
      return signed.built!.toXDR();
    },
    [keyId],
  );

  return (
    <WalletContext.Provider
      value={{
        address,
        keyId,
        wallets,
        network: "TESTNET",
        isConnected: !!address,
        isLoading,
        error,
        createAccount,
        signIn,
        addWallet,
        setActiveWallet,
        refreshWallets,
        disconnect,
        signWithPasskey,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
