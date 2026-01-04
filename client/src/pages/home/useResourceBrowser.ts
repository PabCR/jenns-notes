/**
 * Shared state and behaviors for the Home resource browser.
 */
import { useCallback, useEffect, useReducer } from 'react';
import { deleteResource, getResources, toggleFavorite } from '@/lib/api';
import type { ApiSession } from '@/lib/api';
import type { Resource } from '@/lib/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface HomeState {
  resources: Resource[];
  loading: boolean;
  error: string;
  editingResource: Resource | null;
  deletingResourceId: string | null;
  successMessage: string;
  searchQuery: string;
  typeFilter: 'note' | 'pdf' | 'link' | null;
  ownershipFilter: 'mine' | 'others' | 'all' | null;
  favoritesOnly: boolean;
  selectedResources: Set<string>;
  pdfViewerOpen: boolean;
  pdfViewerPath: string | null;
}

type HomeAction =
  | Partial<HomeState>
  | ((state: HomeState) => Partial<HomeState>);

const createInitialState = (): HomeState => ({
  resources: [],
  loading: true,
  error: '',
  editingResource: null,
  deletingResourceId: null,
  successMessage: '',
  searchQuery: '',
  typeFilter: null,
  ownershipFilter: 'all',
  favoritesOnly: false,
  selectedResources: new Set<string>(),
  pdfViewerOpen: false,
  pdfViewerPath: null,
});

const mergeReducer = (prev: HomeState, action: HomeAction): HomeState => {
  const next = typeof action === 'function' ? action(prev) : action;
  return { ...prev, ...next };
};

/**
 * Manage resource list state and lifecycle interactions.
 */
export function useResourceBrowser(session: ApiSession) {
  const [state, setState] = useReducer(mergeReducer, undefined, createInitialState);
  const debouncedSearch = useDebouncedValue(state.searchQuery, 300);

  const fetchResources = useCallback(async () => {
    if (!session) return;

    setState({ loading: true, error: '' });
    try {
      const data = await getResources(session, {
        search: debouncedSearch || undefined,
        type: state.typeFilter || undefined,
        ownership: state.ownershipFilter || undefined,
        favoritesOnly: state.favoritesOnly || undefined,
      });
      setState({ resources: data });
    } catch (err) {
      setState({
        error: err instanceof Error ? err.message : 'Failed to load resources',
      });
    } finally {
      setState({ loading: false });
    }
  }, [debouncedSearch, session, state.typeFilter, state.ownershipFilter, state.favoritesOnly]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!session) return;
      if (!confirm('Are you sure you want to delete this resource?')) return;

      setState({ deletingResourceId: id });
      try {
        await deleteResource(session, id);
        setState({
          resources: state.resources.filter((r) => r.id !== id),
          successMessage: 'Resource deleted successfully',
        });
        window.setTimeout(() => setState({ successMessage: '' }), 3000);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete resource');
      } finally {
        setState({ deletingResourceId: null });
      }
    },
    [session, state.resources],
  );

  const handleToggleSelection = useCallback(
    (resourceId: string) => {
      setState((prev) => {
        const next = new Set(prev.selectedResources);
        if (next.has(resourceId)) {
          next.delete(resourceId);
        } else {
          next.add(resourceId);
        }
        return { selectedResources: next };
      });
    },
    [],
  );

  const clearSearch = useCallback(() => {
    setState({ searchQuery: '', typeFilter: null, ownershipFilter: 'all', favoritesOnly: false });
  }, []);

  const handleToggleFavorite = useCallback(
    async (resourceId: string) => {
      if (!session) return;

      try {
        const updatedResource = await toggleFavorite(session, resourceId);
        setState((prev) => ({
          resources: prev.resources.map((r) =>
            r.id === resourceId ? updatedResource : r
          ),
        }));
      } catch (err) {
        setState({
          error: err instanceof Error ? err.message : 'Failed to toggle favorite',
        });
      }
    },
    [session],
  );

  const openPdfViewer = useCallback((filePath: string) => {
    setState({ pdfViewerOpen: true, pdfViewerPath: filePath });
  }, []);

  const closePdfViewer = useCallback(() => {
    setState({ pdfViewerOpen: false, pdfViewerPath: null });
  }, []);

  return {
    state,
    setState,
    debouncedSearch,
    fetchResources,
    handleDelete,
    handleToggleSelection,
    handleToggleFavorite,
    clearSearch,
    openPdfViewer,
    closePdfViewer,
  };
}
