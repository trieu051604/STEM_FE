import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, User, Search, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { gradingApi } from '@/services/dashboardApi';
import type { SubmissionEntity } from '@/services/dashboardApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Pagination } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 10;

export default function TeacherSubmissionsPage() {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('submissionId');
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'graded'>('all');

  // GET /Grading/submissions — tự scope theo Teacher qua JWT, đã sort CreatedAt desc sẵn.
  const { data: submissionsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['teacher-grading-submissions', currentPage],
    queryFn: () => gradingApi.getSubmissions({
      pageNumber: currentPage,
      pageSize: ITEMS_PER_PAGE,
    }),
  });

  const allSubmissions = submissionsData?.items || [];
  const totalPages = Math.ceil((submissionsData?.totalCount || 0) / ITEMS_PER_PAGE);

  const submissions = allSubmissions.filter((s) => {
    if (filterStatus === 'submitted' && s.status !== 'submitted') return false;
    if (filterStatus === 'graded' && s.status !== 'graded') return false;
    if (searchTerm.trim() && !s.studentName.toLowerCase().includes(searchTerm.trim().toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId, submissions]);

  const getStatusBadge = (status: SubmissionEntity['status']) => {
    switch (status) {
      case 'submitted':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Chờ chấm</span>;
      case 'graded':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Đã chấm</span>;
      case 'draft':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">Bản nháp</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bài nộp cần chấm</h1>
          <p className="text-muted-foreground">Xem và chấm điểm bài tập của học sinh</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bài nộp cần chấm</h1>
          <p className="text-muted-foreground">Xem và chấm điểm bài tập của học sinh</p>
        </div>
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <p className="text-sm text-destructive mb-4">Không thể tải danh sách bài nộp.</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bài nộp cần chấm</h1>
        <p className="text-muted-foreground">Xem và chấm điểm bài tập của học sinh</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{allSubmissions.filter(s => s.status === 'submitted').length}</p>
              <p className="text-sm text-muted-foreground">Chờ chấm</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{allSubmissions.filter(s => s.status === 'graded').length}</p>
              <p className="text-sm text-muted-foreground">Đã chấm</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{submissionsData?.totalCount ?? 0}</p>
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
            variant={filterStatus === 'all' ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setFilterStatus('all')}
            className={filterStatus === 'all' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'text-muted-foreground'}
          >
            Tất cả
          </Button>
          <Button
            variant={filterStatus === 'submitted' ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setFilterStatus('submitted')}
            className={filterStatus === 'submitted' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'text-muted-foreground'}
          >
            Chờ chấm
          </Button>
          <Button
            variant={filterStatus === 'graded' ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setFilterStatus('graded')}
            className={filterStatus === 'graded' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'text-muted-foreground'}
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
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-4 px-6 font-medium text-foreground">Học sinh</th>
                <th className="text-left py-4 px-6 font-medium text-foreground">Bài tập</th>
                <th className="text-left py-4 px-6 font-medium text-foreground">Lớp</th>
                <th className="text-left py-4 px-6 font-medium text-foreground">Thời gian nộp</th>
                <th className="text-center py-4 px-6 font-medium text-foreground">Điểm</th>
                <th className="text-left py-4 px-6 font-medium text-foreground">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr
                  key={submission.id}
                  ref={String(submission.id) === highlightId ? highlightRef : undefined}
                  className={
                    String(submission.id) === highlightId
                      ? 'border-b border-border/50 bg-indigo-500/10'
                      : 'border-b border-border/50 hover:bg-muted/30'
                  }
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="font-medium text-foreground">{submission.studentName || 'Học sinh'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-foreground">{submission.assignmentTitle}</td>
                  <td className="py-4 px-6 text-muted-foreground">{submission.classCode}</td>
                  <td className="py-4 px-6 text-muted-foreground">
                    {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true, locale: vi })}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {submission.finalScore != null ? (
                      <span className="font-bold text-emerald-400">{submission.finalScore}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(submission.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {submissions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2 text-foreground">Không có bài nộp nào</h3>
            <p>Các bài nộp sẽ xuất hiện ở đây khi học sinh nộp bài</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={submissionsData?.totalCount || 0}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
