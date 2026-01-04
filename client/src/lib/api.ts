/**
 * Barrel exports for client-side API helpers.
 * Keeps individual concerns split across dedicated modules.
 */
export type { ApiSession } from './api/client';
export {
  createResource,
  getResource,
  getResources,
  updateResource,
  deleteResource,
  toggleFavorite,
} from './api/resources';
export {
  requestPresignedUrl,
  uploadToPresignedUrl,
  fetchPDFBlob,
  getPublicSignedUrl,
} from './api/objects';
export { generateTags } from './api/metadata';
export {
  createPacket,
  getPacket,
  listPackets,
  updatePacket,
  deletePacket,
  getPublicPacket,
  getResourcesForPacket,
} from './api/packets';
