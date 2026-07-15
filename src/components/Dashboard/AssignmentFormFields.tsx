import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AssignmentStatus } from '@/services/dashboardApi';

export interface AssignmentClassOption {
  id: number;
  label: string;
}

export interface AssignmentBasicsValue {
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  status: AssignmentStatus;
  allowResubmit: boolean;
  resubmitLimit: string;
}

interface AssignmentFormFieldsProps {
  value: AssignmentBasicsValue;
  onChange: (value: AssignmentBasicsValue) => void;
  classOptions: AssignmentClassOption[];
  isClassesLoading?: boolean;
  classesError?: string | null;
  onRetryClasses?: () => void;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  accentClassName?: string;
}

export function toAssignmentDueDate(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export function createDefaultAssignmentBasics(): AssignmentBasicsValue {
  return {
    classId: '',
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
    status: 'published',
    allowResubmit: false,
    resubmitLimit: '',
  };
}

export const AssignmentFormFields = ({
  value,
  onChange,
  classOptions,
  isClassesLoading,
  classesError,
  onRetryClasses,
  descriptionLabel = 'Mô tả / yêu cầu chung',
  descriptionPlaceholder = 'Nhập mô tả bài tập...',
  accentClassName = 'focus:border-blue-500 focus:ring-blue-500/20',
}: AssignmentFormFieldsProps) => {
  const update = <K extends keyof AssignmentBasicsValue>(
    key: K,
    nextValue: AssignmentBasicsValue[K]
  ) => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Lớp học</span>
          <select
            value={value.classId}
            onChange={(event) => update('classId', event.target.value)}
            disabled={isClassesLoading || classOptions.length === 0}
            className={`mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${accentClassName}`}
          >
            <option value="">
              {isClassesLoading
                ? 'Đang tải lớp học...'
                : classOptions.length
                  ? 'Chọn lớp học'
                  : 'Chưa có lớp học'}
            </option>
            {classOptions.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Tiêu đề</span>
          <input
            type="text"
            value={value.title}
            onChange={(event) => update('title', event.target.value)}
            className={`mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:ring-2 ${accentClassName}`}
            placeholder="Tên bài tập"
          />
        </label>
      </div>

      {classesError && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <p>{classesError}</p>
          {onRetryClasses && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetryClasses}
              className="mt-3 border-amber-200 bg-white text-amber-700 hover:bg-amber-100"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại danh sách lớp
            </Button>
          )}
        </div>
      )}

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">{descriptionLabel}</span>
        <textarea
          value={value.description}
          onChange={(event) => update('description', event.target.value)}
          placeholder={descriptionPlaceholder}
          className={`mt-2 w-full min-h-[110px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:bg-white focus:ring-2 ${accentClassName}`}
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Hạn nộp</span>
          <input
            type="datetime-local"
            value={value.dueDate}
            onChange={(event) => update('dueDate', event.target.value)}
            className={`mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:ring-2 ${accentClassName}`}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Điểm tối đa</span>
          <input
            type="number"
            min="1"
            value={value.maxScore}
            onChange={(event) => update('maxScore', Number(event.target.value))}
            className={`mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:ring-2 ${accentClassName}`}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Trạng thái</span>
          <select
            value={value.status}
            onChange={(event) => update('status', event.target.value as AssignmentStatus)}
            className={`mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:ring-2 ${accentClassName}`}
          >
            <option value="draft">Bản nháp</option>
            <option value="published">Xuất bản</option>
            <option value="closed">Đóng</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={value.allowResubmit}
            onChange={(event) => update('allowResubmit', event.target.checked)}
            className="w-4 h-4 rounded border-slate-300"
          />
          <span className="text-sm font-semibold text-slate-700">Cho phép nộp lại</span>
        </label>

        {value.allowResubmit && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span>Giới hạn</span>
            <input
              type="number"
              min="1"
              value={value.resubmitLimit}
              onChange={(event) => update('resubmitLimit', event.target.value)}
              className={`w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:ring-2 ${accentClassName}`}
            />
            <span>lần</span>
          </label>
        )}
      </div>
    </div>
  );
};
