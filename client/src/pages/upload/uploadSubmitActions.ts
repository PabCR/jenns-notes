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

  return {
    handleSubmit,
    handleBatchSubmit,
  };
}
