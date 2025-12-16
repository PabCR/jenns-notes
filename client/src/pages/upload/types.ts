/**
 * Types that power the Upload flow UI and reducer state.
 */
export type UploadStep = 'type' | 'review' | 'confirm';
export type ResourceType = 'note' | 'link' | 'pdf';

export interface PendingPDF {
  file: File;
  error?: string;
}

export interface PDFResource {
  fileName: string;
  file: File;
  filePath?: string;
  title: string;
  description: string;
  tags: string[];
}

export interface PendingResource {
  id: string; // unique identifier
  type: ResourceType; // 'note' | 'link' | 'pdf'
  title: string;
  description: string;
  tags: string[];
  // Type-specific fields
  content?: string; // for notes
  linkUrl?: string; // for links
  file?: File; // for PDFs
  fileName?: string; // for PDFs
  filePath?: string; // for PDFs (after upload)
}

export interface UploadState {
  step: UploadStep;
  loading: boolean;
  extracting: boolean;
  extractingPdfIndexes: number[]; // deprecated, kept for backward compatibility
  extractingIds: string[]; // new: extracting resource ids
  error: string;
  resourceType: ResourceType;
  content: string;
  linkUrl: string;
  pendingPdfs: PendingPDF[];
  title: string;
  description: string;
  tags: string[];
  tagInput: string;
  pdfResources: PDFResource[]; // deprecated, kept for backward compatibility
  pdfTagInputs: Record<number, string>; // deprecated
  pendingResources: PendingResource[]; // new: unified staging array
  pendingTagInputs: Record<string, string>; // new: keyed by resource id
  confirmedResourceCount: number; // count of resources just created (for confirm step)
  singlePdfFile: File | null;
}
