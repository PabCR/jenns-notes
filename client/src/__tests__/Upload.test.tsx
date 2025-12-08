import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { Upload } from '@/pages/Upload'
import { AuthProvider } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import * as api from '@/lib/api'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

vi.mock('@/lib/api', () => ({
  createResource: vi.fn(),
  requestPresignedUrl: vi.fn(),
  uploadToPresignedUrl: vi.fn(),
  generateTags: vi.fn(),
}))

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  getDocument: vi.fn(),
}))

function renderUpload() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Upload />
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Upload - Auto-fill functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          user: { id: '123', email: 'test@example.com' },
        } as any,
      },
      error: null,
    })
  })

  it('renders auto-fill button in review step for note', async () => {
    const user = userEvent.setup()
    renderUpload()

    // Add a note to get to review step
    const textarea = screen.getByPlaceholderText(/enter your note/i)
    await user.type(textarea, 'Test note content')
    await user.click(screen.getByRole('button', { name: /add note/i }))

    // Check if auto-fill button appears
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /auto-fill with ai/i })).toBeInTheDocument()
    })
  })

  it('successfully auto-fills tags and description for note', async () => {
    const user = userEvent.setup()
    vi.mocked(api.generateTags).mockResolvedValue({
      tags: ['oncology', 'patient education', 'cancer'],
      description: 'A helpful resource about cancer care',
      condition: 'general oncology',
      audience: 'patients',
      topic: 'patient education',
    })

    renderUpload()

    // Add a note
    const textarea = screen.getByPlaceholderText(/enter your note/i)
    await user.type(textarea, 'This is a note about cancer treatment options.')
    await user.click(screen.getByRole('button', { name: /add note/i }))

    // Wait for review step
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /auto-fill with ai/i })).toBeInTheDocument()
    })

    // Click auto-fill button
    const autoFillButton = screen.getByRole('button', { name: /auto-fill with ai/i })
    await user.click(autoFillButton)

    // Wait for API call
    await waitFor(() => {
      expect(api.generateTags).toHaveBeenCalledWith(
        expect.objectContaining({ access_token: 'test-token' }),
        'note',
        'This is a note about cancer treatment options.'
      )
    })

    // Check if tags and description are populated
    await waitFor(() => {
      expect(screen.getByText('oncology')).toBeInTheDocument()
      expect(screen.getByText('patient education')).toBeInTheDocument()
      expect(screen.getByText('cancer')).toBeInTheDocument()
    })

    const descriptionTextarea = screen.getByLabelText(/description/i) as HTMLTextAreaElement
    expect(descriptionTextarea.value).toContain('helpful resource')
  })

  it('successfully auto-fills tags for link resource', async () => {
    const user = userEvent.setup()
    vi.mocked(api.generateTags).mockResolvedValue({
      tags: ['breast cancer', 'treatment'],
      description: 'Information about breast cancer treatment',
    })

    renderUpload()

    // Add a link
    const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/i)
    await user.type(urlInput, 'https://example.com/cancer-info')
    await user.click(screen.getByRole('button', { name: /add link/i }))

    // Wait for review step
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /auto-fill with ai/i })).toBeInTheDocument()
    })

    // Click auto-fill button
    const autoFillButton = screen.getByRole('button', { name: /auto-fill with ai/i })
    await user.click(autoFillButton)

    // Wait for API call
    await waitFor(() => {
      expect(api.generateTags).toHaveBeenCalled()
    })

    // Check if tags are populated
    await waitFor(() => {
      expect(screen.getByText('breast cancer')).toBeInTheDocument()
    })
  })

  it('handles API error gracefully', async () => {
    const user = userEvent.setup()
    vi.mocked(api.generateTags).mockRejectedValue(new Error('API error occurred'))

    renderUpload()

    // Add a note
    const textarea = screen.getByPlaceholderText(/enter your note/i)
    await user.type(textarea, 'Test note')
    await user.click(screen.getByRole('button', { name: /add note/i }))

    // Wait for review step
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /auto-fill with ai/i })).toBeInTheDocument()
    })

    // Click auto-fill button
    const autoFillButton = screen.getByRole('button', { name: /auto-fill with ai/i })
    await user.click(autoFillButton)

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to generate tags/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during tag generation', async () => {
    const user = userEvent.setup()
    // Create a promise that we can control
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    vi.mocked(api.generateTags).mockReturnValue(promise as any)

    renderUpload()

    // Add a note
    const textarea = screen.getByPlaceholderText(/enter your note/i)
    await user.type(textarea, 'Test note')
    await user.click(screen.getByRole('button', { name: /add note/i }))

    // Wait for review step
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /auto-fill with ai/i })).toBeInTheDocument()
    })

    // Click auto-fill button
    const autoFillButton = screen.getByRole('button', { name: /auto-fill with ai/i })
    await user.click(autoFillButton)

    // Check loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generating/i })).toBeInTheDocument()
    })

    // Resolve the promise
    resolvePromise!({
      tags: ['test'],
      description: 'Test description',
    })

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /generating/i })).not.toBeInTheDocument()
    })
  })

  it('preserves existing tags when auto-filling', async () => {
    const user = userEvent.setup()
    vi.mocked(api.generateTags).mockResolvedValue({
      tags: ['oncology', 'patient education'],
      description: 'Test description',
    })

    renderUpload()

    // Add a note
    const textarea = screen.getByPlaceholderText(/enter your note/i)
    await user.type(textarea, 'Test note')
    await user.click(screen.getByRole('button', { name: /add note/i }))

    // Wait for review step
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /auto-fill with ai/i })).toBeInTheDocument()
    })

    // Add an existing tag manually
    const tagInput = screen.getByPlaceholderText(/press enter to add a tag/i)
    await user.type(tagInput, 'existing-tag')
    await user.keyboard('{Enter}')

    // Verify existing tag is there
    expect(screen.getByText('existing-tag')).toBeInTheDocument()

    // Click auto-fill button
    const autoFillButton = screen.getByRole('button', { name: /auto-fill with ai/i })
    await user.click(autoFillButton)

    // Wait for new tags
    await waitFor(() => {
      expect(screen.getByText('oncology')).toBeInTheDocument()
      expect(screen.getByText('patient education')).toBeInTheDocument()
    })

    // Verify existing tag is still there
    expect(screen.getByText('existing-tag')).toBeInTheDocument()
  })
})
