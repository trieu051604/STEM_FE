import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/Switch';
import { ComponentCatalogPicker } from './ComponentCatalogPicker';
import { ScenarioBuilder, TestScenario } from './ScenarioBuilder';
import { RubricEditor, RubricCriteria } from './RubricEditor';
import { FileCode2, Cpu, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateAssignmentRequest } from '@/services/dashboardApi';
import {
  AssignmentFormFields,
  createDefaultAssignmentBasics,
  toAssignmentDueDate,
  type AssignmentClassOption,
} from './AssignmentFormFields';

interface SimulationAssignmentFormProps {
  classOptions?: AssignmentClassOption[];
  isClassesLoading?: boolean;
  classesError?: string | null;
  onRetryClasses?: () => void;
  isSaving?: boolean;
  error?: string | null;
  onSave?: (request: CreateAssignmentRequest) => Promise<void> | void;
  onCancel?: () => void;
}

const DEFAULT_DIAGRAM = {
  version: 1,
  parts: [],
  connections: [],
};

function parseJsonField(value: string, fieldName: string) {
  try {
    return {
      data: JSON.parse(value || '{}') as unknown,
      error: null,
    };
  } catch {
    return {
      data: null,
      error: `${fieldName} chưa đúng định dạng JSON.`,
    };
  }
}

export const SimulationAssignmentForm: React.FC<SimulationAssignmentFormProps> = ({
  classOptions = [],
  isClassesLoading,
  classesError,
  onRetryClasses,
  isSaving,
  error,
  onSave,
  onCancel,
}) => {
  const [basics, setBasics] = useState(createDefaultAssignmentBasics());
  const [studentMode, setStudentMode] = useState<'code_only' | 'circuit_build'>('code_only');
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [enableAutoCheck, setEnableAutoCheck] = useState(true);
  const [autoGradeWeight, setAutoGradeWeight] = useState(50);
  const [rubric, setRubric] = useState<RubricCriteria[]>([]);
  const [starterCode, setStarterCode] = useState('void setup() {\n  \n}\n\nvoid loop() {\n  \n}');
  const [baseDiagramText, setBaseDiagramText] = useState(
    JSON.stringify(DEFAULT_DIAGRAM, null, 2)
  );
  const [answerKeyText, setAnswerKeyText] = useState(
    JSON.stringify(DEFAULT_DIAGRAM, null, 2)
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSave = async () => {
    const classId = Number(basics.classId);
    const title = basics.title.trim();
    const description = basics.description.trim();
    const baseDiagram = parseJsonField(baseDiagramText, 'Sơ đồ mạch nền');
    const answerKey = parseJsonField(answerKeyText, 'Đáp án mẫu');

    if (!Number.isFinite(classId) || classId <= 0) {
      setLocalError('Vui lòng chọn lớp học.');
      return;
    }

    if (!title) {
      setLocalError('Vui lòng nhập tiêu đề bài tập.');
      return;
    }

    if (!description) {
      setLocalError('Vui lòng nhập yêu cầu đề bài.');
      return;
    }

    if (baseDiagram.error) {
      setLocalError(baseDiagram.error);
      return;
    }

    if (answerKey.error) {
      setLocalError(answerKey.error);
      return;
    }

    if (studentMode === 'circuit_build' && selectedComponentIds.length === 0) {
      setLocalError('Vui lòng chọn ít nhất một linh kiện học sinh được phép dùng.');
      return;
    }

    setLocalError(null);

    await onSave?.({
      classId,
      title,
      description,
      assignmentType: 'practical_simulation',
      dueDate: toAssignmentDueDate(basics.dueDate),
      maxScore: Number.isFinite(basics.maxScore) && basics.maxScore > 0 ? basics.maxScore : 100,
      allowResubmit: basics.allowResubmit,
      resubmitLimit:
        basics.allowResubmit && basics.resubmitLimit ? Number(basics.resubmitLimit) : null,
      status: basics.status,
      simulationDetail: {
        environmentSource: 'internal_sandbox',
        baseDiagram: baseDiagram.data ?? {},
        allowedComponentTypes: selectedComponentIds,
        studentInputMode: studentMode,
        starterCode: studentMode === 'code_only' ? starterCode : null,
        answerKey: answerKey.data ?? {},
        autoGradingEnabled: enableAutoCheck,
        autoGradingWeight: enableAutoCheck ? autoGradeWeight / 100 : 0,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Tạo Bài tập Thực hành</h2>
          <p className="text-sm text-muted-foreground">Thiết lập mạch điện tử và kịch bản chấm tự động.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isClassesLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white border-0"
          >
            {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
            Lưu bài tập
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <AssignmentFormFields
          value={basics}
          onChange={setBasics}
          classOptions={classOptions}
          isClassesLoading={isClassesLoading}
          classesError={classesError}
          onRetryClasses={onRetryClasses}
          descriptionLabel="Yêu cầu đề bài"
          descriptionPlaceholder="Mô tả bài thực hành..."
        />

        <div>
          <label className="text-sm font-medium text-foreground block mb-3">Chế độ làm bài của học sinh</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setStudentMode('code_only')}
              className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all",
                studentMode === 'code_only' ? "bg-purple-500/10 border-purple-500/40 ring-2 ring-purple-500/20" : "bg-muted/20 border-border hover:border-muted-foreground/40"
              )}
            >
              <FileCode2 className={cn("w-6 h-6 mb-2", studentMode === 'code_only' ? "text-purple-400" : "text-muted-foreground")} />
              <h4 className="font-semibold text-foreground text-sm mb-1">Chỉ viết code (Mô hình 1)</h4>
              <p className="text-xs text-muted-foreground">Giáo viên tạo sẵn mạch mẫu, học sinh chỉ cần lập trình để mạch hoạt động.</p>
            </div>
            <div
              onClick={() => setStudentMode('circuit_build')}
              className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all",
                studentMode === 'circuit_build' ? "bg-purple-500/10 border-purple-500/40 ring-2 ring-purple-500/20" : "bg-muted/20 border-border hover:border-muted-foreground/40"
              )}
            >
              <Cpu className={cn("w-6 h-6 mb-2", studentMode === 'circuit_build' ? "text-purple-400" : "text-muted-foreground")} />
              <h4 className="font-semibold text-foreground text-sm mb-1">Tự lắp mạch (Mô hình 2)</h4>
              <p className="text-xs text-muted-foreground">Học sinh phải tự kéo thả lắp ráp linh kiện và viết code từ đầu.</p>
            </div>
          </div>
        </div>

        {studentMode === 'circuit_build' && (
          <div>
            <ComponentCatalogPicker selectedComponentIds={selectedComponentIds} onChange={setSelectedComponentIds} />
          </div>
        )}

        {studentMode === 'code_only' && (
          <label className="block">
            <span className="text-sm font-medium text-foreground">Starter code</span>
            <textarea
              value={starterCode}
              onChange={(event) => setStarterCode(event.target.value)}
              spellCheck={false}
              className="mt-2 w-full min-h-[150px] rounded-xl border border-border bg-slate-900 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </label>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-foreground">
              Sơ đồ mạch nền (diagram.json)
            </span>
            <textarea
              value={baseDiagramText}
              onChange={(event) => setBaseDiagramText(event.target.value)}
              spellCheck={false}
              className="mt-2 w-full min-h-[220px] rounded-xl border border-border bg-slate-950 px-4 py-3 font-mono text-xs text-slate-100 outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground">
              Đáp án mẫu để auto-check
            </span>
            <textarea
              value={answerKeyText}
              onChange={(event) => setAnswerKeyText(event.target.value)}
              spellCheck={false}
              className="mt-2 w-full min-h-[220px] rounded-xl border border-border bg-slate-950 px-4 py-3 font-mono text-xs text-slate-100 outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </label>
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-muted/30 p-4 border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Switch checked={enableAutoCheck} onCheckedChange={setEnableAutoCheck} />
              <span className="font-medium text-foreground text-sm">Bật chấm tự động (Auto-check)</span>
            </div>
            {enableAutoCheck && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Tỉ trọng điểm:</span>
                <span className="text-sm font-bold text-purple-400">{autoGradeWeight}% auto</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={autoGradeWeight}
                  onChange={(e) => setAutoGradeWeight(Number(e.target.value))}
                  className="w-24 accent-purple-500"
                />
                <span className="text-sm font-bold text-foreground">{100 - autoGradeWeight}% tay</span>
              </div>
            )}
          </div>

          {enableAutoCheck && (
            <div className="p-4 bg-card">
              <ScenarioBuilder scenarios={scenarios} onChange={setScenarios} />
            </div>
          )}
        </div>

        {(localError || error) && (
          <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {localError || error}
          </p>
        )}

        <div className="pt-4 border-t border-border">
          <RubricEditor initialCriteria={rubric} onChange={setRubric} />
        </div>
      </div>
    </div>
  );
};
