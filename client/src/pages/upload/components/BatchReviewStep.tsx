/**
 * Review UI for batch PDF uploads.
 */
import type { PDFResource } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BatchReviewStepProps {
  resources: PDFResource[];
  tagInputs: Record<number, string>;
  extractingIndexes: number[];
  loading: boolean;
  error: string;
  onBack(): void;
  onSubmit(): void;
  onExtractAll(): void;
  onExtractForIndex(index: number): void;
  onUpdateResource(index: number, updates: Partial<PDFResource>): void;
  onRemoveResource(index: number): void;
  onAddTag(index: number, tag: string): void;
  onRemoveTag(index: number, tag: string): void;
  onTagInputChange(index: number, value: string): void;
}

/**
 * Review UI for batch PDF uploads.
 */
export function BatchReviewStep({
  resources,
  tagInputs,
  extractingIndexes,
  loading,
  error,
  onBack,
  onSubmit,
  onExtractAll,
  onExtractForIndex,
  onUpdateResource,
  onRemoveResource,
  onAddTag,
  onRemoveTag,
  onTagInputChange,
}: BatchReviewStepProps) {
  const isExtractingAll = extractingIndexes.length > 0;
  const hasMissingTitles = resources.some((r) => !r.title.trim());

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Review {resources.length} PDF{resources.length > 1 ? 's' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {resources.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={onExtractAll}
            disabled={isExtractingAll || resources.some((r) => !r.file)}
            className="w-full bg-green-500 text-white"
          >
            {isExtractingAll
              ? `Extracting ${extractingIndexes.length} of ${resources.length}...`
              : 'Auto-fill All'}
          </Button>
        )}

        <div className="space-y-6">
          {resources.map((resource, index) => (
            <div key={resource.fileName} className="p-4 border border-gray-200 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{resource.fileName}</p>
                  <p className="text-xs text-gray-500">
                    {(resource.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onRemoveResource(index)}
                  disabled={loading}
                  className="ml-2"
                >
                  Remove
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`title-${index}`}>Title *</Label>
                <Input
                  id={`title-${index}`}
                  value={resource.title}
                  onChange={(e) => onUpdateResource(index, { title: e.target.value })}
                  placeholder="Resource title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`description-${index}`}>Description</Label>
                <textarea
                  id={`description-${index}`}
                  rows={2}
                  value={resource.description}
                  onChange={(e) => onUpdateResource(index, { description: e.target.value })}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Optional description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`tags-${index}`}>Tags</Label>
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
                          onClick={() => onRemoveTag(index, tag)}
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
                  id={`tags-${index}`}
                  value={tagInputs[index] || ''}
                  onChange={(e) => onTagInputChange(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (tagInputs[index] || '').trim()) {
                      e.preventDefault();
                      onAddTag(index, (tagInputs[index] || '').trim());
                    }
                  }}
                  placeholder="Press Enter to add a tag"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => onExtractForIndex(index)}
                disabled={extractingIndexes.includes(index) || !resource.file}
                className="w-full bg-blue-500 text-white"
              >
                {extractingIndexes.includes(index) ? 'Extracting...' : 'Auto-fill with AI'}
              </Button>
            </div>
          ))}
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
