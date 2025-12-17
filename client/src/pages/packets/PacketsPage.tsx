/**
 * Packets page displays all user packets in a grid.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { listPackets, deletePacket } from '@/lib/api';
import { EditPacketDialog } from './components/EditPacketDialog';
import { getPacket } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import type { Packet } from '../../../../shared/types';
import { Check, Copy, ExternalLink } from 'lucide-react';
import QRCode from 'react-qr-code';

export function PacketsPage() {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const [packets, setPackets] = useState<Packet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deletingPacketId, setDeletingPacketId] = useState<string | null>(null);
  const [editingPacket, setEditingPacket] = useState<Packet | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState<string | null>(null);

  const fetchPackets = async () => {
    if (!session) return;

    setLoading(true);
    setError('');
    try {
      const data = await listPackets(session);
      setPackets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackets();
  }, [session]);

  const handleDelete = async (id: string) => {
    if (!session) return;
    if (!confirm('Are you sure you want to delete this packet?')) return;

    setDeletingPacketId(id);
    try {
      await deletePacket(session, id);
      setPackets(packets.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete packet');
    } finally {
      setDeletingPacketId(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const getShareUrl = (shareLink: string) => {
    return `${window.location.origin}/shared/${shareLink}`;
  };

  const handleCopyLink = async (shareLink: string) => {
    const shareUrl = getShareUrl(shareLink);
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopiedShareLink(shareLink);
      setTimeout(() => setCopiedShareLink(null), 2000);
    }
  };

  const handleViewLink = (shareLink: string) => {
    navigate(`/shared/${shareLink}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Packets</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : packets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No packets yet.</p>
              <p className="text-sm text-gray-400">
                Create your first packet by selecting resources on the Home page.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packets.map((packet) => (
              <Card key={packet.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{packet.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {packet.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{packet.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{packet.resourceCount || 0} resources</span>
                    <span>{formatDate(packet.createdAt)}</span>
                  </div>

                  {packet.shareLink && (
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500">Share Link</Label>
                      <div className="flex gap-2">
                        <Input
                          value={getShareUrl(packet.shareLink)}
                          readOnly
                          className="font-mono text-xs flex-1"
                        />
                        <Button
                          onClick={() => handleCopyLink(packet.shareLink)}
                          variant="outline"
                          className="flex-shrink-0 h-10 w-10 p-0"
                          title="Copy link"
                        >
                          {copiedShareLink === packet.shareLink ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          onClick={() => handleViewLink(packet.shareLink)}
                          variant="outline"
                          className="flex-shrink-0 h-10 w-10 p-0"
                          title="View shared packet"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      {copiedShareLink === packet.shareLink && (
                        <p className="text-xs text-green-600">Link copied to clipboard!</p>
                      )}
                      <div className="flex flex-col items-center space-y-2 pt-2">
                        <div className="border rounded-md p-2 bg-white">
                          <QRCode
                            value={getShareUrl(packet.shareLink)}
                            size={200}
                            level="H"
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          Scan to access packet
                        </p>
                      </div>
                    </div>
                  )}

                  {packet.userId === user?.id && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={async () => {
                          if (!session) return;
                          try {
                            const fullPacket = await getPacket(session, packet.id);
                            setEditingPacket(fullPacket);
                          } catch (err) {
                            alert(err instanceof Error ? err.message : 'Failed to load packet');
                          }
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDelete(packet.id)}
                        disabled={deletingPacketId === packet.id}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {editingPacket && (
          <EditPacketDialog
            packet={editingPacket}
            session={session}
            onClose={() => {
              setEditingPacket(null);
              fetchPackets(); // Refresh the list after editing
            }}
          />
        )}
      </div>
    </div>
  );
}
