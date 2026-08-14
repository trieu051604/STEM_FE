import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Clock, FlaskConical, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { labsApi } from '@/services/dashboardApi';
import type { LabEntity, LabProgressResponse } from '@/services/dashboardApi';
import { LabInstructionsPanel } from '@/components/Dashboard/VirtualLab/LabInstructionsPanel';
import { WokwiEmbedFrame } from '@/components/Dashboard/VirtualLab/WokwiEmbedFrame';
import { LabCompletionButton } from '@/components/Dashboard/VirtualLab/LabCompletionButton';

const categoryMeta: Record<string, { label: string; badgeClass: string }> = {
  physics: { label: 'Vật lý', badgeClass: 'bg-blue-500/10 text-blue-300 border border-blue-500/20' },
  chemistry: { label: 'Hóa học', badgeClass: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' },
  biology: { label: 'Sinh học', badgeClass: 'bg-teal-500/10 text-teal-300 border border-teal-500/20' },
  robotics: { label: 'Robot', badgeClass: 'bg-orange-500/10 text-orange-300 border border-orange-500/20' },
};

// Nhãn hiển thị cho board thật (lab.boardType) — chỉ dùng để hiện metadata, KHÔNG dùng để
// đặt tên section CTA (section CTA phải trung lập, không gắn cứng một board cụ thể).
const boardLabels: Record<string, string> = {
  arduino_uno: 'Arduino Uno',
  esp32_devkit_v1: 'ESP32 DevKit V1',
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string; error?: string } } })
      .response;

    if (response?.status === 401 || response?.status === 403) {
      return 'Bạn không có quyền truy cập phòng lab này.';
    }

    return response?.data?.message ?? response?.data?.error ?? fallback;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
}

function getCategoryMeta(category?: string) {
  if (!category) return { label: 'Lab', badgeClass: 'bg-muted text-muted-foreground border border-border' };

  return categoryMeta[category] ?? {
    label: category,
    badgeClass: 'bg-muted text-muted-foreground border border-border',
  };
}

export const LabDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [lab, setLab] = useState<LabEntity | null>(null);
  const [progress, setProgress] = useState<LabProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [reportedIframeError, setReportedIframeError] = useState(false);

  const isStudent = user?.role === 'student';
  const canManageLabs = user?.role === 'teacher' || user?.role === 'school_admin';

  const loadLab = useCallback(async () => {
    if (!id) {
      setError('Không tìm thấy mã phòng lab.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgressError(null);

    try {
      const labResponse = await labsApi.getById(id);
      setLab(labResponse);

      if (isStudent) {
        try {
          const progressResponse = await labsApi.startProgress(id);
          setProgress(progressResponse);
        } catch (startError) {
          setProgressError(
            getErrorMessage(startError, 'Không thể ghi nhận tiến độ mở phòng lab.')
          );
        }
      } else {
        setProgress(null);
      }
    } catch (loadError) {
      setLab(null);
      setError(getErrorMessage(loadError, 'Không tải được chi tiết phòng lab.'));
    } finally {
      setIsLoading(false);
    }
  }, [id, isStudent]);

  useEffect(() => {
    void loadLab();
  }, [loadLab]);

  const handleBack = () => {
    navigate('/dashboard/virtual-lab');
  };

  const handleComplete = async () => {
    if (!lab) return;
    const completedProgress = await labsApi.completeProgress(lab.id);
    setProgress(completedProgress);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 max-w-[1200px] mx-auto">
        <div className="h-24 rounded-xl bg-card border border-border animate-pulse" />
        <div className="h-40 rounded-xl bg-card border border-border animate-pulse" />
        <div className="h-[600px] rounded-xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  if (error || !lab) {
    return (
      <div className="space-y-6 pb-12 max-w-[900px] mx-auto">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách lab
        </button>

        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 mt-0.5 shrink-0" />
            <div className="space-y-3">
              <div>
                <h1 className="text-xl font-bold text-foreground">Không mở được phòng lab</h1>
                <p className="text-sm text-destructive mt-1">
                  {error || 'Phòng lab không tồn tại hoặc đã bị gỡ.'}
                </p>
              </div>
              <Button
                onClick={() => void loadLab()}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tải lại
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const meta = getCategoryMeta(lab.category);
  const progressStarted = Boolean(progress?.startedAt || progress?.lastOpenedAt);
  const statusText = lab.status === 'draft' ? 'Bản nháp' : 'Đã xuất bản';
  const isCustomSandbox = lab.simulationMode === 'custom_sandbox';
  const boardLabel = boardLabels[lab.boardType] ?? lab.boardType;

  return (
    <div className="space-y-6 pb-12 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border sticky top-4 z-20">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Quay lại danh sách lab"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${meta.badgeClass}`}>
                {meta.label}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                {statusText}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {isCustomSandbox ? 'Lab ảo' : 'Wokwi'}
              </span>
              {progressStarted && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Đang ghi nhận tiến độ
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-foreground truncate">{lab.title}</h1>
          </div>
        </div>

        {(isStudent || lab.linkedAssignmentId) && (
          <div className="shrink-0">
            <LabCompletionButton
              linkedAssignmentId={lab.linkedAssignmentId}
              initialCompleted={Boolean(progress?.completedAt)}
              onComplete={handleComplete}
              disabled={!isStudent}
            />
          </div>
        )}
      </div>

      {progressError && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-500 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {progressError}
        </div>
      )}

      {reportedIframeError && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-300">
          Đã ghi nhận báo lỗi. Giáo viên có thể cập nhật lại link Wokwi cho lab này.
        </div>
      )}

      <LabInstructionsPanel
        instructions={
          <div className="space-y-4">
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {lab.description || 'Giáo viên chưa thêm hướng dẫn chi tiết cho phòng lab này.'}
            </p>
            {lab.linkedAssignmentTitle && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-amber-300">
                <p className="text-sm font-bold">Bài đánh giá sau lab</p>
                <p className="text-sm mt-1">{lab.linkedAssignmentTitle}</p>
              </div>
            )}
          </div>
        }
      />

      <div className="mt-6">
        {isCustomSandbox ? (
          <div className="rounded-xl border border-border bg-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <FlaskConical className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-foreground">
                  Phòng lab ảo mô phỏng
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  Thực hành và chạy mô phỏng trực tiếp trong môi trường lab ảo.
                </p>
                {boardLabel && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Board: <span className="font-medium text-foreground">{boardLabel}</span>
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={() => navigate(`/dashboard/virtual-lab/${lab.id}/sandbox`)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white border-0 shrink-0"
            >
              Mở Lab ảo
            </Button>
          </div>
        ) : (
          <WokwiEmbedFrame
            projectId={lab.wokwiProjectId}
            embedUrl={lab.wokwiEmbedUrl}
            canManage={canManageLabs}
            onUpdateLink={handleBack}
            onErrorFallback={() => setReportedIframeError(true)}
          />
        )}
      </div>
    </div>
  );
};
