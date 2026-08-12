import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

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
        <h3 className="text-sm font-medium text-foreground">Tiêu chí đánh giá (Rubric)</h3>
        <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
          Tổng điểm: {totalPoints}
        </span>
      </div>

      {criteria.length === 0 ? (
        <div className="text-center p-6 border-2 border-dashed border-border rounded-xl bg-muted/30">
          <p className="text-sm text-muted-foreground mb-3">Chưa có tiêu chí nào. Thêm tiêu chí để giáo viên dễ dàng chấm điểm.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {criteria.map((c) => (
            <div key={c.id} className="flex gap-3 items-start p-4 bg-card border border-border rounded-xl">
              <div className="flex-1 space-y-3">
                <div className="flex gap-3">
                  <Input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateCriteria(c.id, { name: e.target.value })}
                    placeholder="Tên tiêu chí (VD: Trình bày, Nội dung)"
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 w-32">
                    <Input
                      type="number"
                      value={c.maxPoints}
                      onChange={(e) => updateCriteria(c.id, { maxPoints: Number(e.target.value) })}
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">điểm</span>
                  </div>
                </div>
                <Input
                  type="text"
                  value={c.description || ''}
                  onChange={(e) => updateCriteria(c.id, { description: e.target.value })}
                  placeholder="Mô tả yêu cầu đạt điểm tối đa..."
                />
              </div>
              <button type="button" onClick={() => removeCriteria(c.id)} className="text-muted-foreground hover:text-destructive p-2" aria-label="Xoá tiêu chí">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addCriteria} className="w-full border-dashed border-2 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10">
        <Plus className="w-4 h-4 mr-1" /> Thêm tiêu chí
      </Button>
    </div>
  );
};
