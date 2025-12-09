/**
 * Step 1: allow the user to choose note, link, or PDF inputs.
 */
import type { PendingPDF } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload as UploadIcon } from 'lucide-react';
import type { RefObject } from 'react';

interface TypeStepProps {
  content: string;
  linkUrl: string;
  pendingPdfs: PendingPDF[];
  loading: boolean;
  error: string;
  fileInputRef: RefObject<HTMLInputElement>;
  onContentChange(value: string): void;
  onLinkChange(value: string): void;
  onAddNote(): void;
  onAddLink(): void;
  onFileSelect(files: File[]): void;
  onRemovePendingPdf(index: number): void;
  onAddPdfs(): void;
}

/**
 * Step 1: select note, link, or PDF inputs and validate pending files.
 */
export function TypeStep({
  content,
  linkUrl,
  pendingPdfs,
  loading,
  error,
  fileInputRef,
  onContentChange,
  onLinkChange,
  onAddNote,
  onAddLink,
  onFileSelect,
  onRemovePendingPdf,
  onAddPdfs,
}: TypeStepProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Type a Note</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Note Content</Label>
            <textarea
              id="content"
              rows={4}
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter your note here..."
            />
          </div>
          <Button onClick={onAddNote} disabled={loading || !content.trim()} className="w-full">
            Add Note
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add External Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkUrl">URL</Label>
            <Input
              id="linkUrl"
              type="url"
              value={linkUrl}
              onChange={(e) => onLinkChange(e.target.value)}
              placeholder="https://example.com"
              className={error && linkUrl ? 'border-red-500' : ''}
            />
            {error && linkUrl && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <Button onClick={onAddLink} disabled={loading || !linkUrl.trim()} className="w-full">
            Add Link
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select PDFs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={(e) => onFileSelect(Array.from(e.target.files || []))}
            className="hidden"
            id="pdf-upload"
          />
          <div className="space-y-2">
            <Label htmlFor="pdf-upload">PDF Files (max 10MB each, up to 10 files)</Label>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full"
            >
              <UploadIcon className="mr-2 h-4 w-4" />
              Select PDFs
            </Button>
            {pendingPdfs.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-sm text-gray-600">{pendingPdfs.length} file(s) selected</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {pendingPdfs.map((pdf, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pdf.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(pdf.file.size / 1024 / 1024).toFixed(2)} MB
                          {pdf.error && <span className="text-red-600 ml-2">- {pdf.error}</span>}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onRemovePendingPdf(index)}
                        className="ml-2"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button
            onClick={onAddPdfs}
            disabled={loading || pendingPdfs.length === 0 || pendingPdfs.some((p) => p.error)}
            className="w-full"
          >
            Review PDFs
          </Button>
          {error && pendingPdfs.length > 0 && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
