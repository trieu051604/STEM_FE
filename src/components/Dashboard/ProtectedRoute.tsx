import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import {
  StudentsPage,
  CoursesPage,
  ClassesPage,
  TeachersPage,
  LoginHistoryPage,
} from '@/pages/dashboard/school-admin';
import { SchoolsPage, UsersPage } from '@/pages/dashboard/master-admin';

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
      // Schools (Master Admin only)
      { 
        path: 'schools', 
        element: <SchoolsPage />,
      },
      // Requests (Master Admin only)
      { 
        path: 'requests', 
        element: <SchoolsPage defaultTab="requests" />,
      },
      // Students (School Admin)
      { 
        path: 'students', 
        element: <StudentsPage />,
      },
      // Courses (School Admin)
      { 
        path: 'courses', 
        element: <CoursesPage />,
      },
      // Classes (School Admin)
      { 
        path: 'classes', 
        element: <ClassesPage />,
      },
      // Teachers (School Admin)
      { 
        path: 'teachers', 
        element: <TeachersPage />,
      },
      // My Classes (Teacher/Student)
      { path: 'my-classes', element: <div>My Classes Page</div> },
      // Login History (School Admin)
      { 
        path: 'login-history', 
        element: <LoginHistoryPage />,
      },
      // Assignments
      { path: 'assignments', element: <div>Assignments Page</div> },
      // Simulations
      { path: 'simulations', element: <div>Simulations Page</div> },
      // Notifications
      { path: 'notifications', element: <div>Notifications Page</div> },
      // Profile
      { path: 'profile', element: <div>Profile Page</div> },
      // Users (Master Admin only)
      { path: 'users', element: <UsersPage /> },
    ],
  },
];
