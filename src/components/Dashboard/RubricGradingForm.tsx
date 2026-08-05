import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, MessageSquare } from 'lucide-react';
import { RubricCriteria } from './RubricEditor';

interface RubricGradingFormProps {
  criteria: RubricCriteria[];
  onSubmit?: (grades: Record<string, { score: number; comment: string }>) => void;
  onCancel?: () => void;
}

export const RubricGradingForm: React.FC<RubricGradingFormProps> = ({ criteria, onSubmit, onCancel }) => {
  const [grades, setGrades] = useState<Record<string, { score: number; comment: string }>>({});

  const updateGrade = (id: string, field: 'score' | 'comment', value: any) => {
    setGrades(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const totalScore = Object.values(grades).reduce((sum, g) => sum + (Number(g?.score) || 0), 0);
  const maxTotalScore = criteria.reduce((sum, c) => sum + c.maxPoints, 0);

  const handleSubmit = () => {
    onSubmit?.(grades);
  };

  if (!criteria || criteria.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800">Không có Rubric</h3>
        <p className="text-slate-500 mt-2">Bài tập này không cấu hình tiêu chí chấm điểm chi tiết.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-[#0f4c5c]">Chấm điểm theo tiêu chí</h2>
          <p className="text-slate-500 text-sm mt-1">Đánh giá bài làm dựa trên Rubric đã cấu hình.</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-slate-500 mb-1">Tổng điểm tay</div>
          <div className="text-4xl font-black text-blue-600">
            {totalScore}<span className="text-xl text-slate-400">/{maxTotalScore}</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {criteria.map((c, index) => {
          const currentScore = grades[c.id]?.score || 0;
          const currentComment = grades[c.id]?.comment || '';

          return (
            <div key={c.id} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-blue-300 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    <span className="text-blue-600 mr-2">#{index + 1}</span>
                    {c.name}
                  </h3>
                  {c.description && <p className="text-sm text-slate-500 mt-1">{c.description}</p>}
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                  <input
                    type="number"
                    value={currentScore}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      if (val > c.maxPoints) val = c.maxPoints;
                      if (val < 0) val = 0;
                      updateGrade(c.id, 'score', val);
                    }}
                    min="0"
                    max={c.maxPoints}
                    className="w-16 bg-white border border-blue-200 rounded text-center font-bold text-blue-700 outline-none focus:border-blue-500"
                  />
                  <span className="text-sm font-semibold text-blue-800">/ {c.maxPoints}</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute top-3 left-3 text-slate-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <textarea
                  value={currentComment}
                  onChange={(e) => updateGrade(c.id, 'comment', e.target.value)}
                  placeholder="Nhận xét cho tiêu chí này (tùy chọn)..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 transition-colors resize-none"
                  rows={2}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} className="rounded-xl px-6">Hủy</Button>
        <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8 font-bold">
          <Check className="w-5 h-5 mr-2" /> Hoàn tất chấm điểm
        </Button>
      </div>
    </div>
  );
};
