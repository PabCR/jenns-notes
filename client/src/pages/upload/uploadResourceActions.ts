/**
 * Resource-level mutations shared across upload steps.
 */
import type { PendingResource, PDFResource, UploadState } from './types';

interface ResourceActionsArgs {
  state: UploadState;
  setState: (next: Partial<UploadState> | ((state: UploadState) => Partial<UploadState>)) => void;
}

/**
 * Build reusable resource/tag handlers for the Upload flow.
 */
export function createResourceActions({ state, setState }: ResourceActionsArgs) {
  /** Update a single PDF resource entry in the batch flow. (deprecated, kept for backward compatibility) */
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

  /** Update a pending resource by id. */
  const handleUpdateResource = (id: string, updates: Partial<PendingResource>) => {
    setState((prev) => ({
      pendingResources: prev.pendingResources.map((resource) =>
        resource.id === id ? { ...resource, ...updates } : resource,
      ),
    }));
  };

  /** Remove a pending resource by id. */
  const handleRemoveResource = (id: string) => {
    setState({
      pendingResources: state.pendingResources.filter((resource) => resource.id !== id),
      pendingTagInputs: Object.fromEntries(
        Object.entries(state.pendingTagInputs).filter(([key]) => key !== id),
      ),
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

  /** Add a tag to a pending resource by id. */
  const handleAddTagToResource = (id: string, tag: string) => {
    if (!tag.trim()) return;
    const trimmed = tag.trim();
    const resource = state.pendingResources.find((r) => r.id === id);
    if (!resource || resource.tags.includes(trimmed)) return;

    handleUpdateResource(id, { tags: [...resource.tags, trimmed] });
    setState({
      pendingTagInputs: {
        ...state.pendingTagInputs,
        [id]: '',
      },
    });
  };

  /** Remove a tag from a pending resource by id. */
  const handleRemoveTagFromResource = (id: string, tagToRemove: string) => {
    const resource = state.pendingResources.find((r) => r.id === id);
    if (!resource) return;

    handleUpdateResource(id, {
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

  /** Hydrate metadata for a specific pending resource by id. */
  const hydrateMetadataForResource = (
    id: string,
    metadata: {
      tags?: string[];
      description?: string;
      topic?: string;
    },
  ) => {
    const resource = state.pendingResources.find((r) => r.id === id);
    if (!resource) return;

    const updates: Partial<PendingResource> = {};
    if (metadata.tags?.length) {
      updates.tags = metadata.tags;
    }
    if (metadata.description && !resource.description.trim()) {
      updates.description = metadata.description;
    }
    if (metadata.topic && !resource.title.trim()) {
      updates.title = metadata.topic;
    }
    if (Object.keys(updates).length > 0) {
      handleUpdateResource(id, updates);
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
    handleUpdateResource,
    handleRemoveResource,
    handleAddTagToResource,
    handleRemoveTagFromResource,
    hydrateMetadataForResource,
  };
}
