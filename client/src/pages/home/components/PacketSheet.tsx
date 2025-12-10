/**
 * Dialog component for creating a packet from selected resources.
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPacket } from '@/lib/api';
import type { Resource } from '../../../../../shared/types';
import type { ApiSession } from '@/lib/api';

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

  // Get selected resources for display
  const selectedResources = resources.filter((r) => selectedResourceIds.has(r.id));

  const handleRemoveResource = (resourceId: string) => {
    // This will be handled by parent component
    // For now, we'll just show the resources that are selected
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
      await createPacket(session, {
        name: name.trim(),
        description: description.trim() || undefined,
        resourceIds: Array.from(selectedResourceIds),
      });
      
      // Reset form
      setName('');
      setDescription('');
      
      // Call success callback (will clear selection and show toast)
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create packet');
    } finally {
      setLoading(false);
    }
  };

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
