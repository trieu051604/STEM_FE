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
import SubmissionDetailPage from '@/pages/dashboard/SubmissionDetailPage';
import { StudentDashboard } from '@/pages/dashboard/student/StudentDashboard';
import TeacherClassesPage from '@/pages/dashboard/teacher/TeacherClassesPage';
import TeacherClassDetailPage from '@/pages/dashboard/teacher/TeacherClassDetailPage';
import TeacherAssignmentsPage from '@/pages/dashboard/teacher/TeacherAssignmentsPage';
import TeacherSubmissionsPage from '@/pages/dashboard/teacher/TeacherSubmissionsPage';
import TeacherGradeSubmissionPage from '@/pages/dashboard/teacher/TeacherGradeSubmissionPage';
import StudentClassesPage from '@/pages/dashboard/student/StudentClassesPage';
import StudentAssignmentsPage from '@/pages/dashboard/student/StudentAssignmentsPage';
import StudentSubmitAssignmentPage from '@/pages/dashboard/student/StudentSubmitAssignmentPage';
import StudentClassDetailPage from '@/pages/dashboard/student/StudentClassDetailPage';
import StudentSchedulePage from '@/pages/dashboard/student/StudentSchedulePage';
import StudentSimulationsPage from '@/pages/dashboard/student/StudentSimulationsPage';
import StudentProfilePage from '@/pages/dashboard/student/StudentProfilePage';
import { TeacherSchedulePage } from '@/pages/dashboard/teacher/TeacherSchedulePage';
import { TeacherSessionAttendance } from '@/pages/dashboard/teacher/TeacherSessionAttendance';
import {
  StudentsPage,
  ClassesPage,
  TeachersPage,
  LoginHistoryPage,
  PaymentsPage,
  AiQuotaPage,
  SyllabusViewerPage,
  ReportsPage,
} from '@/pages/dashboard/school-admin';
import { SchoolsPage, UsersPage, PackagesManagementPage, GradeLevelsPage, SyllabusPage, CoursesPage, RevenuePage } from '@/pages/dashboard/master-admin';
import React from 'react';

interface RouteConfig {
  path?: string;
  index?: boolean;
  element?: React.ReactNode;
  allowedRoles?: string[];
}

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

const ProtectedElement = ({ element, allowedRoles }: { element: React.ReactNode; allowedRoles?: string[] }) => {
  const { user } = useAuthStore();
  
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2 text-destructive">Không có quyền truy cập</h2>
          <p className="text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }
  
  return <>{element}</>;
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
      // Schools (Master Admin only)
      { 
        path: 'schools', 
        element: <ProtectedElement element={<SchoolsPage />} allowedRoles={['master_admin']} />,
      },
      // Grade Levels (Master Admin only)
      { 
        path: 'grade-levels', 
        element: <ProtectedElement element={<GradeLevelsPage />} allowedRoles={['master_admin']} />,
      },
      // Chương trình Science (Master Admin only)
      { 
        path: 'syllabus', 
        element: <ProtectedElement element={<SyllabusPage />} allowedRoles={['master_admin']} />,
      },
      // Packages Management (Master Admin only)
      { 
        path: 'packages', 
        element: <ProtectedElement element={<PackagesManagementPage />} allowedRoles={['master_admin']} />,
      },
      // Requests (Master Admin only)
      { 
        path: 'requests', 
        element: <ProtectedElement element={<SchoolsPage defaultTab="requests" />} allowedRoles={['master_admin']} />,
      },
      // Revenue (Master Admin only)
      { 
        path: 'revenue', 
        element: <ProtectedElement element={<RevenuePage />} allowedRoles={['master_admin']} />,
      },
      // Users (Master Admin only)
      { 
        path: 'users', 
        element: <ProtectedElement element={<UsersPage />} allowedRoles={['master_admin']} />,
      },
      // Students (School Admin and Master Admin)
      { 
        path: 'students', 
        element: <ProtectedElement element={<StudentsPage />} allowedRoles={['master_admin', 'school_admin']} />,
      },
      // Courses (Master Admin only - create/update/delete)
      { 
        path: 'courses', 
        element: <ProtectedElement element={<CoursesPage />} allowedRoles={['master_admin']} />,
      },
      // Classes (School Admin and Master Admin)
      { 
        path: 'classes', 
        element: <ProtectedElement element={<ClassesPage />} allowedRoles={['master_admin', 'school_admin']} />,
      },
      // Teachers (School Admin and Master Admin)
      { 
        path: 'teachers', 
        element: <ProtectedElement element={<TeachersPage />} allowedRoles={['master_admin', 'school_admin']} />,
      },
      // Syllabus Viewer (School Admin only - read only)
      { 
        path: 'school-syllabus', 
        element: <ProtectedElement element={<SyllabusViewerPage />} allowedRoles={['school_admin']} />,
      },
      // Reports (School Admin only)
      { 
        path: 'reports', 
        element: <ProtectedElement element={<ReportsPage />} allowedRoles={['school_admin']} />,
      },
      // My Classes (Teacher/Student)
      { path: 'my-classes', element: <MyClassesPage /> },
      { path: 'teacher/classes', element: <TeacherClassesPage /> },
      { path: 'teacher/classes/:id', element: <TeacherClassDetailPage /> },
      { path: 'teacher/assignments', element: <TeacherAssignmentsPage /> },
      { path: 'teacher/assignments/:id', element: <TeacherAssignmentsPage /> },
      { path: 'teacher/submissions', element: <TeacherSubmissionsPage /> },
      { path: 'teacher/submissions/:id/grade', element: <TeacherGradeSubmissionPage /> },
      { path: 'submissions/:submissionId', element: <SubmissionDetailPage /> },
      { path: 'teacher/schedule', element: <TeacherSchedulePage /> },
      { path: 'teacher/schedule/attendance', element: <TeacherSessionAttendance /> },
      { path: 'student/classes', element: <StudentClassesPage /> },
      { path: 'student/classes/:classId', element: <StudentClassDetailPage /> },
      { path: 'student/assignments', element: <StudentAssignmentsPage /> },
      { path: 'student/assignments/:id', element: <StudentAssignmentsPage /> },
      { path: 'student/assignments/:id/submit', element: <StudentSubmitAssignmentPage /> },
      { path: 'student/schedule', element: <StudentSchedulePage /> },
      { path: 'student/simulations', element: <StudentSimulationsPage /> },
      { path: 'student/simulations/:id', element: <StudentSimulationsPage /> },
      // Legacy entry point — StudentAllVirtualLabsPage called the disconnected
      // legacy VirtualLabs system (/api/VirtualLabs/student, always empty). The
      // real Lab system (Teacher publish flow + Student Sandbox) lives at
      // /dashboard/virtual-lab. Redirect instead of deleting the route so old
      // bookmarks/links still land somewhere useful.
      { path: 'student/virtual-labs', element: <Navigate to="/dashboard/virtual-lab" replace /> },
      { path: 'student/profile', element: <StudentProfilePage /> },
      // Login History (School Admin)
      { 
        path: 'login-history', 
        element: <ProtectedElement element={<LoginHistoryPage />} allowedRoles={['school_admin']} />,
      },
      // Payments (School Admin)
      { 
        path: 'payments', 
        element: <ProtectedElement element={<PaymentsPage />} allowedRoles={['school_admin']} />,
      },
      // AI Quota Management (School Admin)
      { 
        path: 'ai-quota', 
        element: <ProtectedElement element={<AiQuotaPage />} allowedRoles={['school_admin']} />,
      },
      // Assignments
      { path: 'assignments', element: <AssignmentsPage /> },
      // Simulations
      { path: 'simulations', element: <div className="p-6"><div className="text-center py-12"><h2 className="text-xl font-bold mb-2">Mô phỏng</h2><p className="text-muted-foreground">Trang đang được phát triển...</p></div></div> },
      // Notifications
      { path: 'notifications', element: <NotificationsPage /> },
      // Attendance
      { path: 'attendance', element: <AttendancePage /> },
      // Profile
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
];
