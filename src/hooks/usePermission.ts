import { useAuthStore } from '@/stores';
import type { UserRole } from '@/types';

export function usePermission() {
  const user = useAuthStore(s => s.user);
  const role = user?.role;

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!role) return false;
    return roles.includes(role);
  };

  const isMasterAdmin = () => role === 'master_admin';
  const isSchoolAdmin = () => role === 'school_admin';
  const isTeacher = () => role === 'teacher';
  const isStudent = () => role === 'student';
  const isAdmin = () => role === 'master_admin' || role === 'school_admin';
  const isEducator = () => role === 'teacher' || role === 'school_admin' || role === 'master_admin';

  const can = {
    manageSchools: isMasterAdmin(),
    manageTeachers: isAdmin(),
    manageStudents: hasRole('school_admin', 'teacher'),
    createCourse: hasRole('teacher', 'school_admin', 'master_admin'),
    controlSimulation: hasRole('teacher', 'master_admin'),
    viewSimulation: true,
    viewAnalytics: isEducator(),
    viewGlobalAnalytics: isMasterAdmin(),
    manageRoles: isMasterAdmin(),
    viewAuditLogs: isMasterAdmin(),
    submitAssignment: isStudent(),
    gradeAssignment: hasRole('teacher'),
  };

  return { role, hasRole, isMasterAdmin, isSchoolAdmin, isTeacher, isStudent, isAdmin, isEducator, can };
}
