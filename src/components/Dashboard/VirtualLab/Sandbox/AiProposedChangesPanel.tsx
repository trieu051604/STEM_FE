import { useState } from 'react';
import { AlertTriangle, Check, X as XIcon } from 'lucide-react';
import type { ProposedChange } from '@/services/aiAssistantApi';

interface AiProposedChangesPanelProps {
  changes: ProposedChange[];
  currentCode: string;
  statusFor: (changeId: string) => 'pending' | 'applied' | 'rejected';
  onApplyOne: (change: ProposedChange) => void;
  onRejectOne: (change: ProposedChange) => void;
  onApplyAll: (changes: ProposedChange[]) => void;
  onRejectAll: (changes: ProposedChange[]) => void;
}

const TYPE_LABELS: Record<string, string> = {
  replace_file: 'Thay toàn bộ file',
  replace_range: 'Thay 1 đoạn code',
  insert_code: 'Chèn code mới',
  add_component: 'Thêm linh kiện',
  update_wire: 'Nối dây',
  update_diagram_json: 'Thay sơ đồ mạch',
  explanation_only: 'Chỉ giải thích',
};

// So khớp đúng phần code liên quan tới thay đổi (không phải toàn file với
// replace_range) — dùng để phát hiện xung đột nếu người dùng đã tự sửa code
// sau khi AI đề xuất, TRƯỚC khi bấm Apply.
function getConflictSnippet(change: ProposedChange, currentCode: string): string | null {
  if (!change.before) return null;
  if (change.type === 'replace_file') {
    return change.before !== currentCode ? change.before : null;
  }
  if (change.type === 'replace_range' && change.startLine && change.endLine) {
    const lines = currentCode.split('\n');
    const slice = lines.slice(change.startLine - 1, change.endLine).join('\n');
    return slice !== change.before ? change.before : null;
  }
  return null;
}

function isLargeChange(change: ProposedChange): boolean {
  if (change.type !== 'replace_file' || !change.after) return false;
  return change.after.split('\n').length > 15;
}

function ChangeCard({
  change,
  currentCode,
  status,
  onApply,
  onReject,
}: {
  change: ProposedChange;
  currentCode: string;
  status: 'pending' | 'applied' | 'rejected';
  onApply: () => void;
  onReject: () => void;
}) {
  const [armed, setArmed] = useState(false);
  const conflict = getConflictSnippet(change, currentCode);
  const large = isLargeChange(change);
  const needsConfirm = Boolean(conflict) || large;

  const handleApplyClick = () => {
    if (needsConfirm && !armed) {
      setArmed(true);
      return;
    }
    onApply();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700">
          {TYPE_LABELS[change.type] ?? change.type}
        </span>
        {status === 'applied' && (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
            Đã áp dụng
          </span>
        )}
        {status === 'rejected' && (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
            Đã từ chối
          </span>
        )}
      </div>

      <p className="text-sm font-bold text-[#0f4c5c]">{change.title}</p>
      {change.description && (
        <p className="text-xs text-muted-foreground">{change.description}</p>
      )}

      {(change.type === 'replace_file' || change.type === 'replace_range' || change.type === 'insert_code') &&
        change.after && (
          <div className="space-y-1">
            {change.before && (
              <pre className="text-[11px] bg-red-50 text-red-800 rounded-md p-2 overflow-x-auto max-h-32 whitespace-pre-wrap">
                - {change.before}
              </pre>
            )}
            <pre className="text-[11px] bg-emerald-50 text-emerald-800 rounded-md p-2 overflow-x-auto max-h-32 whitespace-pre-wrap">
              + {change.after}
            </pre>
          </div>
        )}

      {change.type === 'add_component' && change.component && (
        <p className="text-xs bg-slate-50 rounded-md p-2 font-mono">
          + {change.component.type} {change.component.id ? `(id: ${change.component.id})` : ''}
        </p>
      )}

      {change.type === 'update_wire' && change.wire && (
        <p className="text-xs bg-slate-50 rounded-md p-2 font-mono">
          {change.wire.from} → {change.wire.to}
        </p>
      )}

      {change.type === 'update_diagram_json' && change.diagramJson && (
        <pre className="text-[11px] bg-amber-50 text-amber-800 rounded-md p-2 overflow-x-auto max-h-32 whitespace-pre-wrap">
          {change.diagramJson.slice(0, 400)}
          {change.diagramJson.length > 400 ? '…' : ''}
        </pre>
      )}

      {conflict && (
        <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-md p-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Code hiện tại đã khác với lúc AI đề xuất — áp dụng có thể ghi đè thay đổi bạn vừa làm.</span>
        </div>
      )}
      {!conflict && large && (
        <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-md p-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Đây là thay đổi lớn — thay thế toàn bộ file code.</span>
        </div>
      )}

      {status === 'pending' && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleApplyClick}
            className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full text-white transition-colors ${
              armed ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#0f4c5c] hover:bg-[#0a3540]'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            {armed ? 'Bấm lại để xác nhận' : 'Áp dụng'}
          </button>
          <button
            type="button"
            onClick={onReject}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <XIcon className="w-3.5 h-3.5" />
            Từ chối
          </button>
        </div>
      )}
    </div>
  );
}

export const AiProposedChangesPanel = ({
  changes,
  currentCode,
  statusFor,
  onApplyOne,
  onRejectOne,
  onApplyAll,
  onRejectAll,
}: AiProposedChangesPanelProps) => {
  const applicable = changes.filter((c) => c.type !== 'explanation_only');
  if (applicable.length === 0) return null;

  const pending = applicable.filter((c) => statusFor(c.id) === 'pending');

  return (
    <div className="space-y-2 mt-2">
      {applicable.map((change) => (
        <ChangeCard
          key={change.id}
          change={change}
          currentCode={currentCode}
          status={statusFor(change.id)}
          onApply={() => onApplyOne(change)}
          onReject={() => onRejectOne(change)}
        />
      ))}

      {pending.length > 1 && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onApplyAll(pending)}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#0f4c5c] text-white hover:bg-[#0a3540] transition-colors"
          >
            Áp dụng tất cả ({pending.length})
          </button>
          <button
            type="button"
            onClick={() => onRejectAll(pending)}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Từ chối tất cả
          </button>
        </div>
      )}
    </div>
  );
};
