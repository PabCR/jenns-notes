/**
 * Review UI for mixed resource types (notes, links, PDFs).
 */
import type { PendingResource } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MultiReviewStepProps {
  resources: PendingResource[];
  tagInputs: Record<string, string>;
  extractingIds: string[];
  loading: boolean;
  error: string;
  onBack(): void;
  onSubmit(): void;
  onExtractAll(): void;
  onExtractForId(id: string): void;
  onUpdateResource(id: string, updates: Partial<PendingResource>): void;
  onRemoveResource(id: string): void;
  onAddTag(id: string, tag: string): void;
  onRemoveTag(id: string, tag: string): void;
  onTagInputChange(id: string, value: string): void;
}

/**
 * Review UI for mixed resource types (notes, links, PDFs).
 */
export function MultiReviewStep({
  resources,
  tagInputs,
  extractingIds,
  loading,
  error,
  onBack,
  onSubmit,
  onExtractAll,
  onExtractForId,
  onUpdateResource,
  onRemoveResource,
  onAddTag,
  onRemoveTag,
  onTagInputChange,
}: MultiReviewStepProps) {
  const isExtractingAll = extractingIds.length > 0;
  const hasMissingTitles = resources.some((r) => !r.title.trim());

  const getResourceTypeLabel = (type: string): string => {
    switch (type) {
      case 'note':
        return 'Note';
      case 'link':
        return 'Link';
      case 'pdf':
        return 'PDF';
      default:
        return 'Resource';
    }
  };

  const renderResourcePreview = (resource: PendingResource) => {
    if (resource.type === 'note' && resource.content) {
      const preview = resource.content.length > 100
        ? resource.content.substring(0, 100) + '...'
        : resource.content;
      return (
        <div className="p-3 bg-gray-100 rounded-md">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{preview}</p>
        </div>
      );
    }
    if (resource.type === 'link' && resource.linkUrl) {
      return (
        <div className="p-3 bg-gray-100 rounded-md">
          <a
            href={resource.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all text-sm"
          >
            {resource.linkUrl}
          </a>
        </div>
      );
    }
    if (resource.type === 'pdf' && resource.file) {
      return (
        <div className="p-3 bg-gray-100 rounded-md">
          <p className="text-sm font-medium text-gray-700">{resource.fileName || resource.file.name}</p>
          <p className="text-xs text-gray-500">
            {(resource.file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      );
    }
    return null;
  };

  const canExtractMetadata = (resource: PendingResource): boolean => {
    if (resource.type === 'pdf') return !!resource.file;
    if (resource.type === 'link') return !!resource.linkUrl;
    if (resource.type === 'note') return !!resource.content;
    return false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Review {resources.length} Resource{resources.length > 1 ? 's' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {resources.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={onExtractAll}
            disabled={isExtractingAll || resources.some((r) => !canExtractMetadata(r))}
            className="w-full bg-green-500 text-white"
          >
            {isExtractingAll
              ? `Extracting ${extractingIds.length} of ${resources.length}...`
              : 'Auto-fill All'}
          </Button>
        )}

        <div className="space-y-6">
          {resources.map((resource) => {
            const isExtracting = extractingIds.includes(resource.id);
            const tagInput = tagInputs[resource.id] || '';

            return (
              <div key={resource.id} className="p-4 border border-gray-200 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 uppercase">
                      {getResourceTypeLabel(resource.type)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onRemoveResource(resource.id)}
                    disabled={loading}
                    className="ml-2"
                  >
                    Remove
                  </Button>
                </div>

                {renderResourcePreview(resource)}

                <div className="space-y-2">
                  <Label htmlFor={`title-${resource.id}`}>Title *</Label>
                  <Input
                    id={`title-${resource.id}`}
                    value={resource.title}
                    onChange={(e) => onUpdateResource(resource.id, { title: e.target.value })}
                    placeholder="Resource title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`description-${resource.id}`}>Description</Label>
                  <textarea
                    id={`description-${resource.id}`}
                    rows={2}
                    value={resource.description}
                    onChange={(e) => onUpdateResource(resource.id, { description: e.target.value })}
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Optional description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tags-${resource.id}`}>Tags</Label>
                  {resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {resource.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => onRemoveTag(resource.id, tag)}
                            className="hover:text-blue-600"
                            aria-label={`Remove tag ${tag}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <Input
                    id={`tags-${resource.id}`}
                    value={tagInput}
                    onChange={(e) => onTagInputChange(resource.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault();
                        onAddTag(resource.id, tagInput.trim());
                      }
                    }}
                    placeholder="Press Enter to add a tag"
                  />
                </div>

                {canExtractMetadata(resource) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onExtractForId(resource.id)}
                    disabled={isExtracting}
                    className="w-full bg-blue-500 text-white"
                  >
                    {isExtracting ? 'Extracting...' : 'Auto-fill with AI'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onBack} disabled={loading}>
            Back
          </Button>
          <Button
            onClick={onSubmit}
            disabled={loading || resources.length === 0 || hasMissingTitles || isExtractingAll}
            className="flex-1"
          >
            {loading
              ? `Creating ${resources.length} Resource${resources.length > 1 ? 's' : ''}...`
              : `Create ${resources.length} Resource${resources.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
