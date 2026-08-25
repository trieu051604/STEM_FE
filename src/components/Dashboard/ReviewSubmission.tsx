import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, FileText, Code, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface QuizQuestion {
  id: string;
  text: string;
  type: string;
  options?: { id: string; text: string; isCorrect?: boolean }[];
  correctAnswer?: string;
}

interface RubricCriterion {
  name: string;
  maxPoints: number;
  description?: string;
}

interface MySubmission {
  submissionId: number;
  attemptNumber: number;
  submittedAt: string;
  status: string;
  score?: number;
  maxScore: number;
  contentJson?: string;
  feedback?: string;
  fileUrl?: string;
  autoGradeResultJson?: string;
}

interface GradeResult {
  QuestionId: string;
  IsCorrect: boolean;
  CorrectAnswer: string | string[];
  StudentAnswer: string | string[];
}

interface ReviewQuizSubmissionProps {
  questions: QuizQuestion[];
  submission: MySubmission;
}

export function ReviewQuizSubmission({ questions, submission }: ReviewQuizSubmissionProps) {
  // Parse grade results từ autoGradeResultJson (cấu trúc backend trả về)
  let gradeResults: GradeResult[] = [];
  try {
    if (submission.autoGradeResultJson) {
      gradeResults = JSON.parse(submission.autoGradeResultJson);
    }
  } catch (e) {
    console.error('Failed to parse autoGradeResultJson:', e);
  }

  // Map questionId -> gradeResult để tra cứu nhanh
  const gradeResultMap = new Map<string, GradeResult>();
  gradeResults.forEach(gr => gradeResultMap.set(gr.QuestionId, gr));

  return (
    <div className="space-y-6">
      {/* Submission Info */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lần nộp #{submission.attemptNumber}</p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(submission.submittedAt), 'HH:mm, dd/MM/yyyy', { locale: vi })}
            </p>
          </div>
        </div>
        {submission.score !== undefined && submission.score !== null && (
          <div className="text-right">
            <span className="text-2xl font-bold text-green-600">{submission.score}</span>
            <span className="text-muted-foreground">/{submission.maxScore}</span>
          </div>
        )}
      </div>

      {/* Questions Review */}
      <div className="space-y-4">
        {questions.map((question, index) => {
          // Lấy grade result từ autoGradeResultJson
          const gradeResult = gradeResultMap.get(question.id);
          const isCorrect = gradeResult?.IsCorrect ?? false;
          const isMultipleChoice = question.type === 'multiple_choice';

          // Lấy câu trả lời của user từ grade result
          const studentAnswer = gradeResult?.StudentAnswer;
          const correctAnswer = gradeResult?.CorrectAnswer;

          return (
            <div 
              key={question.id} 
              className={cn(
                "p-4 rounded-lg border",
                isCorrect 
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              )}
            >
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium">Câu {index + 1}: {question.text}</p>
                    {isCorrect ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Đúng</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Sai</span>
                    )}
                  </div>
                  
                  {/* Options */}
                  {question.options && (
                    <div className="space-y-2 ml-4">
                      {question.options.map((option) => {
                        // Kiểm tra option có phải là đáp án của user không
                        const isUserAnswer = isMultipleChoice
                          ? Array.isArray(studentAnswer) && studentAnswer.includes(option.id)
                          : studentAnswer === option.id;
                        const isCorrectOption = Array.isArray(correctAnswer) 
                          ? correctAnswer.includes(option.id)
                          : correctAnswer === option.id;

                        return (
                          <div 
                            key={option.id}
                            className={cn(
                              "p-2 rounded text-sm",
                              isCorrectOption && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                              isUserAnswer && !isCorrectOption && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
                              isUserAnswer && isCorrectOption && "ring-2 ring-green-500"
                            )}
                          >
                            <span className="font-medium">{option.text}</span>
                            {isCorrectOption && <span className="ml-2 text-green-600 font-medium">✓ Đúng</span>}
                            {isUserAnswer && !isCorrectOption && <span className="ml-2 text-red-600 font-medium">✗ Sai</span>}
                            {isUserAnswer && isCorrectOption && <span className="ml-2 text-green-600 font-medium">✓ Bạn chọn</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fill blank answer */}
                  {question.type === 'fill_blank' && (
                    <div className="ml-4 space-y-2">
                      <div className={cn(
                        "p-2 rounded text-sm",
                        isCorrect 
                          ? "bg-green-100 dark:bg-green-900/30" 
                          : "bg-red-100 dark:bg-red-900/30"
                      )}>
                        <span className="text-muted-foreground">Câu trả lời của bạn: </span>
                        <span className="font-medium">
                          {Array.isArray(studentAnswer) ? studentAnswer.join(', ') : studentAnswer || '(Trống)'}
                        </span>
                        {isCorrect ? (
                          <span className="ml-2 text-green-600 font-medium">✓ Đúng</span>
                        ) : (
                          <span className="ml-2 text-red-600 font-medium">✗ Sai</span>
                        )}
                      </div>
                      {!isCorrect && correctAnswer && (
                        <div className="p-2 rounded text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          <span className="text-muted-foreground">Đáp án đúng: </span>
                          <span className="font-medium">
                            {Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {submission.feedback && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">💬 Nhận xét từ giáo viên:</p>
          <p className="text-amber-700 dark:text-amber-300">{submission.feedback}</p>
        </div>
      )}
    </div>
  );
}

interface ReviewReportSubmissionProps {
  submission: MySubmission;
  rubricCriteria?: RubricCriterion[];
}

export function ReviewReportSubmission({ submission, rubricCriteria }: ReviewReportSubmissionProps) {
  const content = submission.contentJson ? JSON.parse(submission.contentJson) : {};

  return (
    <div className="space-y-6">
      {/* Submission Info */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lần nộp #{submission.attemptNumber}</p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(submission.submittedAt), 'HH:mm, dd/MM/yyyy', { locale: vi })}
            </p>
          </div>
        </div>
        {submission.score !== undefined && submission.score !== null && (
          <div className="text-right">
            <span className="text-2xl font-bold text-green-600">{submission.score}</span>
            <span className="text-muted-foreground">/{submission.maxScore}</span>
          </div>
        )}
      </div>

      {/* Rubric Grading */}
      {rubricCriteria && rubricCriteria.length > 0 && submission.score !== undefined && submission.score !== null && (
        <div className="p-4 bg-white dark:bg-black/20 rounded-lg border border-border">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Tiêu chí chấm điểm
          </h4>
          <div className="space-y-2">
            {rubricCriteria.map((criterion, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{index + 1}.</span>
                  <span className="text-sm font-medium">{criterion.name}</span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {criterion.maxPoints} điểm
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-sm font-medium">Tổng điểm</span>
            <span className="text-lg font-bold text-green-600">{submission.score}/{submission.maxScore}</span>
          </div>
        </div>
      )}

      {/* Report Content */}
      {content.textContent && (
        <div className="p-4 bg-white dark:bg-black/20 rounded-lg border border-border">
          <h4 className="font-medium mb-2">📝 Nội dung báo cáo:</h4>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-muted-foreground">{content.textContent}</p>
          </div>
        </div>
      )}

      {/* File */}
      {submission.fileUrl && (
        <div className="p-4 bg-white dark:bg-black/20 rounded-lg border border-border">
          <h4 className="font-medium mb-2">📎 File đã nộp:</h4>
          <a
            href={submission.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <FileText className="w-4 h-4" />
            Xem file đã nộp
          </a>
        </div>
      )}

      {/* Feedback */}
      {submission.feedback && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">💬 Nhận xét từ giáo viên:</p>
          <p className="text-amber-700 dark:text-amber-300">{submission.feedback}</p>
        </div>
      )}
    </div>
  );
}

interface ReviewSimulationSubmissionProps {
  submission: MySubmission;
}

export function ReviewSimulationSubmission({ submission }: ReviewSimulationSubmissionProps) {
  const content = submission.contentJson ? JSON.parse(submission.contentJson) : {};

  return (
    <div className="space-y-6">
      {/* Submission Info */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lần nộp #{submission.attemptNumber}</p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(submission.submittedAt), 'HH:mm, dd/MM/yyyy', { locale: vi })}
            </p>
          </div>
        </div>
        {submission.score !== undefined && submission.score !== null && (
          <div className="text-right">
            <span className="text-2xl font-bold text-green-600">{submission.score}</span>
            <span className="text-muted-foreground">/{submission.maxScore}</span>
          </div>
        )}
      </div>

      {/* Code Submitted */}
      {content.code && (
        <div className="p-4 bg-white dark:bg-black/20 rounded-lg border border-border">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            💻 Code đã nộp:
          </h4>
          <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
            <code>{content.code}</code>
          </pre>
        </div>
      )}

      {/* Diagram */}
      {content.diagram && (
        <div className="p-4 bg-white dark:bg-black/20 rounded-lg border border-border">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            🔌 Sơ đồ mạch:
          </h4>
          <div 
            className="bg-muted p-4 rounded-lg overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: content.diagram }}
          />
        </div>
      )}

      {/* Compilation Output */}
      {content.compilationOutput && (
        <div className="p-4 bg-white dark:bg-black/20 rounded-lg border border-border">
          <h4 className="font-medium mb-2">📤 Kết quả biên dịch:</h4>
          <pre className={cn(
            "p-4 rounded-lg overflow-x-auto text-sm",
            content.compilationSuccess 
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
          )}>
            <code>{content.compilationOutput}</code>
          </pre>
        </div>
      )}

      {/* Feedback */}
      {submission.feedback && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">💬 Nhận xét từ giáo viên:</p>
          <p className="text-amber-700 dark:text-amber-300">{submission.feedback}</p>
        </div>
      )}
    </div>
  );
}
