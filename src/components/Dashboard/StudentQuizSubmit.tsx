import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Clock, AlertCircle, CheckCircle, XCircle, Loader2, Send } from 'lucide-react';
import { studentApi } from '@/services/teacherStudentApi';

interface QuizQuestion {
  id: string;
  text: string;
  type: 'single_choice' | 'multiple_choice' | 'fill_blank';
  options?: { id: string; text: string; isCorrect?: boolean }[];
  correctAnswer?: string;
}

interface AssignmentDetail {
  id: number;
  title: string;
  maxScore: number;
  quizDetail?: {
    timeLimitSeconds?: number;
    shuffleQuestions?: boolean;
  };
}

interface QuizResult {
  questionId: string;
  isCorrect: boolean;
  studentAnswer: any;
  correctAnswer: any;
}

interface StudentQuizSubmitProps {
  assignment: AssignmentDetail;
  questions: QuizQuestion[];
  isResubmit?: boolean;
  previousAttempt?: number;
  onSuccess?: () => void;
}

export function StudentQuizSubmit({
  assignment,
  questions,
  isResubmit = false,
  previousAttempt = 0,
  onSuccess
}: StudentQuizSubmitProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    maxScore: number;
    correctCount: number;
    totalQuestions: number;
    results: QuizResult[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIdx];
  const isLast = currentQuestionIdx === questions.length - 1;
  const isFirst = currentQuestionIdx === 0;
  const timeLimitSeconds = assignment.quizDetail?.timeLimitSeconds;

  // Timer effect
  useEffect(() => {
    if (!timeLimitSeconds || submitted) return;

    if (timeRemaining === null) {
      setTimeRemaining(timeLimitSeconds);
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimitSeconds, submitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: string, optionId: string, type: string) => {
    if (submitted) return;

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
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const isQuestionAnswered = (questionId: string) => {
    const answer = answers[questionId];
    if (answer === undefined || answer === null) return false;
    if (typeof answer === 'string') return answer.trim() !== '';
    if (Array.isArray(answer)) return answer.length > 0;
    return true;
  };

  const answeredCount = questions.filter(q => isQuestionAnswered(q.id)).length;
  const unansweredCount = questions.length - answeredCount;

  const handleSubmit = async () => {
    setShowConfirmSubmit(false);
    setIsSubmitting(true);
    setError(null);

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const response = await studentApi.submitQuizAssignment(assignment.id, formattedAnswers);

      setResult({
        score: response.score,
        maxScore: response.maxScore,
        correctCount: response.correctCount,
        totalQuestions: response.totalQuestions,
        results: response.results,
      });
      setSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi nộp bài.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show results after submission
  if (submitted && result) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="text-center mb-8">
          <div className={cn(
            "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center",
            result.correctCount / result.totalQuestions >= 0.7 
              ? "bg-green-100 dark:bg-green-900/30" 
              : result.correctCount / result.totalQuestions >= 0.4
                ? "bg-yellow-100 dark:bg-yellow-900/30"
                : "bg-red-100 dark:bg-red-900/30"
          )}>
            {result.correctCount / result.totalQuestions >= 0.7 ? (
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            ) : result.correctCount / result.totalQuestions >= 0.4 ? (
              <AlertCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold mb-2">Hoàn thành bài kiểm tra!</h2>
          <p className="text-muted-foreground">
            Bạn đã trả lời đúng {result.correctCount} / {result.totalQuestions} câu hỏi
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 mb-6 text-center">
          <p className="text-blue-100 mb-1">Điểm của bạn</p>
          <p className="text-4xl font-bold">
            {result.score.toFixed(1)} / {result.maxScore}
          </p>
        </div>

        {/* Question Review */}
        <div className="space-y-4">
          <h3 className="font-semibold">Xem lại đáp án</h3>
          {questions.map((question, idx) => {
            const questionResult = result.results.find(r => r.questionId === question.id);
            const isCorrect = questionResult?.isCorrect ?? false;

            return (
              <div 
                key={question.id} 
                className={cn(
                  "border rounded-xl p-4",
                  isCorrect 
                    ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20"
                    : "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  )}>
                    {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-2">
                      Câu {idx + 1}: {question.text}
                    </p>
                    {question.type !== 'fill_blank' && question.options && (
                      <div className="space-y-2">
                        {question.options.map(option => {
                          const isSelected = questionResult?.studentAnswer === option.id;
                          const isCorrectOption = option.isCorrect;
                          
                          return (
                            <div 
                              key={option.id}
                              className={cn(
                                "p-2 rounded-lg text-sm",
                                isCorrectOption
                                  ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 font-medium"
                                  : isSelected && !isCorrectOption
                                    ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200"
                                    : "bg-gray-50 dark:bg-gray-800/50 text-muted-foreground"
                              )}
                            >
                              {option.text}
                              {isCorrectOption && <span className="ml-2">(Đáp án đúng)</span>}
                              {isSelected && !isCorrectOption && <span className="ml-2">(Đáp án của bạn)</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {question.type === 'fill_blank' && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Đáp án của bạn: <span className="font-medium">{questionResult?.studentAnswer || '(Trống)'}</span>
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Đáp án đúng: <span className="font-medium">{questionResult?.correctAnswer}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Before submission - Quiz taking interface
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-[#0f4c5c]">Làm bài Quiz</h2>
          <p className="text-slate-500 text-sm mt-1">
            {answeredCount}/{questions.length} câu đã trả lời
            {unansweredCount > 0 && <span className="text-amber-600"> ({unansweredCount} chưa trả lời)</span>}
          </p>
        </div>
        {timeLimitSeconds && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-bold",
            timeRemaining !== null && timeRemaining <= 60
              ? "bg-red-100 text-red-700 animate-pulse"
              : "bg-orange-50 text-orange-700"
          )}>
            <Clock className="w-5 h-5" />
            {timeRemaining !== null ? formatTime(timeRemaining) : formatTime(timeLimitSeconds)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Question Navigator */}
        <div className="md:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
          <h3 className="font-semibold text-slate-700 mb-4">Danh sách câu hỏi</h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = isQuestionAnswered(q.id);
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

        {/* Current Question */}
        <div className="md:col-span-3 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Câu {currentQuestionIdx + 1} / {questions.length}
            </span>
            <h3 className="text-xl font-medium text-slate-800 mt-4 leading-relaxed">
              {currentQuestion.text}
            </h3>
          </div>

          <div className="space-y-3 mb-8">
            {currentQuestion.type !== 'fill_blank' && currentQuestion.options && (
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
                      {isSelected && (
                        <div className={cn(
                          "bg-white",
                          currentQuestion.type === 'single_choice' ? "w-2 h-2 rounded-full" : "w-2 h-2"
                        )} />
                      )}
                    </div>
                    <span className={cn("text-base font-medium", isSelected ? "text-blue-900" : "text-slate-700")}>
                      {option.text}
                    </span>
                  </div>
                );
              })
            )}

            {currentQuestion.type === 'fill_blank' && (
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
                onClick={() => setShowConfirmSubmit(true)}
                className="bg-emerald-600 hover:bg-emerald-700 px-8 rounded-xl font-bold"
              >
                <Send className="w-4 h-4 mr-2" />
                Nộp bài
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Xác nhận nộp bài?</h3>
              <p className="text-muted-foreground">
                Bạn đã trả lời {answeredCount}/{questions.length} câu hỏi.
                {unansweredCount > 0 && (
                  <span className="text-amber-600"> Còn {unansweredCount} câu chưa trả lời!</span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmSubmit(false)}
              >
                Quay lại
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang nộp...
                  </>
                ) : (
                  'Xác nhận nộp'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
