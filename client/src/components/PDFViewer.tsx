import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPDFBlob } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

interface PDFViewerProps {
  filePath?: string;      // For authenticated access
  signedUrl?: string;    // For public access
  onClose: () => void;
}

export function PDFViewer({ filePath, signedUrl, onClose }: PDFViewerProps) {
  const { session } = useAuth();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState<number | null>(null);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (signedUrl) {
          // Public access: use signed URL directly
          setPdfUrl(signedUrl);
          setPageNumber(1);
        } else if (filePath && session) {
          // Authenticated access: fetch blob and create object URL
          const url = await fetchPDFBlob(session, filePath);
          setPdfUrl(url);
          setPageNumber(1);
        } else {
          throw new Error('Either signedUrl or filePath with session must be provided');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [filePath, signedUrl, session]);

  // Set responsive page width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      // Mobile-first: use container width minus padding, max 800px for larger screens
      const container = document.querySelector('[data-pdf-container]');
      if (container) {
        const containerWidth = container.clientWidth;
        setPageWidth(Math.min(containerWidth - 32, 800)); // 32px for padding
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Cleanup blob URL when component unmounts or pdfUrl changes (only for authenticated flow)
  useEffect(() => {
    return () => {
      // Only revoke blob URLs (created from fetchPDFBlob), not signed URLs
      if (pdfUrl && filePath && !signedUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl, filePath, signedUrl]);

  return (
    <div className="flex flex-col h-full" data-pdf-container>
      {/* Responsive header: stacks on mobile, horizontal on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 flex-shrink-0">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <h2 className="text-lg font-semibold">PDF Viewer</h2>
          <Button variant="outline" onClick={onClose} className="sm:hidden">
            Close
          </Button>
        </div>
        
        {/* Page navigation controls - centered on mobile, between title and close on desktop */}
        {numPages && numPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              className="h-8 px-2"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[80px] text-center">
              {pageNumber} / {numPages}
            </span>
            <Button
              variant="outline"
              className="h-8 px-2"
              onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Close button - hidden on mobile (shown in title row), visible on desktop */}
        <Button variant="outline" onClick={onClose} className="hidden sm:flex flex-shrink-0">
          Close
        </Button>
      </div>

      {/* PDF content area with responsive width */}
      <div className="flex-1 overflow-auto flex justify-center px-2">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-600 font-semibold">Error</p>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {pdfUrl && !loading && !error && pageWidth && (
          <Document
            file={pdfUrl}
            onLoadError={(err) => {
              setError(err.message || 'Failed to load PDF');
            }}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
            }}
          >
            <Page 
              pageNumber={pageNumber} 
              width={pageWidth}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        )}
      </div>
    </div>
  );
}
