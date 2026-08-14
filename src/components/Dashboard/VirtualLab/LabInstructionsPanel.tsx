import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface LabInstructionsPanelProps {
  title?: string;
  instructions: React.ReactNode;
}

export const LabInstructionsPanel = ({ title = "Hướng dẫn thí nghiệm", instructions }: LabInstructionsPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full flex items-center justify-between p-4 bg-muted/40 hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          {title}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="p-5 border-t border-border prose prose-sm prose-invert max-w-none text-muted-foreground">
          {instructions}
        </div>
      )}
    </div>
  );
};
