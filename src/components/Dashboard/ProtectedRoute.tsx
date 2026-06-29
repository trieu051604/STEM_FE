import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const dashboardRoutes = [
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      // Schools
      { path: 'schools', element: <div>Schools Page</div> },
      // Requests
      { path: 'requests', element: <div>Requests Page</div> },
      // Users
      { path: 'users', element: <div>Users Page</div> },
      // Courses
      { path: 'courses', element: <div>Courses Page</div> },
      // Classes
      { path: 'classes', element: <div>Classes Page</div> },
      { path: 'my-classes', element: <div>My Classes Page</div> },
      // Assignments
      { path: 'assignments', element: <div>Assignments Page</div> },
      // Simulations
      { path: 'simulations', element: <div>Simulations Page</div> },
      // Notifications
      { path: 'notifications', element: <div>Notifications Page</div> },
      // Profile
      { path: 'profile', element: <div>Profile Page</div> },
    ],
  },
];
