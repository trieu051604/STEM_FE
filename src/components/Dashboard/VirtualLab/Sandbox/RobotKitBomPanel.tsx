import { ClipboardList, CheckCircle2 } from 'lucide-react';
import type { LabCircuitComponent } from '@/services/dashboardApi';
import { ROBOT_KIT_COMPONENTS, SUPPORT_LEVEL_BADGE, type RobotKitCategory } from './robotKitComponents';

interface RobotKitBomPanelProps {
  parts?: LabCircuitComponent[];
}

const CATEGORY_LABELS: Record<RobotKitCategory, string> = {
  electronics: 'Điện tử',
  sensor: 'Cảm biến',
  actuator: 'Truyền động',
  'motor-driver': 'Driver động cơ',
  power: 'Nguồn',
  mechanical: 'Cơ khí',
  accessory: 'Phụ kiện',
  'bom-only': 'BOM',
  display: 'Màn hình',
  communication: 'Giao tiếp',
};

const BADGE_STYLE: Record<string, string> = {
  'Mô phỏng được': 'bg-emerald-500/10 text-emerald-400',
  'Kiểm tra nối dây': 'bg-amber-500/10 text-amber-500',
  'Chỉ hiển thị': 'bg-muted text-muted-foreground',
  'Phụ kiện BOM': 'bg-muted text-muted-foreground',
};

export const RobotKitBomPanel = ({ parts = [] }: RobotKitBomPanelProps) => {
  const countByType = parts.reduce<Record<string, number>>((acc, part) => {
    const key = part.type.toLowerCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        <h5 className="text-sm font-bold text-foreground">BOM — Robot giao hàng mini</h5>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Danh sách linh kiện tiêu chuẩn cho bài Robot giao hàng mini (14 mục).
      </p>

      <div className="mt-3 max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
        {ROBOT_KIT_COMPONENTS.map((entry) => {
          const onCanvasCount = entry.componentType ? countByType[entry.componentType] ?? 0 : null;
          const badge = SUPPORT_LEVEL_BADGE[entry.supportLevel];
          const meetsQuantity = onCanvasCount !== null && onCanvasCount >= entry.quantity;

          return (
            <div
              key={entry.displayName}
              className="flex items-start justify-between gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {meetsQuantity && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                  <span className="truncate text-xs font-bold text-foreground">{entry.displayName}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {CATEGORY_LABELS[entry.category]}
                  </span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${BADGE_STYLE[badge]}`}>
                    {badge}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs font-bold text-foreground">
                  {onCanvasCount !== null ? `${onCanvasCount}/` : ''}
                  {entry.quantityLabel ?? entry.quantity}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
