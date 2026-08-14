import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  title?: string;
}

export function FilePreviewModal({ isOpen, onClose, fileUrl, fileName, title = 'Xem tài liệu' }: FilePreviewModalProps) {
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fileExtension = fileName?.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
  const isPdf = fileExtension === 'pdf';
  const isDoc = ['doc', 'docx'].includes(fileExtension);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(false);
      setZoom(1);
    }
  }, [isOpen, fileUrl]);

  const handleDownload = async () => {
    try {
      // Fetch the file first to handle CORS
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      // Fallback: open in new tab
      window.open(fileUrl, '_blank');
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));

  const handlePrevPage = () => {
    // For PDF viewing, this would require a PDF viewer library
    console.log('Previous page');
  };

  const handleNextPage = () => {
    console.log('Next page');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full h-full max-w-6xl mx-4 my-4 rounded-2xl bg-card overflow-hidden flex flex-col shadow-2xl border border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50 shrink-0">
              <div className="flex items-center gap-3">
                {isImage ? (
                  <ImageIcon className="w-5 h-5 text-blue-500" />
                ) : isPdf ? (
                  <FileText className="w-5 h-5 text-red-500" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-500" />
                )}
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-xs text-muted-foreground">{fileName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom controls for images */}
                {isImage && (
                  <div className="flex items-center gap-1 mr-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={handleZoomOut}
                      title="Thu nhỏ"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground w-12 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={handleZoomIn}
                      title="Phóng to"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* PDF page navigation */}
                {isPdf && (
                  <div className="flex items-center gap-1 mr-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={handlePrevPage}
                      title="Trang trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground w-16 text-center">
                      Trang 1
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={handleNextPage}
                      title="Trang sau"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={handleDownload}
                  title="Tải xuống"
                >
                  <Download className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={onClose}
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
              {loading && (
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Đang tải tài liệu...</p>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center gap-3 text-destructive">
                  <FileText className="w-12 h-12 opacity-50" />
                  <p className="text-sm">Không thể tải tài liệu</p>
                  <Button variant="outline" size="sm" onClick={() => window.open(fileUrl, '_blank')}>
                    Mở trong tab mới
                  </Button>
                </div>
              )}

              {!error && isImage && (
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoom})` }}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError(true);
                  }}
                />
              )}

              {!error && isPdf && (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                  className="w-full h-full min-h-[600px] bg-white rounded-lg"
                  title={fileName}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    // Fallback to direct iframe if Google Docs fails
                    setLoading(false);
                    // Try opening in new tab instead
                    window.open(fileUrl, '_blank');
                  }}
                />
              )}

              {!error && isDoc && (
                <div className="flex flex-col items-center justify-center gap-4 text-center max-w-md">
                  <FileText className="w-16 h-16 text-blue-500 opacity-50" />
                  <div>
                    <p className="font-medium text-foreground">Tài liệu Word</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Không thể xem trực tiếp. Vui lòng tải xuống để mở.
                    </p>
                  </div>
                  <Button onClick={handleDownload} className="gap-2">
                    <Download className="w-4 h-4" />
                    Tải xuống tài liệu
                  </Button>
                </div>
              )}

              {!error && !isImage && !isPdf && !isDoc && (
                <div className="flex flex-col items-center justify-center gap-4 text-center max-w-md">
                  <FileText className="w-16 h-16 text-gray-400 opacity-50" />
                  <div>
                    <p className="font-medium text-foreground">Tài liệu không xác định</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Định dạng file không được hỗ trợ xem trực tiếp.
                    </p>
                  </div>
                  <Button onClick={handleDownload} className="gap-2">
                    <Download className="w-4 h-4" />
                    Tải xuống tài liệu
                  </Button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/30 shrink-0">
              <p className="text-xs text-muted-foreground">
                {isImage && `Hình ảnh • ${fileExtension.toUpperCase()}`}
                {isPdf && `PDF • Tài liệu`}
                {isDoc && `Word • ${fileExtension.toUpperCase()}`}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                  <Download className="w-4 h-4" />
                  Tải xuống
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(fileUrl, '_blank')} className="gap-2">
                  Mở tab mới
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default FilePreviewModal;
