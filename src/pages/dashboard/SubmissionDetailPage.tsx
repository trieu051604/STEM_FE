import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Loader2, AlertCircle, User, Calendar, Award, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { gradingApi, parseVirtualLabSubmissionSnapshot, resubmitRequestsApi } from '@/services/dashboardApi';
import { useAuthStore } from '@/stores/authStore';
import { CircuitCanvas } from '@/components/Dashboard/VirtualLab/Sandbox/CircuitCanvas';
import { ReadOnlyCodeViewer } from '@/components/Dashboard/VirtualLab/Sandbox/ReadOnlyCodeViewer';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

type TabKey = 'code' | 'diagram' | 'simulation';

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: { message?: string; error?: string } } }).response?.data;
    return data?.message ?? data?.error ?? fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  try {
    return format(new Date(value), "HH:mm dd/MM/yyyy", { locale: vi });
  } catch {
    return value;
  }
}

const statusLabel: Record<string, string> = {
  submitted: 'Chờ chấm',
  graded: 'Đã chấm',
  draft: 'Bản nháp',
};

export default function SubmissionDetailPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const id = Number(submissionId);
  const isValidId = Number.isFinite(id) && id > 0;

  const [activeTab, setActiveTab] = useState<TabKey>('code');
  const [scoreInput, setScoreInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [reviewingRequestId, setReviewingRequestId] = useState<number | null>(null);
  const [reviewNoteInput, setReviewNoteInput] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  const {
    data: submission,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['submission-detail', id],
    queryFn: () => gradingApi.getSubmissionDetail(id),
    enabled: isValidId,
  });

  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['submission-comments', id],
    queryFn: () => gradingApi.getComments(id),
    enabled: isValidId,
  });

  const { data: resubmitRequests, isLoading: isResubmitRequestsLoading } = useQuery({
    queryKey: ['resubmit-requests', submission?.assignmentId],
    queryFn: () => resubmitRequestsApi.list({ assignmentId: submission!.assignmentId }),
    enabled: user?.role === 'teacher' && !!submission?.assignmentId,
  });

  const studentResubmitRequests = (resubmitRequests ?? []).filter(
    (item) => item.studentId === submission?.studentId
  );

  const reviewResubmitMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: number; action: 'approve' | 'reject' }) => {
      return action === 'approve'
        ? resubmitRequestsApi.approve(requestId, { note: reviewNoteInput.trim() || undefined })
        : resubmitRequestsApi.reject(requestId, reviewNoteInput.trim() || undefined);
    },
    onSuccess: () => {
      setReviewError(null);
      setReviewingRequestId(null);
      setReviewNoteInput('');
      void queryClient.invalidateQueries({ queryKey: ['resubmit-requests', submission?.assignmentId] });
    },
    onError: (mutationError: unknown) => {
      setReviewError(getErrorMessage(mutationError, 'Không xử lý được yêu cầu — vui lòng thử lại.'));
    },
  });

  useEffect(() => {
    if (submission) {
      setScoreInput(submission.score != null ? String(submission.score) : '');
      setFeedbackInput(submission.feedback ?? '');
    }
  }, [submission?.id, submission?.score, submission?.feedback]);

  const isTeacher = user?.role === 'teacher';

  const gradeMutation = useMutation({
    mutationFn: async () => {
      const score = Number(scoreInput);
      if (scoreInput.trim() === '' || !Number.isFinite(score) || score < 0 || score > 100) {
        throw new Error('Điểm phải là số trong khoảng 0-100.');
      }
      const payload = { score, feedback: feedbackInput.trim() || undefined };
      return submission?.score != null
        ? gradingApi.updateSubmissionGrade(id, payload)
        : gradingApi.gradeSubmission(id, payload);
    },
    onSuccess: () => {
      setGradeError(null);
      void queryClient.invalidateQueries({ queryKey: ['submission-detail', id] });
    },
    onError: (mutationError: unknown) => {
      setGradeError(getErrorMessage(mutationError, 'Không lưu được điểm — vui lòng thử lại.'));
    },
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => gradingApi.createComment(id, body),
    onSuccess: () => {
      setCommentInput('');
      setCommentError(null);
      void queryClient.invalidateQueries({ queryKey: ['submission-comments', id] });
    },
    onError: (mutationError: unknown) => {
      setCommentError(getErrorMessage(mutationError, 'Không gửi được bình luận — vui lòng thử lại.'));
    },
  });

  if (!isValidId) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
          Mã bài nộp không hợp lệ.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="h-40 rounded-xl bg-card border border-border animate-pulse" />
        <div className="h-96 rounded-xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  if (isError || !submission) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Button>
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <p className="text-sm text-destructive mb-4">
            {getErrorMessage(error, 'Không tải được bài nộp — bạn có thể không có quyền xem bài này.')}
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  const snapshot = parseVirtualLabSubmissionSnapshot(submission.contentJson);
  const diagramParsed = snapshot?.diagramJson ? safeParseDiagram(snapshot.diagramJson) : null;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Button>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          {statusLabel[submission.status] ?? submission.status}
        </span>
      </div>

      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Học sinh
          </p>
          <p className="font-semibold text-foreground">{submission.studentName || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Bài tập</p>
          <p className="font-semibold text-foreground">{submission.assignmentTitle || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Lớp</p>
          <p className="font-semibold text-foreground">{submission.classCode || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Lần nộp</p>
          <p className="font-semibold text-foreground">#{submission.attemptNumber}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Nộp lúc
          </p>
          <p className="font-semibold text-foreground">{formatDate(submission.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Điểm
          </p>
          <p className="font-semibold text-foreground">
            {submission.score != null ? `${submission.score}/100` : 'Chưa chấm'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Chấm bởi</p>
          <p className="font-semibold text-foreground">{submission.gradedByName || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Ngày chấm</p>
          <p className="font-semibold text-foreground">{formatDate(submission.gradedAt)}</p>
        </div>
      </div>

      {!snapshot && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-500">
          Bài nộp này không có snapshot Virtual Lab (có thể là bài nộp dạng khác, không phải Virtual Lab).
        </div>
      )}

      {snapshot && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: code/diagram/simulation tabs */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2 border-b border-border">
              {(['code', 'diagram', 'simulation'] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'code' ? 'Code' : tab === 'diagram' ? 'Sơ đồ mạch' : 'Mô phỏng'}
                </button>
              ))}
            </div>

            <div className="h-[480px]">
              {activeTab === 'code' && <ReadOnlyCodeViewer code={snapshot.sourceCode} />}

              {activeTab === 'diagram' && (
                <div className="h-full rounded-2xl overflow-hidden border border-border bg-slate-950 relative">
                  {diagramParsed ? (
                    <CircuitCanvas
                      engine={null}
                      components={diagramParsed.parts}
                      connections={diagramParsed.connections}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      Không đọc được sơ đồ mạch của bài nộp này.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'simulation' && (
                <div className="h-full rounded-2xl border border-border bg-card p-4 overflow-y-auto">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Số sự kiện mô phỏng đã ghi nhận: {snapshot.simulationSummary?.eventCount ?? 0}
                  </p>
                  {snapshot.compileResult != null && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Kết quả biên dịch lúc nộp bài</p>
                      <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(snapshot.compileResult, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Nhật ký sự kiện</p>
                    {snapshot.simulationSummary && snapshot.simulationSummary.events.length > 0 ? (
                      <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-72">
                        {JSON.stringify(snapshot.simulationSummary.events, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Không có sự kiện mô phỏng nào được lưu tại thời điểm nộp bài.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: grading + discussion */}
          <div className="space-y-6">
            {isTeacher && (
              <div className="bg-card rounded-xl border border-border p-5 space-y-3">
                <h3 className="font-semibold text-foreground">Chấm điểm</h3>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Điểm (0-100)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    placeholder="VD: 85"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nhận xét cho học sinh</label>
                  <Textarea
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    maxLength={1000}
                    rows={4}
                    placeholder="Nhận xét về bài làm..."
                  />
                </div>
                {gradeError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {gradeError}
                  </p>
                )}
                <Button
                  className="w-full"
                  disabled={gradeMutation.isPending}
                  onClick={() => gradeMutation.mutate()}
                >
                  {gradeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    submission.score != null ? 'Cập nhật điểm' : 'Lưu điểm'
                  )}
                </Button>
                {gradeMutation.isSuccess && !gradeMutation.isPending && (
                  <p className="text-xs text-emerald-500">Đã lưu.</p>
                )}
              </div>
            )}

            {isTeacher && studentResubmitRequests.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-5 space-y-3">
                <h3 className="font-semibold text-foreground">Yêu cầu nộp lại</h3>
                {isResubmitRequestsLoading ? (
                  <div className="h-12 rounded-lg bg-muted animate-pulse" />
                ) : (
                  <div className="space-y-3">
                    {studentResubmitRequests
                      .slice()
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((reqItem) => (
                        <div key={reqItem.id} className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                reqItem.status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-500'
                                  : reqItem.status === 'approved'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-destructive/10 text-destructive'
                              }`}
                            >
                              {reqItem.status === 'pending'
                                ? 'Đang chờ duyệt'
                                : reqItem.status === 'approved'
                                  ? 'Đã duyệt'
                                  : 'Đã từ chối'}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{formatDate(reqItem.createdAt)}</span>
                          </div>
                          {reqItem.reason && (
                            <p className="text-sm text-foreground whitespace-pre-wrap">{reqItem.reason}</p>
                          )}
                          {reqItem.status !== 'pending' && (
                            <p className="text-xs text-muted-foreground">
                              {reqItem.status === 'approved'
                                ? `Cấp thêm ${reqItem.grantedExtraAttempts ?? 0} lượt nộp` +
                                  (reqItem.grantedNewDueDate
                                    ? `, hạn mới: ${formatDate(reqItem.grantedNewDueDate)}`
                                    : '')
                                : reqItem.reviewNote
                                  ? `Lý do từ chối: ${reqItem.reviewNote}`
                                  : ''}
                            </p>
                          )}

                          {reqItem.status === 'pending' && (
                            reviewingRequestId === reqItem.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={reviewNoteInput}
                                  onChange={(e) => setReviewNoteInput(e.target.value)}
                                  placeholder="Ghi chú (không bắt buộc)"
                                  rows={2}
                                  className="text-xs"
                                  disabled={reviewResubmitMutation.isPending}
                                />
                                {reviewError && (
                                  <p className="text-xs text-destructive">{reviewError}</p>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="flex-1"
                                    disabled={reviewResubmitMutation.isPending}
                                    onClick={() =>
                                      reviewResubmitMutation.mutate({ requestId: reqItem.id, action: 'approve' })
                                    }
                                  >
                                    {reviewResubmitMutation.isPending ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      'Approve'
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    disabled={reviewResubmitMutation.isPending}
                                    onClick={() =>
                                      reviewResubmitMutation.mutate({ requestId: reqItem.id, action: 'reject' })
                                    }
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={reviewResubmitMutation.isPending}
                                    onClick={() => {
                                      setReviewingRequestId(null);
                                      setReviewNoteInput('');
                                      setReviewError(null);
                                    }}
                                  >
                                    Hủy
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => setReviewingRequestId(reqItem.id)}>
                                Xử lý yêu cầu
                              </Button>
                            )
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {!isTeacher && submission.score != null && (
              <div className="bg-card rounded-xl border border-border p-5 space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" /> Kết quả
                </h3>
                <p className="text-2xl font-bold text-emerald-500">{submission.score}/100</p>
                {submission.feedback && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Nhận xét của giáo viên</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{submission.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {/* Discussion */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Thảo luận
              </h3>

              {isCommentsLoading ? (
                <div className="space-y-2">
                  <div className="h-12 rounded-lg bg-muted animate-pulse" />
                  <div className="h-12 rounded-lg bg-muted animate-pulse" />
                </div>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">
                          {comment.authorName}
                          {comment.authorRole === 'teacher' && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                              Giáo viên
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{comment.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có bình luận nào.</p>
              )}

              {commentError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {commentError}
                </p>
              )}

              <div className="flex items-end gap-2">
                <Textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Nhập phản hồi..."
                  rows={2}
                  maxLength={2000}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  disabled={commentMutation.isPending || !commentInput.trim()}
                  onClick={() => commentMutation.mutate(commentInput.trim())}
                >
                  {commentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function safeParseDiagram(diagramJson: string): { parts: any[]; connections: any[] } | null {
  try {
    const parsed = JSON.parse(diagramJson);
    return {
      parts: Array.isArray(parsed?.parts) ? parsed.parts : [],
      connections: Array.isArray(parsed?.connections) ? parsed.connections : [],
    };
  } catch {
    return null;
  }
}
