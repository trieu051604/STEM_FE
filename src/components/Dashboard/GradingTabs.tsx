import React, { useState } from 'react';
import { FileText, CheckSquare, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutoCheckResultView, AutoCheckResult } from './AutoCheckResultView';
import { SimulationDiffViewer } from './SimulationDiffViewer';
import { RubricGradingForm } from './RubricGradingForm';
import { RubricCriteria } from './RubricEditor';

interface GradingTabsProps {
  assignmentType: 'quiz' | 'text_report' | 'practical_simulation';
  autoCheckResults?: AutoCheckResult[];
  autoCheckTotalScore?: number;
  autoCheckMaxScore?: number;
  studentDiagram?: any;
  teacherDiagram?: any;
  rubricCriteria?: RubricCriteria[];
  onGradeSubmit?: (grades: any) => void;
}

export const GradingTabs: React.FC<GradingTabsProps> = ({
  assignmentType,
  autoCheckResults = [],
  autoCheckTotalScore = 0,
  autoCheckMaxScore = 0,
  studentDiagram,
  teacherDiagram,
  rubricCriteria = [],
  onGradeSubmit
}) => {
  // Determine tabs based on assignment type
  const hasAutoCheck = assignmentType === 'quiz' || assignmentType === 'practical_simulation';
  const hasManualGrading = assignmentType === 'text_report' || assignmentType === 'practical_simulation';
  const hasDiff = assignmentType === 'practical_simulation';

  const defaultTab = hasAutoCheck ? 'auto' : 'manual';
  const [activeTab, setActiveTab] = useState<'overview' | 'auto' | 'diff' | 'manual'>(defaultTab);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
            activeTab === 'overview' ? "bg-white text-[#0f4c5c] shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          )}
        >
          <BarChart3 className="w-4 h-4" /> Tổng quan
        </button>
        
        {hasAutoCheck && (
          <button
            onClick={() => setActiveTab('auto')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
              activeTab === 'auto' ? "bg-white text-[#0f4c5c] shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            )}
          >
            <CheckSquare className="w-4 h-4" /> Auto-check
          </button>
        )}

        {hasDiff && (
          <button
            onClick={() => setActiveTab('diff')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
              activeTab === 'diff' ? "bg-white text-[#0f4c5c] shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            )}
          >
            <LayoutDashboardIcon className="w-4 h-4" /> Đối chiếu mạch
          </button>
        )}

        {hasManualGrading && (
          <button
            onClick={() => setActiveTab('manual')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
              activeTab === 'manual' ? "bg-white text-[#0f4c5c] shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            )}
          >
            <FileText className="w-4 h-4" /> Chấm tiêu chí
          </button>
        )}
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Tổng quan bài nộp</h3>
            <p className="text-slate-500">Xem tóm tắt thông tin bài nộp, thời gian nộp và trạng thái.</p>
            {/* ... thêm chi tiết overview ... */}
          </div>
        )}

        {activeTab === 'auto' && hasAutoCheck && (
          <AutoCheckResultView 
            results={autoCheckResults} 
            totalScore={autoCheckTotalScore} 
            maxTotalScore={autoCheckMaxScore} 
          />
        )}

        {activeTab === 'diff' && hasDiff && (
          <SimulationDiffViewer 
            studentDiagram={studentDiagram} 
            teacherDiagram={teacherDiagram} 
          />
        )}

        {activeTab === 'manual' && hasManualGrading && (
          <RubricGradingForm 
            criteria={rubricCriteria} 
            onSubmit={onGradeSubmit} 
          />
        )}
      </div>
    </div>
  );
};

function LayoutDashboardIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
