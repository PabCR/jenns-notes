/**
 * Packet CRUD operations against the backend API.
 */
import type { ApiSession } from './client';
import { apiRequest } from './client';
import type { Packet } from '@/lib/types';
import { supabase } from '@/lib/supabase';

function mapResourceRow(row: any) {
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

function mapPacket(row: any): Packet {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    shareLink: row.share_link,
    resourceIds: row.resource_ids ?? [],
    resourceCount: row.resource_count ?? row.resource_ids?.length ?? 0,
    resources: row.resources,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create a new packet for the authenticated user.
 */
export async function createPacket(
  session: ApiSession,
  data: {
    name: string;
    description?: string;
    resourceIds: string[];
  },
): Promise<Packet> {
  return apiRequest<Packet>('/api/packets', session, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Fetch packets for the current user.
 */
export async function listPackets(
  _session: ApiSession,
): Promise<Packet[]> {
  const { data, error } = await supabase
    .from('packets')
    .select('id,user_id,name,description,share_link,resource_ids,created_at,updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapPacket);
}

/**
 * Retrieve a single packet by ID.
 */
export async function getPacket(
  _session: ApiSession,
  id: string,
): Promise<Packet> {
  const { data, error } = await supabase
    .from('packets')
    .select('id,user_id,name,description,share_link,resource_ids,created_at,updated_at')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Load resources for this packet
  const resourceIds = data.resource_ids || [];
  let resources: Packet['resources'] = [];
  if (resourceIds.length > 0) {
    const { data: resourceData, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .in('id', resourceIds);
    if (resourceError) {
      throw new Error(resourceError.message);
    }
    const order = new Map<string, number>(resourceIds.map((rid: string, idx: number) => [rid, idx]));
    resources = (resourceData || [])
      .map(mapResourceRow)
      .sort((a, b) => {
        const aIdx = order.get(a.id) ?? 0;
        const bIdx = order.get(b.id) ?? 0;
        return aIdx - bIdx;
      });
  }

  const packet = mapPacket({ ...data, resources });
  packet.resources = resources as any;
  packet.resourceCount = resourceIds.length;
  return packet;
}

/**
 * Apply partial updates to a packet.
 */
export async function updatePacket(
  session: ApiSession,
  id: string,
  data: { name?: string; description?: string; resourceIds?: string[] },
): Promise<Packet> {
  return apiRequest<Packet>(`/api/packets/${id}`, session, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a packet by ID.
 */
export async function deletePacket(
  session: ApiSession,
  id: string,
): Promise<void> {
  return apiRequest<void>(`/api/packets/${id}`, session, {
    method: 'DELETE',
  });
}

/**
 * Fetch a public packet by share link (anonymous friendly).
 */
export async function getPublicPacket(
  shareLink: string,
): Promise<Packet | null> {
  const { data, error } = await supabase
    .from('packets')
    .select('id,name,description,share_link,resource_ids,created_at,updated_at')
    .eq('share_link', shareLink)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapPacket(data) : null;
}

/**
 * Fetch resources for a public packet by ID list.
 */
export async function getResourcesForPacket(
  resourceIds: string[],
): Promise<any[]> {
  if (!resourceIds.length) return [];

  const { data, error } = await supabase
    .from('resources')
    .select('id,title,description,type,content')
    .in('id', resourceIds);

  if (error) {
    throw new Error(error.message);
  }

  const order = new Map<string, number>(resourceIds.map((rid, idx) => [rid, idx]));
  return (data || []).sort((a, b) => {
    const aIdx = order.get(a.id) ?? 0;
    const bIdx = order.get(b.id) ?? 0;
    return aIdx - bIdx;
  });
}
