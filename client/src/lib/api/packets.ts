/**
 * Packet CRUD operations against the backend API.
 */
import type { ApiSession } from './client';
import { apiRequest } from './client';
import type { Packet, Resource } from '../../../../shared/types';

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
  session: ApiSession,
): Promise<Packet[]> {
  return apiRequest<Packet[]>('/api/packets', session);
}

/**
 * Retrieve a single packet by ID.
 */
export async function getPacket(
  session: ApiSession,
  id: string,
): Promise<Packet> {
  return apiRequest<Packet>(`/api/packets/${id}`, session);
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
