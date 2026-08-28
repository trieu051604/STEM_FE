import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, FileText, Code, Trophy } from 'lucide-react';
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
      {/* Score Display */}
      {submission.score !== undefined && submission.score !== null ? (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Đã hoàn thành</p>
              <p className="text-xs text-muted-foreground mt-1">
                Lần nộp #{submission.attemptNumber} - {format(parseISO(submission.submittedAt), 'HH:mm, dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <span className="text-3xl font-bold text-green-600">{submission.score}</span>
              <span className="text-muted-foreground">/{submission.maxScore}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Đã nộp bài</p>
              <p className="text-xs text-muted-foreground mt-1">
                Lần nộp #{submission.attemptNumber} - {format(parseISO(submission.submittedAt), 'HH:mm, dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-muted-foreground">Chờ chấm điểm</span>
            </div>
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

// AutoGradeResult component
interface AutoGradeResultProps {
  autoGradeResultJson: string;
}

interface AutoGradeCheck {
  name: string;
  passed: boolean;
  message: string;
}

interface AutoGradeResult {
  passed: boolean;
  passedChecks: number;
  totalChecks: number;
  checks: AutoGradeCheck[];
}

function AutoGradeResult({ autoGradeResultJson }: AutoGradeResultProps) {
  let autoGrade: AutoGradeResult | null = null;
  try {
    autoGrade = JSON.parse(autoGradeResultJson);
  } catch (e) {
    console.error('Failed to parse autoGradeResultJson:', e);
  }

  if (!autoGrade) return null;

  return (
    <div className="p-4 bg-white dark:bg-black/20 rounded-lg border border-border">
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Kết quả chấm tự động
      </h4>

      {/* Summary */}
      <div className={cn(
        "p-3 rounded-lg mb-3",
        autoGrade.passed
          ? "bg-green-50 dark:bg-green-900/20"
          : "bg-red-50 dark:bg-red-900/20"
      )}>
        <div className="flex items-center gap-2">
          {autoGrade.passed ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className={cn(
            "font-medium",
            autoGrade.passed ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
          )}>
            {autoGrade.passed ? "Đạt tất cả các bài kiểm tra" : "Chưa đạt một số bài kiểm tra"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {autoGrade.passedChecks}/{autoGrade.totalChecks} bài kiểm tra đạt
        </p>
      </div>

      {/* Checks */}
      {autoGrade.checks && autoGrade.checks.length > 0 && (
        <div className="space-y-2">
          {autoGrade.checks.map((check, index) => (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg flex items-start gap-3",
                check.passed
                  ? "bg-green-50/50 dark:bg-green-900/10"
                  : "bg-red-50/50 dark:bg-red-900/10"
              )}
            >
              {check.passed ? (
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p className={cn(
                  "text-sm font-medium",
                  check.passed ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                )}>
                  {check.name}
                </p>
                {check.message && (
                  <p className="text-xs text-muted-foreground mt-0.5">{check.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ReviewSimulationSubmissionProps {
  submission: MySubmission;
}

export function ReviewSimulationSubmission({ submission }: ReviewSimulationSubmissionProps) {
  let content: Record<string, unknown> = {};
  try {
    if (submission.contentJson) {
      content = JSON.parse(submission.contentJson);
    }
  } catch (e) {
    console.error('Failed to parse contentJson:', e);
  }

  // Backend lưu simulation với cấu trúc virtualLabSubmission
  const virtualLabData = content.virtualLabSubmission as Record<string, unknown> | undefined;
  const code = (virtualLabData?.sourceCode as string) || (content.code as string) || '';
  const diagramData = virtualLabData?.diagram as Record<string, unknown> | undefined;
  const compilationOutput = virtualLabData?.compileOutput as string || content.compilationOutput as string || '';
  const compilationSuccess = virtualLabData?.compileSuccess as boolean ?? content.compilationSuccess as boolean ?? null;

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

      {/* Auto Grade Result */}
      {submission.autoGradeResultJson && (
        <AutoGradeResult autoGradeResultJson={submission.autoGradeResultJson} />
      )}

      {/* Code Submitted */}
      {code && (
        <div className="p-4 bg-white dark:bg-black/20 rounded-lg border border-border">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Code className="w-4 h-4" />
            Code đã nộp:
          </h4>
          <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm max-h-64 overflow-y-auto">
            <code>{code}</code>
          </pre>
        </div>
      )}

      {/* Diagram */}
      {diagramData && (
        <div className="p-4 bg-white dark:bg-black/20 rounded-lg border border-border">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            Sơ đồ mạch:
          </h4>
          <div className="bg-muted p-4 rounded-lg overflow-x-auto text-sm text-muted-foreground">
            <p>Đã lưu sơ đồ mạch tại thời điểm nộp bài</p>
            <p className="text-xs mt-1">Số thành phần: {diagramData.components ? (diagramData.components as unknown[]).length : 0}</p>
          </div>
        </div>
      )}

      {/* Compilation Output */}
      {compilationOutput && (
        <div className="p-4 bg-white dark:bg-black/20 rounded-lg border border-border">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Kết quả biên dịch:
          </h4>
          <pre className={cn(
            "p-4 rounded-lg overflow-x-auto text-sm max-h-48 overflow-y-auto",
            compilationSuccess
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
          )}>
            <code>{compilationOutput}</code>
          </pre>
        </div>
      )}

      {/* No content */}
      {!code && !diagramData && !compilationOutput && (
        <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
          <p>Không có nội dung bài mô phỏng để hiển thị</p>
        </div>
      )}

      {/* Feedback */}
      {submission.feedback && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">💬 Nhận xét từ giáo viên:</p>
          <p className="text-amber-700 dark:text-amber-300 whitespace-pre-wrap">{submission.feedback}</p>
        </div>
      )}
    </div>
  );
}

// Component hiển thị quiz từ autoGradeResultJson (khi không có quizDetail)
interface ReviewQuizFromResultsProps {
  submission: MySubmission;
  questions?: QuizQuestion[];
}

interface QuizResultItem {
  QuestionId: string;
  QuestionText?: string;
  QuestionType?: string;
  IsCorrect?: boolean;
  CorrectAnswer?: string | string[];
  StudentAnswer?: string | string[];
  Points?: number;
  MaxPoints?: number;
  Answer?: string | string[]; // Student answer from contentJson format
  Options?: Array<{ id: string; text: string; isCorrect?: boolean }>;
}

export function ReviewQuizFromResults({ submission, questions: questionsFromProp }: ReviewQuizFromResultsProps) {
  // Parse grade results từ autoGradeResultJson
  let gradeResults: QuizResultItem[] = [];
  try {
    if (submission.autoGradeResultJson) {
      gradeResults = JSON.parse(submission.autoGradeResultJson);
    }
  } catch (e) {
    console.error('Failed to parse autoGradeResultJson:', e);
  }

  // Parse contentJson để lấy đáp án HS đã chọn
  let contentData: Record<string, unknown> = {};
  try {
    if (submission.contentJson) {
      contentData = JSON.parse(submission.contentJson);
    }
  } catch (e) {
    console.error('Failed to parse contentJson:', e);
  }

  // Lấy answers từ contentJson (format: [{Answer, QuestionId}, ...])
  const contentAnswers = contentData.answers as Array<{ Answer?: string | string[]; QuestionId: string }> | undefined;

  // LUÔN hiển thị TẤT CẢ câu hỏi từ assignment
  // Nếu questions từ prop có dữ liệu, dùng nó; không thì dùng từ contentJson
  const questions = questionsFromProp && questionsFromProp.length > 0 
    ? questionsFromProp 
    : (contentData.questions as Array<{
        id: string;
        text: string;
        type: string;
        options?: { id: string; text: string; isCorrect?: boolean }[];
        correctAnswer?: string | string[];
      }> || []);

  // Build quizResults cho TẤT CẢ câu hỏi (từ questions prop)
  const quizResults = questions.map(question => {
    // Tìm đáp án HS đã chọn từ contentAnswers
    const answerItem = contentAnswers?.find(a => a.QuestionId === question.id);
    const studentAnswer = answerItem?.Answer;
    
    // Tìm kết quả chấm từ autoGradeResultJson (chỉ để lấy IsCorrect)
    const gradeResult = gradeResults.find(r => r.QuestionId === question.id);
    
    // Ưu tiên IsCorrect từ autoGradeResultJson, nếu không có thì đánh dấu false
    const isCorrect = gradeResult?.IsCorrect ?? false;

    return {
      QuestionId: question.id,
      QuestionText: question.text,
      QuestionType: question.type,
      IsCorrect: isCorrect,
      StudentAnswer: studentAnswer,
      Options: question.options,
    };
  });

  const correctCount = quizResults.filter(r => r.IsCorrect).length;
  const totalCount = quizResults.length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lần nộp #{submission.attemptNumber}</p>
            <p className="text-xs text-muted-foreground">
              {submission.submittedAt ? format(parseISO(submission.submittedAt), 'HH:mm, dd/MM/yyyy', { locale: vi }) : ''}
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

      {/* Results summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">{correctCount}</p>
          <p className="text-xs text-muted-foreground">Đúng</p>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">{totalCount - correctCount}</p>
          <p className="text-xs text-muted-foreground">Sai</p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-600">{totalCount}</p>
          <p className="text-xs text-muted-foreground">Tổng câu</p>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {quizResults.length > 0 ? quizResults.map((result, index) => {
          // Tìm câu hỏi từ questions array hoặc dùng text từ result
          const question = questions.find(q => q.id === result.QuestionId) || {
            id: result.QuestionId,
            text: result.QuestionText || `Câu hỏi ${index + 1}`,
            type: result.QuestionType || 'single_choice',
            options: [] as { id: string; text: string }[]
          };

          return (
            <QuizResultCard
              key={result.QuestionId}
              index={index}
              question={question}
              result={result}
            />
          );
        }) : questions.map((question, index) => {
          // Lấy đáp án từ contentAnswers nếu có
          const answerItem = contentAnswers?.find(a => a.QuestionId === question.id);
          const studentAnswer = answerItem?.Answer;

          return (
            <div
              key={question.id}
              className="p-4 rounded-lg border border-border bg-muted/30"
            >
              <p className="font-medium">Câu {index + 1}: {question.text}</p>
              {studentAnswer && (
                <p className="text-sm text-muted-foreground mt-2">
                  Đáp án: {Array.isArray(studentAnswer) ? studentAnswer.join(', ') : studentAnswer}
                </p>
              )}
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

interface QuizResultCardProps {
  index: number;
  question: {
    id: string;
    text: string;
    type: string;
    options?: { id: string; text: string }[];
  };
  result: QuizResultItem;
}

function QuizResultCard({ index, question, result }: QuizResultCardProps) {
  const isCorrect = result.IsCorrect;
  const isMultipleChoice = question.type === 'multiple_choice';
  const studentAnswer = result.StudentAnswer;
  const correctAnswer = result.CorrectAnswer;

  const isUserAnswer = (optionId: string) => {
    if (isMultipleChoice) {
      return Array.isArray(studentAnswer) && studentAnswer.includes(optionId);
    }
    return studentAnswer === optionId;
  };

  const isCorrectOption = (optionId: string) => {
    if (isMultipleChoice) {
      return Array.isArray(correctAnswer) && correctAnswer.includes(optionId);
    }
    return correctAnswer === optionId;
  };

  return (
    <div
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

          {/* Student Answer */}
          <div className={cn(
            "p-2 rounded text-sm mb-2",
            isCorrect
              ? "bg-green-100/50 dark:bg-green-900/30"
              : "bg-red-100/50 dark:bg-red-900/30"
          )}>
            <span className="text-muted-foreground">Câu trả lời của học sinh: </span>
            <span className="font-medium">
              {Array.isArray(studentAnswer)
                ? studentAnswer.length > 0
                  ? studentAnswer.map(a => {
                      const opt = question.options?.find(o => o.id === a);
                      return opt ? opt.text : a;
                    }).join(', ')
                  : '(Trống)'
                : studentAnswer
                  ? (() => {
                      const opt = question.options?.find(o => o.id === studentAnswer);
                      return opt ? opt.text : studentAnswer;
                    })()
                  : '(Trống)'}
            </span>
          </div>

          {/* Options with highlighting */}
          {question.options && question.options.length > 0 && (
            <div className="space-y-2 ml-4">
              {question.options.map((option) => {
                const userSelected = isUserAnswer(option.id);
                const correctSelected = isCorrectOption(option.id);

                return (
                  <div
                    key={option.id}
                    className={cn(
                      "p-2 rounded text-sm",
                      correctSelected && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                      userSelected && !correctSelected && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
                      userSelected && correctSelected && "ring-2 ring-green-500"
                    )}
                  >
                    <span className="font-medium">{option.text}</span>
                    {correctSelected && <span className="ml-2 text-green-600 font-medium">✓ Đáp án đúng</span>}
                    {userSelected && !correctSelected && <span className="ml-2 text-red-600 font-medium">✗ Sai</span>}
                    {userSelected && correctSelected && <span className="ml-2 text-green-600 font-medium">✓ Học sinh chọn</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Show correct answer if wrong */}
          {!isCorrect && correctAnswer && (
            <div className="mt-2 p-2 rounded text-sm bg-green-100/50 dark:bg-green-900/30">
              <span className="text-muted-foreground">Đáp án đúng: </span>
              <span className="font-medium">
                {Array.isArray(correctAnswer)
                  ? correctAnswer.map(a => {
                      const opt = question.options?.find(o => o.id === a);
                      return opt ? opt.text : a;
                    }).join(', ')
                  : (() => {
                      const opt = question.options?.find(o => o.id === correctAnswer);
                      return opt ? opt.text : correctAnswer;
                    })()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
