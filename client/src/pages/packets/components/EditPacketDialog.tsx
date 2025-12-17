import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updatePacket, getResources } from '@/lib/api';
import type { Packet, Resource } from '@/lib/types';
import type { ApiSession } from '@/lib/api';

interface EditPacketDialogProps {
  packet: Packet;
  session: ApiSession;
  onClose: () => void;
}

export function EditPacketDialog({ packet, session, onClose }: EditPacketDialogProps) {
  const [name, setName] = useState(packet.name);
  const [description, setDescription] = useState(packet.description || '');
  const [selectedResourceIds, setSelectedResourceIds] = useState<Set<string>>(
    new Set(packet.resourceIds || packet.resources?.map(r => r.id) || [])
  );
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setName(packet.name);
    setDescription(packet.description || '');
    setSelectedResourceIds(new Set(packet.resourceIds || packet.resources?.map(r => r.id) || []));
  }, [packet]);

  useEffect(() => {
    // Load all resources for selection
    const fetchResources = async () => {
      if (!session) return;
      try {
        const resources = await getResources(session);
        setAllResources(resources);
      } catch (err) {
        console.error('Failed to load resources:', err);
      }
    };
    fetchResources();
  }, [session]);

  const handleToggleResource = (resourceId: string) => {
    setSelectedResourceIds(prev => {
      const next = new Set(prev);
      if (next.has(resourceId)) {
        next.delete(resourceId);
      } else {
        next.add(resourceId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Packet name is required');
      return;
    }

    if (selectedResourceIds.size === 0) {
      setError('At least one resource must be selected');
      return;
    }

    if (!session) {
      setError('You must be logged in to update packets');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updatePacket(session, packet.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        resourceIds: Array.from(selectedResourceIds),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update packet');
    } finally {
      setLoading(false);
    }
  };

  const includedResources = allResources.filter(r => selectedResourceIds.has(r.id));
  const availableResources = allResources.filter(r => !selectedResourceIds.has(r.id));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Packet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-packet-name">Name *</Label>
            <Input
              id="edit-packet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Packet name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-packet-description">Description</Label>
            <textarea
              id="edit-packet-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Optional description"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Included in Packet ({includedResources.length})</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {includedResources.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No resources included</p>
                ) : (
                  includedResources.map((resource) => (
                    <label key={resource.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => handleToggleResource(resource.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{resource.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Available Resources ({availableResources.length})</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {availableResources.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No other resources available</p>
                ) : (
                  availableResources.map((resource) => (
                    <label key={resource.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => handleToggleResource(resource.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{resource.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !name.trim() || selectedResourceIds.size === 0}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}