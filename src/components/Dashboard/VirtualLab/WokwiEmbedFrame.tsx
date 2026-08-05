import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WokwiEmbedFrameProps {
  projectId?: string;
  embedUrl?: string;
  canManage?: boolean;
  onErrorFallback?: () => void;
  onUpdateLink?: () => void;
}

export const WokwiEmbedFrame = ({
  projectId,
  embedUrl,
  canManage,
  onErrorFallback,
  onUpdateLink,
}: WokwiEmbedFrameProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const finalEmbedUrl = useMemo(() => {
    if (embedUrl) return embedUrl;
    if (projectId) return `https://wokwi.com/projects/${projectId}?embed=1`;
    return '';
  }, [embedUrl, projectId]);

  useEffect(() => {
    setIsLoading(Boolean(finalEmbedUrl));
    setHasError(!finalEmbedUrl);

    if (!finalEmbedUrl) return undefined;

    const timer = window.setTimeout(() => {
      setHasError(true);
      setIsLoading(false);
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [finalEmbedUrl, retryCount]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  if (hasError) {
    return (
      <div className="w-full h-[600px] bg-slate-50 border border-border rounded-2xl flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Không thể tải mô phỏng</h3>
        <p className="text-slate-500 mb-6 max-w-md">
          Có vẻ như dự án Wokwi không phản hồi hoặc link không còn khả dụng. Vui lòng thử lại hoặc liên hệ giáo viên.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={handleRetry} className="bg-[#0f4c5c] hover:bg-[#0a3540] text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử tải lại
          </Button>
          {canManage ? (
            <Button variant="outline" onClick={onUpdateLink}>
              Cập nhật link
            </Button>
          ) : (
            <Button variant="outline" onClick={onErrorFallback}>
              Báo lỗi cho giáo viên
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-slate-50 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0f4c5c] rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500">Đang khởi tạo phòng thí nghiệm ảo...</p>
        </div>
      )}
      <iframe
        key={`${finalEmbedUrl}-${retryCount}`}
        src={finalEmbedUrl}
        className="w-full h-full border-none"
        onLoad={handleIframeLoad}
        allow="autoplay; camera; microphone"
        title="Wokwi Virtual Lab"
      />
    </div>
  );
};
