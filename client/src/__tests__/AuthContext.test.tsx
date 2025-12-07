import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

function TestComponent() {
  const { user, session, loading, signUp, signIn, signOut, resetPassword } = useAuth()
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button onClick={() => signUp('test@example.com', 'password123')}>Sign Up</button>
      <button onClick={() => signIn('test@example.com', 'password123')}>Sign In</button>
      <button onClick={() => signOut()}>Sign Out</button>
      <button onClick={() => resetPassword('test@example.com')}>Reset Password</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('loading')
  })

  it('handles sign up flow', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        user: { id: '123', email: 'test@example.com' } as any,
        session: null,
      },
      error: null,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const signUpButton = screen.getByText('Sign Up')
    signUpButton.click()

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('handles sign in flow', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: { id: '123', email: 'test@example.com' } as any,
        session: { access_token: 'token' } as any,
      },
      error: null,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const signInButton = screen.getByText('Sign In')
    signInButton.click()

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('handles sign out flow', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const signOutButton = screen.getByText('Sign Out')
    signOutButton.click()

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })

  it('handles password reset request', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ error: null })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const resetButton = screen.getByText('Reset Password')
    resetButton.click()

    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/callback?type=recovery'),
        })
      )
    })
  })
})

