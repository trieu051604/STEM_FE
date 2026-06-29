import { createBrowserRouter } from 'react-router-dom';
import { dashboardRoutes } from '@/components/Dashboard/ProtectedRoute';

// Public pages
import { LandingPage } from '@/pages/public/LandingPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { EmailVerificationPage } from '@/pages/public/EmailVerificationPage';
import { ForgotPasswordPage } from '@/pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/public/ResetPasswordPage';
import { GoogleCallbackPage } from '@/pages/public/GoogleCallbackPage';

export const router = createBrowserRouter([
  // ── Public routes ───────────────────────────────────────
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/login/google/callback', element: <GoogleCallbackPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/verify-email', element: <EmailVerificationPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // ── Dashboard routes (protected) ─────────────────────────
  ...dashboardRoutes,

  // Fallback route
  { path: '*', element: <LandingPage /> },
]);
