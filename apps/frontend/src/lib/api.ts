/** The API lives in this Next.js app (src/app/api), so requests stay same-origin. */
const API_BASE = "";

/** Appends ?address= for reads; reads are public chain data, so no auth header is involved. */
export function withAddress(path: string, address: string | null | undefined): string {
  if (!address) return path;
  return `${path}${path.includes("?") ? "&" : "?"}address=${encodeURIComponent(address)}`;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = opts;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new ApiError(res.status, text);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body }),
};

export { ApiError };
