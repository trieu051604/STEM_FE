import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Clock, AlertCircle } from 'lucide-react';
import { QuizQuestion } from './QuizBuilder';

interface QuizPlayerProps {
  questions: QuizQuestion[];
  timeLimit?: number; // minutes
  onSubmit?: (answers: Record<string, any>) => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ questions, timeLimit, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  const currentQuestion = questions[currentQuestionIdx];
  const isLast = currentQuestionIdx === questions.length - 1;
  const isFirst = currentQuestionIdx === 0;

  const handleSelectOption = (questionId: string, optionId: string, type: string) => {
    if (type === 'single_choice') {
      setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    } else if (type === 'multiple_choice') {
      setAnswers(prev => {
        const current = prev[questionId] || [];
        if (current.includes(optionId)) {
          return { ...prev, [questionId]: current.filter((id: string) => id !== optionId) };
        } else {
          return { ...prev, [questionId]: [...current, optionId] };
        }
      });
    }
  };

  const handleFillBlank = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    onSubmit?.(answers);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Quiz chưa có câu hỏi</h3>
        <p className="text-slate-500 mt-2">Giáo viên chưa thêm câu hỏi nào cho bài tập này.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-[#0f4c5c]">Làm bài Quiz</h2>
          <p className="text-slate-500 text-sm mt-1">Hoàn thành tất cả câu hỏi trước khi nộp bài.</p>
        </div>
        {timeLimit && (
          <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-xl font-bold">
            <Clock className="w-5 h-5" />
            {timeLimit}:00
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm h-fit">
          <h3 className="font-semibold text-slate-700 mb-4">Danh sách câu hỏi</h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] && (Array.isArray(answers[q.id]) ? answers[q.id].length > 0 : String(answers[q.id]).trim() !== '');
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={cn(
                    "w-10 h-10 rounded-xl font-semibold text-sm transition-all flex items-center justify-center border",
                    currentQuestionIdx === idx
                      ? "bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100"
                      : isAnswered
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-3 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Câu {currentQuestionIdx + 1} / {questions.length}
            </span>
            <h3 className="text-xl font-medium text-slate-800 mt-4 leading-relaxed">
              {currentQuestion.text}
            </h3>
          </div>

          <div className="space-y-3 mb-8">
            {currentQuestion.type !== 'fill_blank' ? (
              currentQuestion.options.map(option => {
                const isSelected = currentQuestion.type === 'single_choice'
                  ? answers[currentQuestion.id] === option.id
                  : (answers[currentQuestion.id] || []).includes(option.id);

                return (
                  <div
                    key={option.id}
                    onClick={() => handleSelectOption(currentQuestion.id, option.id, currentQuestion.type)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center border-2 transition-colors",
                      currentQuestion.type === 'single_choice' ? "rounded-full w-5 h-5" : "rounded w-5 h-5",
                      isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                    )}>
                      {isSelected && <div className={cn("bg-white", currentQuestion.type === 'single_choice' ? "w-2 h-2 rounded-full" : "w-2 h-2")} />}
                    </div>
                    <span className={cn("text-base font-medium", isSelected ? "text-blue-900" : "text-slate-700")}>
                      {option.text}
                    </span>
                  </div>
                );
              })
            ) : (
              <div>
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleFillBlank(currentQuestion.id, e.target.value)}
                  placeholder="Nhập câu trả lời của bạn..."
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all text-base font-medium text-slate-700"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              disabled={isFirst}
              onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
              className="px-6 rounded-xl"
            >
              Câu trước
            </Button>
            
            {!isLast ? (
              <Button
                type="button"
                onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                className="bg-blue-600 hover:bg-blue-700 px-6 rounded-xl"
              >
                Câu tiếp theo
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 px-8 rounded-xl font-bold"
              >
                Nộp bài
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
