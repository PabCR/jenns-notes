/**
 * Resource-level mutations shared across upload steps.
 */
import type { PDFResource, UploadState } from './types';

interface ResourceActionsArgs {
  state: UploadState;
  setState: (next: Partial<UploadState> | ((state: UploadState) => Partial<UploadState>)) => void;
}

/**
 * Build reusable resource/tag handlers for the Upload flow.
 */
export function createResourceActions({ state, setState }: ResourceActionsArgs) {
  /** Update a single PDF resource entry in the batch flow. */
  const handleUpdatePdfResource = (index: number, updates: Partial<PDFResource>) => {
    setState((prev) => ({
      pdfResources: prev.pdfResources.map((resource, i) =>
        i === index ? { ...resource, ...updates } : resource,
      ),
    }));
  };

  const handleRemovePdfResource = (index: number) => {
    setState({
      pdfResources: state.pdfResources.filter((_, i) => i !== index),
    });
  };

  const handleAddTag = () => {
    if (!state.tagInput.trim()) return;
    const tag = state.tagInput.trim();
    if (state.tags.includes(tag)) {
      setState({ tagInput: '' });
      return;
    }
    setState({
      tags: [...state.tags, tag],
      tagInput: '',
    });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setState({ tags: state.tags.filter((tag) => tag !== tagToRemove) });
  };

  const handleAddTagToPdf = (index: number, tag: string) => {
    if (!tag.trim()) return;
    const trimmed = tag.trim();
    const resource = state.pdfResources[index];
    if (resource.tags.includes(trimmed)) return;

    handleUpdatePdfResource(index, { tags: [...resource.tags, trimmed] });
    setState({
      pdfTagInputs: {
        ...state.pdfTagInputs,
        [index]: '',
      },
    });
  };

  const handleRemoveTagFromPdf = (index: number, tagToRemove: string) => {
    const resource = state.pdfResources[index];
    handleUpdatePdfResource(index, {
      tags: resource.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const hydrateMetadata = (metadata: {
    tags?: string[];
    description?: string;
    topic?: string;
  }) => {
    const updates: Partial<UploadState> = {};
    if (metadata.tags?.length) {
      updates.tags = metadata.tags;
    }
    if (metadata.description && !state.description.trim()) {
      updates.description = metadata.description;
    }
    if (metadata.topic && !state.title.trim()) {
      updates.title = metadata.topic;
    }
    if (Object.keys(updates).length > 0) {
      setState(updates);
    }
  };

  return {
    handleUpdatePdfResource,
    handleRemovePdfResource,
    handleAddTag,
    handleRemoveTag,
    handleAddTagToPdf,
    handleRemoveTagFromPdf,
    hydrateMetadata,
  };
}
