type RequestOptions = {
  headers?: Record<string, string>;
  cache?: RequestCache;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

/**
 * FastAPI sends errors in two different shapes depending on where they
 * come from:
 *
 *  - Manually raised HTTPException(detail="some string") -> detail is a string
 *  - Pydantic validation failures (422) -> detail is an ARRAY of objects,
 *    e.g. [{ "loc": ["body", "password"], "msg": "...", "type": "..." }]
 *
 * If we only handle the string case, the array case gets silently coerced
 * to a string via `new Error(arrayOfObjects)`, which in JS stringifies
 * each object as "[object Object]". This function unwraps both shapes —
 * and as a last resort, JSON.stringify's anything unrecognized instead of
 * letting it fall through to the default (and useless) toString().
 */
function extractErrorMessage(errorBody: unknown, fallback: string): string {
  if (errorBody && typeof errorBody === "object" && "detail" in errorBody) {
    const detail = (errorBody as { detail: unknown }).detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: unknown }).msg);
          }
          return typeof item === "string" ? item : null;
        })
        .filter((msg): msg is string => Boolean(msg));

      if (messages.length > 0) {
        // Dedupe in case the same message shows up more than once.
        return Array.from(new Set(messages)).join(" ");
      }

      // Array existed but had nothing usable in it — fall through to the
      // JSON.stringify safety net below rather than silently using the
      // generic fallback (that would hide a real backend bug).
    }

    if (detail !== undefined && detail !== null) {
      try {
        return JSON.stringify(detail);
      } catch {
        // fall through to fallback
      }
    }
  }

  return fallback;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const url = `${this.baseUrl}/api${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        cache: options?.cache,
      });
    } catch {
      // fetch() itself throws for network failures / CORS / backend down —
      // these never reach the response-handling code below, so they need
      // their own readable message.
      throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
    }

    if (response.status === 204) {
      return undefined as T;
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = extractErrorMessage(errorBody, response.statusText || `Request failed (${response.status})`);
      throw new ApiError(response.status, message);
    }

    return response.json() as Promise<T>;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("GET", path, undefined, options);
  }

  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("POST", path, body, options);
  }

  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("PUT", path, body, options);
  }

  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("PATCH", path, body, options);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("DELETE", path, undefined, options);
  }
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export const api = new ApiClient(BASE_URL);

/**
 * Always returns a plain, displayable string — use this in every catch
 * block instead of reading err.message directly. Guarantees the UI can
 * never render "[object Object]" again, no matter what got thrown.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}