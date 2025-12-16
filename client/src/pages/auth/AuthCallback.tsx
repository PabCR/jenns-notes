import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if this is a password recovery callback
    if (searchParams.get('type') === 'recovery') {
      navigate('/reset-password', { replace: true });
      return;
    }

    // For other auth callbacks, Supabase handles session automatically
    supabase.auth.getSession().then(({ data: { session } }) => {
      navigate(session ? '/' : '/login', { replace: true });
    });
  }, [navigate, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div>Processing authentication...</div>
    </div>
  );
}

