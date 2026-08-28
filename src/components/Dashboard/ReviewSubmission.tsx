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
  // Parse grade results từ autoGradeResultJson (hỗ trợ cả camelCase và PascalCase)
  let gradeResults: any[] = [];
  try {
    if (submission.autoGradeResultJson) {
      const parsed = typeof submission.autoGradeResultJson === 'string'
        ? JSON.parse(submission.autoGradeResultJson)
        : submission.autoGradeResultJson;
      gradeResults = Array.isArray(parsed) ? parsed : (parsed.results || parsed.Results || []);
    }
  } catch (e) {
    console.error('Failed to parse autoGradeResultJson:', e);
  }

  // Parse contentJson để lấy đáp án học sinh nếu có
  let contentAnswers: Array<{ questionId: string; answer: any }> = [];
  try {
    if (submission.contentJson) {
      const parsed = typeof submission.contentJson === 'string'
        ? JSON.parse(submission.contentJson)
        : submission.contentJson;
      if (Array.isArray(parsed)) {
        contentAnswers = parsed.map((item: any) => ({
          questionId: String(item.questionId || item.QuestionId || item.id || ''),
          answer: item.answer !== undefined ? item.answer : item.Answer,
        }));
      } else if (parsed && typeof parsed === 'object') {
        const arr = parsed.answers || parsed.Answers || [];
        if (Array.isArray(arr)) {
          contentAnswers = arr.map((item: any) => ({
            questionId: String(item.questionId || item.QuestionId || item.id || ''),
            answer: item.answer !== undefined ? item.answer : item.Answer,
          }));
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse contentJson:', e);
  }

  // Map questionId -> gradeResult để tra cứu nhanh
  const gradeResultMap = new Map<string, any>();
  gradeResults.forEach((gr: any) => {
    const qId = String(gr.QuestionId || gr.questionId || gr.id || '');
    if (qId) gradeResultMap.set(qId, gr);
  });

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

      {/* Questions Review */}
      <div className="space-y-4">
        {questions.map((question, index) => {
          const qId = String(question.id);
          const gradeResult = gradeResultMap.get(qId);
          const contentAnswer = contentAnswers.find(ca => ca.questionId === qId);

          const isCorrect = gradeResult ? (gradeResult.IsCorrect ?? gradeResult.isCorrect ?? false) : false;
          const isMultipleChoice = question.type === 'multiple_choice';

          // Lấy câu trả lời của user từ contentAnswers hoặc gradeResult
          const studentAnswer = contentAnswer?.answer !== undefined
            ? contentAnswer.answer
            : (gradeResult?.StudentAnswer ?? gradeResult?.studentAnswer ?? gradeResult?.Answer ?? gradeResult?.answer);
          const correctAnswer = gradeResult?.CorrectAnswer ?? gradeResult?.correctAnswer;

          const isUserAnswer = (optionId: string, optionText?: string) => {
            if (studentAnswer === undefined || studentAnswer === null) return false;
            if (isMultipleChoice || Array.isArray(studentAnswer)) {
              if (!Array.isArray(studentAnswer)) {
                return String(studentAnswer).trim() === String(optionId).trim() ||
                  (optionText ? String(studentAnswer).trim().toLowerCase() === String(optionText).trim().toLowerCase() : false);
              }
              return studentAnswer.some(a =>
                String(a).trim() === String(optionId).trim() ||
                (optionText && String(a).trim().toLowerCase() === String(optionText).trim().toLowerCase())
              );
            }
            const str = String(studentAnswer).trim();
            return str === String(optionId).trim() || (optionText ? str.toLowerCase() === String(optionText).trim().toLowerCase() : false);
          };

          const isCorrectOption = (optionId: string, optionText?: string, isOptionMarkedCorrect?: boolean) => {
            if (isOptionMarkedCorrect) return true;
            if (correctAnswer === undefined || correctAnswer === null) return false;
            if (Array.isArray(correctAnswer)) {
              return correctAnswer.some(a =>
                String(a).trim() === String(optionId).trim() ||
                (optionText && String(a).trim().toLowerCase() === String(optionText).trim().toLowerCase())
              );
            }
            const str = String(correctAnswer).trim();
            return str === String(optionId).trim() || (optionText ? str.toLowerCase() === String(optionText).trim().toLowerCase() : false);
          };

          const formatStudentAnswerDisplay = () => {
            if (studentAnswer === undefined || studentAnswer === null) return '(Trống)';
            if (Array.isArray(studentAnswer)) {
              if (studentAnswer.length === 0) return '(Trống)';
              return studentAnswer.map(a => {
                const opt = question.options?.find(o => String(o.id) === String(a) || o.text === a);
                return opt ? opt.text : String(a);
              }).join(', ');
            }
            const str = String(studentAnswer).trim();
            if (!str) return '(Trống)';
            const opt = question.options?.find(o => String(o.id) === str || o.text === str);
            return opt ? opt.text : str;
          };

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

                  {/* Student Answer preview box */}
                  <div className={cn(
                    "p-2 rounded text-sm mb-3",
                    isCorrect
                      ? "bg-green-100/50 dark:bg-green-900/30"
                      : "bg-red-100/50 dark:bg-red-900/30"
                  )}>
                    <span className="text-muted-foreground">Câu trả lời của học sinh: </span>
                    <span className="font-medium">
                      {formatStudentAnswerDisplay()}
                    </span>
                  </div>

                  {/* Options */}
                  {question.options && question.options.length > 0 && (
                    <div className="space-y-2 ml-4">
                      {question.options.map((option) => {
                        const userSelected = isUserAnswer(option.id, option.text);
                        const correctSelected = isCorrectOption(option.id, option.text, option.isCorrect);

                        return (
                          <div
                            key={option.id}
                            className={cn(
                              "p-2.5 rounded text-sm transition-all",
                              correctSelected && "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700",
                              userSelected && !correctSelected && "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700",
                              userSelected && correctSelected && "ring-2 ring-green-500 font-bold",
                              !userSelected && !correctSelected && "bg-muted/40 text-muted-foreground"
                            )}
                          >
                            <span className="font-medium">{option.text}</span>
                            {correctSelected && <span className="ml-2 text-green-600 font-semibold">✓ Đáp án đúng</span>}
                            {userSelected && !correctSelected && <span className="ml-2 text-red-600 font-semibold">✗ Đã chọn (Sai)</span>}
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
                        <span className="text-muted-foreground">Câu trả lời của học sinh: </span>
                        <span className="font-medium">
                          {formatStudentAnswerDisplay()}
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

      {/* Auto Grade Result — TẠM KHOÁ ở phía học sinh: kết quả chấm tự động
          hiện không đáng tin cậy để hiện cho học sinh (vd tier "compile" luôn
          fail ở môi trường thiếu Docker, không phản ánh đúng chất lượng bài
          làm) và học sinh không nên coi đây là điểm chính thức trước khi
          giáo viên chấm. Điểm cuối (submission.score) vẫn hiện bình thường
          ở trên. Giáo viên vẫn xem được autoGradeResultJson ở màn hình chấm
          điểm (TeacherGradeSubmissionPage) nếu cần tham khảo. */}

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
  let gradeResults: any[] = [];
  try {
    if (submission.autoGradeResultJson) {
      const parsed = typeof submission.autoGradeResultJson === 'string'
        ? JSON.parse(submission.autoGradeResultJson)
        : submission.autoGradeResultJson;
      gradeResults = Array.isArray(parsed) ? parsed : (parsed.results || parsed.Results || []);
    }
  } catch (e) {
    console.error('Failed to parse autoGradeResultJson:', e);
  }

  // Parse contentJson để lấy đáp án HS đã chọn
  let contentAnswers: Array<{ questionId: string; answer: any }> = [];
  try {
    if (submission.contentJson) {
      const parsed = typeof submission.contentJson === 'string'
        ? JSON.parse(submission.contentJson)
        : submission.contentJson;
      if (Array.isArray(parsed)) {
        contentAnswers = parsed.map((item: any) => ({
          questionId: String(item.questionId || item.QuestionId || item.id || ''),
          answer: item.answer !== undefined ? item.answer : item.Answer,
        }));
      } else if (parsed && typeof parsed === 'object') {
        const arr = parsed.answers || parsed.Answers || [];
        if (Array.isArray(arr)) {
          contentAnswers = arr.map((item: any) => ({
            questionId: String(item.questionId || item.QuestionId || item.id || ''),
            answer: item.answer !== undefined ? item.answer : item.Answer,
          }));
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse contentJson:', e);
  }

  const questions = questionsFromProp && questionsFromProp.length > 0
    ? questionsFromProp
    : [];

  // Build quizResults cho TẤT CẢ câu hỏi
  const quizResults = questions.map(question => {
    const qId = String(question.id);
    const answerItem = contentAnswers.find(a => a.questionId === qId);
    const gradeResult = gradeResults.find((r: any) => String(r.QuestionId || r.questionId || r.id) === qId);

    const isCorrect = gradeResult ? (gradeResult.IsCorrect ?? gradeResult.isCorrect ?? false) : false;
    const studentAnswer = answerItem?.answer !== undefined
      ? answerItem.answer
      : (gradeResult?.StudentAnswer ?? gradeResult?.studentAnswer ?? gradeResult?.Answer ?? gradeResult?.answer);
    const correctAnswer = gradeResult?.CorrectAnswer ?? gradeResult?.correctAnswer;

    return {
      QuestionId: question.id,
      QuestionText: question.text,
      QuestionType: question.type,
      IsCorrect: isCorrect,
      StudentAnswer: studentAnswer,
      CorrectAnswer: correctAnswer,
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
        {quizResults.map((result, index) => {
          const question = questions.find(q => String(q.id) === String(result.QuestionId)) || {
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
    options?: { id: string; text: string; isCorrect?: boolean }[];
  };
  result: any;
}

function QuizResultCard({ index, question, result }: QuizResultCardProps) {
  const isCorrect = result.IsCorrect ?? result.isCorrect ?? false;
  const isMultipleChoice = question.type === 'multiple_choice';
  const studentAnswer = result.StudentAnswer ?? result.studentAnswer ?? result.Answer ?? result.answer;
  const correctAnswer = result.CorrectAnswer ?? result.correctAnswer;

  const isUserAnswer = (optionId: string, optionText?: string) => {
    if (studentAnswer === undefined || studentAnswer === null) return false;
    if (isMultipleChoice || Array.isArray(studentAnswer)) {
      if (!Array.isArray(studentAnswer)) {
        return String(studentAnswer).trim() === String(optionId).trim() ||
          (optionText ? String(studentAnswer).trim().toLowerCase() === String(optionText).trim().toLowerCase() : false);
      }
      return studentAnswer.some(a =>
        String(a).trim() === String(optionId).trim() ||
        (optionText && String(a).trim().toLowerCase() === String(optionText).trim().toLowerCase())
      );
    }
    const str = String(studentAnswer).trim();
    return str === String(optionId).trim() || (optionText ? str.toLowerCase() === String(optionText).trim().toLowerCase() : false);
  };

  const isCorrectOption = (optionId: string, optionText?: string, isOptionMarkedCorrect?: boolean) => {
    if (isOptionMarkedCorrect) return true;
    if (correctAnswer === undefined || correctAnswer === null) return false;
    if (Array.isArray(correctAnswer)) {
      return correctAnswer.some(a =>
        String(a).trim() === String(optionId).trim() ||
        (optionText && String(a).trim().toLowerCase() === String(optionText).trim().toLowerCase())
      );
    }
    const str = String(correctAnswer).trim();
    return str === String(optionId).trim() || (optionText ? str.toLowerCase() === String(optionText).trim().toLowerCase() : false);
  };

  const formatStudentAnswerDisplay = () => {
    if (studentAnswer === undefined || studentAnswer === null) return '(Trống)';
    if (Array.isArray(studentAnswer)) {
      if (studentAnswer.length === 0) return '(Trống)';
      return studentAnswer.map(a => {
        const opt = question.options?.find(o => String(o.id) === String(a) || o.text === a);
        return opt ? opt.text : String(a);
      }).join(', ');
    }
    const str = String(studentAnswer).trim();
    if (!str) return '(Trống)';
    const opt = question.options?.find(o => String(o.id) === str || o.text === str);
    return opt ? opt.text : str;
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
            "p-2.5 rounded text-sm mb-3",
            isCorrect
              ? "bg-green-100/50 dark:bg-green-900/30"
              : "bg-red-100/50 dark:bg-red-900/30"
          )}>
            <span className="text-muted-foreground">Câu trả lời của học sinh: </span>
            <span className="font-semibold text-foreground">
              {formatStudentAnswerDisplay()}
            </span>
          </div>

          {/* Options with highlighting */}
          {question.options && question.options.length > 0 && (
            <div className="space-y-2 ml-4">
              {question.options.map((option) => {
                const userSelected = isUserAnswer(option.id, option.text);
                const correctSelected = isCorrectOption(option.id, option.text, option.isCorrect);

                return (
                  <div
                    key={option.id}
                    className={cn(
                      "p-2.5 rounded text-sm transition-all",
                      correctSelected && "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700",
                      userSelected && !correctSelected && "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700",
                      userSelected && correctSelected && "ring-2 ring-green-500 font-bold",
                      !userSelected && !correctSelected && "bg-muted/40 text-muted-foreground"
                    )}
                  >
                    <span className="font-medium">{option.text}</span>
                    {correctSelected && <span className="ml-2 text-green-600 font-semibold">✓ Đáp án đúng</span>}
                    {userSelected && !correctSelected && <span className="ml-2 text-red-600 font-semibold">✗ Đã chọn (Sai)</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Show correct answer if wrong and no options */}
          {!isCorrect && correctAnswer && (!question.options || question.options.length === 0) && (
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
