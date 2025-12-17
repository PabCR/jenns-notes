/**
 * Resource card grid with selection, actions, and metadata display.
 */
import type { Resource } from '../../../../../shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Link as LinkIcon, StickyNote } from 'lucide-react';

interface ResourceGridProps {
  resources: Resource[];
  selectedIds: Set<string>;
  deletingResourceId: string | null;
  currentUserId?: string | null;
  onToggleSelection(resourceId: string): void;
  onEdit(resource: Resource): void;
  onDelete(resourceId: string): void;
  onOpenLink(url: string): void;
  onOpenPdf(path: string): void;
  formatDate(date: string): string;
}

const ResourceIcon = ({ type }: { type: Resource['type'] }) => {
  if (type === 'link') return <LinkIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />;
  if (type === 'note') return <StickyNote className="w-6 h-6 text-green-600 flex-shrink-0" />;
  return <FileText className="w-6 h-6 text-gray-600 flex-shrink-0" />;
};

/**
 * Grid of resource cards with selection and action controls.
 */
export function ResourceGrid({
  resources,
  selectedIds,
  deletingResourceId,
  currentUserId,
  onToggleSelection,
  onEdit,
  onDelete,
  onOpenLink,
  onOpenPdf,
  formatDate,
}: ResourceGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {resources.map((resource) => {
        const isSelected = selectedIds.has(resource.id);
        const isOwner = currentUserId ? resource.userId === currentUserId : true;
        return (
          <Card
            key={resource.id}
            className={`hover:shadow-md transition-shadow cursor-pointer ${
              isSelected ? 'border-blue-500 border-2 bg-blue-50' : ''
            }`}
            onClick={() => onToggleSelection(resource.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <ResourceIcon type={resource.type} />
                  <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelection(resource.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  aria-label={`Select ${resource.title}`}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {resource.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{resource.description}</p>
              )}

              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {resource.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={`${resource.id}-${tag}-${idx}`}
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

              <p className="text-xs text-gray-400">{formatDate(resource.createdAt)}</p>

              <div className="flex gap-2 pt-2">
                {resource.type === 'link' && (
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLink(resource.content);
                    }}
                    className="flex-1 h-9"
                  >
                    Visit Link
                  </Button>
                )}
                {resource.type === 'pdf' && (
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPdf(resource.content);
                    }}
                    className="flex-1 h-9"
                  >
                    View
                  </Button>
                )}
                {isOwner && (
                  <>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(resource);
                      }}
                      className="flex-1 h-9"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(resource.id);
                      }}
                      disabled={deletingResourceId === resource.id}
                      className="flex-1 h-9 text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
