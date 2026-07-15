import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SerialMonitorPanelProps {
  output: string;
  onClear: () => void;
}

export const SerialMonitorPanel = ({ output, onClear }: SerialMonitorPanelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [output]);

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
        className="flex-1 p-4 overflow-y-auto font-mono text-sm text-green-400 whitespace-pre-wrap break-words"
      >
        {output || <span className="text-slate-600 italic">Waiting for serial data...</span>}
      </div>

    </div>
  );
};
