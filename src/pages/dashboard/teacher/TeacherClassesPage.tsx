import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Calendar, MapPin, Play, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherApi, TeacherClass } from '@/services/teacherStudentApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ITEMS_PER_PAGE = 10;

export default function TeacherClassesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch classes
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['teacher-classes', currentPage, searchTerm],
    queryFn: () => teacherApi.getClasses({
      pageNumber: currentPage,
      pageSize: ITEMS_PER_PAGE,
      search: searchTerm || undefined,
    }),
  });

  const classes = classesData?.items || [];
  const totalPages = Math.ceil((classesData?.total || 0) / ITEMS_PER_PAGE);

  // Mock data for demo
  const mockClasses: TeacherClass[] = [
    {
      id: 1,
      name: 'IOT101',
      courseName: 'Arduino Cơ bản',
      studentCount: 15,
      schedule: 'Thứ 2, 14:00 - 16:00',
      room: 'Phòng A101',
    },
    {
      id: 2,
      name: 'IOT201',
      courseName: 'ESP32 Nâng cao',
      studentCount: 12,
      schedule: 'Thứ 4, 08:00 - 10:00',
      room: 'Phòng B202',
    },
    {
      id: 3,
      name: 'IOT301',
      courseName: 'IoT Advanced',
      studentCount: 10,
      schedule: 'Thứ 6, 14:00 - 16:00',
      room: 'Phòng C303',
    },
  ];

  const displayClasses = classes.length > 0 ? classes : mockClasses;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Lớp học của tôi</h1>
        <p className="text-muted-foreground">Quản lý các lớp học mà bạn được phân công giảng dạy</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm lớp học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayClasses.map((cls) => (
          <div key={cls.id} className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Đang hoạt động
              </span>
            </div>

            <div>
              <h3 className="text-lg font-semibold">{cls.name}</h3>
              <p className="text-sm text-muted-foreground">{cls.courseName}</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{cls.studentCount || 0} học sinh</span>
              </div>
              {cls.schedule && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{cls.schedule}</span>
                </div>
              )}
              {cls.room && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{cls.room}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Link to={`/dashboard/teacher/classes/${cls.id}`} className="flex-1">
                <Button className="w-full gap-2">
                  <Play className="w-4 h-4" />
                  Vào lớp
                </Button>
              </Link>
              <Link to={`/dashboard/teacher/classes/${cls.id}/students`}>
                <Button variant="outline" size="icon">
                  <Users className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {displayClasses.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Chưa có lớp học nào</h3>
          <p>Bạn chưa được phân công giảng dạy lớp nào</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
