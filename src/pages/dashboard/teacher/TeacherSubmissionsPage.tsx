import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, User, BookOpen, Loader2, Search, Award, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherApi, TeacherSubmission } from '@/services/teacherStudentApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Pagination } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 10;

export default function TeacherSubmissionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch submissions
  const { data: submissionsData, isLoading } = useQuery({
    queryKey: ['teacher-submissions', currentPage, searchTerm, filterStatus],
    queryFn: () => teacherApi.getSubmissions({
      pageNumber: currentPage,
      pageSize: ITEMS_PER_PAGE,
    }),
  });

  const submissions = submissionsData?.items || [];
  const totalPages = Math.ceil((submissionsData?.total || 0) / ITEMS_PER_PAGE);

  // Mock data for demo
  const mockSubmissions: TeacherSubmission[] = [
    {
      id: 1,
      studentName: 'Nguyễn Văn A',
      assignmentTitle: 'LED Blinking',
      className: 'IOT101 - Arduino Cơ bản',
      submittedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'submitted',
    },
    {
      id: 2,
      studentName: 'Trần Thị B',
      assignmentTitle: 'LED Blinking',
      className: 'IOT101 - Arduino Cơ bản',
      submittedAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'submitted',
    },
    {
      id: 3,
      studentName: 'Lê Văn C',
      assignmentTitle: 'Button Counter',
      className: 'IOT101 - Arduino Cơ bản',
      submittedAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'graded',
      score: 9,
    },
  ];

  const displaySubmissions = submissions.length > 0 ? submissions : mockSubmissions;

  // Toast notification helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // You can implement toast notifications here using your toast library
    alert(message);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Chờ chấm</span>;
      case 'graded':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Đã chấm</span>;
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
        <h1 className="text-2xl font-bold">Bài nộp cần chấm</h1>
        <p className="text-muted-foreground">Xem và chấm điểm bài tập của học sinh</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{displaySubmissions.filter(s => s.status === 'submitted').length}</p>
              <p className="text-sm text-muted-foreground">Chờ chấm</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{displaySubmissions.filter(s => s.status === 'graded').length}</p>
              <p className="text-sm text-muted-foreground">Đã chấm</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{displaySubmissions.length}</p>
              <p className="text-sm text-muted-foreground">Tổng bài nộp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên học sinh..."
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
            variant={filterStatus === 'submitted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('submitted')}
          >
            Chờ chấm
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

      {/* Submissions Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-4 px-6 font-medium">Học sinh</th>
                <th className="text-left py-4 px-6 font-medium">Bài tập</th>
                <th className="text-left py-4 px-6 font-medium">Lớp</th>
                <th className="text-left py-4 px-6 font-medium">Thời gian nộp</th>
                <th className="text-center py-4 px-6 font-medium">Điểm</th>
                <th className="text-left py-4 px-6 font-medium">Trạng thái</th>
                <th className="text-right py-4 px-6 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displaySubmissions.map((submission) => (
                <tr key={submission.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{submission.studentName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">{submission.assignmentTitle}</td>
                  <td className="py-4 px-6 text-muted-foreground">{submission.className}</td>
                  <td className="py-4 px-6 text-muted-foreground">
                    {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true, locale: vi })}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {submission.score !== undefined ? (
                      <span className="font-bold text-green-600">{submission.score}/10</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(submission.status)}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/dashboard/teacher/submissions/${submission.id}`}>
                        <Button variant="outline" size="sm">
                          Xem chi tiết
                        </Button>
                      </Link>
                      {submission.status === 'submitted' && (
                        <Link to={`/dashboard/teacher/submissions/${submission.id}/grade`}>
                          <Button size="sm" className="gap-2">
                            <Award className="w-4 h-4" />
                            Chấm điểm
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {displaySubmissions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Không có bài nộp nào</h3>
            <p>Các bài nộp sẽ xuất hiện ở đây khi học sinh nộp bài</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={submissionsData?.total || 0}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
