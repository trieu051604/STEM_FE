import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export interface TestScenario {
  id: string;
  pin: string;
  expectedValue: string;
  description: string;
}

interface ScenarioBuilderProps {
  scenarios: TestScenario[];
  onChange: (scenarios: TestScenario[]) => void;
}

export const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({ scenarios, onChange }) => {
  const addScenario = () => {
    onChange([
      ...scenarios,
      { id: Math.random().toString(36).substr(2, 9), pin: '', expectedValue: '', description: '' }
    ]);
  };

  const removeScenario = (id: string) => {
    onChange(scenarios.filter(s => s.id !== id));
  };

  const updateScenario = (id: string, updates: Partial<TestScenario>) => {
    onChange(scenarios.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-foreground">Kịch bản Auto-check (Expectations)</h3>
      </div>

      {scenarios.length === 0 ? (
        <div className="text-center p-6 border border-border rounded-xl bg-muted/30">
          <p className="text-sm text-muted-foreground mb-3">Chưa có điều kiện kiểm tra nào.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left text-muted-foreground">
            <thead className="bg-muted/30 text-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Chân/Tín hiệu (Pin)</th>
                <th className="px-4 py-3 font-medium">Giá trị kỳ vọng</th>
                <th className="px-4 py-3 font-medium">Mô tả test case</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(s => (
                <tr key={s.id} className="border-b border-border bg-card">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={s.pin}
                      onChange={(e) => updateScenario(s.id, { pin: e.target.value })}
                      placeholder="VD: 13, A0, Serial..."
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={s.expectedValue}
                      onChange={(e) => updateScenario(s.id, { expectedValue: e.target.value })}
                      placeholder="VD: HIGH, 1023, 'Hello'"
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={s.description}
                      onChange={(e) => updateScenario(s.id, { description: e.target.value })}
                      placeholder="Ghi chú lỗi nếu sai..."
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => removeScenario(s.id)} className="text-muted-foreground hover:text-destructive" aria-label="Xoá điều kiện">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addScenario} className="w-full border-dashed border-2 text-purple-400 border-purple-500/30 hover:bg-purple-500/10">
        <Plus className="w-4 h-4 mr-1" /> Thêm điều kiện test
      </Button>
    </div>
  );
};
