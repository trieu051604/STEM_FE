import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Upload, AlertCircle, CheckCircle, Loader2, FileText } from 'lucide-react';
import { studentApi } from '@/services/teacherStudentApi';

interface AssignmentDetail {
  id: number;
  title: string;
  maxScore: number;
  reportDetail?: {
    instructions?: string;
    allowedSubmissionTypes?: string[];
    allowedFileExtensions?: string[];
    maxFileSizeMb?: number;
  };
}

interface StudentReportSubmitProps {
  assignment: AssignmentDetail;
  instructions?: string;
  isResubmit?: boolean;
  previousAttempt?: number;
  onSuccess?: () => void;
}

export function StudentReportSubmit({
  assignment,
  instructions,
  isResubmit = false,
  previousAttempt = 0,
  onSuccess
}: StudentReportSubmitProps) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    submissionId: number;
    attemptNumber: number;
    status: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allowedExtensions = assignment.reportDetail?.allowedFileExtensions || ['.pdf', '.doc', '.docx', '.zip'];
  const maxSizeMb = assignment.reportDetail?.maxFileSizeMb || 10;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const extension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      setError(`Định dạng file không được hỗ trợ. Vui lòng chọn file: ${allowedExtensions.join(', ')}`);
      return;
    }

    if (selectedFile.size > maxSizeMb * 1024 * 1024) {
      setError(`Dung lượng file vượt quá ${maxSizeMb}MB. File của bạn: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !file) {
      setError('Vui lòng nhập nội dung báo cáo hoặc đính kèm file.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let fileId: number | undefined;

      // Upload file first if selected
      if (file) {
        const uploadResponse = await studentApi.uploadFile(file, 'submissions');
        if (uploadResponse && uploadResponse.success) {
          // FileEntity should be created by BE, get the fileId from response
          // If BE returns fileId, use it. Otherwise, we'll rely on fileUrl in contentJson
          fileId = (uploadResponse as any).fileId;
        }
      }

      const response = await studentApi.submitReportAssignment(assignment.id, {
        content: content.trim() || undefined,
        fileId: fileId,
      });

      setSubmissionResult({
        submissionId: response.submissionId,
        attemptNumber: response.attemptNumber,
        status: response.status,
      });
      setSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi nộp bài.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted && submissionResult) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Nộp bài thành công!</h2>
          <p className="text-muted-foreground mb-4">
            Bài báo cáo của bạn đã được gửi thành công.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 max-w-sm mx-auto">
            <p className="text-sm text-muted-foreground">Lần nộp #{submissionResult.attemptNumber}</p>
            <p className="text-sm text-muted-foreground">ID: {submissionResult.submissionId}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Nộp bài báo cáo
        {isResubmit && (
          <span className="text-sm font-normal text-amber-600">(Nộp lại lần #{previousAttempt + 1})</span>
        )}
      </h3>

      {/* Instructions */}
      {instructions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Hướng dẫn nộp bài:</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">{instructions}</p>
        </div>
      )}

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Đính kèm file
          <span className="text-muted-foreground font-normal ml-1">
            (Tối đa {maxSizeMb}MB, định dạng: {allowedExtensions.join(', ')})
          </span>
        </label>
        <div className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
          file 
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" 
            : "border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600"
        )}>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
            accept={allowedExtensions.join(',')}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-blue-700 dark:text-blue-300">{file.name}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  Kéo thả file vào đây hoặc <span className="text-blue-600 dark:text-blue-400 font-medium">chọn file</span>
                </p>
                <p className="text-sm text-gray-400">
                  {allowedExtensions.join(', ')} - Tối đa {maxSizeMb}MB
                </p>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Content Textarea */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Nội dung báo cáo
          <span className="text-muted-foreground font-normal ml-1">(Tùy chọn)</span>
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập nội dung báo cáo của bạn tại đây..."
          rows={10}
          className="resize-none"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang nộp...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Nộp bài
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
