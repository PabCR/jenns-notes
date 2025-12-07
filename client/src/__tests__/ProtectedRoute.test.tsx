import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthProvider } from '@/contexts/AuthContext'
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

function TestChild() {
  return <div>Protected Content</div>
}

function renderProtectedRoute(hasSession = false) {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: {
      session: hasSession
        ? ({
            user: { id: '123', email: 'test@example.com' },
            access_token: 'token',
          } as any)
        : null,
    },
    error: null,
  })

  return render(
    <BrowserRouter>
      <AuthProvider>
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    renderProtectedRoute()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('redirects unauthenticated users', async () => {
    renderProtectedRoute(false)

    await waitFor(() => {
      // Should redirect to login - check that protected content is not shown
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  it('allows authenticated users', async () => {
    renderProtectedRoute(true)

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })
})

