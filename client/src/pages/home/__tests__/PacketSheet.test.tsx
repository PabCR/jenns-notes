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
  createPacket: vi.fn(),
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

describe('PacketSheet - Button Rendering and API Call', () => {
  const mockSession = { access_token: 'test-token' }
  const mockResources = [
    {
      id: 'resource-1',
      userId: 'user-id',
      title: 'Test Resource 1',
      description: 'Description 1',
      type: 'note' as const,
      content: 'Content 1',
      tags: [],
      autoTagged: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'resource-2',
      userId: 'user-id',
      title: 'Test Resource 2',
      description: 'Description 2',
      type: 'note' as const,
      content: 'Content 2',
      tags: [],
      autoTagged: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null,
    })
    vi.mocked(api.getResources).mockResolvedValue(mockResources)
  })

  it('renders Create Packet button when resources are selected', async () => {
    renderHome()

    await waitFor(() => {
      expect(api.getResources).toHaveBeenCalled()
    })

    // Select a resource by clicking on it (simulating checkbox click)
    const resourceCards = screen.getAllByText(/Test Resource/)
    if (resourceCards.length > 0) {
      await userEvent.click(resourceCards[0])
    }

    // Check if Create Packet button appears
    await waitFor(() => {
      const createButton = screen.queryByText(/Create Packet/)
      expect(createButton).toBeInTheDocument()
    })
  })

  it('calls createPacket API when form is submitted', async () => {
    const mockCreatePacket = vi.mocked(api.createPacket)
    mockCreatePacket.mockResolvedValue({
      id: 'packet-1',
      userId: 'user-id',
      name: 'Test Packet',
      shareLink: 'abc123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    renderHome()

    await waitFor(() => {
      expect(api.getResources).toHaveBeenCalled()
    })

    // Select resources and open packet sheet
    const resourceCards = screen.getAllByText(/Test Resource/)
    if (resourceCards.length > 0) {
      await userEvent.click(resourceCards[0])
    }

    await waitFor(() => {
      const createButton = screen.queryByText(/Create Packet/)
      expect(createButton).toBeInTheDocument()
    })

    // Click Create Packet button to open dialog
    const createButton = screen.getByText(/Create Packet/)
    await userEvent.click(createButton)

    // Fill in packet name
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText(/Packet name/)
      expect(nameInput).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText(/Packet name/)
    await userEvent.type(nameInput, 'My Test Packet')

    // Submit form
    const submitButton = screen.getByText(/Create Packet/)
    await userEvent.click(submitButton)

    // Verify API was called
    await waitFor(() => {
      expect(mockCreatePacket).toHaveBeenCalledWith(
        mockSession,
        expect.objectContaining({
          name: 'My Test Packet',
          resourceIds: expect.any(Array),
        })
      )
    })
  })
})
