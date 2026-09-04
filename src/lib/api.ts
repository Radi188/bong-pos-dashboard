/**
 * One fetch wrapper for every endpoint.
 *
 * The app still reads most of its data from localStorage (see `store.tsx`,
 * `auth.tsx`); this is the layer those should call once a backend exists.
 *
 *   const products = await api.get<Product[]>("/products", { query: { branchId } });
 *   const order    = await api.post<Order>("/orders", body);
 */

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

const TOKEN_KEY = "pos.token";

/** Non-2xx responses throw this so callers can branch on `status`. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode / storage disabled */
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export type RequestOptions = Omit<RequestInit, "body" | "method"> & {
  /** Appended as a query string; null/undefined entries are dropped. */
  query?: Query;
  /** Skip the Authorization header (login, register, …). */
  auth?: boolean;
  /** Abort after this many ms. Defaults to 20s; pass 0 to disable. */
  timeout?: number;
};

function buildUrl(path: string, query?: Query) {
  const url = /^https?:\/\//.test(path) ? path : `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}${url.includes("?") ? "&" : "?"}${qs}` : url;
}

/** JSON-encode the body, but let FormData/Blob through untouched. */
function encodeBody(body: unknown): { body?: BodyInit; json: boolean } {
  if (body === undefined || body === null) return { json: false };
  if (
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    typeof body === "string"
  ) {
    return { body: body as BodyInit, json: false };
  }
  return { body: JSON.stringify(body), json: true };
}

async function parse(res: Response): Promise<unknown> {
  if (res.status === 204 || res.headers.get("content-length") === "0") return null;
  const type = res.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return res.json().catch(() => null);
  return res.text();
}

/** Pull the most useful message out of whatever shape the API returned. */
function errorMessage(status: number, data: unknown): string {
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const body = data as Record<string, unknown>;
    const message = body.message ?? body.error ?? body.detail;
    if (typeof message === "string") return message;
    if (Array.isArray(message) && typeof message[0] === "string") return message[0];
  }
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "Not found.";
  if (status >= 500) return "Something went wrong on the server. Please try again.";
  return `Request failed (${status}).`;
}

export async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  { query, auth = true, timeout = 20_000, headers, signal, ...init }: RequestOptions = {}
): Promise<T> {
  const encoded = encodeBody(body);
  const finalHeaders = new Headers(headers);
  if (encoded.json) finalHeaders.set("Content-Type", "application/json");
  if (!finalHeaders.has("Accept")) finalHeaders.set("Accept", "application/json");

  const token = auth ? getToken() : null;
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);

  // Combine our timeout with any caller-supplied signal.
  const controller = new AbortController();
  const timer = timeout > 0 ? setTimeout(() => controller.abort(), timeout) : undefined;
  signal?.addEventListener("abort", () => controller.abort(), { once: true });

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      ...init,
      method,
      headers: finalHeaders,
      body: encoded.body,
      signal: controller.signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err; // caller cancelled on purpose
    if ((err as Error)?.name === "AbortError") throw new ApiError(408, "The request timed out.");
    throw new ApiError(0, "Cannot reach the server. Check your connection.");
  } finally {
    clearTimeout(timer);
  }

  const data = await parse(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(res.status, data), data);
  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PATCH", path, body, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, undefined, options),
};
