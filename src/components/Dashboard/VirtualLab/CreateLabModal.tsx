import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DialogHeader, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { X, ExternalLink, RefreshCw, Wrench, BookOpen } from 'lucide-react';
import { WokwiLinkValidator } from './WokwiLinkValidator';
import { CircuitBuilderTeacherMode } from './Sandbox/CircuitBuilderTeacherMode';
import type {
  ComponentGlueRegistryEntity,
  CreateLabRequest,
  LabBoardType,
  LabCategory,
  LabCircuitConfig,
  LabEntity,
  LabSimulationMode,
  LabStatus,
  ValidateWokwiProjectResponse,
} from '@/services/dashboardApi';

function toLabBoardType(board: unknown): LabBoardType {
  return board === 'esp32_devkit_v1' ? 'esp32_devkit_v1' : 'arduino_uno';
}

export interface LabClassOption {
  id: number;
  label: string;
}

export interface LabAssignmentOption {
  id: number;
  label: string;
  classId?: number;
}

export interface LabLessonOption {
  id: number;
  label: string;
}

// Dữ liệu điền sẵn từ "bài tập mẫu" (src/data/virtualLabSampleExercises.ts) — KHÁC với
// initialLab: không bật chế độ "đang sửa lab có sẵn" (isEditing vẫn false), Lưu vẫn gọi
// labsApi.create(), không phải update(). Chỉ áp dụng khi mở modal để TẠO MỚI.
export interface CreateLabTemplateData {
  title: string;
  description: string;
  category: LabCategory;
  starterCode: string;
  circuitConfig: LabCircuitConfig;
}

interface CreateLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateLabRequest, lab?: LabEntity) => Promise<void> | void;
  onValidateWokwi: (value: string) => Promise<ValidateWokwiProjectResponse>;
  classOptions: LabClassOption[];
  assignmentOptions: LabAssignmentOption[];
  lessonOptions?: LabLessonOption[];
  componentOptions?: ComponentGlueRegistryEntity[];
  isComponentsLoading?: boolean;
  componentsError?: string | null;
  onRetryComponents?: () => void;
  initialLab?: LabEntity | null;
  templateData?: CreateLabTemplateData | null;
  isSaving?: boolean;
  error?: string | null;
  scheduleOptions?: LabLessonOption[]; // Danh sách buổi dạy (schedules)

  // ROBOT DELIVERY TEMPLATE UI INTEGRATION fix — khi Teacher mở modal này từ
  // 1 trong 2 lối vào KHÔNG đi qua TemplatePickerModal ("Tạo phòng thí
  // nghiệm mới" ở header, hoặc thẻ "Tạo Lab Mới" trong lưới lab), modal vẫn
  // phải cho họ cơ hội quay lại chọn mẫu thay vì chỉ có đường "tạo mạch thủ
  // công". Optional — khi không truyền, modal giữ nguyên hành vi cũ (không
  // hiện bước chọn, vào thẳng form thủ công) để không phá bất kỳ nơi gọi
  // nào khác.
  onRequestTemplatePicker?: () => void;
}

const defaultCircuitConfig: LabCircuitConfig = {
  board: 'arduino_uno',
  parts: [],
  connections: [],
};

const defaultStarterCode =
  'void setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n  delay(1000);\n}';

const defaultFormData = {
  title: '',
  category: 'robotics' as LabCategory,
  description: '',
  thumbnailUrl: '',
  wokwiValue: '',
  classIds: [] as number[],
  status: 'published' as LabStatus,
  linkedAssignmentId: '',
  scheduleId: '',
  simulationMode: 'custom_sandbox' as LabSimulationMode,
  starterCode: defaultStarterCode,
  circuitConfig: defaultCircuitConfig,
};

// Native <select>/<input multiple> chưa có primitive Radix tương đương cho multi-select,
// nên style thủ công theo đúng token của Input/Select (border-input, bg-background,
// focus ring) để đồng bộ hình ảnh với các control khác trong modal.
const nativeFieldClassName =
  'flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700';

function getInitialFormData(
  initialLab?: LabEntity | null,
  templateData?: CreateLabTemplateData | null
) {
  if (!initialLab && templateData) {
    return {
      title: templateData.title,
      category: templateData.category,
      description: templateData.description,
      thumbnailUrl: '',
      wokwiValue: '',
      classIds: [] as number[],
      // Để 'draft' — giáo viên chọn lớp + xuất bản sau khi xem lại mẫu đã điền, tránh bắt
      // buộc chọn lớp ngay lúc chỉ mới "dùng thử mẫu".
      status: 'draft' as LabStatus,
      linkedAssignmentId: '',
      scheduleId: '',
      simulationMode: 'custom_sandbox' as LabSimulationMode,
      starterCode: templateData.starterCode,
      circuitConfig: templateData.circuitConfig,
    };
  }

  if (!initialLab) return { ...defaultFormData };

  return {
    title: initialLab.title,
    category: initialLab.category as LabCategory,
    description: initialLab.description,
    thumbnailUrl: initialLab.thumbnailUrl,
    wokwiValue: initialLab.wokwiProjectUrl || initialLab.wokwiProjectId,
    classIds: initialLab.classIds,
    status: (initialLab.status === 'draft' ? 'draft' : 'published') as LabStatus,
    linkedAssignmentId: initialLab.linkedAssignmentId
      ? String(initialLab.linkedAssignmentId)
      : '',
    scheduleId: '',
    simulationMode:
      (initialLab.simulationMode === 'custom_sandbox'
        ? 'custom_sandbox'
        : 'wokwi_iframe') as LabSimulationMode,
    starterCode: initialLab.starterCode || defaultStarterCode,
    circuitConfig: initialLab.circuitConfig ?? defaultCircuitConfig,
  };
}

export const CreateLabModal = ({
  isOpen,
  onClose,
  onSave,
  onValidateWokwi,
  classOptions,
  assignmentOptions,
  lessonOptions = [],
  scheduleOptions = [], // Danh sách buổi dạy (schedules)
  componentOptions = [],
  isComponentsLoading,
  componentsError,
  onRetryComponents,
  initialLab,
  templateData,
  isSaving,
  error,
  onRequestTemplatePicker,
}: CreateLabModalProps) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [isWokwiValid, setIsWokwiValid] = useState(false);
  const [wokwiValidation, setWokwiValidation] =
    useState<ValidateWokwiProjectResponse | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  // Chỉ có ý nghĩa khi tạo mới hoàn toàn (không sửa lab có sẵn, không đã có
  // templateData sẵn từ TemplatePickerModal) — 'choose' hiện bước chọn
  // "thủ công" hay "từ mẫu" trước khi vào form thật.
  const [entryMode, setEntryMode] = useState<'choose' | 'manual'>('manual');

  useEffect(() => {
    if (!isOpen) return;

    const initialFormData = getInitialFormData(initialLab, templateData);
    setFormData(initialFormData);
    setEntryMode(!initialLab && !templateData && onRequestTemplatePicker ? 'choose' : 'manual');
    setIsWokwiValid(
      initialFormData.simulationMode === 'wokwi_iframe' &&
        Boolean(initialLab?.wokwiProjectId)
    );
    setWokwiValidation(
      initialLab?.wokwiProjectId
        ? {
            isValid: true,
            message: 'Project hợp lệ - sẵn sàng lưu',
            wokwiProjectId: initialLab.wokwiProjectId,
            wokwiProjectUrl: initialLab.wokwiProjectUrl,
          }
        : null
    );
    setLocalError(null);
  }, [initialLab, templateData, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isEditing = Boolean(initialLab);
  const isWokwiMode = formData.simulationMode === 'wokwi_iframe';

  if (entryMode === 'choose') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-xl flex flex-col">
          <DialogHeader className="flex items-center justify-between gap-4 shrink-0">
            <DialogTitle>Tạo phòng thí nghiệm mới</DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>
          <DialogContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bắt đầu từ đâu?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setEntryMode('manual')}
                className="rounded-xl border border-border p-5 flex flex-col items-center text-center gap-2 hover:border-indigo-500/40 hover:bg-accent transition-colors"
              >
                <Wrench className="w-6 h-6 text-indigo-400" />
                <span className="font-semibold text-foreground">Tạo mạch thủ công</span>
                <span className="text-xs text-muted-foreground">
                  Tự chọn board, linh kiện và thiết kế mạch từ đầu.
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestTemplatePicker?.();
                }}
                className="rounded-xl border border-border p-5 flex flex-col items-center text-center gap-2 hover:border-indigo-500/40 hover:bg-accent transition-colors"
              >
                <BookOpen className="w-6 h-6 text-indigo-400" />
                <span className="font-semibold text-foreground">Chọn bài tập mẫu</span>
                <span className="text-xs text-muted-foreground">
                  Bao gồm module Robot Giao Hàng Mini (LAB01-08) — đã có sẵn sơ đồ + code.
                </span>
              </button>
            </div>
          </DialogContent>
        </div>
      </div>
    );
  }
  const circuitParts = Array.isArray(formData.circuitConfig.parts)
    ? formData.circuitConfig.parts
    : [];
  const filteredAssignments = assignmentOptions.filter((assignment) => {
    if (!assignment.classId || formData.classIds.length === 0) return true;
    return formData.classIds.includes(assignment.classId);
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const title = formData.title.trim();
    const wokwiProjectId = isWokwiMode
      ? wokwiValidation?.wokwiProjectId ?? initialLab?.wokwiProjectId
      : null;
    const wokwiProjectUrl = isWokwiMode
      ? wokwiValidation?.wokwiProjectUrl ?? initialLab?.wokwiProjectUrl
      : null;

    if (!title) {
      setLocalError('Vui lòng nhập tên lab.');
      return;
    }

    if (isWokwiMode && (!isWokwiValid || !wokwiProjectId)) {
      setLocalError('Vui lòng kiểm tra link Wokwi hợp lệ trước khi lưu.');
      return;
    }

    if (!isWokwiMode && circuitParts.length === 0) {
      setLocalError('Vui lòng thêm ít nhất một linh kiện cho Sandbox nội bộ.');
      return;
    }

    if (formData.status === 'published' && formData.classIds.length === 0) {
      setLocalError('Lab đã xuất bản cần được gán cho ít nhất một lớp.');
      return;
    }

    setLocalError(null);

    await onSave(
      {
        title,
        description: formData.description.trim(),
        category: formData.category,
        thumbnailUrl: formData.thumbnailUrl.trim(),
        simulationMode: formData.simulationMode,
        boardType: isWokwiMode ? 'arduino_uno' : toLabBoardType(formData.circuitConfig.board),
        starterCode: isWokwiMode ? null : formData.starterCode,
        circuitConfig: isWokwiMode ? defaultCircuitConfig : formData.circuitConfig,
        allowedComponentTypes: isWokwiMode
          ? []
          : Array.from(new Set(circuitParts.map((part) => part.type))),
        wokwiProjectId,
        wokwiProjectUrl,
        classIds: formData.classIds,
        status: formData.status,
        linkedAssignmentId: formData.linkedAssignmentId
          ? Number(formData.linkedAssignmentId)
          : null,
        scheduleId: formData.scheduleId ? Number(formData.scheduleId) : null,
      },
      initialLab ?? undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <DialogTitle>
              {isEditing ? 'Cập nhật phòng lab' : 'Tạo phòng thí nghiệm mới'}
            </DialogTitle>
            {!isEditing && templateData && (
              <p className="text-xs font-medium text-indigo-400 mt-1">
                Đã điền sẵn từ mẫu — kiểm tra lại rồi chọn lớp trước khi lưu.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <DialogContent className="flex-1 max-h-none space-y-8">
          {isWokwiMode ? (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-blue-300">Tạo mạch mô phỏng trên Wokwi</h3>
              <p className="text-sm text-blue-200/80">
                Dán link project Public hoặc Unlisted để StemFlow kiểm tra và nhúng vào lab.
              </p>
              <a
                href="https://wokwi.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-300 hover:text-blue-200 transition-colors"
              >
                Mở Wokwi.com <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <CircuitBuilderTeacherMode
              value={formData.circuitConfig}
              onChange={(circuitConfig) => setFormData({ ...formData, circuitConfig })}
              componentOptions={componentOptions}
              isLoading={isComponentsLoading}
              error={componentsError}
              onRetry={onRetryComponents}
            />
          )}

          <form id="create-lab-form" onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="bg-indigo-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">
                1
              </span>
              Nhập thông tin phòng lab
            </h3>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Tên lab</label>
              <Input
                required
                type="text"
                value={formData.title}
                onChange={(event) =>
                  setFormData({ ...formData, title: event.target.value })
                }
                placeholder="VD: Đèn LED nhấp nháy..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(event) =>
                  setFormData({ ...formData, status: event.target.value as LabStatus })
                }
                className={nativeFieldClassName}
              >
                <option value="published">Xuất bản</option>
                <option value="draft">Bản nháp</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Mô tả hướng dẫn</label>
              <Textarea
                value={formData.description}
                onChange={(event) =>
                  setFormData({ ...formData, description: event.target.value })
                }
                className="min-h-[90px]"
                placeholder="Nhập hướng dẫn làm thí nghiệm cho học sinh..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Ảnh thumbnail URL</label>
              <Input
                type="url"
                value={formData.thumbnailUrl}
                onChange={(event) =>
                  setFormData({ ...formData, thumbnailUrl: event.target.value })
                }
                placeholder="https://..."
              />
            </div>

            {isWokwiMode ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Link/ID project Wokwi
                </label>
                <WokwiLinkValidator
                  value={formData.wokwiValue}
                  onChange={(value) => setFormData({ ...formData, wokwiValue: value })}
                  onValidChange={setIsWokwiValid}
                  onValidate={onValidateWokwi}
                  onValidationResult={setWokwiValidation}
                  initiallyValid={Boolean(initialLab?.wokwiProjectId)}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Starter code cho học sinh
                </label>
                <Textarea
                  value={formData.starterCode}
                  onChange={(event) =>
                    setFormData({ ...formData, starterCode: event.target.value })
                  }
                  spellCheck={false}
                  className="min-h-[150px] font-mono text-sm bg-slate-950 text-slate-100 border-slate-800 dark:bg-slate-950"
                />
              </div>
            )}

            <div className="h-px bg-border my-4" />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Gán cho lớp</label>
              <select
                multiple
                value={formData.classIds.map(String)}
                className={`${nativeFieldClassName} min-h-[90px] h-auto py-2`}
                onChange={(event) => {
                  const values = Array.from(event.target.selectedOptions, (option) =>
                    Number(option.value)
                  ).filter((value) => Number.isFinite(value) && value > 0);
                  setFormData({ ...formData, classIds: values });
                }}
              >
                {classOptions.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Giữ Ctrl hoặc Cmd để chọn nhiều lớp.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Gắn bài đánh giá sau lab
              </label>
              <select
                value={formData.linkedAssignmentId}
                onChange={(event) =>
                  setFormData({ ...formData, linkedAssignmentId: event.target.value })
                }
                className={nativeFieldClassName}
              >
                <option value="">Bỏ qua</option>
                {filteredAssignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Gắn vào buổi dạy
              </label>
              <select
                value={formData.scheduleId}
                onChange={(event) =>
                  setFormData({ ...formData, scheduleId: event.target.value })
                }
                className={nativeFieldClassName}
              >
                <option value="">Bỏ qua</option>
                {scheduleOptions.length === 0 && (
                  <option value="" disabled>
                    Chưa có buổi dạy nào cho các lớp đã chọn
                  </option>
                )}
                {scheduleOptions.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {scheduleOptions.length === 0
                  ? 'Các lớp đã chọn chưa có buổi dạy nào trong thời khóa biểu.'
                  : 'Tùy chọn - gán lab vào một buổi dạy cụ thể.'}
              </p>
            </div>

            {(localError || error) && (
              <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {localError || error}
              </p>
            )}
          </form>
        </DialogContent>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="create-lab-form"
            disabled={(isWokwiMode && !isWokwiValid) || isSaving}
            className="bg-indigo-500 hover:bg-indigo-600 text-white border-0"
          >
            {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Lưu thay đổi' : 'Lưu phòng lab'}
          </Button>
        </DialogFooter>
      </div>
    </div>
  );
};
