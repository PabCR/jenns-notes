import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { AuthCallback } from '@/pages/AuthCallback'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to home on valid session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: '123', email: 'test@example.com' },
          access_token: 'token',
        } as any,
      },
      error: null,
    })

    render(
      <MemoryRouter>
        <AuthCallback />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  it('redirects to login on no session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(
      <MemoryRouter>
        <AuthCallback />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  it('handles password recovery redirect', async () => {
    render(
      <MemoryRouter initialEntries={['/auth/callback?type=recovery']}>
        <AuthCallback />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/reset-password', { replace: true })
    })
  })
})

