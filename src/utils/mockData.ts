// ============ MOCK DATA ============
import type { Course, Student, Teacher, School, Badge, Notification } from '@/types';

export const MOCK_SCHOOLS: School[] = [
  { id: 'school-1', name: 'Trường THPT Khoa học Tự nhiên', address: 'Hà Nội', adminId: '2', teacherCount: 45, studentCount: 1200, courseCount: 38, isActive: true, createdAt: '2023-09-01T00:00:00Z' },
  { id: 'school-2', name: 'Trường THPT Công nghệ Sài Gòn', address: 'TP.HCM', adminId: '5', teacherCount: 52, studentCount: 1500, courseCount: 42, isActive: true, createdAt: '2023-09-01T00:00:00Z' },
  { id: 'school-3', name: 'Trường THPT Kỹ thuật Đà Nẵng', address: 'Đà Nẵng', adminId: '6', teacherCount: 30, studentCount: 800, courseCount: 25, isActive: true, createdAt: '2023-09-01T00:00:00Z' },
];

export const MOCK_COURSES: Course[] = [
  { id: 'c1', title: 'Vật lý lượng tử nâng cao', description: 'Khám phá thế giới vi mô qua thí nghiệm mô phỏng 3D tương tác', thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400', subject: 'physics', level: 'advanced', teacherId: '3', teacherName: 'Lê Văn Giáo', schoolId: 'school-1', studentCount: 124, lessonCount: 18, duration: 2400, rating: 4.9, tags: ['quantum', 'lab'], isPublished: true, hasSimulation: true, createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-05-01T00:00:00Z' },
  { id: 'c2', title: 'Hóa học hữu cơ thực hành', description: 'Thí nghiệm hóa học hữu cơ với mô phỏng phân tử 3D', thumbnail: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400', subject: 'chemistry', level: 'intermediate', teacherId: '3', teacherName: 'Lê Văn Giáo', schoolId: 'school-1', studentCount: 89, lessonCount: 15, duration: 1800, rating: 4.7, tags: ['organic', 'simulation'], isPublished: true, hasSimulation: true, createdAt: '2024-02-10T00:00:00Z', updatedAt: '2024-05-01T00:00:00Z' },
  { id: 'c3', title: 'Sinh học tế bào & Di truyền', description: 'Nghiên cứu cấu trúc tế bào qua kính hiển vi ảo', thumbnail: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=400', subject: 'biology', level: 'intermediate', teacherId: '3', teacherName: 'Lê Văn Giáo', schoolId: 'school-1', studentCount: 156, lessonCount: 20, duration: 2800, rating: 4.8, tags: ['cell', 'genetics'], isPublished: true, hasSimulation: false, createdAt: '2024-03-01T00:00:00Z', updatedAt: '2024-05-01T00:00:00Z' },
  { id: 'c4', title: 'Toán học rời rạc & Thuật toán', description: 'Nền tảng toán học cho khoa học máy tính', thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400', subject: 'math', level: 'advanced', teacherId: '3', teacherName: 'Lê Văn Giáo', schoolId: 'school-1', studentCount: 200, lessonCount: 24, duration: 3200, rating: 4.6, tags: ['math', 'algorithm'], isPublished: true, hasSimulation: false, createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-04-20T00:00:00Z' },
  { id: 'c5', title: 'Lập trình Robot & IoT', description: 'Lập trình vi điều khiển và kết nối thiết bị thông minh', thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400', subject: 'technology', level: 'beginner', teacherId: '3', teacherName: 'Lê Văn Giáo', schoolId: 'school-1', studentCount: 78, lessonCount: 12, duration: 1200, rating: 4.5, tags: ['robot', 'iot'], isPublished: true, hasSimulation: true, createdAt: '2024-04-01T00:00:00Z', updatedAt: '2024-05-05T00:00:00Z' },
  { id: 'c6', title: 'Kỹ thuật điện & Mạch điện', description: 'Thiết kế và mô phỏng mạch điện với Falstad circuit simulator', thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400', subject: 'engineering', level: 'intermediate', teacherId: '3', teacherName: 'Lê Văn Giáo', schoolId: 'school-1', studentCount: 112, lessonCount: 16, duration: 2000, rating: 4.7, tags: ['circuit', 'electronics'], isPublished: true, hasSimulation: true, createdAt: '2024-03-15T00:00:00Z', updatedAt: '2024-05-01T00:00:00Z' },
];

export const MOCK_BADGES: Badge[] = [
  { id: 'b1', name: 'Nhà Khoa học Đầu tiên', description: 'Hoàn thành thí nghiệm lab đầu tiên', icon: '🔬', color: '#6366f1', earnedAt: '2024-03-15T00:00:00Z' },
  { id: 'b2', name: 'Xuất sắc Vật lý', description: 'Đạt điểm 10 trong bài kiểm tra Vật lý', icon: '⚡', color: '#0ea5e9', earnedAt: '2024-04-01T00:00:00Z' },
  { id: 'b3', name: 'Người học chăm chỉ', description: 'Học liên tục 7 ngày', icon: '📚', color: '#10b981', earnedAt: '2024-04-10T00:00:00Z' },
  { id: 'b4', name: 'Teamwork Champion', description: 'Hoàn thành 5 lab nhóm', icon: '🤝', color: '#f59e0b', earnedAt: '2024-05-01T00:00:00Z' },
  { id: 'b5', name: 'Hóa học Master', description: 'Hoàn thành toàn bộ khóa Hóa học hữu cơ', icon: '⚗️', color: '#ef4444', progress: 75, maxProgress: 100 },
  { id: 'b6', name: 'Coder STEM', description: 'Hoàn thành khóa Robot & IoT', icon: '🤖', color: '#8b5cf6', progress: 30, maxProgress: 100 },
];

export const MOCK_TEACHERS: Teacher[] = [
  { id: 't1', userId: '3', fullName: 'Lê Văn Giáo', email: 'teacher@stem.edu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher', schoolId: 'school-1', subjects: ['Vật lý', 'Hóa học'], classCount: 6, studentCount: 156, isOnline: true },
  { id: 't2', userId: '7', fullName: 'Nguyễn Thị Lan', email: 'lan@stem.edu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lan', schoolId: 'school-1', subjects: ['Sinh học', 'Hóa học'], classCount: 4, studentCount: 98, isOnline: false },
  { id: 't3', userId: '8', fullName: 'Phạm Văn Tùng', email: 'tung@stem.edu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tung', schoolId: 'school-1', subjects: ['Toán', 'Công nghệ'], classCount: 5, studentCount: 130, isOnline: true },
];

export const MOCK_STUDENTS: Student[] = [
  { id: 's1', userId: '4', fullName: 'Phạm Thị Học', email: 'student@stem.edu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student', schoolId: 'school-1', grade: '10A1', gpa: 9.2, completedCourses: 3, badges: MOCK_BADGES.slice(0, 4), isOnline: true },
  { id: 's2', userId: '9', fullName: 'Trần Văn An', email: 'an@stem.edu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=an', schoolId: 'school-1', grade: '10A1', gpa: 8.8, completedCourses: 2, badges: MOCK_BADGES.slice(0, 2), isOnline: true },
  { id: 's3', userId: '10', fullName: 'Lê Thị Bình', email: 'binh@stem.edu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=binh', schoolId: 'school-1', grade: '10A2', gpa: 9.5, completedCourses: 4, badges: MOCK_BADGES, isOnline: false },
  { id: 's4', userId: '11', fullName: 'Nguyễn Minh Khoa', email: 'khoa@stem.edu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=khoa', schoolId: 'school-1', grade: '11B1', gpa: 7.9, completedCourses: 1, badges: MOCK_BADGES.slice(0, 1), isOnline: false },
];

export const PERFORMANCE_DATA = [
  { label: 'T1', value: 72 }, { label: 'T2', value: 78 }, { label: 'T3', value: 75 },
  { label: 'T4', value: 83 }, { label: 'T5', value: 88 }, { label: 'T6', value: 85 },
  { label: 'T7', value: 91 }, { label: 'T8', value: 89 }, { label: 'T9', value: 93 },
  { label: 'T10', value: 87 }, { label: 'T11', value: 95 }, { label: 'T12', value: 92 },
];

export const SUBJECT_DISTRIBUTION = [
  { name: 'Vật lý', value: 28, color: '#6366f1' },
  { name: 'Hóa học', value: 22, color: '#0ea5e9' },
  { name: 'Sinh học', value: 18, color: '#10b981' },
  { name: 'Toán học', value: 20, color: '#f59e0b' },
  { name: 'Công nghệ', value: 12, color: '#ef4444' },
];
