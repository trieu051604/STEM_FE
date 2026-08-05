import { useAuthStore, UserRole } from '@/stores/authStore';

interface SidebarItem {
  label: string;
  path: string;
  icon: string;
}

const roleSidebarItems: Record<UserRole, SidebarItem[]> = {
  master_admin: [
    { label: 'Tổng quan', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Quản lý trường', path: '/dashboard/schools', icon: 'Building2' },
    { label: 'Yêu cầu duyệt', path: '/dashboard/requests', icon: 'ClipboardCheck' },
    { label: 'Quản lý người dùng', path: '/dashboard/users', icon: 'Users' },
    { label: 'Khóa học', path: '/dashboard/courses', icon: 'BookOpen' },
    { label: 'Lớp học', path: '/dashboard/classes', icon: 'GraduationCap' },
    { label: 'Thông báo', path: '/dashboard/notifications', icon: 'Bell' },
    { label: 'Hồ sơ', path: '/dashboard/profile', icon: 'User' },
  ],
  school_admin: [
    { label: 'Tổng quan', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Quản lý người dùng', path: '/dashboard/users', icon: 'Users' },
    { label: 'Khóa học', path: '/dashboard/courses', icon: 'BookOpen' },
    { label: 'Lớp học', path: '/dashboard/classes', icon: 'School' },
    { label: 'Mua Token', path: '/dashboard/payments', icon: 'Coins' },
    { label: 'Lịch sử đăng nhập', path: '/dashboard/login-history', icon: 'History' },
    { label: 'Lớp học', path: '/dashboard/classes', icon: 'GraduationCap' },
    { label: 'Thông báo', path: '/dashboard/notifications', icon: 'Bell' },
    { label: 'Hồ sơ', path: '/dashboard/profile', icon: 'User' },
  ],
  teacher: [
    { label: 'Tổng quan', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Lớp học của tôi', path: '/dashboard/my-classes', icon: 'GraduationCap' },
    { label: 'Khóa học', path: '/dashboard/courses', icon: 'BookOpen' },
    { label: 'Bài tập', path: '/dashboard/assignments', icon: 'ClipboardList' },
    { label: 'Thông báo', path: '/dashboard/notifications', icon: 'Bell' },
    { label: 'Hồ sơ', path: '/dashboard/profile', icon: 'User' },
    { label: 'Phòng lab ảo', path: '/dashboard/virtual-lab', icon: 'FlaskConical' },
    { label: 'Lịch dạy hàng tuần', path: '/dashboard/my-classes', icon: 'GraduationCap' },
    { label: 'Quản lý bài tập', path: '/dashboard/assignments', icon: 'ClipboardList' },
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
