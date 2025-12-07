import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { AuthProvider } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

function renderForgotPassword() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ForgotPassword />
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })
  })

  it('renders form', () => {
    renderForgotPassword()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('sends reset email', async () => {
    const user = userEvent.setup()
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ error: null })

    renderForgotPassword()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/callback?type=recovery'),
        })
      )
    })
  })

  it('shows success message', async () => {
    const user = userEvent.setup()
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ error: null })

    renderForgotPassword()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument()
    })
  })

  it('handles errors', async () => {
    const user = userEvent.setup()
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
      error: { message: 'User not found' } as any,
    })

    renderForgotPassword()

    await user.type(screen.getByLabelText(/email/i), 'nonexistent@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument()
    })
  })
})

