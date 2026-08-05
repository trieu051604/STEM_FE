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

const categoryMeta: Record<string, { label: string; color: string }> = {
  physics: { label: 'VẬT LÝ', color: 'bg-blue-100 text-blue-700' },
  chemistry: { label: 'HÓA HỌC', color: 'bg-emerald-100 text-emerald-700' },
  biology: { label: 'SINH HỌC', color: 'bg-teal-100 text-teal-700' },
  robotics: { label: 'ROBOT', color: 'bg-orange-100 text-orange-700' },
};

const fallbackImage =
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600';

function getCategoryMeta(category: string) {
  return categoryMeta[category] ?? {
    label: category || 'LAB',
    color: 'bg-slate-100 text-slate-700',
  };
}

export const LabCard = ({ lab, canManage, onEdit, onDelete }: LabCardProps) => {
  const navigate = useNavigate();
  const meta = getCategoryMeta(lab.category);
  const studentCount = lab.stats?.studentCount ?? 0;
  const visibleClasses = lab.classes.slice(0, 2);
  const extraClasses = Math.max(0, lab.classes.length - visibleClasses.length);

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-border shadow-sm flex flex-col relative group">
      <div className="h-48 relative overflow-hidden bg-slate-100">
        <img
          src={lab.thumbnailUrl || fallbackImage}
          alt={lab.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span
            className={cn(
              'text-[10px] font-bold px-3 py-1 rounded-full shadow-sm inline-block w-max',
              meta.color
            )}
          >
            {meta.label}
          </span>
          {lab.status === 'draft' && (
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/90 text-slate-600 shadow-sm inline-block w-max">
              BẢN NHÁP
            </span>
          )}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {lab.isWokwiBroken && (
          <div className="mb-3 bg-red-50 text-red-700 border border-red-200 rounded-lg p-2.5 flex items-start gap-2 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <p>Link Wokwi không khả dụng — cần cập nhật lại.</p>
          </div>
        )}

        <h3 className="text-xl font-bold text-[#0f4c5c] mb-2">{lab.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-6">
          {lab.description || 'Chưa có mô tả cho phòng lab này.'}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-[#0f4c5c]">
              <Icon name="User" className="w-4 h-4 text-orange-500" />
              {studentCount} Học sinh
            </div>
            <p className="text-xs text-slate-500">
              {lab.classes.length
                ? lab.classes.map((item) => item.classCode || `Lớp #${item.id}`).join(', ')
                : 'Chưa gán lớp'}
            </p>
          </div>
          <div className="flex -space-x-2">
            {visibleClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="w-6 h-6 rounded-full border-2 border-white bg-cyan-100 flex items-center justify-center text-[8px] font-bold text-cyan-700"
                title={classItem.classCode}
              >
                {(classItem.classCode || 'L').slice(0, 2)}
              </div>
            ))}
            {extraClasses > 0 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-600">
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
            className="flex-1 bg-[#0f4c5c] hover:bg-[#0a3540] text-white py-2.5 rounded-full text-sm font-bold transition-colors"
          >
            Xem Lab
          </button>
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => onEdit?.(lab)}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#0f4c5c] transition-colors"
                aria-label="Sửa phòng lab"
                title="Sửa phòng lab"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(lab)}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
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
