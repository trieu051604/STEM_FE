import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AutoCheckResult {
  id: string;
  name: string; // Tên tiêu chí hoặc kịch bản
  passed: boolean;
  score: number;
  maxScore: number;
  message?: string; // Thông báo lỗi nếu fail
}

interface AutoCheckResultViewProps {
  results: AutoCheckResult[];
  totalScore: number;
  maxTotalScore: number;
}

export const AutoCheckResultView: React.FC<AutoCheckResultViewProps> = ({ results, totalScore, maxTotalScore }) => {
  const passPercentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;
  const isPassed = passPercentage >= 50;

  return (
    <div className="space-y-6">
      <div className={cn(
        "flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl border",
        isPassed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
      )}>
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            isPassed ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
          )}>
            {isPassed ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
          </div>
          <div>
            <h3 className={cn("text-xl font-bold", isPassed ? "text-emerald-800" : "text-red-800")}>
              {isPassed ? "Đạt yêu cầu tự động" : "Chưa đạt yêu cầu tự động"}
            </h3>
            <p className={cn("text-sm", isPassed ? "text-emerald-600" : "text-red-600")}>
              Hệ thống đã kiểm tra kịch bản test.
            </p>
          </div>
        </div>
        <div className="text-center md:text-right">
          <div className="text-sm text-slate-500 mb-1">Điểm Auto-check</div>
          <div className="text-4xl font-black text-slate-800">
            {totalScore}<span className="text-xl text-slate-400">/{maxTotalScore}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h4 className="font-bold text-slate-700">Chi tiết kết quả kiểm tra</h4>
        </div>
        <div className="divide-y divide-slate-100">
          {results.map((result) => (
            <div key={result.id} className="p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3 w-48 shrink-0">
                {result.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={cn(
                  "font-semibold text-sm",
                  result.passed ? "text-emerald-700" : "text-red-700"
                )}>
                  {result.passed ? "Pass" : "Fail"}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm mb-1">{result.name}</p>
                {result.message && !result.passed && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg font-mono">
                    {result.message}
                  </p>
                )}
              </div>
              <div className="text-right w-24 shrink-0 font-bold text-slate-700">
                {result.score} <span className="text-slate-400 font-normal text-sm">/ {result.maxScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
