import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Clock, Cpu, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { labsApi } from '@/services/dashboardApi';
import type { LabEntity, LabProgressResponse } from '@/services/dashboardApi';
import { LabInstructionsPanel } from '@/components/Dashboard/VirtualLab/LabInstructionsPanel';
import { WokwiEmbedFrame } from '@/components/Dashboard/VirtualLab/WokwiEmbedFrame';
import { LabCompletionButton } from '@/components/Dashboard/VirtualLab/LabCompletionButton';

const categoryMeta: Record<string, { label: string; badgeClass: string }> = {
  physics: { label: 'Vật lý', badgeClass: 'bg-blue-100 text-blue-700' },
  chemistry: { label: 'Hóa học', badgeClass: 'bg-emerald-100 text-emerald-700' },
  biology: { label: 'Sinh học', badgeClass: 'bg-teal-100 text-teal-700' },
  robotics: { label: 'Robot', badgeClass: 'bg-orange-100 text-orange-700' },
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
  if (!category) return { label: 'Lab', badgeClass: 'bg-slate-100 text-slate-700' };

  return categoryMeta[category] ?? {
    label: category,
    badgeClass: 'bg-slate-100 text-slate-700',
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
        <div className="h-24 rounded-2xl bg-white border border-border shadow-sm animate-pulse" />
        <div className="h-40 rounded-2xl bg-white border border-border shadow-sm animate-pulse" />
        <div className="h-[600px] rounded-2xl bg-white border border-border shadow-sm animate-pulse" />
      </div>
    );
  }

  if (error || !lab) {
    return (
      <div className="space-y-6 pb-12 max-w-[900px] mx-auto">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0f4c5c]"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách lab
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 mt-0.5 shrink-0" />
            <div className="space-y-3">
              <div>
                <h1 className="text-xl font-bold">Không mở được phòng lab</h1>
                <p className="text-sm text-red-600 mt-1">
                  {error || 'Phòng lab không tồn tại hoặc đã bị gỡ.'}
                </p>
              </div>
              <Button
                onClick={() => void loadLab()}
                className="bg-red-600 hover:bg-red-700 text-white"
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

  return (
    <div className="space-y-6 pb-12 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-border shadow-sm sticky top-4 z-20">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${meta.badgeClass}`}
              >
                {meta.label}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {statusText}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700">
                {isCustomSandbox ? 'Sandbox nội bộ' : 'Wokwi iframe'}
              </span>
              {progressStarted && (
                <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Đang ghi nhận tiến độ
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#0f4c5c] truncate">{lab.title}</h1>
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
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {progressError}
        </div>
      )}

      {reportedIframeError && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
          Đã ghi nhận báo lỗi. Giáo viên có thể cập nhật lại link Wokwi cho lab này.
        </div>
      )}

      <LabInstructionsPanel
        instructions={
          <div className="space-y-4">
            <p className="whitespace-pre-line leading-relaxed">
              {lab.description || 'Giáo viên chưa thêm hướng dẫn chi tiết cho phòng lab này.'}
            </p>
            {lab.linkedAssignmentTitle && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-800">
                <p className="text-sm font-bold">Bài đánh giá sau lab</p>
                <p className="text-sm mt-1">{lab.linkedAssignmentTitle}</p>
              </div>
            )}
          </div>
        }
      />

      <div className="mt-6">
        {isCustomSandbox ? (
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0f4c5c]">
                  Sandbox nội bộ Arduino Uno
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  Học sinh chỉnh code, gọi API compile và chạy avr8js ngay trong trình duyệt.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate(`/dashboard/virtual-lab/${lab.id}/sandbox`)}
              className="bg-[#0f4c5c] hover:bg-[#0a3540] text-white rounded-full font-bold"
            >
              Mở Sandbox
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
