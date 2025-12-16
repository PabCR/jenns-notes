/**
 * Submission handlers for single and batch resource creation.
 */
import {
  createResource,
  requestPresignedUrl,
  uploadToPresignedUrl,
} from '@/lib/api';
import type { ApiSession } from '@/lib/api';
import type { UploadState } from './types';

interface SubmitActionArgs {
  state: UploadState;
  setState: (next: Partial<UploadState> | ((state: UploadState) => Partial<UploadState>)) => void;
  session: ApiSession;
  setError(message: string): void;
}

/**
 * Build submission handlers for single and batch resource creation.
 */
export function createSubmitActions({
  state,
  setState,
  session,
  setError,
}: SubmitActionArgs) {
  const handleBatchSubmit = async () => {
    if (!session) {
      setError('You must be logged in to create resources');
      return;
    }

    if (state.pdfResources.some((r) => !r.title.trim())) {
      setError('All PDFs must have a title');
      return;
    }

    setState({ loading: true, error: '' });
    try {
      const resourcesWithPaths = await Promise.all(
        state.pdfResources.map(async (resource) => {
          const { uploadUrl, filePath } = await requestPresignedUrl(
            session,
            resource.file.name,
          );
          await uploadToPresignedUrl(uploadUrl, resource.file);
          return { ...resource, filePath };
        }),
      );

      await Promise.all(
        resourcesWithPaths.map((resource) =>
          createResource(session, {
            title: resource.title.trim(),
            description: resource.description.trim() || undefined,
            type: 'pdf',
            content: resource.filePath || '',
            tags: resource.tags.length ? resource.tags : undefined,
          }),
        ),
      );

      setState({ step: 'confirm' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resources');
    } finally {
      setState({ loading: false });
    }
  };

  const handleSubmit = async () => {
    if (!state.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!session) {
      setError('You must be logged in to create resources');
      return;
    }

    setState({ loading: true, error: '' });
    try {
      let resourceContent = state.content.trim();
      if (state.resourceType === 'pdf' && state.singlePdfFile) {
        const { uploadUrl, filePath } = await requestPresignedUrl(
          session,
          state.singlePdfFile.name,
        );
        await uploadToPresignedUrl(uploadUrl, state.singlePdfFile);
        resourceContent = filePath;
      } else if (state.resourceType === 'link') {
        resourceContent = state.linkUrl.trim();
      }

      await createResource(session, {
        title: state.title.trim(),
        description: state.description.trim() || undefined,
        type: state.resourceType,
        content: resourceContent,
        tags: state.tags.length ? state.tags : undefined,
      });

      setState({ step: 'confirm' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resource');
    } finally {
      setState({ loading: false });
    }
  };

  /** Unified submit handler for all pending resources (mixed types). */
  const handleSubmitAll = async () => {
    if (!session) {
      setError('You must be logged in to create resources');
      return;
    }

    if (state.pendingResources.length === 0) {
      setError('No resources to submit');
      return;
    }

    if (state.pendingResources.some((r) => !r.title.trim())) {
      setError('All resources must have a title');
      return;
    }

    setState({ loading: true, error: '' });
    try {
      // Process PDFs: upload to presigned URL first
      const pdfResources = state.pendingResources.filter((r) => r.type === 'pdf' && r.file);
      const pdfResourcesWithPaths = await Promise.all(
        pdfResources.map(async (resource) => {
          if (!resource.file) throw new Error('PDF file missing');
          const { uploadUrl, filePath } = await requestPresignedUrl(
            session,
            resource.file.name,
          );
          await uploadToPresignedUrl(uploadUrl, resource.file);
          return { ...resource, filePath };
        }),
      );

      // Create a map of resource id to filePath for PDFs
      const pdfPathMap = new Map(
        pdfResourcesWithPaths.map((r) => [r.id, r.filePath || '']),
      );

      // Store count before clearing
      const resourceCount = state.pendingResources.length;

      // Create all resources in parallel
      await Promise.all(
        state.pendingResources.map(async (resource) => {
          let content: string;
          if (resource.type === 'pdf') {
            content = pdfPathMap.get(resource.id) || '';
            if (!content) throw new Error(`File path missing for PDF ${resource.id}`);
          } else if (resource.type === 'link') {
            content = resource.linkUrl || '';
            if (!content) throw new Error(`URL missing for link ${resource.id}`);
          } else {
            // note
            content = resource.content || '';
            if (!content) throw new Error(`Content missing for note ${resource.id}`);
          }

          return createResource(session, {
            title: resource.title.trim(),
            description: resource.description.trim() || undefined,
            type: resource.type,
            content,
            tags: resource.tags.length ? resource.tags : undefined,
          });
        }),
      );

      setState({
        step: 'confirm',
        pendingResources: [],
        pendingTagInputs: {},
        confirmedResourceCount: resourceCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resources');
    } finally {
      setState({ loading: false });
    }
  };

  return {
    handleSubmit,
    handleBatchSubmit,
    handleSubmitAll,
  };
}
