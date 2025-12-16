/**
 * State container for the Upload flow.
 */
import { useCallback, useReducer } from 'react';
import type { UploadState } from './types';

export type UploadAction =
  | Partial<UploadState>
  | ((state: UploadState) => Partial<UploadState>);

const createInitialState = (): UploadState => ({
  step: 'type',
  loading: false,
  extracting: false,
  extractingPdfIndexes: [],
  extractingIds: [],
  error: '',
  resourceType: 'note',
  content: '',
  linkUrl: '',
  pendingPdfs: [],
  title: '',
  description: '',
  tags: [],
  tagInput: '',
  pdfResources: [],
  pdfTagInputs: {},
  pendingResources: [],
  pendingTagInputs: {},
  confirmedResourceCount: 0,
  singlePdfFile: null,
});

const mergeReducer = (prev: UploadState, action: UploadAction): UploadState => {
  const next = typeof action === 'function' ? action(prev) : action;
  return { ...prev, ...next };
};

/**
 * Hook that exposes Upload state and a partial state setter.
 */
export function useUploadState() {
  const [state, setState] = useReducer(mergeReducer, undefined, createInitialState);
  const resetFlow = useCallback(() => setState(createInitialState()), []);
  return { state, setState, resetFlow };
}

/** Normalize a URL by ensuring it includes an http/https protocol. */
export const normalizeUrl = (url: string): string => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

/** Verify that a URL string uses an http or https protocol. */
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};
