/**
 * Review form for a single note, link, or PDF resource.
 */
import type { KeyboardEvent } from 'react';
import type { ResourceType } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SingleReviewStepProps {
  resourceType: ResourceType;
  linkUrl: string;
  singlePdfFile: File | null;
  title: string;
  description: string;
  tags: string[];
  tagInput: string;
  loading: boolean;
  extracting: boolean;
  error: string;
  onTitleChange(value: string): void;
  onDescriptionChange(value: string): void;
  onTagInputChange(value: string): void;
  onAddTag(): void;
  onRemoveTag(tag: string): void;
  onExtractMetadata(): void;
  onExtractPdfMetadata(): void;
  onBack(): void;
  onReset(): void;
  onSubmit(): void;
}

/**
 * Review form for a single note, link, or PDF resource.
 */
export function SingleReviewStep({
  resourceType,
  linkUrl,
  singlePdfFile,
  title,
  description,
  tags,
  tagInput,
  loading,
  extracting,
  error,
  onTitleChange,
  onDescriptionChange,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onExtractMetadata,
  onExtractPdfMetadata,
  onBack,
  onReset,
  onSubmit,
}: SingleReviewStepProps) {
  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddTag();
    }
  };

  return (
    <Card className="max-h-[calc(100vh-12rem)] overflow-y-auto">
      <CardHeader>
        <CardTitle>Review Resource</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {resourceType === 'link' && (
          <div className="space-y-2">
            <Label>URL Preview</Label>
            <div className="p-3 bg-gray-100 rounded-md">
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {linkUrl}
              </a>
            </div>
          </div>
        )}

        {resourceType === 'pdf' && singlePdfFile && (
          <div className="space-y-2">
            <Label>PDF File</Label>
            <div className="p-3 bg-gray-100 rounded-md">
              <p className="text-sm text-gray-700">File: {singlePdfFile.name}</p>
              <p className="text-xs text-gray-500">
                {(singlePdfFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Resource title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Optional description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => onRemoveTag(tag)}
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
            id="tags"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Press Enter to add a tag"
          />
        </div>

        {resourceType === 'pdf' ? (
          <Button
            type="button"
            variant="outline"
            onClick={onExtractPdfMetadata}
            disabled={extracting || !singlePdfFile}
            className="w-full bg-blue-500 text-white"
          >
            {extracting ? 'Extracting...' : 'Auto-fill with AI'}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onExtractMetadata}
            disabled={extracting || (resourceType === 'link' ? !linkUrl.trim() : false)}
            className="w-full bg-blue-500 text-white"
          >
            {extracting ? 'Extracting...' : 'Auto-fill with AI'}
          </Button>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} disabled={loading}>
            Back
          </Button>
          <Button variant="outline" onClick={onReset} disabled={loading}>
            Remove
          </Button>
          <Button onClick={onSubmit} disabled={loading || !title.trim() || extracting} className="flex-1">
            {loading ? 'Creating...' : 'Create Resource'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
