import { useAuthStore, UserRole } from '@/stores/authStore';

interface SidebarItem {
  label: string;
  path: string;
  icon: string;
}

const roleSidebarItems: Record<UserRole, SidebarItem[]> = {
  master_admin: [
    { label: 'Tổng quan', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Quản lý khối lớp', path: '/dashboard/grade-levels', icon: 'GraduationCap' },
    { label: 'Khung chương trình', path: '/dashboard/syllabus', icon: 'BookOpen' },
    { label: 'Quản lý khóa học', path: '/dashboard/courses', icon: 'FlaskConical' },
    { label: 'Quản lý trường', path: '/dashboard/schools', icon: 'Building2' },
    { label: 'Quản lý gói token', path: '/dashboard/packages', icon: 'Package' },
    { label: 'Thống kê doanh thu', path: '/dashboard/revenue', icon: 'DollarSign' },
    { label: 'Thông báo', path: '/dashboard/notifications', icon: 'Bell' },
    { label: 'Hồ sơ', path: '/dashboard/profile', icon: 'User' },
  ],
  school_admin: [
    { label: 'Tổng quan', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Khung chương trình', path: '/dashboard/school-syllabus', icon: 'BookOpen' },
    { label: 'Quản lý học sinh', path: '/dashboard/students', icon: 'GraduationCap' },
    { label: 'Quản lý giáo viên', path: '/dashboard/teachers', icon: 'UserCheck' },
    { label: 'Lớp học', path: '/dashboard/classes', icon: 'School' },
    { label: 'Báo cáo', path: '/dashboard/reports', icon: 'BarChart3' },
    { label: 'Mua Token', path: '/dashboard/payments', icon: 'Coins' },
    { label: 'Quản lý AI Quota', path: '/dashboard/ai-quota', icon: 'Sparkles' },
    { label: 'Lịch sử đăng nhập', path: '/dashboard/login-history', icon: 'History' },
    { label: 'Thông báo', path: '/dashboard/notifications', icon: 'Bell' },
    { label: 'Hồ sơ', path: '/dashboard/profile', icon: 'User' },
  ],
  teacher: [
    { label: 'Tổng quan', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Lớp học của tôi', path: '/dashboard/teacher/classes', icon: 'School' },
    { label: 'Phòng lab ảo', path: '/dashboard/virtual-lab', icon: 'FlaskConical' },
    { label: 'Lịch dạy hàng tuần', path: '/dashboard/teacher/schedule', icon: 'GraduationCap' },
    { label: 'Quản lý bài tập', path: '/dashboard/assignments', icon: 'ClipboardList' },
    { label: 'Thông báo', path: '/dashboard/notifications', icon: 'Bell' },
    { label: 'Hồ sơ', path: '/dashboard/profile', icon: 'User' },
  ],
  student: [
    { label: 'Tổng quan', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Lớp học', path: '/dashboard/student/classes', icon: 'BookOpen' },
    { label: 'Lịch học', path: '/dashboard/student/schedule', icon: 'Calendar' },
    { label: 'Bài tập', path: '/dashboard/student/assignments', icon: 'ClipboardList' },
    { label: 'Phòng Lab Ảo', path: '/dashboard/virtual-lab', icon: 'FlaskConical' },
    { label: 'Thông báo', path: '/dashboard/notifications', icon: 'Bell' },
    { label: 'Hồ sơ', path: '/dashboard/profile', icon: 'User' },
  ],
};

export const getSidebarItems = (role: UserRole): SidebarItem[] => {
  return roleSidebarItems[role] || roleSidebarItems.student;
};
