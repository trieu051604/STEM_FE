import React from 'react';
import Editor from '@monaco-editor/react';
import { FileCode2, Play, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeEditorPanelProps {
  code: string;
  onChange: (value: string | undefined) => void;
  onRun: () => void;
  onStop: () => void;
  isRunning: boolean;
  isCompiling: boolean;
  compileError: string | null;
}

export const CodeEditorPanel = ({
  code,
  onChange,
  onRun,
  onStop,
  isRunning,
  isCompiling,
  compileError
}: CodeEditorPanelProps) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-300">
          <FileCode2 className="w-5 h-5 text-emerald-500" />
          <span className="font-semibold text-sm">sketch.ino</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button 
              onClick={onStop} 
              size="sm" 
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4"
            >
              <Square className="w-4 h-4 mr-2" />
              Dừng mô phỏng
            </Button>
          ) : (
            <Button 
              onClick={onRun} 
              disabled={isCompiling}
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4"
            >
              {isCompiling ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isCompiling ? 'Đang biên dịch...' : 'Chạy mô phỏng'}
            </Button>
          )}
        </div>
      </div>
      
      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          defaultLanguage="cpp"
          theme="vs-dark"
          value={code}
          onChange={onChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
          }}
        />
      </div>

      {/* Compile Error Panel */}
      {compileError && (
        <div className="bg-red-950/80 border-t border-red-900 p-4 max-h-[150px] overflow-y-auto">
          <h4 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">Lỗi biên dịch:</h4>
          <pre className="text-red-300 text-sm font-mono whitespace-pre-wrap">
            {compileError}
          </pre>
        </div>
      )}

    </div>
  );
};
