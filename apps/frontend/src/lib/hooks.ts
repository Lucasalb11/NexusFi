"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api, ApiError } from "./api";

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useApi<T>(path: string, fallback?: T): AsyncState<T> {
  const [data, setData] = useState<T | null>(fallback ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep fallback in a ref so it doesn't need to be a useCallback dependency
  // (including it would cause infinite refetch loops for object/array fallbacks)
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<T>(path);
      setData(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Connection error");
      }
      // Use functional setState to avoid depending on `data` in the closure
      if (fallbackRef.current) {
        setData((prev) => prev ?? fallbackRef.current!);
      }
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const show = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  return { toast, show };
}
