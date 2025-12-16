/**
 * Actions for type selection, file intake, and pending PDF preparation.
 */
import type { ApiSession } from '@/lib/api';
import type { PendingPDF, PendingResource, UploadState } from './types';
import { isValidUrl, normalizeUrl } from './uploadState';

/** Generate a unique ID for a pending resource */
const generateResourceId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface TypeActionArgs {
  state: UploadState;
  setState: (next: Partial<UploadState> | ((state: UploadState) => Partial<UploadState>)) => void;
  session: ApiSession;
  setError(message: string): void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;

/**
 * Configure handlers for the type-selection step (notes, links, PDFs).
 */
export function createTypeActions({
  state,
  setState,
  session,
  setError,
}: TypeActionArgs) {
  const handleAddNote = () => {
    if (!state.content.trim()) {
      setError('Please enter note content');
      return;
    }

    const title = state.content.split('\n')[0].trim() || 'Untitled Note';
    const newResource: PendingResource = {
      id: generateResourceId(),
      type: 'note',
      title,
      description: '',
      tags: [],
      content: state.content.trim(),
    };

    setState({
      error: '',
      pendingResources: [...state.pendingResources, newResource],
      content: '', // Clear input
    });
  };

  const handleAddLink = () => {
    const trimmed = state.linkUrl.trim();
    if (!trimmed) {
      setError('Please enter a URL');
      return;
    }

    const candidate = normalizeUrl(trimmed);
    if (!isValidUrl(candidate)) {
      setError('Please enter a valid URL');
      return;
    }

    const hostname = new URL(candidate).hostname.replace('www.', '') || 'Untitled Link';
    const newResource: PendingResource = {
      id: generateResourceId(),
      type: 'link',
      title: hostname,
      description: '',
      tags: [],
      linkUrl: candidate,
    };

    setState({
      error: '',
      pendingResources: [...state.pendingResources, newResource],
      linkUrl: '', // Clear input
    });
  };

  const handleFileSelect = (files: File[]) => {
    if (!files.length) return;

    if (state.pendingPdfs.length + files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed. Please select fewer files.`);
      return;
    }

    const valid: PendingPDF[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      if (file.type !== 'application/pdf') {
        errors.push(`${file.name}: Must be a PDF file`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File size must be less than 10MB`);
        return;
      }
      valid.push({ file });
    });

    if (errors.length) {
      setError(errors.join(', '));
    } else {
      setError('');
    }

    if (valid.length) {
      setState({
        pendingPdfs: [...state.pendingPdfs, ...valid],
      });
    }
  };

  const handleRemovePendingPdf = (index: number) => {
    setState({ pendingPdfs: state.pendingPdfs.filter((_, i) => i !== index) });
  };

  const handleAddPdfs = () => {
    if (state.pendingPdfs.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    if (!session) {
      setError('You must be logged in to upload PDFs');
      return;
    }

    const newResources: PendingResource[] = state.pendingPdfs.map((pdf) => {
      const filename = pdf.file.name.replace(/\.pdf$/i, '') || 'Untitled PDF';
      return {
        id: generateResourceId(),
        type: 'pdf',
        title: filename,
        description: '',
        tags: [],
        file: pdf.file,
        fileName: pdf.file.name,
      };
    });

    setState({
      error: '',
      pendingResources: [...state.pendingResources, ...newResources],
      pendingPdfs: [], // Clear input
    });
  };

  return {
    handleAddNote,
    handleAddLink,
    handleFileSelect,
    handleRemovePendingPdf,
    handleAddPdfs,
  };
}
