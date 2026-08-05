import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { VirtualLabPage } from '@/pages/dashboard/VirtualLabPage';
import { MyClassesPage } from '@/pages/dashboard/MyClassesPage';
import { ProfilePage } from '@/pages/dashboard/ProfilePage';
import { AssignmentsPage } from '@/pages/dashboard/AssignmentsPage';
import { LabDetailPage } from '@/pages/dashboard/LabDetailPage';
import { LabSandboxPage } from '@/pages/dashboard/LabSandboxPage';
import { ClassMonitorPage } from '@/pages/dashboard/ClassMonitorPage';
import { AttendancePage } from '@/pages/dashboard/AttendancePage';
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
      // Virtual Lab
      { path: 'virtual-lab', element: <VirtualLabPage /> },
      { path: 'virtual-lab/:id', element: <LabDetailPage /> },
      { path: 'virtual-lab/:id/sandbox', element: <LabSandboxPage /> },
      { path: 'virtual-lab/monitor/:classId', element: <ClassMonitorPage /> },
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
      { path: 'my-classes', element: <MyClassesPage /> },
      { path: 'attendance', element: <AttendancePage /> },
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
      { path: 'my-classes', element: <StudentClassesPage /> },
      { path: 'teacher/classes', element: <TeacherClassesPage /> },
      { path: 'teacher/classes/:id', element: <TeacherClassesPage /> },
      { path: 'teacher/assignments', element: <TeacherAssignmentsPage /> },
      { path: 'teacher/assignments/:id', element: <TeacherAssignmentsPage /> },
      { path: 'teacher/submissions', element: <TeacherSubmissionsPage /> },
      { path: 'student/classes', element: <StudentClassesPage /> },
      { path: 'student/classes/:id', element: <StudentClassesPage /> },
      { path: 'student/assignments', element: <StudentAssignmentsPage /> },
      { path: 'student/assignments/:id', element: <StudentAssignmentsPage /> },
      // Login History (School Admin)
      { 
        path: 'login-history', 
        element: <LoginHistoryPage />,
      },
      // Payments (School Admin)
      { 
        path: 'payments', 
        element: <PaymentsPage />,
      },
      // Assignments
      { path: 'assignments', element: <AssignmentsPage /> },
      { path: 'assignments', element: <div className="p-6"><div className="text-center py-12"><h2 className="text-xl font-bold mb-2">Bài tập</h2><p className="text-muted-foreground">Trang đang được phát triển...</p></div></div> },
      // Simulations
      { path: 'simulations', element: <div className="p-6"><div className="text-center py-12"><h2 className="text-xl font-bold mb-2">Mô phỏng</h2><p className="text-muted-foreground">Trang đang được phát triển...</p></div></div> },
      // Notifications
      { path: 'notifications', element: <NotificationsPage /> },
      // Profile
      { path: 'profile', element: <ProfilePage /> },
      { path: 'profile', element: <ProfilePage /> },
      // Users (Master Admin only)
      { path: 'users', element: <UsersPage /> },
      // Teacher Dashboard
      { path: 'teacher-dashboard', element: <TeacherDashboard /> },
      // Student Dashboard  
      { path: 'student-dashboard', element: <StudentDashboard /> },
    ],
  },
];
