import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  BookOpen,
  FileText,
  Lightbulb,
  RefreshCw,
  Trophy,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { studentApi } from '@/services/teacherStudentApi';
import { formatDistanceToNow, format, parseISO, isBefore } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { StudentQuizSubmit } from '@/components/Dashboard/StudentQuizSubmit';
import { StudentReportSubmit } from '@/components/Dashboard/StudentReportSubmit';
import { StudentSimulationSubmit } from '@/components/Dashboard/StudentSimulationSubmit';
import { ReviewQuizSubmission, ReviewReportSubmission, ReviewSimulationSubmission } from '@/components/Dashboard/ReviewSubmission';

interface QuizQuestion {
  id: string;
  text: string;
  type: 'single_choice' | 'multiple_choice' | 'fill_blank';
  options?: { id: string; text: string; isCorrect?: boolean }[];
  correctAnswer?: string;
}

interface AssignmentDetail {
  id: number;
  classId: number;
  classCode: string;
  className: string;
  courseId: number;
  courseTitle: string;
  teacherId: number;
  teacherName: string;
  title: string;
  description: string;
  assignmentType: 'quiz' | 'text_report' | 'practical_simulation';
  dueDate: string;
  maxScore: number;
  allowResubmit: boolean;
  resubmitLimit?: number;
  status: string;
  rubricId?: number | null;
  rubricCriteria?: RubricCriterion[];
  quizDetail?: {
    questions: QuizQuestion[];
    timeLimitSeconds?: number;
    shuffleQuestions?: boolean;
  };
  reportDetail?: {
    instructions?: string;
    allowedSubmissionTypes?: string[];
    allowedFileExtensions?: string[];
    maxFileSizeMb?: number;
  };
  simulationDetail?: {
    baseDiagram?: any;
    environmentSource?: string;
    starterCode?: string;
    autoGradingEnabled?: boolean;
  };
  submissionCount: number;
}

interface RubricCriterion {
  name: string;
  maxPoints: number;
  description?: string;
}

export default function StudentSubmitAssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const assignmentId = parseInt(id || '0');

  // Assignment query - standalone
  const { data: assignment, isLoading: assignmentLoading, isError: assignmentError, refetch: refetchAssignment } = useQuery({
    queryKey: ['student-assignment-detail', assignmentId],
    queryFn: async () => {
      const response = await studentApi.getAssignmentDetailWithQuiz(assignmentId);
      return response as AssignmentDetail;
    },
    enabled: !!assignmentId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Submission query - always enabled, handles its own loading state
  const { data: mySubmission, isLoading: submissionLoading, isError: submissionError, refetch: refetchSubmission } = useQuery({
    queryKey: ['my-submission', assignmentId],
    queryFn: async () => {
      return await studentApi.getMySubmission(assignmentId);
    },
    enabled: !!assignmentId,
    retry: 1,
    staleTime: 30 * 1000,
  });

  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const isViewMode = searchParams.get('view') === 'true';
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check if submission is still loading (undefined = not yet loaded)
  const isSubmissionLoading = mySubmission === undefined;
  // When submission is still loading, show as "not submitted" to allow action
  const hasSubmitted = mySubmission !== null && mySubmission !== undefined;

  // Tự động chuyển sang chế độ xem lại khi đã nộp - chỉ khi submission đã load
  useEffect(() => {
    if (hasSubmitted && !isViewMode && !isRedirecting && !isSubmissionLoading) {
      setIsRedirecting(true);
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'true');
      window.location.href = url.toString();
    }
  }, [hasSubmitted, isViewMode, isRedirecting, isSubmissionLoading]);

  // Tự động redirect khi có submission (chỉ khi submission load xong)
  useEffect(() => {
    if (mySubmission !== undefined && mySubmission !== null && !isViewMode) {
      setIsRedirecting(true);
      const timer = setTimeout(() => {
        navigate(`/dashboard/student/assignments/${assignmentId}/submit?view=true`, { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    } else if (mySubmission !== undefined) {
      setIsRedirecting(false);
    }
  }, [mySubmission, isViewMode, assignmentId, navigate]);

  // Combined error state
  const hasError = assignmentError || submissionError;
  const refetch = () => {
    refetchAssignment();
    refetchSubmission();
  };

  const formatDueDate = () => {
    if (!assignment?.dueDate) return { relative: 'Không có hạn nộp', absolute: '-', isOverdue: false };
    const date = parseISO(assignment.dueDate);
    const now = new Date();
    const isOverdue = isBefore(date, now);
    
    return {
      relative: formatDistanceToNow(date, { addSuffix: true, locale: vi }),
      absolute: format(date, 'HH:mm, dd/MM/yyyy', { locale: vi }),
      isOverdue,
    };
  };

  const getAssignmentTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <Lightbulb className="w-5 h-5" />;
      case 'text_report':
        return <FileText className="w-5 h-5" />;
      case 'practical_simulation':
        return <BookOpen className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getAssignmentTypeLabel = (type: string) => {
    switch (type) {
      case 'quiz':
        return 'Bài kiểm tra';
      case 'text_report':
        return 'Báo cáo';
      case 'practical_simulation':
        return 'Mô phỏng';
      default:
        return 'Bài tập';
    }
  };

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue && status !== 'graded') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mr-1" />
          Quá hạn
        </span>
      );
    }

    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
            Nháp
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-4 h-4 mr-1" />
            Đã đăng
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
            Đã đóng
          </span>
        );
      case 'graded':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <CheckCircle className="w-4 h-4 mr-1" />
            Đã chấm
          </span>
        );
      default:
        return null;
    }
  };

  if (assignmentLoading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải bài tập...</p>
        </div>
      </div>
    );
  }

  if (assignmentError || !assignment) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Không thể tải bài tập</h3>
              <p className="text-sm mt-1">Vui lòng thử lại sau.</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => refetchAssignment()} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </Button>
            <Button onClick={() => navigate(-1)} variant="ghost">
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const dueInfo = formatDueDate();
  const canSubmit = assignment.status === 'published' && !dueInfo.isOverdue;
  
  // Use assignment-level submission info for better UX
  const canResubmit = assignment.allowResubmit && (mySubmission ? true : false);

  // Xem lại bài đã nộp - Mặc định hiện xem lại khi đã nộp (KHÔNG hiện form làm bài)
  const showReviewMode = hasSubmitted;
  // Chỉ hiện form làm bài khi CHƯA nộp và ĐÃ load xong
  const showSubmitForm = !hasSubmitted && !isSubmissionLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className={cn(
              "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
              assignment.assignmentType === 'quiz' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
              assignment.assignmentType === 'text_report' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
              "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
            )}>
              {getAssignmentTypeIcon(assignment.assignmentType)}
              {getAssignmentTypeLabel(assignment.assignmentType)}
            </span>
            {getStatusBadge(assignment.status, dueInfo.isOverdue)}
            {showReviewMode && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                <Eye className="w-4 h-4" />
                Xem lại bài làm
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">{assignment.title}</h1>
          <p className="text-muted-foreground">
            {assignment.className} - {assignment.courseTitle}
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Due Date */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hạn nộp</p>
              <p className={cn(
                "font-semibold",
                dueInfo.isOverdue && "text-red-600 dark:text-red-400"
              )}>
                {dueInfo.relative}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground ml-11">{dueInfo.absolute}</p>
        </div>

        {/* Score */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Điểm tối đa</p>
              <p className="font-semibold">{assignment.maxScore} điểm</p>
            </div>
          </div>
        </div>

        {/* Resubmit */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nộp lại</p>
              <p className="font-semibold">
                {assignment.allowResubmit 
                  ? assignment.resubmitLimit 
                    ? `Có (${assignment.resubmitLimit} lần)` 
                    : 'Có'
                  : 'Không'
                }
              </p>
              {mySubmission && (
                <p className="text-xs text-muted-foreground">
                  {mySubmission.attemptNumber > 1 && `Đã nộp ${mySubmission.attemptNumber} lần`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Previous Submission Info */}
      {hasSubmitted && mySubmission && (
        <div className={cn(
          "bg-card rounded-xl border p-5",
          mySubmission.status === 'graded' 
            ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20" 
            : "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {mySubmission.status === 'graded' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Đã hoàn thành
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-blue-600" />
                    Đã nộp bài
                  </>
                )}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Lần nộp #{mySubmission.attemptNumber} - {format(parseISO(mySubmission.submittedAt), 'HH:mm, dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
            <div className="text-right">
              {mySubmission.score !== undefined && mySubmission.score !== null ? (
                <>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="text-2xl font-bold text-green-600">{mySubmission.score}</span>
                    <span className="text-muted-foreground">/{mySubmission.maxScore}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Điểm cao nhất</p>
                </>
              ) : (
                <span className="text-muted-foreground">Chờ chấm điểm</span>
              )}
            </div>
          </div>
          {mySubmission.feedback && (
            <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Phản hồi:</p>
              <p className="text-sm mt-1">{mySubmission.feedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions for Report */}
      {(assignment.assignmentType === 'text_report'
        ? (assignment.description || assignment.reportDetail?.instructions)
        : assignment.description) && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-3">Mô tả bài tập</h3>
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded"
            dangerouslySetInnerHTML={{
              __html: assignment.assignmentType === 'text_report'
                ? (assignment.description || assignment.reportDetail?.instructions)
                : assignment.description
            }}
          />
        </div>
      )}

      {/* Rubric Section */}
      {assignment.rubricCriteria && assignment.rubricCriteria.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Tiêu chí chấm điểm
          </h3>
          <div className="space-y-3">
            {assignment.rubricCriteria.map((criterion, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{criterion.name}</p>
                    <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {criterion.maxPoints} điểm
                    </span>
                  </div>
                  {criterion.description && (
                    <p className="text-sm text-muted-foreground mt-1">{criterion.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tổng điểm tối đa</span>
            <span className="text-lg font-bold text-primary">
              {assignment.rubricCriteria.reduce((sum, c) => sum + c.maxPoints, 0)} điểm
            </span>
          </div>
        </div>
      )}

      {/* Xem lại bài đã nộp - Quiz */}
      {showReviewMode && assignment.assignmentType === 'quiz' && mySubmission?.contentJson && (
        <div className="bg-card rounded-xl border border-indigo-200 dark:border-indigo-800 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Xem lại bài làm Quiz
          </h3>
          <ReviewQuizSubmission 
            questions={assignment.quizDetail?.questions || []} 
            submission={mySubmission}
          />
        </div>
      )}

      {/* Xem lại bài đã nộp - Báo cáo */}
      {showReviewMode && assignment.assignmentType === 'text_report' && mySubmission && (
        <div className="bg-card rounded-xl border border-indigo-200 dark:border-indigo-800 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Xem lại bài báo cáo
          </h3>
          <ReviewReportSubmission
            submission={mySubmission}
            rubricCriteria={assignment.rubricCriteria}
          />
        </div>
      )}

      {/* Xem lại bài đã nộp - Mô phỏng */}
      {showReviewMode && assignment.assignmentType === 'practical_simulation' && mySubmission && (
        <div className="bg-card rounded-xl border border-indigo-200 dark:border-indigo-800 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            🧪 Xem lại bài mô phỏng
          </h3>
          <ReviewSimulationSubmission submission={mySubmission} />
        </div>
      )}

      {/* Submit Component - Chỉ hiện khi chưa nộp */}
      {showSubmitForm && !canSubmit && !hasSubmitted && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h3 className="font-semibold text-amber-800 dark:text-amber-200">
            Không thể nộp bài
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            {assignment.status !== 'published' 
              ? 'Bài tập chưa được đăng tải.'
              : 'Đã quá hạn nộp bài.'
            }
          </p>
        </div>
      )}

      {showSubmitForm && canSubmit && !hasSubmitted && (
        <>
          {assignment.assignmentType === 'quiz' && assignment.quizDetail && (
            <StudentQuizSubmit 
              assignment={assignment} 
              questions={assignment.quizDetail.questions}
              onSuccess={() => {
                refetchSubmission();
                queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
              }}
            />
          )}

          {assignment.assignmentType === 'text_report' && (
            <StudentReportSubmit 
              assignment={assignment}
              instructions={assignment.reportDetail?.instructions}
              onSuccess={() => {
                refetchSubmission();
                queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
              }}
            />
          )}

          {assignment.assignmentType === 'practical_simulation' && (
            <StudentSimulationSubmit 
              assignment={assignment}
              baseDiagram={assignment.simulationDetail?.baseDiagram}
              starterCode={assignment.simulationDetail?.starterCode}
              onSuccess={() => {
                refetchSubmission();
                queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
              }}
            />
          )}
        </>
      )}

      {/* Nút nộp lại - Chỉ hiện khi xem lại và được phép nộp lại */}
      {showReviewMode && canResubmit && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">Nộp lại bài</h3>
          
          {assignment.assignmentType === 'quiz' && assignment.quizDetail && (
            <StudentQuizSubmit 
              assignment={assignment} 
              questions={assignment.quizDetail.questions}
              isResubmit
              previousAttempt={mySubmission.attemptNumber}
              onSuccess={() => {
                refetchSubmission();
                queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
              }}
            />
          )}

          {assignment.assignmentType === 'text_report' && (
            <StudentReportSubmit 
              assignment={assignment}
              instructions={assignment.reportDetail?.instructions}
              isResubmit
              previousAttempt={mySubmission.attemptNumber}
              onSuccess={() => {
                refetchSubmission();
                queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
              }}
            />
          )}

          {assignment.assignmentType === 'practical_simulation' && (
            <StudentSimulationSubmit 
              assignment={assignment}
              baseDiagram={assignment.simulationDetail?.baseDiagram}
              starterCode={assignment.simulationDetail?.starterCode}
              isResubmit
              previousAttempt={mySubmission.attemptNumber}
              onSuccess={() => {
                refetchSubmission();
                queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
