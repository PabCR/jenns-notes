import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createResource } from '@/lib/api';

type Step = 'type' | 'review' | 'confirm';
type ResourceType = 'note' | 'link';

export function Upload() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [step, setStep] = useState<Step>('type');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Resource type
  const [resourceType, setResourceType] = useState<ResourceType>('note');

  // Step 1: Input (Note content or Link URL)
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Step 2: Review
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

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
      await createResource(session, {
        title: title.trim(),
        description: description.trim() || undefined,
        type: resourceType,
        content: resourceType === 'link' ? linkUrl.trim() : content.trim(),
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
    setTitle('');
    setDescription('');
    setTags([]);
    setTagInput('');
    setError('');
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
          </div>
        )}

        {step === 'review' && (
          <Card>
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

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

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
                Your resource has been created successfully.
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

