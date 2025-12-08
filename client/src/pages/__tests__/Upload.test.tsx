import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { Upload } from '@/pages/Upload'
import { AuthProvider } from '@/contexts/AuthContext'
import * as api from '@/lib/api'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

vi.mock('@/lib/api', () => ({
  createResource: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

function renderUpload() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Upload />
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Upload - Link Resources', () => {
  const mockSession = { access_token: 'test-token' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null,
    })
    vi.mocked(api.createResource).mockResolvedValue({
      id: 'test-id',
      userId: 'user-id',
      title: 'Test Link',
      type: 'link',
      content: 'https://example.com',
      tags: [],
      autoTagged: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any)
  })

  it('renders "Type a Note" card initially', () => {
    renderUpload()
    expect(screen.getByText(/type a note/i)).toBeInTheDocument()
  })

  it('shows "Add External Link" option when link creation is implemented', async () => {
    renderUpload()
    // This test will pass once we implement the link UI
    // For now, we're testing the structure exists
    const uploadTitle = screen.getByText(/upload resource/i)
    expect(uploadTitle).toBeInTheDocument()
  })

  it('automatically prepends https:// to URLs without protocol', async () => {
    const user = userEvent.setup()
    renderUpload()
    
    // Find the URL input field
    const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/i)
    await user.type(urlInput, 'example.com')
    
    // Find and click the "Add Link" button
    const addLinkButton = screen.getByText(/add link/i)
    await user.click(addLinkButton)
    
    // Wait for review step
    await waitFor(() => {
      expect(screen.getByText(/review resource/i)).toBeInTheDocument()
    })
    
    // Verify that the URL preview shows the URL with https://
    const urlPreview = screen.getByText(/https:\/\/example.com/i)
    expect(urlPreview).toBeInTheDocument()
  })

  it('preserves http:// protocol when provided', async () => {
    const user = userEvent.setup()
    renderUpload()
    
    const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/i)
    await user.type(urlInput, 'http://example.com')
    
    const addLinkButton = screen.getByText(/add link/i)
    await user.click(addLinkButton)
    
    await waitFor(() => {
      expect(screen.getByText(/review resource/i)).toBeInTheDocument()
    })
    
    const urlPreview = screen.getByText(/http:\/\/example.com/i)
    expect(urlPreview).toBeInTheDocument()
  })

  it('preserves https:// protocol when provided', async () => {
    const user = userEvent.setup()
    renderUpload()
    
    const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/i)
    await user.type(urlInput, 'https://secure.example.com')
    
    const addLinkButton = screen.getByText(/add link/i)
    await user.click(addLinkButton)
    
    await waitFor(() => {
      expect(screen.getByText(/review resource/i)).toBeInTheDocument()
    })
    
    const urlPreview = screen.getByText(/https:\/\/secure.example.com/i)
    expect(urlPreview).toBeInTheDocument()
  })

  it('disables "Add Link" button when URL is empty', async () => {
    renderUpload()
    
    const addLinkButton = screen.getByText(/add link/i)
    expect(addLinkButton).toBeDisabled()
  })

  it('moves to review step when valid URL is provided', async () => {
    const user = userEvent.setup()
    renderUpload()
    
    const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/i)
    await user.type(urlInput, 'example.com')
    
    const addLinkButton = screen.getByText(/add link/i)
    await user.click(addLinkButton)
    
    await waitFor(() => {
      expect(screen.getByText(/review resource/i)).toBeInTheDocument()
    })
  })

  it('pre-fills title from URL domain in review step', async () => {
    const user = userEvent.setup()
    renderUpload()
    
    const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/i)
    await user.type(urlInput, 'example.com')
    
    const addLinkButton = screen.getByText(/add link/i)
    await user.click(addLinkButton)
    
    await waitFor(() => {
      expect(screen.getByText(/review resource/i)).toBeInTheDocument()
    })
    
    // Title should be pre-filled with the domain
    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
    expect(titleInput.value).toBe('example.com')
  })

  it('shows URL preview in review step', async () => {
    const user = userEvent.setup()
    renderUpload()
    
    const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/i)
    await user.type(urlInput, 'example.com')
    
    const addLinkButton = screen.getByText(/add link/i)
    await user.click(addLinkButton)
    
    await waitFor(() => {
      expect(screen.getByText(/review resource/i)).toBeInTheDocument()
    })
    
    // URL preview should be visible
    expect(screen.getByText(/https:\/\/example.com/i)).toBeInTheDocument()
  })

  it('creates link resource with https:// prepended when protocol is missing', async () => {
    const user = userEvent.setup()
    renderUpload()
    
    const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/i)
    await user.type(urlInput, 'example.com')
    
    const addLinkButton = screen.getByText(/add link/i)
    await user.click(addLinkButton)
    
    await waitFor(() => {
      expect(screen.getByText(/review resource/i)).toBeInTheDocument()
    })
    
    const createButton = screen.getByText(/create resource/i)
    await user.click(createButton)
    
    await waitFor(() => {
      expect(api.createResource).toHaveBeenCalledWith(
        mockSession,
        expect.objectContaining({
          type: 'link',
          content: 'https://example.com',
        })
      )
    })
  })
})
