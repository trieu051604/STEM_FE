import { useMemo } from 'react';
import { X, Plus, Trash2, Radio, Waves, Route, Droplets, Flame, Sprout, CloudRain, Vibrate, Thermometer } from 'lucide-react';
import type { LabCircuitComponent, SensorScenarioConfig, SensorTimeline, SensorTimelineEntry } from '@/services/dashboardApi';
import { normalizeComponentType } from './componentTypeNormalize';

interface SensorScenarioPanelProps {
  open: boolean;
  onClose: () => void;
  components: LabCircuitComponent[];
  scenario: SensorScenarioConfig;
  onChange: (next: SensorScenarioConfig) => void;
}

// Sensor Input Bridge — Phase 1+2 (scenario/timeline, KHÔNG interactive
// realtime — xem BE SensorRuntimeHeaderGenerator.cs). Panel này KHÔNG phụ
// thuộc trạng thái "component đang chọn" trong CircuitCanvas.tsx (state đó
// sống nội bộ trong CircuitCanvas, không lift lên LabSandboxPage — tránh
// refactor có rủi ro tới phần canvas selection đã ổn) — thay vào đó liệt kê
// TẤT CẢ sensor được hỗ trợ đang có trên canvas, mỗi cái có timeline riêng
// theo componentId.
const SENSOR_LABEL: Record<string, string> = {
  'hc-sr04': 'HC-SR04',
  'pir-motion-sensor': 'PIR Motion Sensor',
  'line-tracking-3ch': 'Line Tracking (3 kênh)',
  'line-tracking-5ch': 'Line Tracking (5 kênh)',
  'water-leak-sensor': 'Water Leak Sensor',
  'flame-sensor': 'Flame Sensor',
  'soil-moisture-sensor': 'Soil Moisture Sensor',
  'rain-sensor': 'Rain Sensor',
  'vibration-sensor': 'Vibration Sensor (SW-420)',
  'dht22': 'DHT22',
  'dht11': 'DHT11',
};

const SENSOR_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  'hc-sr04': Waves,
  'pir-motion-sensor': Radio,
  'line-tracking-3ch': Route,
  'line-tracking-5ch': Route,
  'water-leak-sensor': Droplets,
  'flame-sensor': Flame,
  'soil-moisture-sensor': Sprout,
  'rain-sensor': CloudRain,
  'vibration-sensor': Vibrate,
  'dht22': Thermometer,
  'dht11': Thermometer,
};

// Chỉ 5 loại này có analog (0-4095) — Vibration Sensor SW-420 thật không có
// chân AOUT, khớp đúng GenericSensorPins trong BE.
const HAS_ANALOG = new Set(['water-leak-sensor', 'flame-sensor', 'soil-moisture-sensor', 'rain-sensor']);
const HAS_DETECTED = new Set(['water-leak-sensor', 'flame-sensor', 'soil-moisture-sensor', 'rain-sensor', 'vibration-sensor']);
const LINE_TRACKING_TYPES = new Set(['line-tracking-3ch', 'line-tracking-5ch']);
const DHT_TYPES = new Set(['dht22', 'dht11']);

const PATTERNS_3CH = ['center', 'left', 'right', 'lost', 'intersection'];
const PATTERNS_5CH = ['far-left', 'left', 'center', 'right', 'far-right', 'lost', 'intersection'];

const SUPPORTED_TYPES = new Set([
  'hc-sr04', 'pir-motion-sensor', 'line-tracking-3ch', 'line-tracking-5ch',
  'water-leak-sensor', 'flame-sensor', 'soil-moisture-sensor', 'rain-sensor', 'vibration-sensor',
  'dht22', 'dht11',
]);

function defaultEntryFor(type: string): SensorTimelineEntry {
  if (type === 'hc-sr04') return { timeMs: 0, distanceCm: 400 };
  if (type === 'pir-motion-sensor') return { timeMs: 0, motion: false };
  if (LINE_TRACKING_TYPES.has(type)) return { timeMs: 0, pattern: 'lost' };
  if (HAS_DETECTED.has(type)) return { timeMs: 0, detected: false, analog: HAS_ANALOG.has(type) ? 300 : undefined };
  if (DHT_TYPES.has(type)) return { timeMs: 0, temperature: 25, humidity: 50 };
  return { timeMs: 0 };
}

function emptyTimelineFor(type: string): SensorTimeline {
  return { type, timeline: [defaultEntryFor(type)] };
}

export const SensorScenarioPanel = ({ open, onClose, components, scenario, onChange }: SensorScenarioPanelProps) => {
  const sensors = useMemo(
    () => components.filter((c) => SUPPORTED_TYPES.has(normalizeComponentType(c.type))),
    [components]
  );

  if (!open) return null;

  const updateTimeline = (componentId: string, rawType: string, timeline: SensorTimelineEntry[]) => {
    const next: SensorScenarioConfig = {
      sensors: {
        ...scenario.sensors,
        [componentId]: { type: rawType, timeline },
      },
    };
    onChange(next);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[640px] w-full max-w-[620px] flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#1e1e1e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-700 bg-[#171717] px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Sensor Scenario (Phase 1+2)</h3>
            <p className="text-[11px] text-slate-500">
              Kịch bản theo mốc thời gian (ms kể từ lúc Run) — firmware đọc thật qua digitalRead()/analogRead()/pulseIn()/StemFlowDHT.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-100"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {sensors.length === 0 && (
            <div className="px-2 py-8 text-center text-xs text-slate-500">
              Chưa có sensor nào hỗ trợ scenario trên canvas — thêm qua nút &quot;+&quot; trước (HC-SR04, PIR, Line
              Tracking, Water Leak, Flame, Soil Moisture, Rain, Vibration, DHT11/22).
            </div>
          )}

          {sensors.map((component) => {
            const type = normalizeComponentType(component.type);
            const entry = scenario.sensors[component.id] ?? emptyTimelineFor(type);
            const Icon = SENSOR_ICON[type] ?? Waves;
            const patternOptions = type === 'line-tracking-5ch' ? PATTERNS_5CH : PATTERNS_3CH;

            return (
              <div key={component.id} className="mb-3 rounded-lg border border-slate-700 bg-[#252525] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-slate-100">{SENSOR_LABEL[type] ?? type}</span>
                  <span className="text-[11px] text-slate-500">({component.id})</span>
                </div>

                <div className="space-y-1.5">
                  {entry.timeline.map((row, idx) => {
                    const updateRow = (patch: Partial<SensorTimelineEntry>) => {
                      const next = entry.timeline.map((r, i) => (i === idx ? { ...r, ...patch } : r));
                      updateTimeline(component.id, component.type, next);
                    };

                    return (
                      <div key={idx} className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          value={row.timeMs}
                          onChange={(e) => updateRow({ timeMs: Number(e.target.value) })}
                          className="w-20 rounded border border-slate-600 bg-[#1a1a1a] px-2 py-1 text-xs text-slate-100"
                          placeholder="timeMs"
                        />
                        <span className="text-[11px] text-slate-500">ms →</span>

                        {type === 'hc-sr04' && (
                          <>
                            <input
                              type="number"
                              value={row.distanceCm ?? 400}
                              onChange={(e) => updateRow({ distanceCm: Number(e.target.value) })}
                              className="w-20 rounded border border-slate-600 bg-[#1a1a1a] px-2 py-1 text-xs text-slate-100"
                            />
                            <span className="text-[11px] text-slate-500">cm</span>
                          </>
                        )}

                        {type === 'pir-motion-sensor' && (
                          <label className="flex items-center gap-1.5 text-xs text-slate-300">
                            <input type="checkbox" checked={row.motion ?? false} onChange={(e) => updateRow({ motion: e.target.checked })} />
                            motion (HIGH)
                          </label>
                        )}

                        {LINE_TRACKING_TYPES.has(type) && (
                          <select
                            value={row.pattern ?? 'lost'}
                            onChange={(e) => updateRow({ pattern: e.target.value })}
                            className="rounded border border-slate-600 bg-[#1a1a1a] px-2 py-1 text-xs text-slate-100"
                          >
                            {patternOptions.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        )}

                        {HAS_DETECTED.has(type) && (
                          <>
                            <label className="flex items-center gap-1.5 text-xs text-slate-300">
                              <input
                                type="checkbox"
                                checked={row.detected ?? false}
                                onChange={(e) => updateRow({ detected: e.target.checked })}
                              />
                              detected (HIGH)
                            </label>
                            {HAS_ANALOG.has(type) && (
                              <>
                                <input
                                  type="number"
                                  min={0}
                                  max={4095}
                                  value={row.analog ?? (row.detected ? 2800 : 300)}
                                  onChange={(e) => updateRow({ analog: Number(e.target.value) })}
                                  className="w-20 rounded border border-slate-600 bg-[#1a1a1a] px-2 py-1 text-xs text-slate-100"
                                  placeholder="0-4095"
                                />
                                <span className="text-[11px] text-slate-500">analog</span>
                              </>
                            )}
                          </>
                        )}

                        {DHT_TYPES.has(type) && (
                          <>
                            <input
                              type="number"
                              step="0.1"
                              value={row.temperature ?? 25}
                              onChange={(e) => updateRow({ temperature: Number(e.target.value) })}
                              className="w-20 rounded border border-slate-600 bg-[#1a1a1a] px-2 py-1 text-xs text-slate-100"
                            />
                            <span className="text-[11px] text-slate-500">°C</span>
                            <input
                              type="number"
                              step="0.1"
                              value={row.humidity ?? 50}
                              onChange={(e) => updateRow({ humidity: Number(e.target.value) })}
                              className="w-20 rounded border border-slate-600 bg-[#1a1a1a] px-2 py-1 text-xs text-slate-100"
                            />
                            <span className="text-[11px] text-slate-500">%RH</span>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const next = entry.timeline.filter((_, i) => i !== idx);
                            updateTimeline(component.id, component.type, next.length > 0 ? next : emptyTimelineFor(type).timeline);
                          }}
                          className="ml-auto rounded p-1 text-slate-500 hover:bg-red-500/20 hover:text-red-400"
                          aria-label="Xoá mốc"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const lastTime = entry.timeline.length > 0 ? entry.timeline[entry.timeline.length - 1].timeMs : 0;
                    const newRow: SensorTimelineEntry = { ...defaultEntryFor(type), timeMs: lastTime + 3000 };
                    updateTimeline(component.id, component.type, [...entry.timeline, newRow]);
                  }}
                  className="mt-2 flex items-center gap-1 rounded border border-dashed border-slate-600 px-2 py-1 text-[11px] text-slate-400 hover:border-teal-500 hover:text-teal-400"
                >
                  <Plus className="h-3 w-3" /> Thêm mốc thời gian
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
