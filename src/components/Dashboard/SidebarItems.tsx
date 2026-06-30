import { useAuthStore, UserRole } from '@/stores/authStore';

interface SidebarItem {
  label: string;
  path: string;
  icon: string;
}

const roleSidebarItems: Record<UserRole, SidebarItem[]> = {
  master_admin: [
    { label: 'Quản lý trường', path: '/dashboard/schools', icon: 'Building2' },
    { label: 'Thông báo', path: '/dashboard/notifications', icon: 'Bell' },
  ],
  school_admin: [
    { label: 'Tổng quan', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Quản lý người dùng', path: '/dashboard/users', icon: 'Users' },
    { label: 'Khóa học', path: '/dashboard/courses', icon: 'BookOpen' },
    { label: 'Lớp học', path: '/dashboard/classes', icon: 'GraduationCap' },
    { label: 'Thông báo', path: '/dashboard/notifications', icon: 'Bell' },
  ],
  teacher: [
    { label: 'Tổng quan', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Lớp học của tôi', path: '/dashboard/my-classes', icon: 'GraduationCap' },
    { label: 'Khóa học', path: '/dashboard/courses', icon: 'BookOpen' },
    { label: 'Bài tập', path: '/dashboard/assignments', icon: 'ClipboardList' },
    { label: 'Thông báo', path: '/dashboard/notifications', icon: 'Bell' },
  ],
  student: [
    { label: 'Tổng quan', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Lớp học', path: '/dashboard/my-classes', icon: 'BookOpen' },
    { label: 'Bài tập', path: '/dashboard/assignments', icon: 'ClipboardList' },
    { label: 'Mô phỏng', path: '/dashboard/simulations', icon: 'Cpu' },
    { label: 'Thông báo', path: '/dashboard/notifications', icon: 'Bell' },
  ],
};

export const getSidebarItems = (role: UserRole): SidebarItem[] => {
  return roleSidebarItems[role] || roleSidebarItems.student;
};
