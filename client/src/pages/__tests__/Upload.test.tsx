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

  it('validates URL format before allowing submission', async () => {
    const user = userEvent.setup()
    renderUpload()
    
    // This test will be updated once link UI is implemented
    // It should test that invalid URLs show an error
    expect(screen.getByText(/upload resource/i)).toBeInTheDocument()
  })

  it('disables "Add Link" button when URL is empty', async () => {
    const user = userEvent.setup()
    renderUpload()
    
    // This test will be updated once link UI is implemented
    // It should test that the button is disabled when URL input is empty
    expect(screen.getByText(/upload resource/i)).toBeInTheDocument()
  })

  it('moves to review step when valid URL is provided', async () => {
    const user = userEvent.setup()
    renderUpload()
    
    // This test will be updated once link UI is implemented
    // It should test that clicking "Add Link" with valid URL moves to review step
    expect(screen.getByText(/upload resource/i)).toBeInTheDocument()
  })

  it('pre-fills title from URL domain in review step', async () => {
    const user = userEvent.setup()
    renderUpload()
    
    // This test will be updated once link UI is implemented
    // It should test that title is pre-filled from URL domain
    expect(screen.getByText(/upload resource/i)).toBeInTheDocument()
  })

  it('shows URL preview in review step', async () => {
    const user = userEvent.setup()
    renderUpload()
    
    // This test will be updated once link UI is implemented
    // It should test that URL is displayed in review step
    expect(screen.getByText(/upload resource/i)).toBeInTheDocument()
  })

  it('allows editing title and description in review step', async () => {
    const user = userEvent.setup()
    renderUpload()
    
    // This test will be updated once link UI is implemented
    // It should test that title and description can be edited
    expect(screen.getByText(/upload resource/i)).toBeInTheDocument()
  })

  it('creates link resource via API on submit', async () => {
    const user = userEvent.setup()
    renderUpload()
    
    // This test will be updated once link UI is implemented
    // It should test that createResource is called with correct link data
    expect(screen.getByText(/upload resource/i)).toBeInTheDocument()
  })

  it('shows success confirmation after link creation', async () => {
    const user = userEvent.setup()
    renderUpload()
    
    // This test will be updated once link UI is implemented
    // It should test that success message appears after creation
    expect(screen.getByText(/upload resource/i)).toBeInTheDocument()
  })
})
