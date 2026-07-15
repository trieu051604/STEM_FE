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
        <h3 className="text-sm font-semibold text-slate-700">Kịch bản Auto-check (Expectations)</h3>
      </div>
      
      {scenarios.length === 0 ? (
        <div className="text-center p-6 border border-slate-200 rounded-xl bg-slate-50">
          <p className="text-sm text-slate-500 mb-3">Chưa có điều kiện kiểm tra nào.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Chân/Tín hiệu (Pin)</th>
                <th className="px-4 py-3 font-semibold">Giá trị kỳ vọng</th>
                <th className="px-4 py-3 font-semibold">Mô tả test case</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(s => (
                <tr key={s.id} className="border-b border-slate-100 bg-white">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={s.pin}
                      onChange={(e) => updateScenario(s.id, { pin: e.target.value })}
                      placeholder="VD: 13, A0, Serial..."
                      className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm outline-none focus:border-purple-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={s.expectedValue}
                      onChange={(e) => updateScenario(s.id, { expectedValue: e.target.value })}
                      placeholder="VD: HIGH, 1023, 'Hello'"
                      className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm outline-none focus:border-purple-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={s.description}
                      onChange={(e) => updateScenario(s.id, { description: e.target.value })}
                      placeholder="Ghi chú lỗi nếu sai..."
                      className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm outline-none focus:border-purple-500"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => removeScenario(s.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addScenario} className="w-full border-dashed border-2 text-purple-600 border-purple-200 hover:bg-purple-50">
        <Plus className="w-4 h-4 mr-1" /> Thêm điều kiện test
      </Button>
    </div>
  );
};
