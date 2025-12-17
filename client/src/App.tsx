import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Login } from '@/pages/auth/Login';
import { Signup } from '@/pages/auth/Signup';
import { HomePage } from '@/pages/home/HomePage';
import { UploadPage } from '@/pages/upload/UploadPage';
import { PacketsPage } from '@/pages/packets/PacketsPage';
import { SharedPacketPage } from '@/pages/shared/SharedPacketPage';
import { AuthCallback } from '@/pages/auth/AuthCallback';
import { ResetPassword } from '@/pages/auth/ResetPassword';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                  <BottomNavigation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadPage />
                  <BottomNavigation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/packets"
              element={
                <ProtectedRoute>
                  <PacketsPage />
                  <BottomNavigation />
                </ProtectedRoute>
              }
            />
            <Route path="/shared/:shareLink" element={<SharedPacketPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
