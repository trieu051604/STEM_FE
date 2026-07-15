import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, RefreshCw } from 'lucide-react';
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

interface CreateLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateLabRequest, lab?: LabEntity) => Promise<void> | void;
  onValidateWokwi: (value: string) => Promise<ValidateWokwiProjectResponse>;
  classOptions: LabClassOption[];
  assignmentOptions: LabAssignmentOption[];
  componentOptions?: ComponentGlueRegistryEntity[];
  isComponentsLoading?: boolean;
  componentsError?: string | null;
  onRetryComponents?: () => void;
  initialLab?: LabEntity | null;
  isSaving?: boolean;
  error?: string | null;
}

const categories: Array<{ value: LabCategory; label: string }> = [
  { value: 'physics', label: 'Vật lý' },
  { value: 'chemistry', label: 'Hóa học' },
  { value: 'biology', label: 'Sinh học' },
  { value: 'robotics', label: 'Robot' },
];

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
  simulationMode: 'wokwi_iframe' as LabSimulationMode,
  starterCode: defaultStarterCode,
  circuitConfig: defaultCircuitConfig,
};

function getInitialFormData(initialLab?: LabEntity | null) {
  if (!initialLab) return defaultFormData;

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
  componentOptions = [],
  isComponentsLoading,
  componentsError,
  onRetryComponents,
  initialLab,
  isSaving,
  error,
}: CreateLabModalProps) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [isWokwiValid, setIsWokwiValid] = useState(false);
  const [wokwiValidation, setWokwiValidation] =
    useState<ValidateWokwiProjectResponse | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const initialFormData = getInitialFormData(initialLab);
    setFormData(initialFormData);
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
  }, [initialLab, isOpen]);

  if (!isOpen) return null;

  const isEditing = Boolean(initialLab);
  const isWokwiMode = formData.simulationMode === 'wokwi_iframe';
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
      },
      initialLab ?? undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-[#0f4c5c]">
            {isEditing ? 'Cập nhật phòng lab' : 'Tạo phòng thí nghiệm mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          <div className="space-y-4">
            <h3 className="font-bold text-[#0f4c5c] text-lg border-b pb-2">
              1. Chọn chế độ mô phỏng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, simulationMode: 'wokwi_iframe' })}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  isWokwiMode
                    ? 'border-[#0f4c5c] bg-cyan-50/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isWokwiMode ? 'border-[#0f4c5c]' : 'border-slate-300'
                    }`}
                  >
                    {isWokwiMode && <div className="w-2.5 h-2.5 rounded-full bg-[#0f4c5c]" />}
                  </div>
                  <h4 className="font-bold text-slate-800">Nhúng Wokwi</h4>
                </div>
                <p className="text-sm text-slate-500 pl-8">
                  Project Wokwi có sẵn, nhanh và hỗ trợ nhiều loại board.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, simulationMode: 'custom_sandbox' })
                }
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  !isWokwiMode
                    ? 'border-[#0f4c5c] bg-cyan-50/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      !isWokwiMode ? 'border-[#0f4c5c]' : 'border-slate-300'
                    }`}
                  >
                    {!isWokwiMode && <div className="w-2.5 h-2.5 rounded-full bg-[#0f4c5c]" />}
                  </div>
                  <h4 className="font-bold text-slate-800">Sandbox nội bộ</h4>
                </div>
                <p className="text-sm text-slate-500 pl-8">
                  Arduino Uno, học sinh chỉnh code và chạy mô phỏng trong trình duyệt.
                </p>
              </button>
            </div>
          </div>

          {isWokwiMode ? (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-3">
              <h3 className="font-bold text-blue-900">Tạo mạch mô phỏng trên Wokwi</h3>
              <p className="text-sm text-blue-800">
                Dán link project Public hoặc Unlisted để StemFlow kiểm tra và nhúng vào lab.
              </p>
              <a
                href="https://wokwi.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
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
            <h3 className="font-bold text-[#0f4c5c] flex items-center gap-2">
              <span className="bg-[#0f4c5c] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                2
              </span>
              Nhập thông tin phòng lab
            </h3>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Tên lab</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(event) =>
                  setFormData({ ...formData, title: event.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="VD: Đèn LED nhấp nháy..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Môn học</label>
                <select
                  value={formData.category}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      category: event.target.value as LabCategory,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(event) =>
                    setFormData({ ...formData, status: event.target.value as LabStatus })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="published">Xuất bản</option>
                  <option value="draft">Bản nháp</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Mô tả hướng dẫn</label>
              <textarea
                value={formData.description}
                onChange={(event) =>
                  setFormData({ ...formData, description: event.target.value })
                }
                className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Nhập hướng dẫn làm thí nghiệm cho học sinh..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Ảnh thumbnail URL</label>
              <input
                type="url"
                value={formData.thumbnailUrl}
                onChange={(event) =>
                  setFormData({ ...formData, thumbnailUrl: event.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>

            {isWokwiMode ? (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
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
                <label className="text-sm font-semibold text-slate-700">
                  Starter code cho học sinh
                </label>
                <textarea
                  value={formData.starterCode}
                  onChange={(event) =>
                    setFormData({ ...formData, starterCode: event.target.value })
                  }
                  spellCheck={false}
                  className="flex min-h-[150px] w-full rounded-md border border-input bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            )}

            <div className="h-px bg-border my-4" />

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Gán cho lớp</label>
              <select
                multiple
                value={formData.classIds.map(String)}
                className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              <label className="text-sm font-semibold text-slate-700">
                Gắn bài đánh giá sau lab
              </label>
              <select
                value={formData.linkedAssignmentId}
                onChange={(event) =>
                  setFormData({ ...formData, linkedAssignmentId: event.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Bỏ qua</option>
                {filteredAssignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.label}
                  </option>
                ))}
              </select>
            </div>

            {(localError || error) && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {localError || error}
              </p>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-border bg-slate-50 rounded-b-2xl flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="create-lab-form"
            disabled={(isWokwiMode && !isWokwiValid) || isSaving}
            className="bg-[#0f4c5c] hover:bg-[#0a3540] text-white"
          >
            {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Lưu thay đổi' : 'Lưu phòng lab'}
          </Button>
        </div>
      </div>
    </div>
  );
};
