/**
 * Actions for type selection, file intake, and pending PDF preparation.
 */
import type { ApiSession } from '@/lib/api';
import type { PDFResource, PendingPDF, UploadState } from './types';
import { isValidUrl, normalizeUrl } from './uploadState';

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
    setState({
      error: '',
      resourceType: 'note',
      title,
      step: 'review',
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
    setState({
      error: '',
      resourceType: 'link',
      linkUrl: candidate,
      content: candidate,
      title: hostname,
      step: 'review',
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

    const resources: PDFResource[] = state.pendingPdfs.map((pdf) => {
      const filename = pdf.file.name.replace(/\.pdf$/i, '') || 'Untitled PDF';
      return {
        fileName: pdf.file.name,
        file: pdf.file,
        title: filename,
        description: '',
        tags: [],
      };
    });

    if (resources.length === 1) {
      const resource = resources[0];
      setState({
        resourceType: 'pdf',
        title: resource.title,
        description: resource.description,
        tags: resource.tags,
        singlePdfFile: resource.file,
        pendingPdfs: [],
        pdfResources: [],
        step: 'review',
        error: '',
      });
    } else {
      setState({
        resourceType: 'pdf',
        pdfResources: resources,
        pendingPdfs: [],
        step: 'review',
        error: '',
      });
    }
  };

  return {
    handleAddNote,
    handleAddLink,
    handleFileSelect,
    handleRemovePendingPdf,
    handleAddPdfs,
  };
}
