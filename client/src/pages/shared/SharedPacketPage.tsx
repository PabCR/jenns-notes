/**
 * Public shared packet page for anonymous patient access.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PDFViewer } from '@/components/PDFViewer';
import { getPublicPacket, getResourcesForPacket, getPublicSignedUrl } from '@/lib/api';
import type { Packet, Resource } from '@/lib/types';
import { FileText, Link as LinkIcon, StickyNote } from 'lucide-react';

const ResourceIcon = ({ type }: { type: Resource['type'] }) => {
  if (type === 'link') return <LinkIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />;
  if (type === 'note') return <StickyNote className="w-6 h-6 text-green-600 flex-shrink-0" />;
  return <FileText className="w-6 h-6 text-gray-600 flex-shrink-0" />;
};

export function SharedPacketPage() {
  const { shareLink } = useParams<{ shareLink: string }>();
  const [packet, setPacket] = useState<Packet | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfSignedUrl, setPdfSignedUrl] = useState<string | null>(null);
  const [loadingPdfUrl, setLoadingPdfUrl] = useState(false);

  useEffect(() => {
    const fetchPacket = async () => {
      if (!shareLink) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const packetData = await getPublicPacket(shareLink);
        if (!packetData) {
          setError('Packet not found');
          setLoading(false);
          return;
        }

        setPacket(packetData);

        // Load resources
        if (packetData.resourceIds && packetData.resourceIds.length > 0) {
          const resourceData = await getResourcesForPacket(packetData.resourceIds);
          setResources(resourceData as Resource[]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load packet');
      } finally {
        setLoading(false);
      }
    };

    fetchPacket();
  }, [shareLink]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const handleVisitLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenPdf = async (resource: Resource) => {
    if (!shareLink || resource.type !== 'pdf') return;

    setLoadingPdfUrl(true);
    setPdfViewerOpen(true);

    try {
      const signedUrl = await getPublicSignedUrl(shareLink, resource.id);
      setPdfSignedUrl(signedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PDF');
      setPdfViewerOpen(false);
    } finally {
      setLoadingPdfUrl(false);
    }
  };

  const handleClosePdf = () => {
    setPdfViewerOpen(false);
    setPdfSignedUrl(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !packet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-2">Packet Not Found</p>
            <p className="text-sm text-gray-600">
              {error || 'The packet you are looking for does not exist or has been removed.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl mb-2">{packet.name}</CardTitle>
            {packet.description && (
              <p className="text-gray-600 text-base">{packet.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                {packet.resourceCount || resources.length} {packet.resourceCount === 1 ? 'resource' : 'resources'}
              </span>
              <span>Shared on {formatDate(packet.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        {resources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No resources in this packet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {resources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <ResourceIcon type={resource.type} />
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{resource.title}</CardTitle>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resource.type === 'note' && resource.content && (
                    <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{resource.content}</p>
                    </div>
                  )}

                  {resource.type === 'link' && resource.content && (
                    <Button
                      onClick={() => handleVisitLink(resource.content)}
                      className="w-full sm:w-auto"
                    >
                      Visit Link
                    </Button>
                  )}

                  {resource.type === 'pdf' && (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => handleOpenPdf(resource)}
                    >
                      Preview Document
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            This resource packet was shared by your healthcare provider. If you have questions, please contact your care team.
          </p>
        </div>
      </div>

      {/* PDF Viewer Dialog */}
      <Dialog open={pdfViewerOpen} onOpenChange={handleClosePdf}>
        <DialogContent className="max-w-full sm:max-w-6xl max-h-[90vh] h-[90vh] flex flex-col p-4 sm:p-6">
          {pdfSignedUrl && !loadingPdfUrl && (
            <PDFViewer
              signedUrl={pdfSignedUrl}
              onClose={handleClosePdf}
            />
          )}
          {loadingPdfUrl && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
