import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RubricEditor, RubricCriteria } from './RubricEditor';
import { RefreshCw } from 'lucide-react';
import type { CreateAssignmentRequest } from '@/services/dashboardApi';
import {
  AssignmentFormFields,
  createDefaultAssignmentBasics,
  toAssignmentDueDate,
  type AssignmentClassOption,
} from './AssignmentFormFields';

interface ReportAssignmentFormProps {
  classOptions?: AssignmentClassOption[];
  isClassesLoading?: boolean;
  classesError?: string | null;
  onRetryClasses?: () => void;
  isSaving?: boolean;
  error?: string | null;
  onSave?: (request: CreateAssignmentRequest) => Promise<void> | void;
  onCancel?: () => void;
}

export const ReportAssignmentForm: React.FC<ReportAssignmentFormProps> = ({
  classOptions = [],
  isClassesLoading,
  classesError,
  onRetryClasses,
  isSaving,
  error,
  onSave,
  onCancel,
}) => {
  const [basics, setBasics] = useState(createDefaultAssignmentBasics);
  const [allowFile, setAllowFile] = useState(true);
  const [allowVideo, setAllowVideo] = useState(false);
  const [allowedExtensions, setAllowedExtensions] = useState('.pdf,.doc,.docx,.ppt,.pptx,.xlsx,.zip');
  const [maxSize, setMaxSize] = useState(10); // MB
  const [rubric, setRubric] = useState<RubricCriteria[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSave = async () => {
    const classId = Number(basics.classId);
    const title = basics.title.trim();
    const instructions = basics.description.trim();
    const submissionTypes = [
      ...(allowFile ? ['file'] : []),
      ...(allowVideo ? ['video'] : []),
    ];
    const fileExtensions = allowedExtensions
      .split(',')
      .map((extension) => extension.trim())
      .filter(Boolean);

    if (!Number.isFinite(classId) || classId <= 0) {
      setLocalError('Vui lòng chọn lớp học.');
      return;
    }

    if (!title) {
      setLocalError('Vui lòng nhập tiêu đề bài tập.');
      return;
    }

    if (!instructions) {
      setLocalError('Vui lòng nhập đề bài hoặc hướng dẫn nộp báo cáo.');
      return;
    }

    if (submissionTypes.length === 0) {
      setLocalError('Vui lòng chọn ít nhất một hình thức nộp bài.');
      return;
    }

    setLocalError(null);

    await onSave?.({
      classId,
      title,
      description: instructions,
      assignmentType: 'text_report',
      dueDate: toAssignmentDueDate(basics.dueDate),
      maxScore: Number.isFinite(basics.maxScore) && basics.maxScore > 0 ? basics.maxScore : 100,
      allowResubmit: basics.allowResubmit,
      resubmitLimit:
        basics.allowResubmit && basics.resubmitLimit ? Number(basics.resubmitLimit) : null,
      status: basics.status,
      reportDetail: {
        instructions,
        allowedSubmissionTypes: submissionTypes,
        allowedFileExtensions: fileExtensions,
        maxFileSizeMb: Number.isFinite(maxSize) && maxSize > 0 ? maxSize : 50,
      },
    });
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0f4c5c]">Tạo Bài tập Báo cáo</h2>
          <p className="text-sm text-slate-500">Giáo viên chấm điểm dựa trên file nộp và tiêu chí.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isClassesLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
            Lưu bài tập
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        <AssignmentFormFields
          value={basics}
          onChange={setBasics}
          classOptions={classOptions}
          isClassesLoading={isClassesLoading}
          classesError={classesError}
          onRetryClasses={onRetryClasses}
          descriptionLabel="Đề bài / Hướng dẫn chi tiết"
          descriptionPlaceholder="Nhập yêu cầu bài tập báo cáo..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-3">Hình thức nộp bài cho phép</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={allowFile}
                  onChange={(e) => setAllowFile(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-slate-700">File tài liệu (PDF, Word, Excel...)</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={allowVideo}
                  onChange={(e) => setAllowVideo(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-slate-700">Video (.mp4, .mov...)</span>
              </label>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-3">Cấu hình tải lên</label>
            <div>
              <span className="text-xs text-slate-500 block mb-1">Dung lượng tối đa mỗi file (MB)</span>
              <input
                type="number"
                value={maxSize}
                onChange={(e) => setMaxSize(Number(e.target.value))}
                min="1"
                max="500"
                className="w-full max-w-[150px] border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
            </div>
            <div className="mt-4">
              <span className="text-xs text-slate-500 block mb-1">
                Định dạng file cho phép
              </span>
              <input
                type="text"
                value={allowedExtensions}
                onChange={(e) => setAllowedExtensions(e.target.value)}
                placeholder=".pdf,.docx,.zip"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {(localError || error) && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {localError || error}
          </p>
        )}

        <div className="pt-4 border-t border-slate-100">
          <RubricEditor initialCriteria={rubric} onChange={setRubric} />
        </div>
      </div>
    </div>
  );
};
