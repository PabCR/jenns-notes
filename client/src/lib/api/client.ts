/**
 * API client utilities for authenticated requests to the backend.
 * Centralizes base URL resolution and shared fetch helpers.
 */

export type ApiSession = { access_token?: string } | null;

// Normalize base URL: remove trailing slashes to prevent double slashes in URLs
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

/**
 * Extract the bearer token from a Supabase session.
 */
export function getAuthToken(session: ApiSession): string | null {
  return session?.access_token || null;
}

/**
 * Build headers including Authorization when a session is present.
 */
export function buildAuthHeaders(
  session: ApiSession,
  overrides: HeadersInit = {},
): Headers {
  const headers = new Headers(overrides);
  const token = getAuthToken(session);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

/**
 * Perform a JSON API request with automatic auth handling and error parsing.
 */
export async function apiRequest<T>(
  endpoint: string,
  session: ApiSession,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: buildAuthHeaders(session, headers),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `API error: ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
