import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, Download, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { gradingApi, assignmentsApi } from '@/services/dashboardApi';
import { ReviewQuizSubmission, ReviewQuizFromResults } from '@/components/Dashboard/ReviewSubmission';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function TeacherGradeSubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const submissionId = parseInt(id || '0');
  const queryClient = useQueryClient();

  const { data: submission, isLoading, isError } = useQuery({
    queryKey: ['submission-detail', submissionId],
    queryFn: () => gradingApi.getSubmissionDetail(submissionId),
    enabled: !!submissionId,
  });

  // Query để lấy assignment với quiz questions
  const { data: assignmentWithQuiz } = useQuery({
    queryKey: ['assignment-with-quiz', submission?.assignmentId],
    queryFn: () => assignmentsApi.getById(submission!.assignmentId),
    enabled: !!submission?.assignmentId && submission.assignmentType === 'quiz',
  });

  const gradeMutation = useMutation({
    mutationFn: ({ score, feedback }: { score: number; feedback?: string }) =>
      gradingApi.gradeSubmission(submissionId, { score, feedback }),
    onSuccess: () => {
      // Refetch để lấy data mới từ server
      queryClient.invalidateQueries({ queryKey: ['submission-detail', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-grading-submissions'] });
    },
    onSettled: () => {
      // Reset state để hiển thị thành công
    },
    onError: (error) => {
      console.error('Lỗi chấm điểm:', error);
    },
  });

  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});

  const handleRubricScoreChange = (index: number, points: number, maxPoints: number) => {
    const key = `rubric_${index}`;
    const clampedPoints = Math.min(Math.max(0, points), maxPoints);
    setRubricScores((prev) => ({ ...prev, [key]: clampedPoints }));
  };

  const getTotalRubricScore = () => {
    return Object.entries(rubricScores).reduce((sum, [key, value]) => {
      const index = parseInt(key.split('_')[1]);
      const criterion = submission?.rubricCriteria?.[index];
      return sum + (criterion ? value : 0);
    }, 0);
  };

  const handleSubmit = () => {
    const finalScore = submission?.rubricCriteria?.length ? getTotalRubricScore() : score;
    gradeMutation.mutate({
      score: finalScore,
      feedback: feedback || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !submission) {
    return (
      <div className="space-y-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <p className="text-destructive">Không thể tải thông tin bài nộp</p>
          <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const content = submission.contentJson ? JSON.parse(submission.contentJson) : {};

  const isGraded = submission.status === 'graded';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Chấm điểm bài nộp</h1>
          <p className="text-muted-foreground">{submission.assignmentTitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Info */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold mb-4">Thông tin học sinh</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Họ tên</p>
                <p className="font-medium">{submission.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{submission.studentEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lớp</p>
                <p className="font-medium">{submission.classCode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lần nộp</p>
                <p className="font-medium">#{submission.attemptNumber}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Thời gian nộp</p>
                <p className="font-medium">
                  {format(parseISO(submission.createdAt), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                </p>
              </div>
            </div>
          </div>

          {/* Report Content */}
          {submission.assignmentType === 'text_report' && content.textContent && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-semibold mb-4">Nội dung báo cáo</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-muted-foreground">{content.textContent}</p>
              </div>
            </div>
          )}

          {/* File Download */}
          {submission.fileUrl && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-semibold mb-4">File đính kèm</h2>
              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">File báo cáo</p>
                  <p className="text-sm text-muted-foreground">Nhấn để xem/tải file</p>
                </div>
                <Download className="w-5 h-5 text-primary" />
              </a>
            </div>
          )}

          {/* Quiz Review - với quizDetail từ assignment API */}
          {submission.assignmentType === 'quiz' && (assignmentWithQuiz?.quizDetail?.questions || submission.quizDetail?.questions) && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-semibold mb-4">Chi tiết bài Quiz</h2>
              <ReviewQuizSubmission
                questions={(assignmentWithQuiz?.quizDetail?.questions || submission.quizDetail?.questions) as any}
                submission={{
                  submissionId: submission.id,
                  attemptNumber: submission.attemptNumber,
                  submittedAt: submission.createdAt,
                  status: submission.status,
                  score: submission.score ?? undefined,
                  maxScore: submission.maxScore,
                  contentJson: submission.contentJson,
                  feedback: submission.feedback ?? undefined,
                  fileUrl: submission.fileUrl || undefined,
                  autoGradeResultJson: submission.autoGradeResultJson ?? undefined,
                }}
              />
            </div>
          )}
        </div>

        {/* Grading Panel */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 sticky top-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              {isGraded ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Đã chấm điểm</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <span>Chấm điểm</span>
                </>
              )}
            </h2>

            {/* Rubric Grading */}
            {submission.rubricCriteria && submission.rubricCriteria.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-medium text-muted-foreground">Tiêu chí chấm điểm</h3>
                {isGraded ? (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-muted-foreground mb-1">Tổng điểm đã chấm</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {submission.score} / {submission.maxScore}
                    </p>
                  </div>
                ) : (
                  <>
                    {submission.rubricCriteria.map((criterion, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium">{criterion.name}</p>
                          <span className="text-xs text-muted-foreground">
                            Tối đa: {criterion.maxPoints}
                          </span>
                        </div>
                        {criterion.description && (
                          <p className="text-xs text-muted-foreground mb-2">{criterion.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={criterion.maxPoints}
                            value={rubricScores[`rubric_${index}`] ?? ''}
                            onChange={(e) =>
                              handleRubricScoreChange(index, parseInt(e.target.value) || 0, criterion.maxPoints)
                            }
                            className="w-20 text-center"
                            disabled={isGraded}
                          />
                          <span className="text-sm text-muted-foreground">/ {criterion.maxPoints}</span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Tổng điểm:</span>
                        <span className="text-lg font-bold text-primary">
                          {getTotalRubricScore()} / {submission.rubricCriteria.reduce((sum, c) => sum + c.maxPoints, 0)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Simple Score Input (if no rubric) */}
            {(!submission.rubricCriteria || submission.rubricCriteria.length === 0) && (
              <div className="space-y-4 mb-6">
                {isGraded ? (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-muted-foreground mb-1">Điểm đã chấm</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {submission.score} / {submission.maxScore}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Điểm</label>
                    <Input
                      type="number"
                      min={0}
                      max={submission.maxScore}
                      value={score}
                      onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                      disabled={isGraded}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tối đa: {submission.maxScore} điểm
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Feedback */}
            <div className="mb-6">
              <label className="text-sm text-muted-foreground block mb-2">Nhận xét</label>
              {isGraded ? (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{submission.feedback || '(Không có nhận xét)'}</p>
                </div>
              ) : (
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Nhập nhận xét cho học sinh..."
                  rows={4}
                  disabled={isGraded}
                />
              )}
            </div>

            {/* Actions */}
            {submission.status !== 'graded' && (
              <Button
                onClick={handleSubmit}
                disabled={gradeMutation.isPending}
                className="w-full gap-2"
              >
                {gradeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Lưu điểm
              </Button>
            )}

            {gradeMutation.isSuccess && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Đã lưu điểm thành công!
              </div>
            )}

            {gradeMutation.isError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Có lỗi xảy ra: {gradeMutation.error?.message || 'Không rõ lỗi'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
