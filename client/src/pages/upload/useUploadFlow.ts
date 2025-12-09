/**
 * Compose upload actions from smaller action modules.
 */
import { useCallback } from 'react';
import type { ApiSession } from '@/lib/api';
import { useUploadState } from './uploadState';
import { createTypeActions } from './uploadTypeActions';
import { createResourceActions } from './uploadResourceActions';
import { createMetadataActions } from './uploadMetadataActions';
import { createSubmitActions } from './uploadSubmitActions';

/**
 * Expose Upload state plus grouped action handlers.
 */
export function useUploadFlow(session: ApiSession) {
  const { state, setState, resetFlow } = useUploadState();

  const setError = useCallback(
    (message: string) => setState({ error: message }),
    [setState],
  );

  const resourceActions = createResourceActions({ state, setState });
  const typeActions = createTypeActions({ state, setState, session, setError });
  const metadataActions = createMetadataActions({
    state,
    setState,
    session,
    setError,
    hydrateMetadata: resourceActions.hydrateMetadata,
    handleUpdatePdfResource: resourceActions.handleUpdatePdfResource,
  });
  const submitActions = createSubmitActions({ state, setState, session, setError });

  return {
    state,
    setState,
    resetFlow,
    setError,
    ...resourceActions,
    ...typeActions,
    ...metadataActions,
    ...submitActions,
  };
}
