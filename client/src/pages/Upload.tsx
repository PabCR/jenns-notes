import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createResource, requestPresignedUrl, uploadToPresignedUrl } from '@/lib/api';
import { Upload as UploadIcon } from 'lucide-react';

type Step = 'type' | 'review' | 'confirm';
type ResourceType = 'note' | 'link' | 'pdf';

interface PendingPDF {
  file: File;
  error?: string;
}

interface PDFResource {
  fileName: string;
  file: File;
  filePath?: string;
  title: string;
  description: string;
  tags: string[];
}

export function Upload() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [step, setStep] = useState<Step>('type');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Resource type
  const [resourceType, setResourceType] = useState<ResourceType>('note');

  // Step 1: Input (Note content or Link URL or PDF files)
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [pendingPDFs, setPendingPDFs] = useState<PendingPDF[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Review
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [pdfResources, setPdfResources] = useState<PDFResource[]>([]);
  const [pdfTagInputs, setPdfTagInputs] = useState<Record<number, string>>({});
  const [singlePDFFile, setSinglePDFFile] = useState<File | null>(null);

  const isValidUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const extractDomainFromUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch {
      return 'Untitled Link';
    }
  };

  const handleAddNote = () => {
    if (!content.trim()) {
      setError('Please enter note content');
      return;
    }
    setError('');
    setResourceType('note');
    // Pre-fill title from first line or use default
    const firstLine = content.split('\n')[0].trim();
    setTitle(firstLine || 'Untitled Note');
    setStep('review');
  };

  const handleAddLink = () => {
    let url = linkUrl.trim();
    if (!url) {
      setError('Please enter a URL');
      return;
    }
    // Automatically prepend https:// if no protocol is present
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
      setLinkUrl(url); // Update state with the URL that has protocol
    }
    if (!isValidUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }
    setError('');
    setResourceType('link');
    // Pre-fill title from URL domain
    const domain = extractDomainFromUrl(url);
    setTitle(domain || 'Untitled Link');
    setContent(url); // Store URL in content for submission
    setStep('review');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_FILES = 10;
    const validFiles: PendingPDF[] = [];
    const errors: string[] = [];

    // Check total file count
    if (pendingPDFs.length + files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed. Please select fewer files.`);
      return;
    }

    files.forEach((file) => {
      // Check file type
      if (file.type !== 'application/pdf') {
        errors.push(`${file.name}: Must be a PDF file`);
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File size must be less than 10MB`);
        return;
      }

      validFiles.push({ file });
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    if (validFiles.length > 0) {
      setPendingPDFs([...pendingPDFs, ...validFiles]);
      setError('');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePDF = (index: number) => {
    setPendingPDFs(pendingPDFs.filter((_, i) => i !== index));
  };

  const handleAddPDFs = () => {
    if (pendingPDFs.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    setError('');

    // Create PDF resources from pending PDFs (no upload yet)
    const resources: PDFResource[] = pendingPDFs.map((pdf) => {
      const filename = pdf.file.name.replace(/\.pdf$/i, '');
      return {
        fileName: pdf.file.name,
        file: pdf.file,
        title: filename || 'Untitled PDF',
        description: '',
        tags: [],
      };
    });

    // If only one PDF, use single resource flow
    if (pendingPDFs.length === 1) {
      const resource = resources[0];
      setResourceType('pdf');
      setTitle(resource.title);
      setDescription(resource.description);
      setTags(resource.tags);
      setSinglePDFFile(resource.file);
      setPendingPDFs([]);
      setPdfResources([]);
      setStep('review');
    } else {
      // Multiple PDFs - show preview with all resources
      setResourceType('pdf');
      setPdfResources(resources);
      setPendingPDFs([]);
      setStep('review');
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUpdatePDFResource = (index: number, updates: Partial<PDFResource>) => {
    setPdfResources(
      pdfResources.map((resource, i) =>
        i === index ? { ...resource, ...updates } : resource
      )
    );
  };

  const handleAddTagToPDF = (pdfIndex: number, tag: string) => {
    if (!tag.trim()) return;
    const resource = pdfResources[pdfIndex];
    if (!resource.tags.includes(tag.trim())) {
      handleUpdatePDFResource(pdfIndex, {
        tags: [...resource.tags, tag.trim()],
      });
    }
  };

  const handleRemoveTagFromPDF = (pdfIndex: number, tagToRemove: string) => {
    const resource = pdfResources[pdfIndex];
    handleUpdatePDFResource(pdfIndex, {
      tags: resource.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleRemovePDFResource = (index: number) => {
    setPdfResources(pdfResources.filter((_, i) => i !== index));
  };

  const handleBatchSubmit = async () => {
    if (!session) {
      setError('You must be logged in to create resources');
      return;
    }

    // Validate all resources have titles
    const invalidResources = pdfResources.filter((r) => !r.title.trim());
    if (invalidResources.length > 0) {
      setError('All PDFs must have a title');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload all files to storage first
      const resourcesWithPaths = await Promise.all(
        pdfResources.map(async (resource) => {
          const { uploadUrl, filePath } = await requestPresignedUrl(
            session,
            resource.file.name
          );
          await uploadToPresignedUrl(uploadUrl, resource.file);
          return {
            ...resource,
            filePath,
          };
        })
      );

      // Then create all resources
      const createPromises = resourcesWithPaths.map((resource) =>
        createResource(session, {
          title: resource.title.trim(),
          description: resource.description.trim() || undefined,
          type: 'pdf',
          content: resource.filePath!,
          tags: resource.tags.length > 0 ? resource.tags : undefined,
        })
      );

      await Promise.all(createPromises);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resources');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!session) {
      setError('You must be logged in to create resources');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let resourceContent: string;
      
      // For PDF type, upload file to storage first
      if (resourceType === 'pdf' && singlePDFFile) {
        const { uploadUrl, filePath } = await requestPresignedUrl(
          session,
          singlePDFFile.name
        );
        await uploadToPresignedUrl(uploadUrl, singlePDFFile);
        resourceContent = filePath;
      } else if (resourceType === 'link') {
        resourceContent = linkUrl.trim();
      } else {
        resourceContent = content.trim();
      }

      await createResource(session, {
        title: title.trim(),
        description: description.trim() || undefined,
        type: resourceType,
        content: resourceContent,
        tags: tags.length > 0 ? tags : undefined,
      });

      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resource');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadMore = () => {
    // Reset all state
    setStep('type');
    setResourceType('note');
    setContent('');
    setLinkUrl('');
    setPendingPDFs([]);
    setTitle('');
    setDescription('');
    setTags([]);
    setTagInput('');
    setError('');
    setPdfResources([]);
    setPdfTagInputs({});
    setSinglePDFFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upload Resource</h1>

        {step === 'type' && (
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
                    onChange={(e) => setContent(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter your note here..."
                  />
                </div>
                <Button
                  onClick={handleAddNote}
                  disabled={loading || !content.trim()}
                  className="w-full"
                >
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
                    onChange={(e) => {
                      setLinkUrl(e.target.value);
                      setError('');
                    }}
                    placeholder="https://example.com"
                    className={error && linkUrl ? 'border-red-500' : ''}
                  />
                  {error && linkUrl && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                </div>
                <Button
                  onClick={handleAddLink}
                  disabled={loading || !linkUrl.trim()}
                  className="w-full"
                >
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
                  onChange={handleFileSelect}
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
                  {pendingPDFs.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-sm text-gray-600">
                        {pendingPDFs.length} file(s) selected
                      </p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {pendingPDFs.map((pdf, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {pdf.file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(pdf.file.size / 1024 / 1024).toFixed(2)} MB
                                {pdf.error && (
                                  <span className="text-red-600 ml-2">
                                    - {pdf.error}
                                  </span>
                                )}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePDF(index)}
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
                  onClick={handleAddPDFs}
                  disabled={
                    loading ||
                    pendingPDFs.length === 0 ||
                    pendingPDFs.some((p) => p.error)
                  }
                  className="w-full"
                >
                  Review PDFs
                </Button>
                {error && pendingPDFs.length > 0 && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'review' && (
          <Card>
            <CardHeader>
              <CardTitle>
                {pdfResources.length > 0
                  ? `Review ${pdfResources.length} PDF${pdfResources.length > 1 ? 's' : ''}`
                  : 'Review Resource'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Multiple PDFs preview */}
              {pdfResources.length > 0 ? (
                <div className="space-y-6">
                  {pdfResources.map((resource, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {resource.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(resource.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleRemovePDFResource(index)}
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
                          onChange={(e) =>
                            handleUpdatePDFResource(index, {
                              title: e.target.value,
                            })
                          }
                          placeholder="Resource title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`description-${index}`}>Description</Label>
                        <textarea
                          id={`description-${index}`}
                          rows={2}
                          value={resource.description}
                          onChange={(e) =>
                            handleUpdatePDFResource(index, {
                              description: e.target.value,
                            })
                          }
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
                                  onClick={() =>
                                    handleRemoveTagFromPDF(index, tag)
                                  }
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
                          value={pdfTagInputs[index] || ''}
                          onChange={(e) =>
                            setPdfTagInputs({
                              ...pdfTagInputs,
                              [index]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key === 'Enter' &&
                              (pdfTagInputs[index] || '').trim()
                            ) {
                              e.preventDefault();
                              handleAddTagToPDF(
                                index,
                                (pdfTagInputs[index] || '').trim()
                              );
                              setPdfTagInputs({
                                ...pdfTagInputs,
                                [index]: '',
                              });
                            }
                          }}
                          placeholder="Press Enter to add a tag"
                        />
                      </div>
                    </div>
                  ))}

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setStep('type')}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleBatchSubmit}
                      disabled={
                        loading ||
                        pdfResources.length === 0 ||
                        pdfResources.some((r) => !r.title.trim())
                      }
                      className="flex-1"
                    >
                      {loading
                        ? `Creating ${pdfResources.length} Resource${pdfResources.length > 1 ? 's' : ''}...`
                        : `Create ${pdfResources.length} Resource${pdfResources.length > 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Single resource review (existing flow for note/link/single PDF) */
                <>
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
                  {resourceType === 'pdf' && singlePDFFile && (
                    <div className="space-y-2">
                      <Label>PDF File</Label>
                      <div className="p-3 bg-gray-100 rounded-md">
                        <p className="text-sm text-gray-700">
                          File: {singlePDFFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(singlePDFFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Resource title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
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
                              onClick={() => handleRemoveTag(tag)}
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
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Press Enter to add a tag"
                    />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep('type')}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleUploadMore}
                      disabled={loading}
                    >
                      Remove
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={loading || !title.trim()}
                      className="flex-1"
                    >
                      {loading ? 'Creating...' : 'Create Resource'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {step === 'confirm' && (
          <Card>
            <CardHeader>
              <CardTitle>Success!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-green-600">
                {pdfResources.length > 0
                  ? `${pdfResources.length} resource${pdfResources.length > 1 ? 's' : ''} created successfully.`
                  : 'Your resource has been created successfully.'}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleUploadMore}
                  className="flex-1"
                >
                  Upload More
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  View Resources
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

