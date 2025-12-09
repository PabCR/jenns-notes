/**
 * AI-assisted metadata generation requests.
 */
import type { ApiSession } from './client';
import { API_BASE_URL, buildAuthHeaders } from './client';

export type MetadataType = 'pdf' | 'link' | 'note';

/**
 * Generate tags and descriptive metadata for a resource via the backend AI endpoint.
 */
export async function generateTags(
  session: ApiSession,
  type: MetadataType,
  content: string | File,
): Promise<{
  tags: string[];
  description?: string;
  condition?: string;
  audience?: string;
  topic?: string;
}> {
  const headers = buildAuthHeaders(session);
  const formData = new FormData();
  formData.append('type', type);

  if (type === 'pdf' && content instanceof File) {
    formData.append('file', content);
  } else {
    formData.append('content', content as string);
  }

  const response = await fetch(`${API_BASE_URL}/api/resources/generate-tags`, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `API error: ${response.status}`);
  }

  return response.json();
}
