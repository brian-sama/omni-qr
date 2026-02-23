export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

type ApiFetchOptions = RequestInit & {
  skipRefresh?: boolean;
};

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

async function request<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store"
  });

  if (response.status === 401 && !options.skipRefresh) {
    const refreshResponse = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      cache: "no-store"
    });

    if (refreshResponse.ok) {
      return request<T>(path, {
        ...options,
        skipRefresh: true
      });
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let payload = null;
  
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    if (!response.ok) {
      throw new ApiError(text.substring(0, 200) || "Request failed", response.status, { text });
    }
    throw new Error("Invalid JSON response from server");
  }

  if (!response.ok) {
    throw new ApiError(payload?.error ?? "Request failed", response.status, payload);
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body)
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body)
    })
};

