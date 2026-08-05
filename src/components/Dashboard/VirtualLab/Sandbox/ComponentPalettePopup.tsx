import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { ComponentGlueRegistryEntity } from '@/services/dashboardApi';
import {
  getComponentCategory,
  getComponentReference,
  PALETTE_CATEGORY_ORDER,
  type PaletteCategory,
} from './componentReferenceCatalog';
import { getComponentIllustration } from './componentIllustrations';

interface ComponentPalettePopupProps {
  open: boolean;
  onClose: () => void;
  componentOptions: ComponentGlueRegistryEntity[];
  onSelect: (componentType: string) => void;
}

// Badge — bắt buộc khớp ĐÚNG supportLevel thật (xem componentReferenceCatalog.ts
// và robotKitComponents.ts), không tự vẽ màu theo cảm tính riêng ở đây.
const BADGE_STYLE: Record<string, string> = {
  'Mô phỏng được': 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300',
  'Kiểm tra nối dây': 'border-amber-500/50 bg-amber-500/15 text-amber-300',
  'Chỉ hiển thị': 'border-slate-500/50 bg-slate-500/15 text-slate-300',
  'Phụ kiện BOM': 'border-slate-500/50 bg-slate-500/15 text-slate-300',
};

// Wokwi-style palette popup — nền tối, search trên cùng, category dạng thanh
// đen, item icon+tên+badge. Nguồn dữ liệu là componentReferenceCatalog.ts
// (label/icon/badge) + componentOptions (BE ComponentGlueRegistry, quyết định
// component nào THẬT SỰ được phép thêm — giống đúng nguồn mà sidebar cũ trong
// CircuitBuilderTeacherMode.tsx đang dùng, không hardcode danh sách riêng).
export const ComponentPalettePopup = ({ open, onClose, componentOptions, onSelect }: ComponentPalettePopupProps) => {
  const [search, setSearch] = useState('');

  const supported = useMemo(
    () => componentOptions.filter((component) => component.supported),
    [componentOptions]
  );

  const grouped = useMemo(() => {
    const query = search.trim().toLowerCase();
    const map = new Map<PaletteCategory, typeof supported>();
    for (const option of supported) {
      const reference = getComponentReference(option.componentType);
      const category = getComponentCategory(option.componentType);
      const haystack = `${option.label} ${reference.label} ${option.componentType} ${category}`.toLowerCase();
      if (query && !haystack.includes(query)) continue;
      if (!map.has(category)) map.set(category, []);
      map.get(category)!.push(option);
    }
    return map;
  }, [supported, search]);

  const totalMatches = useMemo(
    () => Array.from(grouped.values()).reduce((sum, list) => sum + list.length, 0),
    [grouped]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-[600px] w-full max-w-[420px] flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#1e1e1e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-700 bg-[#171717] px-4 py-3">
          <h3 className="text-sm font-bold text-slate-100">Thêm linh kiện</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-100"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-700 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm linh kiện..."
              className="w-full rounded-md border border-slate-600 bg-[#2a2a2a] py-2 pl-8 pr-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {PALETTE_CATEGORY_ORDER.filter((category) => (grouped.get(category)?.length ?? 0) > 0).map((category) => (
            <div key={category}>
              <div className="sticky top-0 z-10 bg-black px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                {category}
              </div>
              {grouped.get(category)!.map((option) => {
                const reference = getComponentReference(option.componentType);
                const Icon = reference.icon;
                const illustration = getComponentIllustration(option.componentType);
                return (
                  <button
                    key={option.componentType}
                    type="button"
                    onClick={() => onSelect(option.componentType)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-700/60 focus:bg-teal-500/20 focus:outline-none"
                  >
                    {illustration ? (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-600 bg-slate-800">
                        {illustration}
                      </span>
                    ) : (
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${reference.iconClassName}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-100">
                        {option.label || reference.label}
                      </span>
                    </span>
                    {reference.badge && (
                      <span
                        className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${
                          BADGE_STYLE[reference.badge] ?? BADGE_STYLE['Chỉ hiển thị']
                        }`}
                      >
                        {reference.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {totalMatches === 0 && (
            <div className="px-4 py-8 text-center text-xs text-slate-500">
              Không tìm thấy linh kiện khớp &quot;{search}&quot;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
