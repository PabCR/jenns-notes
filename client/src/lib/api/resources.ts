/**
 * Resource CRUD operations against the backend API.
 */
import type { ApiSession } from './client';
import { apiRequest } from './client';
import type { Resource } from '../../../../shared/types';
import { supabase } from '@/lib/supabase';

function mapResource(row: any): Resource {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    type: row.type,
    content: row.content,
    tags: row.tags ?? [],
    autoTagged: row.auto_tagged ?? false,
    condition: row.condition ?? undefined,
    audience: row.audience ?? undefined,
    topic: row.topic ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
 * Fetch resources for the current user with optional filtering.
 */
export async function getResources(
  _session: ApiSession,
  params?: { search?: string; type?: 'note' | 'pdf' | 'link' },
): Promise<Resource[]> {
  let query = supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (params?.type) {
    query = query.eq('type', params.type);
  }

  if (params?.search) {
    const term = `%${params.search}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data || []).map(mapResource);
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
