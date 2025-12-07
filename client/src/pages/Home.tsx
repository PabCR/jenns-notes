import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getResources, deleteResource } from '@/lib/api';
import type { Resource } from '../../shared/types';
import { EditResourceDialog } from '@/components/EditResourceDialog';
import { Search, X } from 'lucide-react';

export function Home() {
  const { user, session } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'note' | 'pdf' | 'link' | null>(null);
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchResources = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    setError('');

    try {
      const data = await getResources(session, {
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
      });
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [session, debouncedSearch, typeFilter]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleDelete = async (id: string) => {
    if (!session) return;
    if (!confirm('Are you sure you want to delete this resource?')) return;

    setDeletingResourceId(id);
    try {
      await deleteResource(session, id);
      setResources(resources.filter(r => r.id !== id));
      setSuccessMessage('Resource deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete resource');
    } finally {
      setDeletingResourceId(null);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
  };

  const handleEditClose = () => {
    setEditingResource(null);
    fetchResources(); // Refresh list after edit
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setTypeFilter(null);
  };

  const handleToggleSelection = (resourceId: string) => {
    setSelectedResources(prev => {
      const next = new Set(prev);
      if (next.has(resourceId)) {
        next.delete(resourceId);
      } else {
        next.add(resourceId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isSearchActive = debouncedSearch.trim().length > 0 || typeFilter !== null;
  const showNoResults = !loading && resources.length === 0 && isSearchActive;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold">My Resources</h1>
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 md:flex-initial md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={typeFilter || ''}
              onChange={(e) => setTypeFilter(e.target.value as 'note' | 'pdf' | 'link' | null || null)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="note">Notes</option>
              <option value="pdf">PDFs</option>
              <option value="link">Links</option>
            </select>
            <span className="text-sm text-gray-600 hidden md:inline">{user?.email}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 rounded border border-green-200">
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        {loading ? (
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
              <Button
                variant="outline"
                onClick={handleClearSearch}
                className="mt-2"
              >
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : resources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No resources yet.</p>
              <p className="text-sm text-gray-400">
                Create your first resource by clicking the Upload button.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource) => {
              const isSelected = selectedResources.has(resource.id);
              return (
                <Card
                  key={resource.id}
                  className={`hover:shadow-md transition-shadow cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 border-2 bg-blue-50'
                      : ''
                  }`}
                  onClick={() => handleToggleSelection(resource.id)}
                >
                <CardHeader>
                  <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                      <span className="text-2xl">📝</span>
                      <CardTitle className="text-lg line-clamp-2">
                        {resource.title}
                      </CardTitle>
                    </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleSelection(resource.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        aria-label={`Select ${resource.title}`}
                      />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resource.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {resource.description}
                    </p>
                  )}

                  {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {resource.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {resource.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          +{resource.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-400">
                    {formatDate(resource.createdAt)}
                  </p>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(resource);
                      }}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(resource.id);
                      }}
                      disabled={deletingResourceId === resource.id}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}

        {editingResource && (
          <EditResourceDialog
            resource={editingResource}
            session={session}
            onClose={handleEditClose}
          />
        )}
      </div>
    </div>
  );
}
