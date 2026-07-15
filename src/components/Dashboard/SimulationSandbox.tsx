import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MousePointer2, Move, Copy, Trash2, Code2, Play, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimulationSandboxProps {
  mode: 'teacher' | 'student';
  allowedComponentTypes?: string[];
  initialDiagram?: any;
  onSave?: (diagram: any) => void;
  onTest?: () => void;
}

export const SimulationSandbox: React.FC<SimulationSandboxProps> = ({
  mode,
  allowedComponentTypes,
  onSave,
  onTest
}) => {
  const [activeTab, setActiveTab] = useState<'diagram' | 'code'>('diagram');

  return (
    <div className="flex h-[80vh] min-h-[600px] border border-slate-200 rounded-3xl overflow-hidden shadow-lg bg-slate-50">
      {/* Sidebar: Toolbar & Catalog */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="font-bold text-slate-700">Công cụ</span>
          <div className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-bold uppercase">
            {mode === 'teacher' ? 'Chỉnh sửa' : 'Làm bài'}
          </div>
        </div>
        
        <div className="p-2 border-b border-slate-200 flex gap-2">
          <button className="p-2 rounded hover:bg-slate-100 text-slate-600 tooltip" title="Chọn">
            <MousePointer2 className="w-5 h-5" />
          </button>
          <button className="p-2 rounded hover:bg-slate-100 text-slate-600" title="Di chuyển">
            <Move className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-slate-200 my-auto" />
          <button className="p-2 rounded hover:bg-slate-100 text-slate-600" title="Sao chép">
            <Copy className="w-5 h-5" />
          </button>
          <button className="p-2 rounded hover:bg-red-50 text-red-500" title="Xóa">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            {mode === 'student' ? 'Linh kiện cho phép' : 'Tất cả linh kiện'}
          </h4>
          
          <div className="space-y-3">
            {/* Fake components */}
            <div className="p-3 border border-slate-200 rounded-xl flex items-center gap-3 cursor-grab hover:border-purple-300 hover:bg-purple-50 transition-colors">
              <div className="w-10 h-10 bg-slate-100 rounded-lg" />
              <span className="text-sm font-medium text-slate-700">Arduino Uno</span>
            </div>
            <div className="p-3 border border-slate-200 rounded-xl flex items-center gap-3 cursor-grab hover:border-purple-300 hover:bg-purple-50 transition-colors">
              <div className="w-10 h-10 bg-slate-100 rounded-lg" />
              <span className="text-sm font-medium text-slate-700">Đèn LED</span>
            </div>
            <div className="p-3 border border-slate-200 rounded-xl flex items-center gap-3 cursor-grab hover:border-purple-300 hover:bg-purple-50 transition-colors">
              <div className="w-10 h-10 bg-slate-100 rounded-lg" />
              <span className="text-sm font-medium text-slate-700">Điện trở</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas & Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-between items-center bg-white border-b border-slate-200 px-4 h-14">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('diagram')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === 'diagram' ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Sơ đồ mạch
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === 'code' ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Code2 className="w-4 h-4" />
              Code
            </button>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'student' && (
              <Button onClick={onTest} variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                <Play className="w-4 h-4 mr-2" /> Kiểm tra trước khi nộp
              </Button>
            )}
            <Button onClick={() => onSave?.({})} className="bg-purple-600 hover:bg-purple-700">
              {mode === 'teacher' ? 'Lưu đáp án mẫu' : 'Nộp mạch điện'}
            </Button>
          </div>
        </div>

        <div className="flex-1 relative bg-slate-100 overflow-hidden">
          {activeTab === 'diagram' ? (
            <div className="absolute inset-0 pattern-dots pattern-slate-300 pattern-bg-white pattern-size-4 flex items-center justify-center">
              {/* Fake Wokwi Element rendering area */}
              <div className="text-center bg-white/80 p-6 rounded-2xl backdrop-blur-sm border border-slate-200 shadow-sm">
                <LayoutDashboard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Khu vực kéo thả mạch (Wokwi Elements)</p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-slate-900 flex flex-col">
              <textarea 
                className="flex-1 w-full bg-slate-900 text-slate-300 p-6 font-mono text-sm outline-none resize-none custom-scrollbar leading-relaxed"
                spellCheck={false}
                defaultValue="void setup() {\n  \n}\n\nvoid loop() {\n  \n}"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
