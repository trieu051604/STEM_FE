import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import type { UserRole } from '@/types';

const ROLE_HOME: Record<UserRole, string> = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  school_admin: '/school/dashboard',
  master_admin: '/admin/dashboard',
};

export function RoleRedirect() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  if (user) {
    navigate(ROLE_HOME[user.role], { replace: true });
  }
  return null;
}
