import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function Home() {
  const { user, signOut, session } = useAuth();
  const [apiUser, setApiUser] = useState<any>(null);
  const [apiError, setApiError] = useState<string>('');

  useEffect(() => {
    const testAuth = async () => {
      if (!session?.access_token) return;

      try {
        const response = await fetch('http://localhost:8000/api/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setApiUser(data);
          setApiError('');
        } else {
          const errorText = await response.text();
          setApiError(`API Error: ${response.status} - ${errorText || 'Unknown error'}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setApiError(`Failed to connect to API: ${errorMessage}`);
        console.error('API connection error:', error);
      }
    };

    testAuth();
  }, [session]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Nurse Resource Binder</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Authentication is working! You're logged in as {user?.email}
            </p>
            {apiUser && (
              <div className="p-4 bg-green-50 rounded border border-green-200">
                <p className="text-sm font-medium text-green-800">
                  ✅ Backend authentication verified
                </p>
                <p className="text-xs text-green-600 mt-1">
                  User ID: {apiUser.id}
                </p>
              </div>
            )}
            {apiError && (
              <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  ⚠️ {apiError}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Make sure the backend server is running on http://localhost:8000
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Next: Implement Phase 1 - Basic Resource Management
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

