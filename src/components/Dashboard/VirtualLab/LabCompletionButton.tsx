import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LabCompletionButtonProps {
  linkedAssignmentId?: number | null;
  initialCompleted?: boolean;
  onComplete?: () => Promise<void> | void;
  disabled?: boolean;
}

export const LabCompletionButton = ({
  linkedAssignmentId,
  initialCompleted = false,
  onComplete,
  disabled,
}: LabCompletionButtonProps) => {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleMarkComplete = async () => {
    if (!onComplete) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onComplete();
      setIsCompleted(true);
    } catch {
      setError('Không lưu được trạng thái hoàn thành.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToAssignment = () => {
    navigate(`/dashboard/assignments?id=${linkedAssignmentId}`);
  };

  if (linkedAssignmentId) {
    return (
      <Button
        onClick={handleGoToAssignment}
        className="bg-[#b45309] hover:bg-[#92400e] text-white rounded-full font-bold shadow-sm"
      >
        Làm bài đánh giá
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    );
  }

  if (isCompleted) {
    return (
      <Button
        disabled
        className="bg-green-100 text-green-700 border-green-200 opacity-100 rounded-full font-bold shadow-sm"
      >
        <CheckCircle2 className="w-5 h-5 mr-2" />
        Đã hoàn thành ✓
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleMarkComplete}
        disabled={disabled || isSubmitting}
        className="bg-[#0f4c5c] hover:bg-[#0a3540] text-white rounded-full font-bold shadow-sm"
      >
        {isSubmitting ? (
          <span className="flex items-center">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Đang lưu...
          </span>
        ) : (
          'Đánh dấu hoàn thành'
        )}
      </Button>
      {error && <p className="text-xs font-semibold text-red-500 text-right">{error}</p>}
    </div>
  );
};
