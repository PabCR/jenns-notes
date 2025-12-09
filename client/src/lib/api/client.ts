/**
 * API client utilities for authenticated requests to the backend.
 * Centralizes base URL resolution and shared fetch helpers.
 */

export type ApiSession = { access_token?: string } | null;

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
): HeadersInit {
  const headers: HeadersInit = { ...overrides };
  const token = getAuthToken(session);

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

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
