import React from 'react';
import { LayoutDashboard } from 'lucide-react';

interface SimulationDiffViewerProps {
  studentDiagram: any;
  teacherDiagram: any;
}

export const SimulationDiffViewer: React.FC<SimulationDiffViewerProps> = ({ studentDiagram, teacherDiagram }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800">Đối chiếu sơ đồ mạch</h3>
        <p className="text-sm text-slate-500">Kéo và zoom để xem chi tiết kết nối.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-semibold text-slate-700 flex justify-between">
            <span>Bài làm của học sinh</span>
          </div>
          <div className="h-[400px] relative bg-slate-100 pattern-dots pattern-slate-300 pattern-bg-white pattern-size-4 flex items-center justify-center">
            {/* Fake Wokwi Element rendering area */}
            <div className="text-center bg-white/80 p-4 rounded-xl backdrop-blur-sm border border-slate-200 shadow-sm">
              <LayoutDashboard className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500 font-medium text-sm">Sơ đồ mạch học sinh nộp</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-200 font-semibold text-emerald-800 flex justify-between">
            <span>Đáp án mẫu (Giáo viên)</span>
            <span className="text-xs bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">Gợi ý chấm</span>
          </div>
          <div className="h-[400px] relative bg-slate-100 pattern-dots pattern-slate-300 pattern-bg-white pattern-size-4 flex items-center justify-center">
            {/* Fake Wokwi Element rendering area */}
            <div className="text-center bg-white/80 p-4 rounded-xl backdrop-blur-sm border border-slate-200 shadow-sm">
              <LayoutDashboard className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-emerald-700 font-medium text-sm">Sơ đồ mạch mẫu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
