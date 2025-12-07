import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    origin: 'http://localhost:5173',
    href: 'http://localhost:5173',
  },
})

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')

