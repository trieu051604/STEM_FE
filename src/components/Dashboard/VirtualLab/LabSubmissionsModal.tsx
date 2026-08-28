import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { labSubmissionsApi } from '@/services/dashboardApi';
import type { LabEntity, LabSubmissionListResult } from '@/services/dashboardApi';

interface LabSubmissionsModalProps {
  lab: LabEntity;
  onClose: () => void;
}

const statusLabels: Record<string, { text: string; className: string }> = {
  not_started: { text: 'Chưa bắt đầu', className: 'bg-muted text-muted-foreground border border-border' },
  in_progress: { text: 'Đang làm', className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  submitted: { text: 'Đã nộp', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  graded: { text: 'Đã chấm', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
};

// Teacher xem "Bài nộp" của 1 Lab thẳng từ Phòng lab ảo — không cần đi qua
// Assignment (ẩn hoàn toàn với giáo viên, xem LabSubmissionsController.cs).
export const LabSubmissionsModal = ({ lab, onClose }: LabSubmissionsModalProps) => {
  const navigate = useNavigate();
  const classes = lab.classes;
  const [selectedClassId, setSelectedClassId] = useState<number | null>(classes[0]?.id ?? null);
  const [result, setResult] = useState<LabSubmissionListResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (classId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await labSubmissionsApi.getSubmissions(lab.id, classId);
      setResult(data);
    } catch (err) {
      setError('Không tải được danh sách bài nộp.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      void load(selectedClassId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between gap-4 p-5 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">Bài nộp — {lab.title}</h2>
            {classes.length > 1 ? (
              <select
                value={selectedClassId ?? undefined}
                onChange={(event) => setSelectedClassId(Number(event.target.value))}
                className="mt-1 text-sm bg-background border border-border rounded-md px-2 py-1"
              >
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.classCode || `Lớp #${classItem.id}`}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-muted-foreground">{classes[0]?.classCode || 'Chưa gán lớp'}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectedClassId && load(selectedClassId)}
              disabled={isLoading || !selectedClassId}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && (
            <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Đang tải danh sách bài nộp...
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!isLoading && !error && result && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="bg-muted/30 rounded-xl border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{result.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Tổng học sinh</p>
                </div>
                <div className="bg-muted/30 rounded-xl border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{result.submittedCount}</p>
                  <p className="text-xs text-muted-foreground">Đã nộp</p>
                </div>
                <div className="bg-muted/30 rounded-xl border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-amber-400">{result.notSubmittedCount}</p>
                  <p className="text-xs text-muted-foreground">Chưa nộp</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-3 px-4 font-medium text-foreground">Học sinh</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Trạng thái</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Nộp lúc</th>
                      <th className="text-center py-3 px-4 font-medium text-foreground">Điểm</th>
                      <th className="text-center py-3 px-4 font-medium text-foreground">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.students.map((student) => {
                      const status = statusLabels[student.status] ?? statusLabels.not_started;
                      return (
                        <tr key={student.studentId} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                          <td className="py-3 px-4 text-foreground">{student.studentName || `HS #${student.studentId}`}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                              {status.text}
                            </span>
                            {student.attemptNumber && student.attemptNumber > 1 && (
                              <span className="ml-2 text-xs text-muted-foreground">Lần {student.attemptNumber}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {student.submittedAt ? new Date(student.submittedAt).toLocaleString('vi-VN') : '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {student.score != null ? (
                              <span className="font-bold text-emerald-400">{student.score}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {student.submissionId ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/dashboard/teacher/submissions/${student.submissionId}/grade`)}
                                className="gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                Xem bài
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabSubmissionsModal;
