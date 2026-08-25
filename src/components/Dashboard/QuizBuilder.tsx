import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/Switch';
import { DialogHeader, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, GripVertical, RefreshCw, X, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateAssignmentRequest } from '@/services/dashboardApi';
import {
  AssignmentFormFields,
  createDefaultAssignmentBasics,
  toAssignmentDueDate,
  type AssignmentBasicsValue,
  type AssignmentClassOption,
} from './AssignmentFormFields';
import {
  parseQuizExcelWorkbook,
  downloadQuizExcelTemplate,
  type QuizExcelParseResult,
} from './quizExcelImport';

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'single_choice' | 'multiple_choice' | 'fill_blank';
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string; // for fill_blank
}

interface QuizBuilderProps {
  initialBasics?: AssignmentBasicsValue;
  initialQuestions?: QuizQuestion[];
  initialTimeLimitMinutes?: number;
  initialShuffleQuestions?: boolean;
  heading?: string;
  submitLabel?: string;
  classOptions?: AssignmentClassOption[];
  isClassesLoading?: boolean;
  classesError?: string | null;
  onRetryClasses?: () => void;
  isSaving?: boolean;
  error?: string | null;
  onSave?: (request: CreateAssignmentRequest) => Promise<void> | void;
  onCancel?: () => void;
}

// Style thủ công cho <select> loại câu hỏi (inline trong header từng câu) — chưa cần đổi
// sang Radix Select vì đây chỉ là 3 lựa chọn cố định, style theo đúng token nativeFieldClassName
// dùng chung với AssignmentFormFields/CreateLabModal.
const questionTypeSelectClassName =
  'rounded-lg border border-input bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700';

export const QuizBuilder: React.FC<QuizBuilderProps> = ({
  initialBasics,
  initialQuestions = [],
  initialTimeLimitMinutes = 45,
  initialShuffleQuestions = true,
  heading = 'Soạn câu hỏi Quiz',
  submitLabel = 'Lưu Quiz',
  classOptions = [],
  isClassesLoading,
  classesError,
  onRetryClasses,
  isSaving,
  error,
  onSave,
  onCancel,
}) => {
  const [basics, setBasics] = useState(initialBasics ?? createDefaultAssignmentBasics());
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(initialTimeLimitMinutes);
  const [shuffleQuestions, setShuffleQuestions] = useState(initialShuffleQuestions);
  const [localError, setLocalError] = useState<string | null>(null);
  const [excelImportResult, setExcelImportResult] = useState<QuizExcelParseResult | null>(null);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      type: 'single_choice',
      options: [
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: true },
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false },
      ],
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: [...q.options, { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false }],
        };
      }
      return q;
    }));
  };

  const removeOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, options: q.options.filter(o => o.id !== optionId) };
      }
      return q;
    }));
  };

  const updateOption = (questionId: string, optionId: string, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: q.options.map(o => o.id === optionId ? { ...o, text } : o)
        };
      }
      return q;
    }));
  };

  const setCorrectOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        if (q.type === 'single_choice') {
          return {
            ...q,
            options: q.options.map(o => ({ ...o, isCorrect: o.id === optionId }))
          };
        } else {
          return {
            ...q,
            options: q.options.map(o => o.id === optionId ? { ...o, isCorrect: !o.isCorrect } : o)
          };
        }
      }
      return q;
    }));
  };

  const validateQuestions = () => {
    if (questions.length === 0) {
      return 'Vui lòng thêm ít nhất một câu hỏi.';
    }

    for (const [index, question] of questions.entries()) {
      if (!question.text.trim()) {
        return `Vui lòng nhập nội dung câu ${index + 1}.`;
      }

      if (question.type === 'fill_blank') {
        if (!question.correctAnswer?.trim()) {
          return `Vui lòng nhập đáp án đúng cho câu ${index + 1}.`;
        }
        continue;
      }

      const filledOptions = question.options.filter((option) => option.text.trim());
      if (filledOptions.length < 2) {
        return `Câu ${index + 1} cần ít nhất 2 lựa chọn.`;
      }

      if (!question.options.some((option) => option.isCorrect && option.text.trim())) {
        return `Vui lòng chọn đáp án đúng cho câu ${index + 1}.`;
      }
    }

    return null;
  };

  const handleExcelFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setExcelFileName(file.name);
    setExcelImportResult(null);

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const data = loadEvent.target?.result as ArrayBuffer;
      setExcelImportResult(parseQuizExcelWorkbook(data));
    };
    reader.onerror = () => {
      setExcelImportResult({
        questions: [],
        rowStatuses: [],
        errors: [{ row: 0, field: 'File', message: 'Không thể đọc file.' }],
        hasFatalError: true,
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const closeExcelImport = () => {
    setExcelImportResult(null);
    setExcelFileName(null);
  };

  // Atomic import: any row error blocks the whole batch (Phase 9 default when no
  // explicit partial-import requirement exists) — imported questions are appended,
  // never overwrite existing manually-entered ones.
  const confirmExcelImport = () => {
    if (!excelImportResult || excelImportResult.errors.length > 0) return;
    setQuestions([...questions, ...excelImportResult.questions]);
    closeExcelImport();
  };

  const handleSave = async () => {
    const classId = Number(basics.classId);
    const title = basics.title.trim();

    if (!Number.isFinite(classId) || classId <= 0) {
      setLocalError('Vui lòng chọn lớp học.');
      return;
    }

    if (!title) {
      setLocalError('Vui lòng nhập tiêu đề bài tập.');
      return;
    }

    const questionError = validateQuestions();
    if (questionError) {
      setLocalError(questionError);
      return;
    }

    setLocalError(null);

    await onSave?.({
      classId,
      title,
      description: basics.description.trim(),
      assignmentType: 'quiz',
      dueDate: toAssignmentDueDate(basics.dueDate),
      maxScore: Number.isFinite(basics.maxScore) && basics.maxScore > 0 ? basics.maxScore : 100,
      allowResubmit: basics.allowResubmit,
      resubmitLimit:
        basics.allowResubmit && basics.resubmitLimit ? Number(basics.resubmitLimit) : null,
      status: basics.status,
      quizDetail: {
        questions,
        timeLimitSeconds:
          Number.isFinite(timeLimitMinutes) && timeLimitMinutes > 0
            ? timeLimitMinutes * 60
            : null,
        shuffleQuestions,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <DialogTitle>{heading}</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Tạo danh sách các câu hỏi trắc nghiệm hoặc điền khuyết.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <DialogContent className="flex-1 max-h-none space-y-6">
          <AssignmentFormFields
            value={basics}
            onChange={setBasics}
            classOptions={classOptions}
            isClassesLoading={isClassesLoading}
            classesError={classesError}
            onRetryClasses={onRetryClasses}
            descriptionLabel="Mô tả / hướng dẫn Quiz"
            descriptionPlaceholder="Nhập hướng dẫn làm bài, phạm vi kiến thức hoặc ghi chú..."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4">
            <label className="block">
              <span className="text-sm font-medium text-foreground">Thời gian làm bài (phút)</span>
              <Input
                type="number"
                min="1"
                value={timeLimitMinutes}
                onChange={(event) => setTimeLimitMinutes(Number(event.target.value))}
                className="mt-2"
              />
            </label>

            <label className="flex items-center gap-3 self-end rounded-lg bg-card px-4 py-3 border border-border">
              <Switch checked={shuffleQuestions} onCheckedChange={setShuffleQuestions} />
              <span className="text-sm font-medium text-foreground">Xáo trộn câu hỏi</span>
            </label>
          </div>

          {(localError || error) && (
            <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {localError || error}
            </p>
          )}

          <div className="space-y-6">
            {questions.map((q, index) => (
              <div key={q.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                    <span className="font-medium text-foreground">Câu {index + 1}</span>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(q.id, { type: e.target.value as any })}
                      className={questionTypeSelectClassName}
                    >
                      <option value="single_choice">Chọn 1 đáp án</option>
                      <option value="multiple_choice">Chọn nhiều đáp án</option>
                      <option value="fill_blank">Điền khuyết</option>
                    </select>
                  </div>
                  <button onClick={() => removeQuestion(q.id)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5">
                  <Textarea
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                    placeholder="Nhập nội dung câu hỏi..."
                    className="min-h-[80px] mb-4"
                  />

                  {q.type !== 'fill_blank' ? (
                    <div className="space-y-3">
                      {q.options.map((option, optIdx) => (
                        <div key={option.id} className="flex items-center gap-3">
                          <input
                            type={q.type === 'single_choice' ? 'radio' : 'checkbox'}
                            checked={option.isCorrect}
                            onChange={() => setCorrectOption(q.id, option.id)}
                            name={`correct-${q.id}`}
                            className="w-4 h-4 accent-[#6366f1] shrink-0"
                          />
                          <Input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(q.id, option.id, e.target.value)}
                            placeholder={`Lựa chọn ${optIdx + 1}`}
                            className={cn(
                              'flex-1',
                              option.isCorrect && 'border-indigo-500/40 bg-indigo-500/5'
                            )}
                          />
                          <button onClick={() => removeOption(q.id, option.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => addOption(q.id)} className="mt-2 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-300">
                        <Plus className="w-4 h-4 mr-1" /> Thêm lựa chọn
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Đáp án đúng (phân cách bằng dấu phẩy nếu nhiều đáp án):</label>
                      <Input
                        type="text"
                        value={q.correctAnswer || ''}
                        onChange={(e) => updateQuestion(q.id, { correctAnswer: e.target.value })}
                        placeholder="VD: Arduino, Raspberry Pi"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addQuestion}
            className="w-full border-dashed border-2 py-8 text-muted-foreground hover:text-indigo-400 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all"
          >
            <Plus className="w-5 h-5 mr-2" /> Thêm câu hỏi mới
          </Button>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <span className="text-sm font-medium text-foreground mr-auto">
              Nhập câu hỏi hàng loạt từ Excel
            </span>
            <Button type="button" variant="outline" size="sm" onClick={downloadQuizExcelTemplate}>
              <Download className="w-4 h-4" /> Tải file mẫu
            </Button>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent text-sm cursor-pointer text-foreground">
              <FileSpreadsheet className="w-4 h-4" />
              Import Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelFileChange}
                className="hidden"
              />
            </label>
          </div>

          {excelImportResult && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{excelFileName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {excelImportResult.hasFatalError
                      ? 'Không đọc được file'
                      : `${excelImportResult.rowStatuses.length} dòng — ${excelImportResult.errors.length === 0 ? 'tất cả hợp lệ' : `${excelImportResult.errors.length} lỗi`}`}
                  </p>
                </div>
                <button type="button" onClick={closeExcelImport} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Đóng preview">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!excelImportResult.hasFatalError && excelImportResult.rowStatuses.length > 0 && (
                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 sticky top-0">
                      <tr>
                        <th className="p-2 text-left text-xs font-medium text-muted-foreground w-16">Dòng</th>
                        <th className="p-2 text-left text-xs font-medium text-muted-foreground">Câu hỏi</th>
                        <th className="p-2 text-left text-xs font-medium text-muted-foreground w-20">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelImportResult.rowStatuses.map((status) => (
                        <tr key={status.row} className="border-t border-border">
                          <td className="p-2 text-muted-foreground">{status.row}</td>
                          <td className="p-2 text-foreground">
                            {status.question ? (
                              status.question.text
                            ) : (
                              <span className="text-destructive">
                                {status.errors.map((e) => `${e.field}: ${e.message}`).join('; ')}
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            {status.errors.length === 0 ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-destructive" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {excelImportResult.hasFatalError && (
                <div className="p-4 text-sm text-destructive">
                  {excelImportResult.errors.map((e, idx) => <p key={idx}>{e.message}</p>)}
                </div>
              )}

              {!excelImportResult.hasFatalError && (
                <div className="p-4 border-t border-border flex justify-end gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={closeExcelImport}>
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={confirmExcelImport}
                    disabled={excelImportResult.errors.length > 0}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white border-0"
                  >
                    Import {excelImportResult.questions.length} câu hỏi
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isClassesLoading}
            className="bg-indigo-500 hover:bg-indigo-600 text-white border-0"
          >
            {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </div>
    </div>
  );
};
