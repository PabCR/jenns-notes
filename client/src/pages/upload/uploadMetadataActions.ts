/**
 * Metadata extraction helpers for AI-powered tag generation.
 */
import { generateTags } from '@/lib/api';
import type { ApiSession } from '@/lib/api';
import type { PDFResource, UploadState } from './types';

interface MetadataActionArgs {
  state: UploadState;
  setState: (next: Partial<UploadState> | ((state: UploadState) => Partial<UploadState>)) => void;
  session: ApiSession;
  setError(message: string): void;
  hydrateMetadata(metadata: { tags?: string[]; description?: string; topic?: string }): void;
  handleUpdatePdfResource(index: number, updates: Partial<PDFResource>): void;
}

/**
 * Build metadata extraction handlers for single and batch uploads.
 */
export function createMetadataActions({
  state,
  setState,
  session,
  setError,
  hydrateMetadata,
  handleUpdatePdfResource,
}: MetadataActionArgs) {
  const handleExtractMetadata = async () => {
    if (!session) return;

    setState({ extracting: true, error: '' });
    try {
      const contentValue =
        state.resourceType === 'link'
          ? state.linkUrl.trim()
          : state.title.trim() || state.content.trim();
      const metadata = await generateTags(session, state.resourceType, contentValue);
      hydrateMetadata(metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract metadata');
    } finally {
      setState({ extracting: false });
    }
  };

  const handleExtractPdfMetadata = async () => {
    if (!session || !state.singlePdfFile) {
      setError('You must be logged in and PDF file must be selected');
      return;
    }

    setState({ extracting: true, error: '' });
    try {
      const metadata = await generateTags(session, 'pdf', state.singlePdfFile);
      hydrateMetadata(metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract metadata');
    } finally {
      setState({ extracting: false });
    }
  };

  const handleExtractPdfMetadataForIndex = async (index: number) => {
    const resource = state.pdfResources[index];
    if (!session || !resource.file) {
      setError('You must be logged in and PDF file must be selected');
      return;
    }

    setState({
      extractingPdfIndexes: Array.from(new Set([...state.extractingPdfIndexes, index])),
      error: '',
    });

    try {
      const metadata = await generateTags(session, 'pdf', resource.file);
      const updates: Partial<PDFResource> = {};
      if (metadata.tags?.length) updates.tags = metadata.tags;
      if (metadata.description) updates.description = metadata.description;
      if (metadata.topic && !resource.title.trim()) updates.title = metadata.topic;
      handleUpdatePdfResource(index, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract metadata');
    } finally {
      setState({
        extractingPdfIndexes: state.extractingPdfIndexes.filter((i) => i !== index),
      });
    }
  };

  const handleExtractAllPdfMetadata = async () => {
    if (!session || state.pdfResources.length === 0) return;

    const indexes = state.pdfResources.map((_, i) => i);
    setState({ extractingPdfIndexes: indexes, error: '' });

    await Promise.all(
      state.pdfResources.map(async (resource, index) => {
        try {
          const metadata = await generateTags(session, 'pdf', resource.file);
          const updates: Partial<PDFResource> = {};
          if (metadata.tags?.length) updates.tags = metadata.tags;
          if (metadata.description) updates.description = metadata.description;
          if (metadata.topic && !resource.title.trim()) updates.title = metadata.topic;
          handleUpdatePdfResource(index, updates);
        } catch {
          // ignore individual failures to allow batch completion
        } finally {
          setState((prev) => ({
            extractingPdfIndexes: prev.extractingPdfIndexes.filter((i) => i !== index),
          }));
        }
      }),
    );
  };

  return {
    handleExtractMetadata,
    handleExtractPdfMetadata,
    handleExtractPdfMetadataForIndex,
    handleExtractAllPdfMetadata,
  };
}
