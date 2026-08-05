import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, User, Calendar, MapPin, Play, Loader2, Search, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { studentApi, StudentClass } from '@/services/teacherStudentApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const ITEMS_PER_PAGE = 10;

export default function StudentClassesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch classes
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['student-classes', currentPage, searchTerm],
    queryFn: () => studentApi.getClasses({
      pageNumber: currentPage,
      pageSize: ITEMS_PER_PAGE,
      status: filterStatus !== 'all' ? filterStatus : undefined,
    }),
  });

  const classes = classesData?.items || [];
  const totalPages = Math.ceil((classesData?.total || 0) / ITEMS_PER_PAGE);

  // Mock data for demo
  const mockClasses: StudentClass[] = [
    {
      id: 1,
      name: 'IOT101 - Arduino Cơ bản',
      courseName: 'Arduino Cơ bản',
      teacherName: 'Thầy Nguyễn Văn A',
      schedule: 'Thứ 2, 14:00 - 16:00',
      room: 'Phòng A101',
      progress: 75,
      nextSession: new Date(Date.now() + 3600000 * 2).toISOString(),
      status: 'active',
    },
    {
      id: 2,
      name: 'IOT201 - ESP32 Nâng cao',
      courseName: 'ESP32 Nâng cao',
      teacherName: 'Cô Trần Thị B',
      schedule: 'Thứ 4, 08:00 - 10:00',
      room: 'Phòng B202',
      progress: 45,
      nextSession: new Date(Date.now() + 86400000).toISOString(),
      status: 'active',
    },
  ];

  const displayClasses = classes.length > 0 ? classes : mockClasses;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Đang học</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Hoàn thành</span>;
      case 'upcoming':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Sắp bắt đầu</span>;
      default:
        return null;
    }
  };

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
        <p className="text-muted-foreground">Theo dõi tiến độ học tập tại các lớp học</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm lớp học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            Tất cả
          </Button>
          <Button
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('active')}
          >
            Đang học
          </Button>
          <Button
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('completed')}
          >
            Hoàn thành
          </Button>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayClasses.map((cls) => (
          <div key={cls.id} className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              {getStatusBadge(cls.status)}
            </div>

            <div>
              <h3 className="text-lg font-semibold">{cls.name}</h3>
              <p className="text-sm text-muted-foreground">{cls.courseName}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tiến độ</span>
                <span className="font-medium">{cls.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${cls.progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{cls.teacherName}</span>
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
              {cls.nextSession && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Buổi tiếp theo: {formatDistanceToNow(new Date(cls.nextSession), { addSuffix: true, locale: vi })}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Link to={`/dashboard/student/classes/${cls.id}`} className="flex-1">
                <Button className="w-full gap-2">
                  <Play className="w-4 h-4" />
                  Vào học
                </Button>
              </Link>
              <Link to={`/dashboard/student/classes/${cls.id}/progress`}>
                <Button variant="outline" size="icon">
                  <CheckCircle className="w-4 h-4" />
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
          <h3 className="text-lg font-medium mb-2">Chưa tham gia lớp học nào</h3>
          <p>Liên hệ quản trị viên để được thêm vào lớp học</p>
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
