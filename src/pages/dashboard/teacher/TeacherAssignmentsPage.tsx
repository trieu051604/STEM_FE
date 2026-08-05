import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle, AlertCircle, Search, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherApi, TeacherAssignment } from '@/services/teacherStudentApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const ITEMS_PER_PAGE = 10;

export default function TeacherAssignmentsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch assignments
  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ['teacher-assignments', currentPage, searchTerm],
    queryFn: () => teacherApi.getAssignments({
      pageNumber: currentPage,
      pageSize: ITEMS_PER_PAGE,
    }),
  });

  const assignments = assignmentsData?.items || [];
  const totalPages = Math.ceil((assignmentsData?.total || 0) / ITEMS_PER_PAGE);

  // Mock data for demo
  const mockAssignments: TeacherAssignment[] = [
    {
      id: 1,
      title: 'LED Blinking',
      classId: 1,
      className: 'IOT101 - Arduino Cơ bản',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      submittedCount: 8,
      totalStudents: 15,
      status: 'pending',
    },
    {
      id: 2,
      title: 'Button Counter',
      classId: 1,
      className: 'IOT101 - Arduino Cơ bản',
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      submittedCount: 15,
      totalStudents: 15,
      status: 'graded',
    },
    {
      id: 3,
      title: 'Temperature Sensor',
      classId: 2,
      className: 'IOT201 - ESP32 Nâng cao',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      submittedCount: 5,
      totalStudents: 12,
      status: 'pending',
    },
  ];

  const displayAssignments = assignments.length > 0 ? assignments : mockAssignments;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Chờ nộp</span>;
      case 'graded':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Đã chấm</span>;
      case 'overdue':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Quá hạn</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bài tập</h1>
          <p className="text-muted-foreground">Quản lý bài tập đã giao cho các lớp</p>
        </div>
        <Link to="/dashboard/teacher/assignments/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Tạo bài tập mới
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bài tập..."
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
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('pending')}
          >
            Chờ nộp
          </Button>
          <Button
            variant={filterStatus === 'graded' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('graded')}
          >
            Đã chấm
          </Button>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-4 px-6 font-medium">Tên bài tập</th>
                <th className="text-left py-4 px-6 font-medium">Lớp</th>
                <th className="text-left py-4 px-6 font-medium">Hạn nộp</th>
                <th className="text-center py-4 px-6 font-medium">Đã nộp</th>
                <th className="text-left py-4 px-6 font-medium">Trạng thái</th>
                <th className="text-right py-4 px-6 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayAssignments.map((assignment) => (
                <tr key={assignment.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-4 px-6 font-medium">{assignment.title}</td>
                  <td className="py-4 px-6 text-muted-foreground">{assignment.className}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true, locale: vi })}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={assignment.submittedCount === assignment.totalStudents ? 'text-green-600' : ''}>
                      {assignment.submittedCount}/{assignment.totalStudents}
                    </span>
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(assignment.status)}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/dashboard/teacher/assignments/${assignment.id}/submissions`}>
                        <Button variant="outline" size="sm">
                          Xem bài nộp
                        </Button>
                      </Link>
                      <Link to={`/dashboard/teacher/assignments/${assignment.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Sửa
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {displayAssignments.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Chưa có bài tập nào</h3>
            <p>Tạo bài tập mới để giao cho học sinh</p>
          </div>
        )}
      </div>

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
