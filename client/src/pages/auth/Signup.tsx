import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { signUp, resendConfirmationEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setLoading(false);
      setShowConfirmationDialog(true);
    }
  };

  const handleResendEmail = async () => {
    setResendMessage(null);
    setResendLoading(true);

    const { error } = await resendConfirmationEmail(email);

    if (error) {
      setResendMessage({ type: 'error', text: error.message || 'Failed to resend email. Please try again.' });
    } else {
      setResendMessage({ type: 'success', text: 'Confirmation email sent! Please check your inbox.' });
    }

    setResendLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Check your email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              We've sent a confirmation email to <strong>{email}</strong>. Please check your inbox and click the confirmation link to activate your account before logging in.
            </p>
            {resendMessage && (
              <div
                className={`text-sm p-3 rounded ${
                  resendMessage.type === 'success'
                    ? 'text-green-600 bg-green-50'
                    : 'text-red-600 bg-red-50'
                }`}
              >
                {resendMessage.text}
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmationDialog(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={resendLoading}
              className="w-full sm:w-auto"
            >
              {resendLoading ? 'Sending...' : 'Resend confirmation email'}
            </Button>
            <Button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto"
            >
              Go to Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

