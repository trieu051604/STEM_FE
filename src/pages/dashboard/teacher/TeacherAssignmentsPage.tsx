import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle, AlertCircle, Search, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TeacherCard } from '@/components/Dashboard/teacher/TeacherCard';
import { TeacherPageHeader } from '@/components/Dashboard/teacher/TeacherPageHeader';
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-500">Chờ nộp</span>;
      case 'graded':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">Đã chấm</span>;
      case 'overdue':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">Quá hạn</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">{status}</span>;
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
      <TeacherPageHeader
        title="Bài tập"
        description="Quản lý bài tập đã giao cho các lớp"
        action={
          <Link to="/dashboard/teacher/assignments/create">
            <Button className="gap-2 bg-indigo-500 hover:bg-indigo-600 text-white border-0">
              <Plus className="w-4 h-4" />
              Tạo bài tập mới
            </Button>
          </Link>
        }
      />

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
      <TeacherCard noPadding>
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
              {assignments.map((assignment) => (
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
                    <span className={assignment.submittedCount === assignment.totalStudents ? 'text-green-500' : ''}>
                      {assignment.submittedCount}/{assignment.totalStudents}
                    </span>
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(assignment.status)}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/dashboard/teacher/assignments/${assignment.id}/submissions`}>
                        <Button variant="outline" size="sm" className="border-border hover:bg-accent">
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
        {assignments.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Chưa có bài tập nào</h3>
            <p>Tạo bài tập mới để giao cho học sinh</p>
          </div>
        )}
      </TeacherCard>

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
