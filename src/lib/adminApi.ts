const FALLBACK_PROD_BACKEND = "https://back-end-sand.vercel.app";
const LOCAL_BACKEND = "http://localhost:4000";

export function resolveBackendUrl(): string {
  const configured = import.meta.env.VITE_BACKEND_URL?.trim();
  if (configured && configured.length > 0) {
    return configured.replace(/\/$/, "");
  }

  if (import.meta.env.DEV) {
    return LOCAL_BACKEND;
  }

  return FALLBACK_PROD_BACKEND;
}

const backendUrl = resolveBackendUrl();
const adminToken = import.meta.env.VITE_ADMIN_TOKEN;

interface RequestOptions extends RequestInit {
  json?: unknown;
}

export async function adminRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (adminToken) {
    headers["x-admin-token"] = adminToken;
  }

  const response = await fetch(`${backendUrl}/api/admin${path}`, {
    ...options,
    headers,
    body:
      options.json !== undefined ? JSON.stringify(options.json) : options.body,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error || `Request to ${path} failed with status ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getBackendUrl(): string {
  return backendUrl;
}
