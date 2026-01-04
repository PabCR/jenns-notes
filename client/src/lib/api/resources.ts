/**
 * Resource CRUD operations against the backend API.
 */
import type { ApiSession } from './client';
import { apiRequest } from './client';
import type { Resource } from '@/lib/types';
import { supabase } from '@/lib/supabase';

function mapResource(row: any): Resource {
  return {
    id: row.id,
    userId: row.userId || row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    type: row.type,
    content: row.content,
    tags: row.tags ?? [],
    autoTagged: row.autoTagged ?? row.auto_tagged ?? false,
    condition: row.condition ?? undefined,
    audience: row.audience ?? undefined,
    topic: row.topic ?? undefined,
    createdAt: row.createdAt || row.created_at,
    updatedAt: row.updatedAt || row.updated_at,
    isFavorite: row.isFavorite ?? row.is_favorite ?? false,
  };
}

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
 * Fetch resources with optional filtering.
 */
export async function getResources(
  session: ApiSession,
  params?: {
    search?: string;
    type?: 'note' | 'pdf' | 'link';
    ownership?: 'mine' | 'others' | 'all';
    favoritesOnly?: boolean;
  },
): Promise<Resource[]> {
  const searchParams = new URLSearchParams();
  
  if (params?.search) {
    searchParams.append('search', params.search);
  }
  if (params?.type) {
    searchParams.append('type', params.type);
  }
  if (params?.ownership) {
    searchParams.append('ownership', params.ownership);
  }
  if (params?.favoritesOnly) {
    searchParams.append('favorites_only', 'true');
  }

  const queryString = searchParams.toString();
  const endpoint = `/api/resources${queryString ? `?${queryString}` : ''}`;
  
  const data = await apiRequest<Resource[]>(endpoint, session, {
    method: 'GET',
  });
  
  return data.map(mapResource);
}

/**
 * Retrieve a single resource by ID.
 */
export async function getResource(
  _session: ApiSession,
  id: string,
): Promise<Resource> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapResource(data);
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

/**
 * Toggle favorite status for a resource.
 */
export async function toggleFavorite(
  session: ApiSession,
  resourceId: string,
): Promise<Resource> {
  const data = await apiRequest<Resource>(`/api/resources/${resourceId}/favorite`, session, {
    method: 'POST',
  });
  return mapResource(data);
}
