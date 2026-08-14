import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SerialMonitorPanelProps {
  output: string;
  onClear: () => void;
}

// Log hệ thống ([compile]/[simulation]/[error], xem appendSystemLog() ở
// LabSandboxPage.tsx) và serial output THẬT từ firmware dùng chung 1 stream
// (state serialOutput) — phân biệt bằng prefix ở đầu dòng, không phải field
// riêng, để không phải đổi shape SimulationEventEntity/API nào. Serial output
// thật KHÔNG có prefix nào (giữ nguyên hiển thị như cũ, đúng yêu cầu "Serial
// output thật từ firmware vẫn phải hiển thị như cũ").
// WiFi/Cloud Phase 1 — "[cloud] topic = value" là dòng raw serial THẬT
// (QemuEsp32Runner.cs forward SF_CLOUD_EVENT/SF_CLOUD_LOG thành type="serial"
// đọc được, xem TryParseSfCloudEvent/TryParseSfCloudLog), KHÔNG phải log hệ
// thống [compile]/[simulation] — vẫn tô riêng màu để dễ phân biệt theo đúng
// yêu cầu "highlight nhưng vẫn giữ raw serial để debug" (dòng gốc không bị
// ẩn/đổi nội dung, chỉ đổi màu hiển thị).
const LINE_COLOR_BY_PREFIX: Array<{ prefix: string; className: string }> = [
  { prefix: '[error]', className: 'text-red-400' },
  { prefix: '[compile]', className: 'text-cyan-400' },
  { prefix: '[simulation]', className: 'text-amber-300' },
  { prefix: '[cloud]', className: 'text-sky-300' },
];

// "--- Compile ---"/"--- Simulation started ---" — dòng phân cách trần
// (appendRawLine() ở LabSandboxPage.tsx), tô riêng 1 màu trung tính + đậm để
// tách rõ khỏi cả log hệ thống [prefix] lẫn raw serial thật bên dưới.
function isSeparatorLine(line: string): boolean {
  return line.startsWith('--- ') && line.endsWith(' ---');
}

function getLineClassName(line: string): string {
  if (isSeparatorLine(line)) return 'text-slate-400 font-bold';
  const match = LINE_COLOR_BY_PREFIX.find((entry) => line.startsWith(entry.prefix));
  return match ? match.className : 'text-green-400';
}

export const SerialMonitorPanel = ({ output, onClear }: SerialMonitorPanelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [output]);

  const lines = output.split('\n');

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] rounded-2xl overflow-hidden border border-slate-700 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-slate-700">
        <div className="flex items-center gap-2 text-slate-300">
          <Terminal className="w-4 h-4" />
          <span className="font-semibold text-xs tracking-wider uppercase">Serial Monitor</span>
        </div>
        
        <Button 
          onClick={onClear}
          variant="ghost" 
          size="sm" 
          className="h-8 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Xóa log
        </Button>
      </div>
      
      {/* Output Area */}
      <div
        ref={containerRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-sm whitespace-pre-wrap break-words"
      >
        {output ? (
          lines.map((line, index) => (
            <div key={index} className={getLineClassName(line)}>
              {line || ' '}
            </div>
          ))
        ) : (
          <span className="text-slate-600 italic">Waiting for serial data...</span>
        )}
      </div>

    </div>
  );
};
