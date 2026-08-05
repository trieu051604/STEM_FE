import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProfilePage } from '@/pages/dashboard/ProfilePage';
import { NotificationsPage } from '@/pages/dashboard/NotificationsPage';
import { TeacherDashboard } from '@/pages/dashboard/teacher/TeacherDashboard';
import { StudentDashboard } from '@/pages/dashboard/student/StudentDashboard';
import TeacherClassesPage from '@/pages/dashboard/teacher/TeacherClassesPage';
import TeacherAssignmentsPage from '@/pages/dashboard/teacher/TeacherAssignmentsPage';
import TeacherSubmissionsPage from '@/pages/dashboard/teacher/TeacherSubmissionsPage';
import StudentClassesPage from '@/pages/dashboard/student/StudentClassesPage';
import StudentAssignmentsPage from '@/pages/dashboard/student/StudentAssignmentsPage';
import {
  StudentsPage,
  CoursesPage,
  ClassesPage,
  TeachersPage,
  LoginHistoryPage,
  PaymentsPage,
} from '@/pages/dashboard/school-admin';
import { SchoolsPage, UsersPage } from '@/pages/dashboard/master-admin';
import { VirtualLabPage } from '@/pages/dashboard/VirtualLabPage';
import { MyClassesPage } from '@/pages/dashboard/MyClassesPage';
import { AssignmentsPage } from '@/pages/dashboard/AssignmentsPage';
import { LabDetailPage } from '@/pages/dashboard/LabDetailPage';
import { LabSandboxPage } from '@/pages/dashboard/LabSandboxPage';
import { ClassMonitorPage } from '@/pages/dashboard/ClassMonitorPage';

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
      { path: 'schools', element: <SchoolsPage /> },
      { path: 'requests', element: <SchoolsPage defaultTab="requests" /> },
      { path: 'students', element: <StudentsPage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'classes', element: <ClassesPage /> },
      { path: 'teachers', element: <TeachersPage /> },
      { path: 'login-history', element: <LoginHistoryPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'my-classes', element: <MyClassesPage /> },
      { path: 'teacher/classes', element: <TeacherClassesPage /> },
      { path: 'teacher/classes/:id', element: <TeacherClassesPage /> },
      { path: 'teacher/assignments', element: <TeacherAssignmentsPage /> },
      { path: 'teacher/assignments/:id', element: <TeacherAssignmentsPage /> },
      { path: 'teacher/submissions', element: <TeacherSubmissionsPage /> },
      { path: 'student/classes', element: <StudentClassesPage /> },
      { path: 'student/classes/:id', element: <StudentClassesPage /> },
      { path: 'student/assignments', element: <StudentAssignmentsPage /> },
      { path: 'student/assignments/:id', element: <StudentAssignmentsPage /> },
      { path: 'virtual-lab', element: <VirtualLabPage /> },
      { path: 'virtual-lab/:id', element: <LabDetailPage /> },
      { path: 'virtual-lab/:id/sandbox', element: <LabSandboxPage /> },
      { path: 'virtual-lab/monitor/:classId', element: <ClassMonitorPage /> },
      { path: 'assignments', element: <AssignmentsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'teacher-dashboard', element: <TeacherDashboard /> },
      { path: 'student-dashboard', element: <StudentDashboard /> },
    ],
  },
];
