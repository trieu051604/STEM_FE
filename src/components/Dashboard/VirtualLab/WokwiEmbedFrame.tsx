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
      <div className="w-full h-[600px] bg-card border border-border rounded-xl flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Không thể tải mô phỏng</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Có vẻ như dự án Wokwi không phản hồi hoặc link không còn khả dụng. Vui lòng thử lại hoặc liên hệ giáo viên.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={handleRetry} className="bg-indigo-500 hover:bg-indigo-600 text-white border-0">
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
    <div className="relative w-full h-[600px] bg-card border border-border rounded-xl overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-card flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-border border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-muted-foreground">Đang khởi tạo phòng thí nghiệm ảo...</p>
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
