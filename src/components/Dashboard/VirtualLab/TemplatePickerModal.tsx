import { X } from 'lucide-react';
import {
  VIRTUAL_LAB_SAMPLE_EXERCISES,
  type VirtualLabSampleExercise,
} from '@/data/virtualLabSampleExercises';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: VirtualLabSampleExercise) => void;
}

const levelLabel: Record<string, string> = {
  beginner: 'Cơ bản',
  intermediate: 'Trung bình',
};

const levelClass: Record<string, string> = {
  beginner: 'bg-emerald-50 text-emerald-700',
  intermediate: 'bg-amber-50 text-amber-700',
};

// Linh kiện cơ khí/hiển thị thuần — không có chân điện, không vào netlist (xem
// VirtualLabDiagramService.cs SupportedPins — các type này KHÔNG có entry).
const VISUAL_ONLY_TYPES = new Set([
  'wokwi-robot-chassis',
  'wokwi-robot-wheel',
  'wokwi-caster-wheel',
  'wokwi-delivery-box',
  'wokwi-breadboard',
]);

function hasVisualOnlyComponent(exercise: VirtualLabSampleExercise) {
  return exercise.components.some((type) => VISUAL_ONLY_TYPES.has(type));
}

export const TemplatePickerModal = ({ isOpen, onClose, onSelect }: TemplatePickerModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[#0f4c5c]">Chọn bài tập mẫu</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {VIRTUAL_LAB_SAMPLE_EXERCISES.length} bài mẫu StemFlow Virtual Lab — đã có sẵn
              code + sơ đồ mạch, chạy được ngay bằng Run.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {VIRTUAL_LAB_SAMPLE_EXERCISES.map((exercise) => (
            <div
              key={exercise.slug}
              className="rounded-2xl border border-border p-5 flex flex-col gap-3 hover:border-[#0f4c5c]/40 transition-colors"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                    levelClass[exercise.level] ?? 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {levelLabel[exercise.level] ?? exercise.level}
                </span>
                <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-cyan-50 text-cyan-700">
                  {exercise.estimatedTimeMinutes} phút
                </span>
                {hasVisualOnlyComponent(exercise) && (
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-500"
                    title={exercise.limitations}
                  >
                    Có linh kiện visual-only
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-[#0f4c5c]">{exercise.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{exercise.objective}</p>
              <p className="text-xs text-slate-500">
                Linh kiện: {exercise.components.map((c) => c.replace(/^wokwi-/, '')).join(', ')}
              </p>

              <button
                type="button"
                onClick={() => onSelect(exercise)}
                className="mt-auto bg-[#0f4c5c] hover:bg-[#0a3540] text-white py-2.5 rounded-full text-sm font-bold transition-colors"
              >
                Dùng mẫu này
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
