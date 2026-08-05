import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RubricCriteria {
  id: string;
  name: string;
  maxPoints: number;
  description?: string;
}

interface RubricEditorProps {
  initialCriteria?: RubricCriteria[];
  onChange?: (criteria: RubricCriteria[]) => void;
}

export const RubricEditor: React.FC<RubricEditorProps> = ({ initialCriteria = [], onChange }) => {
  const [criteria, setCriteria] = useState<RubricCriteria[]>(initialCriteria);

  const addCriteria = () => {
    const newCriteria: RubricCriteria = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      maxPoints: 10,
    };
    const updated = [...criteria, newCriteria];
    setCriteria(updated);
    onChange?.(updated);
  };

  const removeCriteria = (id: string) => {
    const updated = criteria.filter(c => c.id !== id);
    setCriteria(updated);
    onChange?.(updated);
  };

  const updateCriteria = (id: string, updates: Partial<RubricCriteria>) => {
    const updated = criteria.map(c => c.id === id ? { ...c, ...updates } : c);
    setCriteria(updated);
    onChange?.(updated);
  };

  const totalPoints = criteria.reduce((sum, c) => sum + (Number(c.maxPoints) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-slate-700">Tiêu chí đánh giá (Rubric)</h3>
        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Tổng điểm: {totalPoints}
        </span>
      </div>

      {criteria.length === 0 ? (
        <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <p className="text-sm text-slate-500 mb-3">Chưa có tiêu chí nào. Thêm tiêu chí để giáo viên dễ dàng chấm điểm.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {criteria.map((c, index) => (
            <div key={c.id} className="flex gap-3 items-start p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="flex-1 space-y-3">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateCriteria(c.id, { name: e.target.value })}
                    placeholder="Tên tiêu chí (VD: Trình bày, Nội dung)"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-2 w-32">
                    <input
                      type="number"
                      value={c.maxPoints}
                      onChange={(e) => updateCriteria(c.id, { maxPoints: Number(e.target.value) })}
                      min="0"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                    <span className="text-sm text-slate-500">điểm</span>
                  </div>
                </div>
                <input
                  type="text"
                  value={c.description || ''}
                  onChange={(e) => updateCriteria(c.id, { description: e.target.value })}
                  placeholder="Mô tả yêu cầu đạt điểm tối đa..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-slate-50"
                />
              </div>
              <button type="button" onClick={() => removeCriteria(c.id)} className="text-slate-400 hover:text-red-500 p-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addCriteria} className="w-full border-dashed border-2 text-blue-600 border-blue-200 hover:bg-blue-50">
        <Plus className="w-4 h-4 mr-1" /> Thêm tiêu chí
      </Button>
    </div>
  );
};
