/**
 * Dialog component for creating a packet from selected resources.
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPacket } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import type { Resource } from '@/lib/types';
import type { ApiSession } from '@/lib/api';
import { Check, Copy } from 'lucide-react';
import QRCode from 'react-qr-code';

interface PacketSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedResourceIds: Set<string>;
  resources: Resource[];
  session: ApiSession;
  onSuccess: () => void;
}

export function PacketSheet({
  open,
  onOpenChange,
  selectedResourceIds,
  resources,
  session,
  onSuccess,
}: PacketSheetProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [createdShareLink, setCreatedShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Get selected resources for display
  const selectedResources = resources.filter((r) => selectedResourceIds.has(r.id));

  const shareUrl = createdShareLink ? `${window.location.origin}/shared/${createdShareLink}` : '';

  const handleCopyLink = async () => {
    if (shareUrl) {
      const success = await copyToClipboard(shareUrl);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleSuccessDone = () => {
    setCreatedShareLink(null);
    setCopied(false);
    onSuccess();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Packet name is required');
      return;
    }

    if (selectedResourceIds.size === 0) {
      setError('At least one resource must be selected');
      return;
    }

    if (!session) {
      setError('You must be logged in to create packets');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const createdPacket = await createPacket(session, {
        name: name.trim(),
        description: description.trim() || undefined,
        resourceIds: Array.from(selectedResourceIds),
      });
      
      // Reset form
      setName('');
      setDescription('');
      
      // Store share link to show in success dialog
      if (createdPacket.shareLink) {
        setCreatedShareLink(createdPacket.shareLink);
      } else {
        // If no share link, just close and call success
        onSuccess();
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create packet');
    } finally {
      setLoading(false);
    }
  };

  // Show success dialog if packet was created
  if (createdShareLink) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Packet Created Successfully!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Share this link with patients to give them access to the packet:
            </p>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="flex-shrink-0 h-10 w-10 p-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {copied && (
              <p className="text-sm text-green-600">Link copied to clipboard!</p>
            )}
            {shareUrl && (
              <div className="flex flex-col items-center space-y-2 pt-2">
                <div className="border rounded-md p-2 bg-white">
                  <QRCode
                    value={shareUrl}
                    size={200}
                    level="H"
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Scan this QR code to access the packet
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSuccessDone}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Packet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="packet-name">Name *</Label>
            <Input
              id="packet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Packet name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="packet-description">Description</Label>
            <textarea
              id="packet-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Optional description"
            />
          </div>

          <div className="space-y-2">
            <Label>Selected Resources ({selectedResources.length})</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
              {selectedResources.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No resources selected</p>
              ) : (
                selectedResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm font-medium">{resource.title}</span>
                    <button
                      type="button"
                      onClick={() => {
                        // Note: This would need to be handled by parent
                        // For now, we'll just show the resource
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                      aria-label={`Remove ${resource.title}`}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim() || selectedResourceIds.size === 0}>
            {loading ? 'Creating...' : 'Create Packet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
