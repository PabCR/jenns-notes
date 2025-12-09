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

export interface UploadState {
  step: UploadStep;
  loading: boolean;
  extracting: boolean;
  extractingPdfIndexes: number[];
  error: string;
  resourceType: ResourceType;
  content: string;
  linkUrl: string;
  pendingPdfs: PendingPDF[];
  title: string;
  description: string;
  tags: string[];
  tagInput: string;
  pdfResources: PDFResource[];
  pdfTagInputs: Record<number, string>;
  singlePdfFile: File | null;
}
