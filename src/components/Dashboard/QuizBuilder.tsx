import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateAssignmentRequest } from '@/services/dashboardApi';
import {
  AssignmentFormFields,
  createDefaultAssignmentBasics,
  toAssignmentDueDate,
  type AssignmentClassOption,
} from './AssignmentFormFields';

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'single_choice' | 'multiple_choice' | 'fill_blank';
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string; // for fill_blank
}

interface QuizBuilderProps {
  initialQuestions?: QuizQuestion[];
  classOptions?: AssignmentClassOption[];
  isClassesLoading?: boolean;
  classesError?: string | null;
  onRetryClasses?: () => void;
  isSaving?: boolean;
  error?: string | null;
  onSave?: (request: CreateAssignmentRequest) => Promise<void> | void;
  onCancel?: () => void;
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({
  initialQuestions = [],
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
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(45);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

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
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0f4c5c]">Soạn câu hỏi Quiz</h2>
          <p className="text-sm text-slate-500">Tạo danh sách các câu hỏi trắc nghiệm hoặc điền khuyết.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isClassesLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
            Lưu Quiz
          </Button>
        </div>
      </div>

      <AssignmentFormFields
        value={basics}
        onChange={setBasics}
        classOptions={classOptions}
        isClassesLoading={isClassesLoading}
        classesError={classesError}
        onRetryClasses={onRetryClasses}
        descriptionLabel="Mô tả / hướng dẫn Quiz"
        descriptionPlaceholder="Nhập hướng dẫn làm bài, phạm vi kiến thức hoặc ghi chú..."
        accentClassName="focus:border-blue-500 focus:ring-blue-500/20"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Thời gian làm bài (phút)</span>
          <input
            type="number"
            min="1"
            value={timeLimitMinutes}
            onChange={(event) => setTimeLimitMinutes(Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>

        <label className="flex items-center gap-3 self-end rounded-xl bg-white px-4 py-3 border border-blue-100">
          <input
            type="checkbox"
            checked={shuffleQuestions}
            onChange={(event) => setShuffleQuestions(event.target.checked)}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-semibold text-slate-700">Xáo trộn câu hỏi</span>
        </label>
      </div>

      {(localError || error) && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {localError || error}
        </p>
      )}

      <div className="space-y-6">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <GripVertical className="w-5 h-5 text-slate-400 cursor-grab" />
                <span className="font-semibold text-slate-700">Câu {index + 1}</span>
                <select
                  value={q.type}
                  onChange={(e) => updateQuestion(q.id, { type: e.target.value as any })}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="single_choice">Chọn 1 đáp án</option>
                  <option value="multiple_choice">Chọn nhiều đáp án</option>
                  <option value="fill_blank">Điền khuyết</option>
                </select>
              </div>
              <button onClick={() => removeQuestion(q.id)} className="text-slate-400 hover:text-red-500 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <textarea
                value={q.text}
                onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                placeholder="Nhập nội dung câu hỏi..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm min-h-[80px] mb-4 outline-none focus:border-blue-500 focus:bg-white transition-all"
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
                        className="w-4 h-4 text-blue-600 border-slate-300"
                      />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOption(q.id, option.id, e.target.value)}
                        placeholder={`Lựa chọn ${optIdx + 1}`}
                        className={cn(
                          "flex-1 border rounded-lg px-3 py-2 text-sm outline-none transition-all",
                          option.isCorrect ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200 focus:border-slate-300"
                        )}
                      />
                      <button onClick={() => removeOption(q.id, option.id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => addOption(q.id)} className="mt-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                    <Plus className="w-4 h-4 mr-1" /> Thêm lựa chọn
                  </Button>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Đáp án đúng (phân cách bằng dấu phẩy nếu nhiều đáp án):</label>
                  <input
                    type="text"
                    value={q.correctAnswer || ''}
                    onChange={(e) => updateQuestion(q.id, { correctAnswer: e.target.value })}
                    placeholder="VD: Arduino, Raspberry Pi"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
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
        className="w-full border-dashed border-2 py-8 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all rounded-2xl"
      >
        <Plus className="w-5 h-5 mr-2" /> Thêm câu hỏi mới
      </Button>
    </div>
  );
};
