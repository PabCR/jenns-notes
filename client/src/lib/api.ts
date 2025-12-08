import type { Resource } from '../../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Get authentication token from session
 * This function will be called with the session from AuthContext
 */
function getAuthToken(session: { access_token?: string } | null): string | null {
  return session?.access_token || null;
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  session: { access_token?: string } | null,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken(session);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `API error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

/**
 * Create a new resource
 */
export async function createResource(
  session: { access_token?: string } | null,
  data: {
    title: string;
    description?: string;
    type: 'note' | 'pdf' | 'link';
    content: string;
    tags?: string[];
  }
): Promise<Resource> {
  return apiRequest<Resource>(
    '/api/resources',
    session,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

/**
 * Get all resources for the current user
 */
export async function getResources(
  session: { access_token?: string } | null,
  params?: {
    search?: string;
    type?: 'note' | 'pdf' | 'link';
  }
): Promise<Resource[]> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.type) queryParams.append('type', params.type);
  
  const queryString = queryParams.toString();
  const endpoint = `/api/resources${queryString ? `?${queryString}` : ''}`;
  return apiRequest<Resource[]>(endpoint, session);
}

/**
 * Get a single resource by ID
 */
export async function getResource(
  session: { access_token?: string } | null,
  id: string
): Promise<Resource> {
  return apiRequest<Resource>(`/api/resources/${id}`, session);
}

/**
 * Update a resource
 */
export async function updateResource(
  session: { access_token?: string } | null,
  id: string,
  data: {
    title?: string;
    description?: string;
    tags?: string[];
  }
): Promise<Resource> {
  return apiRequest<Resource>(
    `/api/resources/${id}`,
    session,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete a resource
 */
export async function deleteResource(
  session: { access_token?: string } | null,
  id: string
): Promise<void> {
  return apiRequest<void>(
    `/api/resources/${id}`,
    session,
    {
      method: 'DELETE',
    }
  );
}

/**
 * Request a presigned URL for uploading a PDF file
 */
export async function requestPresignedUrl(
  session: { access_token?: string } | null,
  filename: string
): Promise<{ uploadUrl: string; filePath: string }> {
  return apiRequest<{ uploadUrl: string; filePath: string }>(
    '/api/objects/upload',
    session,
    {
      method: 'POST',
      body: JSON.stringify({ filename }),
    }
  );
}

/**
 * Upload a file directly to Supabase Storage using a presigned URL
 */
export async function uploadToPresignedUrl(
  presignedUrl: string,
  file: File
): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': 'application/pdf',
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
}

/**
 * Fetch a PDF file as a blob and return a blob URL
 */
export async function fetchPDFBlob(
  session: { access_token?: string } | null,
  filePath: string
): Promise<string> {
  const token = getAuthToken(session);
  
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/objects/${encodeURIComponent(filePath)}`, {
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `Failed to fetch PDF: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

