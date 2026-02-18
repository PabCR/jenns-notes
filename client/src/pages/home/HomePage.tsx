/**
 * Home page renders the resource library with search, filters, and preview.
 */
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { EditResourceDialog } from '@/components/EditResourceDialog';
import { PDFViewer } from '@/components/PDFViewer';
import { FilterBar } from './components/FilterBar';
import { ResourceGrid } from './components/ResourceGrid';
import { PacketSheet } from './components/PacketSheet';
import { useResourceBrowser } from './useResourceBrowser';

/**
 * Home entry point that stitches filter controls with resource list UI.
 */
export function HomePage() {
  const { user, session, signOut } = useAuth();
  const {
    state,
    setState,
    debouncedSearch,
    fetchResources,
    handleDelete,
    handleToggleSelection,
    handleToggleFavorite,
    clearSearch,
    setSort,
    openPdfViewer,
    closePdfViewer,
  } = useResourceBrowser(session);
  const [packetSheetOpen, setPacketSheetOpen] = useState(false);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const isSearchActive =
    debouncedSearch.trim().length > 0 || state.typeFilter !== null;
  const showNoResults = !state.loading && state.resources.length === 0 && isSearchActive;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto">
        <FilterBar
          searchQuery={state.searchQuery}
          typeFilter={state.typeFilter}
          ownershipFilter={state.ownershipFilter}
          favoritesOnly={state.favoritesOnly}
          sort={state.sort}
          userEmail={user?.email}
          onSearchChange={(value) => setState({ searchQuery: value })}
          onClear={clearSearch}
          onTypeChange={(value) => setState({ typeFilter: value })}
          onOwnershipChange={(value) => setState({ ownershipFilter: value })}
          onFavoritesToggle={(value) => setState({ favoritesOnly: value })}
          onSortChange={setSort}
          onSignOut={signOut}
        />

        {state.error && (
          <div className="mb-4 p-4 bg-red-50 rounded border border-red-200">
            <p className="text-sm text-red-800">{state.error}</p>
          </div>
        )}

        {state.successMessage && (
          <div className="mb-4 p-4 bg-green-50 rounded border border-green-200">
            <p className="text-sm text-green-800">{state.successMessage}</p>
          </div>
        )}

        {state.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : showNoResults ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No resources match your search.</p>
              <Button variant="outline" onClick={clearSearch} className="mt-2">
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : state.resources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No resources yet.</p>
              <p className="text-sm text-gray-400">
                Create your first resource by clicking the Upload button.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ResourceGrid
            resources={state.resources}
            selectedIds={state.selectedResources}
            deletingResourceId={state.deletingResourceId}
            currentUserId={user?.id ?? null}
            onToggleSelection={handleToggleSelection}
            onToggleFavorite={handleToggleFavorite}
            onEdit={(resource) => setState({ editingResource: resource })}
            onDelete={handleDelete}
            onOpenLink={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
            onOpenPdf={openPdfViewer}
            formatDate={formatDate}
          />
        )}

        {state.editingResource && (
          <EditResourceDialog
            resource={state.editingResource}
            session={session}
            onClose={() => {
              setState({ editingResource: null });
              fetchResources();
            }}
          />
        )}

        <Dialog open={state.pdfViewerOpen} onOpenChange={closePdfViewer}>
          <DialogContent className="max-w-full sm:max-w-6xl max-h-[90vh] h-[90vh] flex flex-col p-4 sm:p-6">
            {state.pdfViewerPath && (
              <PDFViewer
                filePath={state.pdfViewerPath}
                onClose={closePdfViewer}
              />
            )}
          </DialogContent>
        </Dialog>

        {state.selectedResources.size > 0 && (
          <div className="fixed bottom-24 right-4 z-30">
            <Button
              onClick={() => setPacketSheetOpen(true)}
              className="shadow-lg"
            >
              Create Packet ({state.selectedResources.size} selected)
            </Button>
          </div>
        )}

        <PacketSheet
          open={packetSheetOpen}
          onOpenChange={setPacketSheetOpen}
          selectedResourceIds={state.selectedResources}
          resources={state.resources}
          session={session}
          onSuccess={() => {
            setState({ selectedResources: new Set(), successMessage: 'Packet created successfully' });
            window.setTimeout(() => setState({ successMessage: '' }), 3000);
            fetchResources();
          }}
        />
      </div>
    </div>
  );
}

export { HomePage as Home };
