import React, { useEffect } from 'react';
import { RotateCw, Trash2 } from 'lucide-react';

export interface ColorOption {
  name: string;
  value: string;
  hex: string;
}

// Metadata màu khả dụng theo từng loại linh kiện (key = normalized type từ
// CircuitCanvas.normalizeComponentType). Chỉ LED có màu thật sự đổi được ở
// @wokwi/elements hiện tại; thêm entry mới ở đây là đủ để mở rộng loại khác.
export const COMPONENT_COLOR_OPTIONS: Record<string, { label: string; options: ColorOption[] }> = {
  led: {
    label: 'LED',
    options: [
      { name: 'Đỏ', value: 'red', hex: '#ef4444' },
      { name: 'Xanh lá', value: 'green', hex: '#22c55e' },
      { name: 'Xanh dương', value: 'blue', hex: '#3b82f6' },
      { name: 'Vàng', value: 'yellow', hex: '#eab308' },
      { name: 'Cam', value: 'orange', hex: '#f97316' },
      { name: 'Trắng', value: 'white', hex: '#f8fafc' },
      { name: 'Tím', value: 'purple', hex: '#a855f7' },
      { name: 'Hồng', value: 'pink', hex: '#ec4899' },
      { name: 'Xanh ngọc', value: 'cyan', hex: '#06b6d4' },
    ],
  },
};

// Bảng màu dây theo quy ước điện thực tế (đen=GND, đỏ=nguồn lên đầu vì dùng
// thường xuyên nhất), khác với bảng màu linh kiện ở trên — đây là 2 khái niệm
// riêng: màu SƠN của 1 linh kiện (LED) vs màu DÂY DẪN nối 2 chân.
export const WIRE_COLOR_OPTIONS: ColorOption[] = [
  { name: 'Đen (GND)', value: 'black', hex: '#111827' },
  { name: 'Đỏ (Nguồn)', value: 'red', hex: '#ef4444' },
  { name: 'Xanh lá', value: 'green', hex: '#22c55e' },
  { name: 'Xanh dương', value: 'blue', hex: '#3b82f6' },
  { name: 'Vàng', value: 'yellow', hex: '#eab308' },
  { name: 'Cam', value: 'orange', hex: '#f97316' },
  { name: 'Tím', value: 'purple', hex: '#a855f7' },
  { name: 'Xám', value: 'gray', hex: '#9ca3af' },
  { name: 'Hồng', value: 'pink', hex: '#ec4899' },
];

interface ColorTarget {
  partId: string;
  typeLabel: string;
  currentColor?: string;
}

interface ToolbarProps {
  // Contextual color picker — chỉ hiện khi đang chọn 1 linh kiện có màu
  selectedColorTarget: ColorTarget | null;
  colorOptions?: ColorOption[];
  onChangeColor?: (color: string) => void;
  // Contextual color picker cho dây nối — chỉ hiện khi đang chọn 1 dây, và
  // chỉ khi KHÔNG có linh kiện nào đang chọn màu (2 thanh loại trừ lẫn nhau)
  selectedWireColor?: string | null;
  onChangeWireColor?: (color: string) => void;
  // Actions
  onDelete?: () => void;
  onRotate?: () => void;
  hasSelection?: boolean;
}

export const Toolbar = ({
  selectedColorTarget,
  colorOptions,
  onChangeColor,
  selectedWireColor,
  onChangeWireColor,
  onDelete,
  onRotate,
  hasSelection,
}: ToolbarProps) => {
  // Phím tắt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (hasSelection && onDelete) onDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDelete, hasSelection]);

  const showColorPicker = selectedColorTarget && colorOptions && colorOptions.length > 0 && onChangeColor;
  const showWireColorPicker = !showColorPicker && selectedWireColor != null && onChangeWireColor;

  return (
    <div
      className="absolute top-0 left-0 right-0 h-12 bg-[#2d2d2d] border-b border-[#1a1a1a] flex items-center px-4 z-50 shadow-md gap-3"
      // Toolbar là lớp UI chrome nổi trên canvas, không phải bề mặt vẽ mạch —
      // chặn pointerdown ở đây để không lọt xuống onPointerDown của canvas
      // (handlePointerDownBackground), nếu không mọi click vào nút màu/xoay/
      // xoá sẽ bị coi là "click nền" và bỏ chọn linh kiện/dây NGAY TRƯỚC KHI
      // sự kiện click thực sự chạy (pointerdown luôn bắn trước click), khiến
      // thao tác đổi màu/xoay/xoá bị mất hoặc chạy nhầm state đã cũ.
      onPointerDown={(e) => e.stopPropagation()}
    >

      {/* Contextual color picker — chỉ hiện khi chọn linh kiện có màu */}
      {showColorPicker && (
        <div className="flex gap-1 items-center">
          <span className="text-[10px] text-gray-400 mr-1 font-semibold uppercase tracking-wider">
            Màu {selectedColorTarget.typeLabel}:
          </span>
          {colorOptions.map((c) => (
            <button
              key={c.value}
              onClick={() => onChangeColor(c.value)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                selectedColorTarget.currentColor === c.value
                  ? 'border-white scale-110 ring-2 ring-white/30'
                  : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>
      )}

      {/* Contextual color picker — chỉ hiện khi chọn 1 dây nối */}
      {showWireColorPicker && (
        <div className="flex gap-1 items-center">
          <span className="text-[10px] text-gray-400 mr-1 font-semibold uppercase tracking-wider">
            Màu dây:
          </span>
          {WIRE_COLOR_OPTIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => onChangeWireColor(c.value)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                selectedWireColor === c.value
                  ? 'border-white scale-110 ring-2 ring-white/30'
                  : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>
      )}

      {!showColorPicker && !showWireColorPicker && (
        <span className="text-xs text-gray-500 italic select-none">
          Chọn linh kiện có màu (VD: LED) hoặc 1 dây nối để đổi màu
        </span>
      )}

      <div className="flex-1" />

      {/* Tool buttons */}
      <div className="flex gap-1 items-center">
        <button
          onClick={onRotate}
          disabled={!hasSelection}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            hasSelection ? 'text-gray-400 hover:text-white hover:bg-[#444]' : 'text-gray-600 cursor-not-allowed'
          }`}
          title="Xoay (Rotate)"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          onClick={onDelete}
          disabled={!hasSelection}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            hasSelection ? 'text-gray-400 hover:text-red-400 hover:bg-[#444]' : 'text-gray-600 cursor-not-allowed'
          }`}
          title="Xóa (Delete)"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
