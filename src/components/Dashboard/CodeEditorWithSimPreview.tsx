import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle2, AlertCircle, FileCode2, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeEditorWithSimPreviewProps {
  initialCode?: string;
  onTest?: (code: string) => Promise<any>;
  onSubmit?: (code: string) => Promise<void>;
}

export const CodeEditorWithSimPreview: React.FC<CodeEditorWithSimPreviewProps> = ({
  initialCode = 'void setup() {\n  // Khởi tạo\n}\n\nvoid loop() {\n  // Vòng lặp chính\n}',
  onTest,
  onSubmit
}) => {
  const [code, setCode] = useState(initialCode);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTest = async () => {
    if (!onTest) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      // Giả lập chạy test 2s
      await new Promise(r => setTimeout(r, 2000));
      await onTest(code);
      setTestResult('success');
    } catch (e) {
      setTestResult('failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async () => {
    if (!onSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit(code);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto h-[80vh]">
      {/* Editor Panel */}
      <div className="flex flex-col bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-300">
            <FileCode2 className="w-5 h-5" />
            <span className="font-semibold text-sm">main.ino</span>
          </div>
          <Button 
            onClick={handleTest} 
            disabled={isTesting}
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4"
          >
            {isTesting ? 'Đang biên dịch...' : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Chạy thử
              </>
            )}
          </Button>
        </div>
        
        {/* Fake Code Editor for now (textarea) */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full bg-slate-900 text-slate-300 p-4 font-mono text-sm outline-none resize-none custom-scrollbar"
        />
      </div>

      {/* Preview/Result Panel */}
      <div className="flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Kết quả chạy thử</h3>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || testResult !== 'success'}
            className="bg-purple-600 hover:bg-purple-700 rounded-xl px-6"
          >
            {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
          </Button>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50/50">
          {!testResult && !isTesting && (
            <div className="text-center text-slate-500">
              <Cpu className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p>Viết code và bấm <strong>Chạy thử</strong> để xem kết quả biên dịch và kiểm tra tự động.</p>
            </div>
          )}

          {isTesting && (
            <div className="text-center text-slate-500 animate-pulse">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-semibold">Đang nạp code vào mạch mô phỏng...</p>
            </div>
          )}

          {testResult === 'success' && (
            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 text-emerald-700 mb-4">
                <CheckCircle2 className="w-6 h-6" />
                <h4 className="font-bold text-lg">Test Case Pass (100%)</h4>
              </div>
              <ul className="space-y-2 text-sm text-emerald-800">
                <li>✓ Chân 13 xuất tín hiệu HIGH (Pass)</li>
                <li>✓ Serial print "Hello World" (Pass)</li>
              </ul>
              <p className="text-sm text-slate-600 mt-6 pt-4 border-t border-emerald-200/50">
                Bạn đã có thể nộp bài tập này.
              </p>
            </div>
          )}

          {testResult === 'failed' && (
            <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 text-red-700 mb-4">
                <AlertCircle className="w-6 h-6" />
                <h4 className="font-bold text-lg">Biên dịch lỗi hoặc Test Fail</h4>
              </div>
              <ul className="space-y-2 text-sm text-red-800 font-mono bg-white p-3 rounded-xl border border-red-100">
                <li>error: 'ledPin' was not declared in this scope</li>
                <li>test: expected HIGH on pin 13, got LOW (Fail)</li>
              </ul>
              <p className="text-sm text-slate-600 mt-6 pt-4 border-t border-red-200/50">
                Hãy sửa lại code và chạy thử lại.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
