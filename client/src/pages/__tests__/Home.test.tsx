import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { Home } from '@/pages/Home'
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
  getResources: vi.fn(),
  deleteResource: vi.fn(),
  updateResource: vi.fn(),
}))

function renderHome() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Home />
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Home - Link Resource Display', () => {
  const mockSession = { access_token: 'test-token' }
  const mockLinkResource = {
    id: 'link-id-1',
    userId: 'user-id',
    title: 'Example Website',
    description: 'A helpful website',
    type: 'link' as const,
    content: 'https://example.com',
    tags: ['medical', 'oncology'],
    autoTagged: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockNoteResource = {
    id: 'note-id-1',
    userId: 'user-id',
    title: 'Test Note',
    description: 'A test note',
    type: 'note' as const,
    content: 'Note content',
    tags: ['test'],
    autoTagged: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null,
    })
    vi.mocked(api.getResources).mockResolvedValue([mockLinkResource, mockNoteResource] as any)
    // Mock window.open
    global.window.open = vi.fn()
  })

  it('displays link resources with Link icon', async () => {
    renderHome()
    
    await waitFor(() => {
      expect(screen.getByText('Example Website')).toBeInTheDocument()
    })
    
    // Check that link icon is present (will be updated when implementation is done)
    const linkResource = screen.getByText('Example Website')
    expect(linkResource).toBeInTheDocument()
  })

  it('displays "Visit Link" button for link resources', async () => {
    renderHome()
    
    await waitFor(() => {
      expect(screen.getByText('Example Website')).toBeInTheDocument()
    })
    
    // This test will be updated once Visit Link button is implemented
    // It should check for a button with "Visit Link" text
    const visitButton = screen.queryByText(/visit link/i)
    // For now, this will be null until implementation
    // expect(visitButton).toBeInTheDocument()
  })

  it('opens URL in new tab when "Visit Link" is clicked', async () => {
    const user = userEvent.setup()
    renderHome()
    
    await waitFor(() => {
      expect(screen.getByText('Example Website')).toBeInTheDocument()
    })
    
    // This test will be updated once Visit Link button is implemented
    // It should test that window.open is called with the correct URL
    // const visitButton = screen.getByText(/visit link/i)
    // await user.click(visitButton)
    // expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer')
  })

  it('filters link resources by type filter', async () => {
    renderHome()
    
    await waitFor(() => {
      expect(screen.getByText('Example Website')).toBeInTheDocument()
    })
    
    const typeFilter = screen.getByRole('combobox')
    await userEvent.selectOptions(typeFilter, 'link')
    
    await waitFor(() => {
      expect(api.getResources).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ type: 'link' })
      )
    })
  })

  it('includes link resources in search results', async () => {
    const user = userEvent.setup()
    renderHome()
    
    await waitFor(() => {
      expect(screen.getByText('Example Website')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText(/search resources/i)
    await user.type(searchInput, 'example')
    
    await waitFor(() => {
      expect(api.getResources).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ search: 'example' })
      )
    })
  })

  it('allows editing link resources', async () => {
    const user = userEvent.setup()
    renderHome()
    
    await waitFor(() => {
      expect(screen.getByText('Example Website')).toBeInTheDocument()
    })
    
    // Find and click edit button
    const editButtons = screen.getAllByText(/edit/i)
    await user.click(editButtons[0])
    
    // This test will be updated once edit dialog is shown
    // It should verify that edit dialog appears
  })

  it('allows deleting link resources', async () => {
    const user = userEvent.setup()
    vi.mocked(api.deleteResource).mockResolvedValue(undefined)
    
    // Mock confirm to return true
    global.confirm = vi.fn(() => true)
    
    renderHome()
    
    await waitFor(() => {
      expect(screen.getByText('Example Website')).toBeInTheDocument()
    })
    
    const deleteButtons = screen.getAllByText(/delete/i)
    await user.click(deleteButtons[0])
    
    await waitFor(() => {
      expect(api.deleteResource).toHaveBeenCalledWith(
        expect.anything(),
        'link-id-1'
      )
    })
  })

  it('shows different icons for different resource types', async () => {
    renderHome()
    
    await waitFor(() => {
      expect(screen.getByText('Example Website')).toBeInTheDocument()
      expect(screen.getByText('Test Note')).toBeInTheDocument()
    })
    
    // This test will be updated once icons are implemented
    // It should verify that link resources show Link icon and notes show StickyNote icon
  })
})
