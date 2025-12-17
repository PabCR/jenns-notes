/**
 * Storage object helpers for working with presigned URLs and PDF retrieval.
 */
import type { ApiSession } from './client';
import { API_BASE_URL, apiRequest, buildAuthHeaders } from './client';

/**
 * Request a presigned URL for uploading a PDF file.
 */
export async function requestPresignedUrl(
  session: ApiSession,
  filename: string,
): Promise<{ uploadUrl: string; filePath: string }> {
  return apiRequest<{ uploadUrl: string; filePath: string }>(
    '/api/objects/upload',
    session,
    {
      method: 'POST',
      body: JSON.stringify({ filename }),
    },
  );
}

/**
 * Upload a PDF directly to storage using the provided presigned URL.
 */
export async function uploadToPresignedUrl(
  presignedUrl: string,
  file: File,
): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': 'application/pdf' },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
}

/**
 * Fetch a PDF blob and return a browser-safe object URL for inline viewing.
 */
export async function fetchPDFBlob(
  session: ApiSession,
  filePath: string,
): Promise<string> {
  const response = await fetch(
    `${API_BASE_URL}/objects/${encodeURIComponent(filePath)}`,
    {
      headers: buildAuthHeaders(session),
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `Failed to fetch PDF: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Fetch a signed URL for a PDF in a public packet (no auth required).
 */
export async function getPublicSignedUrl(
  shareLink: string,
  resourceId: string,
): Promise<string> {
  const response = await fetch(
    `${API_BASE_URL}/api/objects/public/packets/${shareLink}/resources/${resourceId}/signed-url`,
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || 'Failed to fetch signed URL');
  }

  const data = await response.json();
  return data.signedUrl;
}
