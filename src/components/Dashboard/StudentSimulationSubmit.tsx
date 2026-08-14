import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Upload, AlertCircle, CheckCircle, XCircle, Loader2, BookOpen } from 'lucide-react';
import { studentApi } from '@/services/teacherStudentApi';

interface AssignmentDetail {
  id: number;
  title: string;
  maxScore: number;
  simulationDetail?: {
    baseDiagram?: any;
    environmentSource?: string;
    starterCode?: string;
    autoGradingEnabled?: boolean;
  };
}

interface StudentSimulationSubmitProps {
  assignment: AssignmentDetail;
  baseDiagram?: any;
  starterCode?: string;
  isResubmit?: boolean;
  previousAttempt?: number;
  onSuccess?: () => void;
}

export function StudentSimulationSubmit({
  assignment,
  baseDiagram,
  starterCode,
  isResubmit = false,
  previousAttempt = 0,
  onSuccess
}: StudentSimulationSubmitProps) {
  const [circuit, setCircuit] = useState<any>(baseDiagram || null);
  const [code, setCode] = useState(starterCode || '');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    submissionId: number;
    attemptNumber: number;
    score: number;
    maxScore: number;
    isCorrect: boolean;
    validationMessage: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!circuit && !code.trim()) {
      setError('Vui lòng vẽ mạch hoặc nhập code trước khi nộp bài.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await studentApi.submitSimulationAssignment(assignment.id, {
        circuit,
        code: code.trim() || undefined,
        description: description.trim() || undefined,
      });

      setSubmissionResult({
        submissionId: response.submissionId,
        attemptNumber: response.attemptNumber,
        score: response.score,
        maxScore: response.maxScore,
        isCorrect: response.isCorrect,
        validationMessage: response.validationMessage,
      });
      setSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi nộp bài.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted && submissionResult) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="text-center mb-6">
          <div className={cn(
            "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center",
            submissionResult.isCorrect 
              ? "bg-green-100 dark:bg-green-900/30" 
              : "bg-yellow-100 dark:bg-yellow-900/30"
          )}>
            {submissionResult.isCorrect ? (
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {submissionResult.isCorrect ? 'Hoàn thành!' : 'Đã nộp bài!'}
          </h2>
          <p className="text-muted-foreground">
            {submissionResult.validationMessage}
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 mb-6 text-center">
          <p className="text-blue-100 mb-1">Điểm của bạn</p>
          <p className="text-4xl font-bold">
            {submissionResult.score.toFixed(1)} / {submissionResult.maxScore}
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">Lần nộp #{submissionResult.attemptNumber}</p>
          <p className="text-sm text-muted-foreground">ID: {submissionResult.submissionId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Làm bài mô phỏng
        {isResubmit && (
          <span className="text-sm font-normal text-amber-600">(Nộp lại lần #{previousAttempt + 1})</span>
        )}
      </h3>

      {/* Simulation Environment */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Môi trường mô phỏng</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Vui lòng vẽ mạch điện trong ô bên dưới và nhấn "Nộp bài" khi hoàn thành.
              {assignment.simulationDetail?.autoGradingEnabled && (
                <span className="block mt-1 text-blue-600 dark:text-blue-400">
                  Bài này có chấm điểm tự động.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Circuit Preview / Editor */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Mạch điện</label>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center min-h-[300px] bg-gray-50 dark:bg-gray-800/50">
          {circuit ? (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium text-green-700 dark:text-green-400">Đã có mạch điện</p>
              <p className="text-sm text-muted-foreground mt-1">Mạch điện đã được tải lên</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Mạch điện sẽ được vẽ trong môi trường mô phỏng
              </p>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Nhấn "Nộp bài" để gửi mạch điện của bạn
        </p>
      </div>

      {/* Code Input (if applicable) */}
      {starterCode && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Code mẫu</label>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Nhập code của bạn tại đây..."
            rows={8}
            className="font-mono text-sm"
          />
        </div>
      )}

      {/* Description */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Mô tả
          <span className="text-muted-foreground font-normal ml-1">(Tùy chọn)</span>
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Nhập mô tả về bài làm của bạn..."
          rows={3}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang nộp...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Nộp bài
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
