import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ResetPassword } from '@/pages/ResetPassword'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(),
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

function renderResetPassword() {
  return render(
    <BrowserRouter>
      <ResetPassword />
    </BrowserRouter>
  )
}

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form', () => {
    renderResetPassword()
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
  })

  it('validates password length', async () => {
    const user = userEvent.setup()
    renderResetPassword()

    await user.type(screen.getByLabelText(/new password/i), 'short')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('handles successful reset', async () => {
    const user = userEvent.setup()
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: { id: '123' } as any },
      error: null,
    })

    renderResetPassword()

    await user.type(screen.getByLabelText(/new password/i), 'newpassword123')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('handles errors', async () => {
    const user = userEvent.setup()
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' } as any,
    })

    renderResetPassword()

    await user.type(screen.getByLabelText(/new password/i), 'newpassword123')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid token/i)).toBeInTheDocument()
    })
  })
})

