import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PDFViewer } from '../PDFViewer';
import { AuthProvider } from '@/contexts/AuthContext';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

vi.mock('@/lib/api', () => ({
  fetchPDFBlob: vi.fn(),
}));

vi.mock('react-pdf', () => ({
  Document: ({ file, onLoadSuccess, children }: any) => {
    // Simulate PDF load
    if (file && typeof file === 'string' && file.startsWith('blob:')) {
      setTimeout(() => {
        onLoadSuccess?.({ numPages: 1 });
      }, 0);
    }
    return <div data-testid="pdf-document">{children}</div>;
  },
  Page: ({ pageNumber }: any) => <div data-testid={`pdf-page-${pageNumber}`}>Page {pageNumber}</div>,
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: '',
    },
  },
}));

describe('PDFViewer', () => {
  const mockOnClose = vi.fn();
  const mockSession = { access_token: 'test-token' } as any;
  const mockFilepath = 'uploads/test.pdf';

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders and fetches PDF on mount', async () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    vi.mocked(api.fetchPDFBlob).mockResolvedValue('blob:mock-url');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    render(
      <AuthProvider>
        <PDFViewer filePath={mockFilepath} onClose={mockOnClose} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(api.fetchPDFBlob).toHaveBeenCalledWith(mockSession, mockFilepath);
    });

    await waitFor(() => {
      expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
    });
  });

  it('displays loading state while fetching', () => {
    vi.mocked(api.fetchPDFBlob).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <AuthProvider>
        <PDFViewer filePath={mockFilepath} onClose={mockOnClose} />
      </AuthProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('hides loading state when PDF loads', async () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    vi.mocked(api.fetchPDFBlob).mockResolvedValue('blob:mock-url');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    render(
      <AuthProvider>
        <PDFViewer filePath={mockFilepath} onClose={mockOnClose} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  it('displays error message when PDF fetch fails', async () => {
    vi.mocked(api.fetchPDFBlob).mockRejectedValue(new Error('Failed to fetch PDF'));

    render(
      <AuthProvider>
        <PDFViewer filePath={mockFilepath} onClose={mockOnClose} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to fetch pdf/i)).toBeInTheDocument();
    });
  });

  it('displays error message when PDF is invalid', async () => {
    vi.mocked(api.fetchPDFBlob).mockResolvedValue('blob:mock-url');
    // Mock Document component to simulate invalid PDF
    vi.doMock('react-pdf', () => ({
      Document: ({ onLoadError }: any) => {
        setTimeout(() => {
          onLoadError?.(new Error('Invalid PDF'));
        }, 0);
        return <div>Error</div>;
      },
      Page: () => null,
      pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
    }));

    render(
      <AuthProvider>
        <PDFViewer filePath={mockFilepath} onClose={mockOnClose} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    vi.mocked(api.fetchPDFBlob).mockResolvedValue('blob:mock-url');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    render(
      <AuthProvider>
        <PDFViewer filePath={mockFilepath} onClose={mockOnClose} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders first page when PDF loads', async () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    vi.mocked(api.fetchPDFBlob).mockResolvedValue('blob:mock-url');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    render(
      <AuthProvider>
        <PDFViewer filePath={mockFilepath} onClose={mockOnClose} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument();
    });
  });

  it('cleans up blob URL on unmount', async () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    vi.mocked(api.fetchPDFBlob).mockResolvedValue('blob:mock-url');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    const { unmount } = render(
      <AuthProvider>
        <PDFViewer filePath={mockFilepath} onClose={mockOnClose} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
    });

    unmount();

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
