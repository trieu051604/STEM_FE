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
    { label: 'Hồ sơ', path: '/dashboard/profile', icon: 'User' },
  ],
  school_admin: [
    { label: 'Tổng quan', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Quản lý học sinh', path: '/dashboard/students', icon: 'GraduationCap' },
    { label: 'Quản lý giáo viên', path: '/dashboard/teachers', icon: 'UserCheck' },
    { label: 'Khóa học', path: '/dashboard/courses', icon: 'BookOpen' },
    { label: 'Lớp học', path: '/dashboard/classes', icon: 'School' },
    { label: 'Mua Token', path: '/dashboard/payments', icon: 'Coins' },
    { label: 'Lịch sử đăng nhập', path: '/dashboard/login-history', icon: 'History' },
    { label: 'Thông báo', path: '/dashboard/notifications', icon: 'Bell' },
    { label: 'Hồ sơ', path: '/dashboard/profile', icon: 'User' },
  ],
  teacher: [
    { label: 'Tổng quan', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Phòng lab ảo', path: '/dashboard/virtual-lab', icon: 'FlaskConical' },
    { label: 'Lịch dạy hàng tuần', path: '/dashboard/teacher/schedule', icon: 'GraduationCap' },
    { label: 'Quản lý bài tập', path: '/dashboard/assignments', icon: 'ClipboardList' },
    { label: 'Thông báo', path: '/dashboard/notifications', icon: 'Bell' },
    { label: 'Hồ sơ', path: '/dashboard/profile', icon: 'User' },
  ],
  student: [
    { label: 'Tổng quan', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Lớp học', path: '/dashboard/my-classes', icon: 'BookOpen' },
    { label: 'Bài tập', path: '/dashboard/assignments', icon: 'ClipboardList' },
    { label: 'Mô phỏng', path: '/dashboard/simulations', icon: 'Cpu' },
    { label: 'Thông báo', path: '/dashboard/notifications', icon: 'Bell' },
    { label: 'Hồ sơ', path: '/dashboard/profile', icon: 'User' },
  ],
};

export const getSidebarItems = (role: UserRole): SidebarItem[] => {
  return roleSidebarItems[role] || roleSidebarItems.student;
};
