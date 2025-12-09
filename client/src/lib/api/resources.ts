/**
 * Resource CRUD operations against the backend API.
 */
import type { ApiSession } from './client';
import { apiRequest } from './client';
import type { Resource } from '../../../../shared/types';

/**
 * Create a new resource for the authenticated user.
 */
export async function createResource(
  session: ApiSession,
  data: {
    title: string;
    description?: string;
    type: 'note' | 'pdf' | 'link';
    content: string;
    tags?: string[];
  },
): Promise<Resource> {
  return apiRequest<Resource>('/api/resources', session, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Fetch resources for the current user with optional filtering.
 */
export async function getResources(
  session: ApiSession,
  params?: { search?: string; type?: 'note' | 'pdf' | 'link' },
): Promise<Resource[]> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.type) queryParams.append('type', params.type);

  const queryString = queryParams.toString();
  const endpoint = `/api/resources${queryString ? `?${queryString}` : ''}`;
  return apiRequest<Resource[]>(endpoint, session);
}

/**
 * Retrieve a single resource by ID.
 */
export async function getResource(
  session: ApiSession,
  id: string,
): Promise<Resource> {
  return apiRequest<Resource>(`/api/resources/${id}`, session);
}

/**
 * Apply partial updates to a resource.
 */
export async function updateResource(
  session: ApiSession,
  id: string,
  data: { title?: string; description?: string; tags?: string[] },
): Promise<Resource> {
  return apiRequest<Resource>(`/api/resources/${id}`, session, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a resource by ID.
 */
export async function deleteResource(
  session: ApiSession,
  id: string,
): Promise<void> {
  return apiRequest<void>(`/api/resources/${id}`, session, {
    method: 'DELETE',
  });
}
