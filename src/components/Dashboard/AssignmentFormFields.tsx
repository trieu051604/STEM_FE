import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/Switch';
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
}

// Native <select> chưa có primitive Radix tương đương đơn giản để đổi hoàn toàn mà không
// đổi hành vi; style thủ công theo đúng token của Input để đồng bộ hình ảnh.
const nativeFieldClassName =
  'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30 dark:border-input';

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
          <span className="text-sm font-medium text-foreground">Lớp học</span>
          <select
            value={value.classId}
            onChange={(event) => update('classId', event.target.value)}
            disabled={isClassesLoading || classOptions.length === 0}
            className={`mt-2 ${nativeFieldClassName}`}
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
          <span className="text-sm font-medium text-foreground">Tiêu đề</span>
          <Input
            type="text"
            value={value.title}
            onChange={(event) => update('title', event.target.value)}
            className="mt-2"
            placeholder="Tên bài tập"
          />
        </label>
      </div>

      {classesError && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-500">
          <p>{classesError}</p>
          {onRetryClasses && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetryClasses}
              className="mt-3"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại danh sách lớp
            </Button>
          )}
        </div>
      )}

      <label className="block">
        <span className="text-sm font-medium text-foreground">{descriptionLabel}</span>
        <Textarea
          value={value.description}
          onChange={(event) => update('description', event.target.value)}
          placeholder={descriptionPlaceholder}
          className="mt-2 min-h-[110px]"
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-foreground">Hạn nộp</span>
          <Input
            type="datetime-local"
            value={value.dueDate}
            onChange={(event) => update('dueDate', event.target.value)}
            className="mt-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Điểm tối đa</span>
          <Input
            type="number"
            min="1"
            value={value.maxScore}
            onChange={(event) => update('maxScore', Number(event.target.value))}
            className="mt-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Trạng thái</span>
          <select
            value={value.status}
            onChange={(event) => update('status', event.target.value as AssignmentStatus)}
            className={`mt-2 ${nativeFieldClassName}`}
          >
            <option value="draft">Bản nháp</option>
            <option value="published">Xuất bản</option>
            <option value="closed">Đóng</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <label className="flex items-center gap-3">
          <Switch
            checked={value.allowResubmit}
            onCheckedChange={(checked) => update('allowResubmit', checked)}
          />
          <span className="text-sm font-medium text-foreground">Cho phép nộp lại</span>
        </label>

        {value.allowResubmit && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Giới hạn</span>
            <Input
              type="number"
              min="1"
              value={value.resubmitLimit}
              onChange={(event) => update('resubmitLimit', event.target.value)}
              className="w-24"
            />
            <span>lần</span>
          </label>
        )}
      </div>
    </div>
  );
};
