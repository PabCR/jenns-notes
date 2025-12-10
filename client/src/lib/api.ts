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
} from './api/resources';
export {
  requestPresignedUrl,
  uploadToPresignedUrl,
  fetchPDFBlob,
} from './api/objects';
export { generateTags } from './api/metadata';
export {
  createPacket,
  getPacket,
  listPackets,
  updatePacket,
  deletePacket,
} from './api/packets';
