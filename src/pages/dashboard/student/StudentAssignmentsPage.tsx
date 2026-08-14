import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Loader2, 
  Upload,
  FileText,
  BookOpen,
  RefreshCw,
  Filter,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { studentApi, StudentAssignment } from '@/services/teacherStudentApi';
import { formatDistanceToNow, format, isAfter, isBefore, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

type FilterStatus = 'all' | 'pending' | 'submitted' | 'graded' | 'overdue';

export default function StudentAssignmentsPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch assignments from API
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['student-assignments', currentPage, searchTerm, filterStatus],
    queryFn: async () => {
      const response = await studentApi.getAssignments({
        pageNumber: currentPage,
        pageSize: ITEMS_PER_PAGE,
        status: filterStatus !== 'all' ? filterStatus : undefined,
      });
      return response;
    },
    placeholderData: (previousData) => previousData,
  });

  const assignments = data?.items || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Determine actual status based on due date and submission
  const getAssignmentWithOverdueStatus = (assignment: StudentAssignment): StudentAssignment => {
    if (assignment.status === 'pending' || assignment.status === 'submitted') {
      const dueDate = parseISO(assignment.dueDate);
      const now = new Date();
      if (isBefore(dueDate, now)) {
        return { ...assignment, status: 'overdue' as const };
      }
    }
    return assignment;
  };

  // Get status badge with improved logic
  const getStatusBadge = (assignment: StudentAssignment) => {
    // If has highest score (from backend), show graded
    if (assignment.highestScore !== undefined && assignment.highestScore !== null) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Đã chấm
        </span>
      );
    }
    
    // If submitted but no score yet
    if (assignment.hasSubmitted) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Đã nộp
        </span>
      );
    }
    
    // Check overdue
    const dueInfo = formatDueDate(assignment.dueDate);
    if (dueInfo.isOverdue) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Quá hạn
        </span>
      );
    }
    
    // Default pending
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        Chờ nộp
      </span>
    );
  };

  // Apply status override for overdue check
  const processedAssignments = useMemo(() => {
    return assignments.map(getAssignmentWithOverdueStatus);
  }, [assignments]);

  // Client-side search filter (in case backend doesn't support search)
  const filteredAssignments = useMemo(() => {
    if (!searchTerm.trim()) return processedAssignments;
    
    const search = searchTerm.toLowerCase();
    return processedAssignments.filter(
      (a) =>
        a.title.toLowerCase().includes(search) ||
        a.className.toLowerCase().includes(search)
    );
  }, [processedAssignments, searchTerm]);

  // Filter by status (client-side for override status)
  const statusFilteredAssignments = useMemo(() => {
    if (filterStatus === 'all') return filteredAssignments;
    return filteredAssignments.filter((a) => a.status === filterStatus);
  }, [filteredAssignments, filterStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'submitted':
        return <Upload className="w-5 h-5 text-blue-600" />;
      case 'graded':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatDueDate = (dueDate: string | null | undefined) => {
    if (!dueDate) return { relative: 'Không có hạn nộp', absolute: '-', isOverdue: false };
    const date = parseISO(dueDate);
    const now = new Date();
    const isOverdue = isBefore(date, now);
    
    return {
      relative: formatDistanceToNow(date, { addSuffix: true, locale: vi }),
      absolute: format(date, 'HH:mm, dd/MM/yyyy', { locale: vi }),
      isOverdue,
    };
  };

  const getScoreDisplay = (assignment: StudentAssignment) => {
    // Show highest score if available, otherwise show the original score
    const displayScore = assignment.highestScore ?? assignment.score;
    if (displayScore !== undefined && displayScore !== null) {
      return (
        <div className="text-center">
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {displayScore}
          </span>
          <span className="text-muted-foreground">/{assignment.maxScore}</span>
          {assignment.lastAttemptNumber && assignment.lastAttemptNumber > 1 && (
            <span className="block text-xs text-muted-foreground">
              Lần {assignment.lastAttemptNumber}
            </span>
          )}
        </div>
      );
    }
    return <span className="text-muted-foreground">-/-</span>;
  };

  // Check if student can submit
  const canSubmitAssignment = (assignment: StudentAssignment): boolean => {
    // Can always submit if not yet submitted
    if (!assignment.hasSubmitted) {
      return true;
    }
    // Can resubmit if allowed and under limit
    if (assignment.canResubmit) {
      return true;
    }
    return false;
  };

  // Get submit button text
  const getSubmitButtonText = (assignment: StudentAssignment): { text: string; isDetail: boolean } => {
    if (!assignment.hasSubmitted) {
      return { text: 'Nộp bài', isDetail: false };
    }
    if (assignment.canResubmit) {
      return { text: 'Nộp lại', isDetail: false };
    }
    return { text: 'Chi tiết', isDetail: true };
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'all';

  const getErrorMessage = () => {
    if (!error) return 'Đã xảy ra lỗi không xác định.';
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
    return 'Không thể tải danh sách bài tập.';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bài tập</h1>
          <p className="text-muted-foreground">Theo dõi và nộp bài tập của bạn</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bài tập..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filter buttons - Desktop */}
          <div className="hidden sm:flex gap-2">
            <FilterStatusButton 
              status="all" 
              currentStatus={filterStatus} 
              onClick={handleFilterChange}
              count={totalCount}
            />
            <FilterStatusButton 
              status="pending" 
              currentStatus={filterStatus} 
              onClick={handleFilterChange}
            />
            <FilterStatusButton 
              status="submitted" 
              currentStatus={filterStatus} 
              onClick={handleFilterChange}
            />
            <FilterStatusButton 
              status="graded" 
              currentStatus={filterStatus} 
              onClick={handleFilterChange}
            />
            <FilterStatusButton 
              status="overdue" 
              currentStatus={filterStatus} 
              onClick={handleFilterChange}
            />
          </div>

          {/* Mobile filter button */}
          <Button
            variant="outline"
            size="icon"
            className="sm:hidden"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile filters dropdown */}
        {showMobileFilters && (
          <div className="sm:hidden mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              <FilterStatusButton 
                status="all" 
                currentStatus={filterStatus} 
                onClick={(s) => { handleFilterChange(s); setShowMobileFilters(false); }}
                count={totalCount}
              />
              <FilterStatusButton 
                status="pending" 
                currentStatus={filterStatus} 
                onClick={(s) => { handleFilterChange(s); setShowMobileFilters(false); }}
              />
              <FilterStatusButton 
                status="submitted" 
                currentStatus={filterStatus} 
                onClick={(s) => { handleFilterChange(s); setShowMobileFilters(false); }}
              />
              <FilterStatusButton 
                status="graded" 
                currentStatus={filterStatus} 
                onClick={(s) => { handleFilterChange(s); setShowMobileFilters(false); }}
              />
              <FilterStatusButton 
                status="overdue" 
                currentStatus={filterStatus} 
                onClick={(s) => { handleFilterChange(s); setShowMobileFilters(false); }}
              />
            </div>
          </div>
        )}

        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Đang lọc: {statusFilteredAssignments.length} kết quả
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-auto p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
              Xóa lọc
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải danh sách bài tập...</p>
          </div>
        </div>
      )}

      {isError && (
        <div className="bg-card rounded-xl border border-red-200 dark:border-red-900 p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không thể tải bài tập</h3>
            <p className="text-muted-foreground mb-4">{getErrorMessage()}</p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && statusFilteredAssignments.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-12">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {hasActiveFilters ? 'Không có kết quả phù hợp' : 'Chưa có bài tập nào'}
            </h3>
            <p className="text-muted-foreground">
              {hasActiveFilters 
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                : 'Các bài tập sẽ xuất hiện ở đây khi được giao'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-4 gap-2">
                <X className="w-4 h-4" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>
      )}

      {!isLoading && !isError && statusFilteredAssignments.length > 0 && (
        <>
          {/* Assignments Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-4 px-4 sm:px-6 font-semibold text-sm">Bài tập</th>
                    <th className="text-left py-4 px-4 sm:px-6 font-semibold text-sm hidden md:table-cell">Lớp</th>
                    <th className="text-left py-4 px-4 sm:px-6 font-semibold text-sm">Hạn nộp</th>
                    <th className="text-center py-4 px-4 sm:px-6 font-semibold text-sm">Điểm</th>
                    <th className="text-left py-4 px-4 sm:px-6 font-semibold text-sm">Trạng thái</th>
                    <th className="text-right py-4 px-4 sm:px-6 font-semibold text-sm">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {statusFilteredAssignments.map((assignment) => {
                    const dueInfo = formatDueDate(assignment.dueDate);
                    return (
                      <tr 
                        key={assignment.id} 
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                              assignment.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/30' :
                              assignment.status === 'graded' ? 'bg-green-100 dark:bg-green-900/30' :
                              'bg-muted'
                            )}>
                              {getStatusIcon(assignment.status)}
                            </div>
                            <div>
                              <span className="font-medium line-clamp-1">{assignment.title}</span>
                              <p className="text-xs text-muted-foreground md:hidden">{assignment.className}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-muted-foreground hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            {assignment.className}
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <div className="space-y-1">
                            <div className={cn(
                              "flex items-center gap-2 text-sm",
                              dueInfo.isOverdue && assignment.status !== 'graded' ? 'text-red-600 dark:text-red-400' : ''
                            )}>
                              <Clock className="w-4 h-4" />
                              {dueInfo.relative}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {dueInfo.absolute}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          {getScoreDisplay(assignment)}
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          {getStatusBadge(assignment)}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right">
                          {(() => {
                            const canSubmit = canSubmitAssignment(assignment);
                            const { text, isDetail } = getSubmitButtonText(assignment);
                            
                            return (
                              <Link to={`/dashboard/student/assignments/${assignment.id}/submit`}>
                                <Button 
                                  size="sm" 
                                  variant={isDetail ? 'outline' : 'default'}
                                  disabled={!canSubmit}
                                  className={cn(!canSubmit && 'opacity-50 cursor-not-allowed')}
                                >
                                  {canSubmit ? (
                                    <>
                                      <Upload className="w-4 h-4" />
                                      <span className="hidden sm:inline ml-1">{text}</span>
                                    </>
                                  ) : (
                                    <span>{text}</span>
                                  )}
                                </Button>
                              </Link>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isFetching}
              >
                Trước
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10 h-10 p-0"
                      disabled={isFetching}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isFetching}
              >
                Sau
              </Button>
            </div>
          )}

          {/* Results count */}
          <div className="text-center text-sm text-muted-foreground">
            Hiển thị {statusFilteredAssignments.length} / {totalCount} bài tập
          </div>
        </>
      )}
    </div>
  );
}

// Filter status button component
function FilterStatusButton({ 
  status, 
  currentStatus, 
  onClick,
  count 
}: { 
  status: FilterStatus; 
  currentStatus: FilterStatus; 
  onClick: (status: FilterStatus) => void;
  count?: number;
}) {
  const config: Record<FilterStatus, { label: string; className?: string }> = {
    all: { label: 'Tất cả' },
    pending: { label: 'Chờ nộp', className: 'border-amber-200 dark:border-amber-800' },
    submitted: { label: 'Đã nộp', className: 'border-blue-200 dark:border-blue-800' },
    graded: { label: 'Đã chấm', className: 'border-green-200 dark:border-green-800' },
    overdue: { label: 'Quá hạn', className: 'border-red-200 dark:border-red-800' },
  };

  const isActive = currentStatus === status;
  const { label, className } = config[status];

  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      onClick={() => onClick(status)}
      className={cn(
        'transition-all',
        !isActive && className
      )}
    >
      {label}
      {status === 'all' && count !== undefined && (
        <span className="ml-1 text-xs opacity-70">({count})</span>
      )}
    </Button>
  );
}
