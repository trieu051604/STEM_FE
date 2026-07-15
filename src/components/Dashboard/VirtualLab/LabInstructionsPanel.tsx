import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface LabInstructionsPanelProps {
  title?: string;
  instructions: React.ReactNode;
}

export const LabInstructionsPanel = ({ title = "Hướng dẫn thí nghiệm", instructions }: LabInstructionsPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2 font-bold text-[#0f4c5c]">
          <BookOpen className="w-5 h-5" />
          {title}
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
      </button>
      
      {isExpanded && (
        <div className="p-5 border-t border-border prose prose-sm max-w-none text-slate-700">
          {instructions}
        </div>
      )}
    </div>
  );
};
