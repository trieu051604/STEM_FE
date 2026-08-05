import { Cloud } from 'lucide-react';
import type { LabCircuitComponent } from '@/services/dashboardApi';
import { normalizeComponentType } from './componentTypeNormalize';

// WiFi/Cloud Phase 1 — hiển thị latest value theo topic + log nhỏ cho
// StemFlowCloud (xem CloudRuntimeHeaderGenerator.cs + QemuEsp32Runner.cs
// TryParseSfCloudEvent + LabSandboxPage.tsx applySimulationEvent nhánh
// type==='cloud-event'). KHÔNG phải dashboard cloud thật — chỉ đọc lại state
// đã tích luỹ từ SimulationEvent nhận qua SignalR/replay.
export interface CloudTopicValue {
  value: string | number | boolean;
  timeMs: number;
}

export interface CloudComponentState {
  topics: Record<string, CloudTopicValue>;
  log: string[];
}

interface CloudDashboardPanelProps {
  components: LabCircuitComponent[];
  cloudState: Record<string, CloudComponentState>;
}

const CLOUD_TYPES = new Set(['wifi-cloud-node', 'dashboard-cloud']);

function formatValue(value: CloudTopicValue['value']) {
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
}

export const CloudDashboardPanel = ({ components, cloudState }: CloudDashboardPanelProps) => {
  const cloudComponents = components.filter((c) => CLOUD_TYPES.has(normalizeComponentType(c.type)));

  if (cloudComponents.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-3 right-3 z-20 w-64 max-h-[70%] overflow-y-auto rounded-xl border border-slate-600 bg-[#1e1e1e]/95 shadow-xl pointer-events-auto">
      <div className="flex items-center gap-1.5 border-b border-slate-700 bg-[#171717] px-3 py-2">
        <Cloud className="h-3.5 w-3.5 text-cyan-400" />
        <span className="text-xs font-bold text-slate-100">Cloud Dashboard</span>
      </div>

      <div className="p-2 space-y-2">
        {cloudComponents.map((component) => {
          const state = cloudState[component.id];
          const topics = state ? Object.entries(state.topics) : [];

          return (
            <div key={component.id} className="rounded-lg border border-slate-700 bg-[#252525] p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-200">{component.id}</span>
                <span className="text-[10px] text-slate-500">{topics.length > 0 ? 'live' : 'chưa có dữ liệu'}</span>
              </div>

              {topics.length > 0 && (
                <div className="space-y-0.5">
                  {topics.map(([topic, tv]) => (
                    <div key={topic} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{topic}</span>
                      <span className="font-mono text-cyan-300">{formatValue(tv.value)}</span>
                    </div>
                  ))}
                </div>
              )}

              {state && state.log.length > 0 && (
                <div className="mt-1.5 border-t border-slate-700 pt-1">
                  <div className="max-h-20 overflow-y-auto space-y-0.5">
                    {state.log.slice(-6).reverse().map((line, i) => (
                      <div key={i} className="truncate text-[10px] text-slate-500 font-mono">{line}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
