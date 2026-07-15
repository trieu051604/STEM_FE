import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Giả lập danh sách component từ @wokwi/elements
const AVAILABLE_COMPONENTS = [
  { id: 'wokwi-resistor', name: 'Điện trở', category: 'Cơ bản' },
  { id: 'wokwi-led', name: 'Đèn LED', category: 'Cơ bản' },
  { id: 'wokwi-pushbutton', name: 'Nút nhấn', category: 'Cơ bản' },
  { id: 'wokwi-potentiometer', name: 'Biến trở', category: 'Cơ bản' },
  { id: 'wokwi-servo', name: 'Servo Motor', category: 'Động cơ' },
  { id: 'wokwi-dht22', name: 'Cảm biến DHT22', category: 'Cảm biến' },
  { id: 'wokwi-lcd1602', name: 'Màn hình LCD 16x2', category: 'Hiển thị' },
];

interface ComponentCatalogPickerProps {
  selectedComponentIds: string[];
  onChange: (ids: string[]) => void;
}

export const ComponentCatalogPicker: React.FC<ComponentCatalogPickerProps> = ({ selectedComponentIds, onChange }) => {
  const toggleComponent = (id: string) => {
    if (selectedComponentIds.includes(id)) {
      onChange(selectedComponentIds.filter(c => c !== id));
    } else {
      onChange([...selectedComponentIds, id]);
    }
  };

  const selectAll = () => onChange(AVAILABLE_COMPONENTS.map(c => c.id));
  const deselectAll = () => onChange([]);

  const isAllSelected = selectedComponentIds.length === AVAILABLE_COMPONENTS.length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-700">Danh sách linh kiện cho phép</span>
        <button
          type="button"
          onClick={isAllSelected ? deselectAll : selectAll}
          className="text-xs text-purple-600 hover:underline font-medium"
        >
          {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </button>
      </div>
      <div className="p-2 max-h-48 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {AVAILABLE_COMPONENTS.map(comp => {
            const isSelected = selectedComponentIds.includes(comp.id);
            return (
              <div
                key={comp.id}
                onClick={() => toggleComponent(comp.id)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all text-sm",
                  isSelected ? "bg-purple-50 border-purple-200" : "bg-white border-slate-100 hover:border-slate-300"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  isSelected ? "bg-purple-600 border-purple-600 text-white" : "border-slate-300 bg-white"
                )}>
                  {isSelected && <Check className="w-3 h-3" />}
                </div>
                <div className="truncate flex-1">
                  <span className={cn("block truncate", isSelected ? "text-purple-700 font-medium" : "text-slate-600")}>
                    {comp.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
