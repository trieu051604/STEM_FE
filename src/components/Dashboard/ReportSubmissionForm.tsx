import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, File, Video, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportSubmissionFormProps {
  allowFile?: boolean;
  allowVideo?: boolean;
  maxSize?: number; // MB
  onSubmit?: (file: File) => Promise<void>;
}

export const ReportSubmissionForm: React.FC<ReportSubmissionFormProps> = ({
  allowFile = true,
  allowVideo = false,
  maxSize = 10,
  onSubmit
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validation
      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > maxSize) {
        setError(`File quá lớn. Vui lòng chọn file dưới ${maxSize}MB.`);
        return;
      }
      
      const isVideo = file.type.startsWith('video/');
      if (isVideo && !allowVideo) {
        setError('Bài tập này không cho phép nộp video.');
        return;
      }
      
      if (!isVideo && !allowFile) {
        setError('Bài tập này chỉ cho phép nộp video.');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > maxSize) {
        setError(`File quá lớn. Vui lòng chọn file dưới ${maxSize}MB.`);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !onSubmit) return;
    
    setIsUploading(true);
    setProgress(0);
    setError(null);

    // Giả lập tiến trình upload
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 10;
      });
    }, 200);

    try {
      await onSubmit(selectedFile);
      clearInterval(interval);
      setProgress(100);
      setIsSuccess(true);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || 'Lỗi tải lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Nộp bài thành công!</h2>
        <p className="text-slate-500 mb-6">Bài làm của bạn đã được gửi tới giáo viên để chờ chấm điểm.</p>
        <Button variant="outline" onClick={() => { setIsSuccess(false); setSelectedFile(null); setProgress(0); }} className="rounded-xl">
          Nộp lại bài khác
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
      <h2 className="text-2xl font-bold text-[#0f4c5c] mb-2">Nộp báo cáo</h2>
      <p className="text-slate-500 text-sm mb-6">
        Hỗ trợ: {allowFile && 'Tài liệu (PDF, Word...)'} {allowFile && allowVideo && 'hoặc'} {allowVideo && 'Video (MP4, MOV...)'}. 
        Tối đa {maxSize}MB.
      </p>

      {!selectedFile ? (
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:bg-slate-50 transition-colors"
        >
          <UploadCloud className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Kéo thả file vào đây</h3>
          <p className="text-sm text-slate-500 mb-6">hoặc click để chọn file từ máy tính</p>
          
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            onChange={handleFileChange}
            accept={cn(allowFile ? ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" : "", allowVideo ? ",video/mp4,video/quicktime" : "")}
          />
          <label htmlFor="file-upload">
            <Button type="button" asChild className="bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer">
              <span>Chọn file</span>
            </Button>
          </label>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
              {selectedFile.type.startsWith('video/') ? (
                <Video className="w-6 h-6 text-indigo-500" />
              ) : (
                <File className="w-6 h-6 text-orange-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            {!isUploading && progress === 0 && (
              <button onClick={() => setSelectedFile(null)} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {(isUploading || progress > 0) && (
            <div className="mt-4">
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                <span>{isUploading ? 'Đang tải lên...' : 'Hoàn tất'}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" className="rounded-xl">Hủy</Button>
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || isUploading}
          className="bg-orange-600 hover:bg-orange-700 rounded-xl"
        >
          {isUploading ? 'Đang nộp...' : 'Nộp bài'}
        </Button>
      </div>
    </div>
  );
};
