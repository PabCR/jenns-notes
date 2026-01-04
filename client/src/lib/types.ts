// TypeScript types for Nurse Resource Binder

export type ResourceType = 'pdf' | 'link' | 'note';

export type ShareMethod = 'qr' | 'link' | 'print';

export interface Resource {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: ResourceType;
  content: string; // PDF: storage path, Link: URL, Note: text content
  tags: string[];
  autoTagged: boolean;
  condition?: string;
  audience?: string;
  topic?: string;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
}

export interface Packet {
  id: string;
  userId: string;
  name: string;
  description?: string;
  shareLink: string;
  resourceIds?: string[];
  resourceCount?: number;
  resources?: Resource[];
  createdAt: string;
  updatedAt: string;
}

export interface ShareHistory {
  id: string;
  userId: string;
  packetId: string;
  packetName: string;
  shareMethod: ShareMethod;
  sharedAt: string;
}
