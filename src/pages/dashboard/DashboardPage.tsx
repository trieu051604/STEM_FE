import { useAuthStore } from '@/stores/authStore';
import { MasterAdminDashboard } from '@/pages/dashboard/master-admin';
import { SchoolAdminDashboard } from '@/pages/dashboard/school-admin';
import { TeacherDashboard } from './TeacherDashboard';
import { StudentDashboard } from '@/pages/dashboard/student/StudentDashboard';

export const DashboardPage = () => {
  const { user } = useAuthStore();

  // Redirect to role-specific dashboards
  switch (user?.role) {
    case 'master_admin':
      return <MasterAdminDashboard />;
    case 'school_admin':
      return <SchoolAdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">
            Xin chào, {user?.fullName}
          </h1>
          <p className="text-muted-foreground">Chào mừng bạn đến với STEM</p>
        </div>
      );
  }
};
