import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { LabEntity } from '@/services/dashboardApi';

interface LabCardProps {
  lab: LabEntity;
  canManage?: boolean;
  onEdit?: (lab: LabEntity) => void;
  onDelete?: (lab: LabEntity) => void;
}

// Badge này đè lên ảnh thumbnail thật (độ sáng/màu bất định), không phải trên bg-card —
// nền phải gần như đặc (không dùng opacity thấp kiểu /10) để luôn đọc được bất kể ảnh nền.
const categoryMeta: Record<string, { label: string; color: string }> = {
  physics: { label: 'Vật lý', color: 'bg-slate-950/80 backdrop-blur-sm text-blue-300 border border-blue-400/30' },
  chemistry: { label: 'Hóa học', color: 'bg-slate-950/80 backdrop-blur-sm text-emerald-300 border border-emerald-400/30' },
  biology: { label: 'Sinh học', color: 'bg-slate-950/80 backdrop-blur-sm text-teal-300 border border-teal-400/30' },
  robotics: { label: 'Robot', color: 'bg-slate-950/80 backdrop-blur-sm text-orange-300 border border-orange-400/30' },
};

const fallbackImage =
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600';

function getCategoryMeta(category: string) {
  return categoryMeta[category] ?? {
    label: category || 'LAB',
    color: 'bg-slate-950/80 backdrop-blur-sm text-slate-200 border border-white/20',
  };
}

export const LabCard = ({ lab, canManage, onEdit, onDelete }: LabCardProps) => {
  const navigate = useNavigate();
  const meta = getCategoryMeta(lab.category);
  const studentCount = lab.stats?.studentCount ?? 0;
  const visibleClasses = lab.classes.slice(0, 2);
  const extraClasses = Math.max(0, lab.classes.length - visibleClasses.length);

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border flex flex-col relative group hover:border-indigo-500/40 transition-colors">
      <div className="h-48 relative overflow-hidden bg-muted">
        <img
          src={lab.thumbnailUrl || fallbackImage}
          alt={lab.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span
            className={cn(
              'text-xs font-semibold px-3 py-1 rounded-full inline-block w-max',
              meta.color
            )}
          >
            {meta.label}
          </span>
          {lab.status === 'draft' && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-sm text-amber-300 border border-amber-400/30 inline-block w-max">
              Bản nháp
            </span>
          )}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {lab.isWokwiBroken && (
          <div className="mb-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-2.5 flex items-start gap-2 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Link Wokwi không khả dụng — cần cập nhật lại.</p>
          </div>
        )}

        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">{lab.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-6">
          {lab.description || 'Chưa có mô tả cho phòng lab này.'}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
              <Icon name="User" className="w-4 h-4 text-amber-500" />
              {studentCount} Học sinh
            </div>
            <p className="text-xs text-muted-foreground">
              {lab.classes.length
                ? lab.classes.map((item) => item.classCode || `Lớp #${item.id}`).join(', ')
                : 'Chưa gán lớp'}
            </p>
          </div>
          <div className="flex -space-x-2">
            {visibleClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="w-6 h-6 rounded-full border-2 border-card bg-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-300"
                title={classItem.classCode}
              >
                {(classItem.classCode || 'L').slice(0, 2)}
              </div>
            ))}
            {extraClasses > 0 && (
              <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                +{extraClasses}
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-border my-5" />

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/virtual-lab/${lab.id}`)}
            className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Xem Lab
          </button>
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => onEdit?.(lab)}
                className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Sửa phòng lab"
                title="Sửa phòng lab"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(lab)}
                className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Xóa phòng lab"
                title="Xóa phòng lab"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
