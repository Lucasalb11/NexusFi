"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 rounded-2xl border border-danger/30 bg-bg-card flex items-center justify-center mb-8">
        <span className="text-danger text-2xl font-serif font-bold">!</span>
      </div>
      <h1 className="text-3xl font-serif font-semibold mb-2 tracking-tight">
        Algo deu errado
      </h1>
      <p className="text-text-secondary text-center text-sm max-w-xs mb-8">
        Ocorreu um erro inesperado. Tente novamente.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-xl bg-accent/20 border border-accent/40 text-accent font-medium hover:bg-accent/30 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
}
