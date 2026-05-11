import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Layouts
import { AppLayout } from '@/components/layout/AppLayout';

// Public pages
import { LandingPage } from '@/pages/public/LandingPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { ForgotPasswordPage } from '@/pages/public/ForgotPasswordPage';
import { CourseDiscoveryPage } from '@/pages/public/CourseDiscoveryPage';
import { CourseDetailPage } from '@/pages/public/CourseDetailPage';

// Student pages
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { MyCoursesPage } from '@/pages/student/MyCoursesPage';
import { LessonViewerPage } from '@/pages/student/LessonViewerPage';
import { AssignmentSubmissionPage } from '@/pages/student/AssignmentSubmissionPage';
import { QuizPage } from '@/pages/student/QuizPage';
import { SimulationLabPage } from '@/pages/student/SimulationLabPage';
import { ProgressTrackingPage } from '@/pages/student/ProgressTrackingPage';
import { BadgeAchievementPage } from '@/pages/student/BadgeAchievementPage';
import { StudentProfilePage } from '@/pages/student/StudentProfilePage';
import { NotificationCenterPage } from '@/pages/student/NotificationCenterPage';

// Teacher pages
import { TeacherDashboard } from '@/pages/teacher/TeacherDashboard';
import { ManageStudentsPage } from '@/pages/teacher/ManageStudentsPage';
import { ManageClassesPage } from '@/pages/teacher/ManageClassesPage';
import { CreateCoursePage } from '@/pages/teacher/CreateCoursePage';
import { UploadMaterialsPage } from '@/pages/teacher/UploadMaterialsPage';
import { AssignmentReviewPage } from '@/pages/teacher/AssignmentReviewPage';
import { RubricGradingPage } from '@/pages/teacher/RubricGradingPage';
import { SimulationControlPage } from '@/pages/teacher/SimulationControlPage';
import { ClassroomMonitoringPage } from '@/pages/teacher/ClassroomMonitoringPage';
import { AnalyticsReportsPage } from '@/pages/teacher/AnalyticsReportsPage';

// School Admin pages
import { SchoolDashboard } from '@/pages/school-admin/SchoolDashboard';
import { TeacherManagementPage } from '@/pages/school-admin/TeacherManagementPage';
import { PermissionManagementPage } from '@/pages/school-admin/PermissionManagementPage';
import { CourseManagementPage } from '@/pages/school-admin/CourseManagementPage';
import { SchoolReportsPage } from '@/pages/school-admin/SchoolReportsPage';
import { AcademicConfigPage } from '@/pages/school-admin/AcademicConfigPage';
import { PerformanceAnalyticsPage } from '@/pages/school-admin/PerformanceAnalyticsPage';

// Master Admin pages
import { GlobalDashboard } from '@/pages/master-admin/GlobalDashboard';
import { SchoolManagementPage } from '@/pages/master-admin/SchoolManagementPage';
import { GlobalSimulationLibraryPage } from '@/pages/master-admin/GlobalSimulationLibraryPage';
import { SystemMonitoringPage } from '@/pages/master-admin/SystemMonitoringPage';
import { RolePermissionMatrixPage } from '@/pages/master-admin/RolePermissionMatrixPage';
import { PlatformAnalyticsPage } from '@/pages/master-admin/PlatformAnalyticsPage';
import { AuditLogsPage } from '@/pages/master-admin/AuditLogsPage';

// Misc
import { UnauthorizedPage } from '@/pages/misc/UnauthorizedPage';
import { NotFoundPage } from '@/pages/misc/NotFoundPage';
import { RoleRedirect } from '@/pages/misc/RoleRedirect';

export const router = createBrowserRouter([
  // ── Public routes ───────────────────────────────────────
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/courses', element: <CourseDiscoveryPage /> },
  { path: '/courses/:courseId', element: <CourseDetailPage /> },

  // ── After login redirect ─────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <RoleRedirect /> },
    ],
  },

  // ── Student ──────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['student']} />,
    children: [{
      element: <AppLayout role="student" />,
      children: [
        { path: '/student/dashboard', element: <StudentDashboard /> },
        { path: '/student/courses', element: <MyCoursesPage /> },
        { path: '/student/courses/:courseId/lesson/:lessonId', element: <LessonViewerPage /> },
        { path: '/student/assignments/:assignmentId', element: <AssignmentSubmissionPage /> },
        { path: '/student/quiz/:quizId', element: <QuizPage /> },
        { path: '/student/lab/:sessionId', element: <SimulationLabPage /> },
        { path: '/student/progress', element: <ProgressTrackingPage /> },
        { path: '/student/badges', element: <BadgeAchievementPage /> },
        { path: '/student/profile', element: <StudentProfilePage /> },
        { path: '/student/notifications', element: <NotificationCenterPage /> },
      ],
    }],
  },

  // ── Teacher ──────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['teacher']} />,
    children: [{
      element: <AppLayout role="teacher" />,
      children: [
        { path: '/teacher/dashboard', element: <TeacherDashboard /> },
        { path: '/teacher/students', element: <ManageStudentsPage /> },
        { path: '/teacher/classes', element: <ManageClassesPage /> },
        { path: '/teacher/courses/create', element: <CreateCoursePage /> },
        { path: '/teacher/materials', element: <UploadMaterialsPage /> },
        { path: '/teacher/assignments', element: <AssignmentReviewPage /> },
        { path: '/teacher/grading', element: <RubricGradingPage /> },
        { path: '/teacher/lab/:sessionId', element: <SimulationControlPage /> },
        { path: '/teacher/monitoring', element: <ClassroomMonitoringPage /> },
        { path: '/teacher/analytics', element: <AnalyticsReportsPage /> },
        { path: '/teacher/notifications', element: <NotificationCenterPage /> },
      ],
    }],
  },

  // ── School Admin ─────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['school_admin']} />,
    children: [{
      element: <AppLayout role="school_admin" />,
      children: [
        { path: '/school/dashboard', element: <SchoolDashboard /> },
        { path: '/school/teachers', element: <TeacherManagementPage /> },
        { path: '/school/permissions', element: <PermissionManagementPage /> },
        { path: '/school/courses', element: <CourseManagementPage /> },
        { path: '/school/reports', element: <SchoolReportsPage /> },
        { path: '/school/config', element: <AcademicConfigPage /> },
        { path: '/school/analytics', element: <PerformanceAnalyticsPage /> },
        { path: '/school/notifications', element: <NotificationCenterPage /> },
      ],
    }],
  },

  // ── Master Admin ─────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['master_admin']} />,
    children: [{
      element: <AppLayout role="master_admin" />,
      children: [
        { path: '/admin/dashboard', element: <GlobalDashboard /> },
        { path: '/admin/schools', element: <SchoolManagementPage /> },
        { path: '/admin/simulations', element: <GlobalSimulationLibraryPage /> },
        { path: '/admin/monitoring', element: <SystemMonitoringPage /> },
        { path: '/admin/roles', element: <RolePermissionMatrixPage /> },
        { path: '/admin/analytics', element: <PlatformAnalyticsPage /> },
        { path: '/admin/audit-logs', element: <AuditLogsPage /> },
        { path: '/admin/notifications', element: <NotificationCenterPage /> },
      ],
    }],
  },

  // ── Misc ─────────────────────────────────────────────────
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
