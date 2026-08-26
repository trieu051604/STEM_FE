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
//
// VIỆT HÓA UI (task riêng) — chỉ đổi chữ hiển thị. Field name/shape thật của
// SensorScenarioConfig/SensorTimeline/SensorTimelineEntry (timeMs, distanceCm,
// motion, detected, analog, pattern, temperature, humidity, componentId...)
// giữ NGUYÊN 100% — đây vẫn là đúng JSON gửi/nhận với BE
// (SensorRuntimeHeaderGenerator.cs đọc đúng các key này). Chỉ riêng "thời
// gian" hiển thị bằng GIÂY cho dễ đọc — quy đổi 2 chiều ngay tại input
// (giây hiển thị = timeMs / 1000, lưu lại vẫn là timeMs nguyên).
const SENSOR_LABEL: Record<string, string> = {
  'hc-sr04': 'Cảm biến khoảng cách HC-SR04',
  'pir-motion-sensor': 'Cảm biến chuyển động PIR',
  'line-tracking-3ch': 'Cảm biến dò line (3 kênh)',
  'line-tracking-5ch': 'Cảm biến dò line (5 kênh)',
  'water-leak-sensor': 'Cảm biến rò rỉ nước',
  'flame-sensor': 'Cảm biến lửa',
  'soil-moisture-sensor': 'Cảm biến độ ẩm đất',
  'rain-sensor': 'Cảm biến mưa',
  'vibration-sensor': 'Cảm biến rung (SW-420)',
  'dht22': 'Cảm biến nhiệt độ - độ ẩm DHT22',
  'dht11': 'Cảm biến nhiệt độ - độ ẩm DHT11',
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

// Nhãn hiển thị cho từng giá trị pattern — CHỈ đổi chữ hiển thị, giá trị
// thật gửi lên vẫn là string gốc bên trái (BE/SensorRuntimeHeaderGenerator
// so khớp đúng các chuỗi này, không được đổi).
const PATTERN_LABEL: Record<string, string> = {
  'center': 'Ở giữa',
  'left': 'Lệch trái',
  'right': 'Lệch phải',
  'lost': 'Mất line',
  'intersection': 'Giao lộ',
  'far-left': 'Lệch trái xa',
  'far-right': 'Lệch phải xa',
};

// Nhãn boolean thân thiện theo từng loại cảm biến (không hiển thị thẳng
// true/false cho người dùng) — checked phản ánh đúng field "motion"/"detected"
// thật trong data, chỉ đổi CHỮ hiển thị cạnh ô tick.
function booleanStateLabel(type: string, checked: boolean): string {
  switch (type) {
    case 'pir-motion-sensor':
      return checked ? 'Có chuyển động' : 'Không có chuyển động';
    case 'flame-sensor':
      return checked ? 'Phát hiện lửa' : 'Không phát hiện lửa';
    case 'water-leak-sensor':
      return checked ? 'Phát hiện nước' : 'Khô';
    case 'vibration-sensor':
      return checked ? 'Phát hiện rung' : 'Bình thường';
    case 'rain-sensor':
      return checked ? 'Có mưa' : 'Không mưa';
    case 'soil-moisture-sensor':
      return checked ? 'Đất ẩm' : 'Đất khô';
    default:
      return checked ? 'Có' : 'Không';
  }
}

// Nhãn cho ô giá trị analog (0-4095) — chỉ đổi CHỮ, field vẫn tên "analog".
function analogFieldLabel(type: string): string {
  switch (type) {
    case 'soil-moisture-sensor':
      return 'Độ ẩm đất';
    case 'rain-sensor':
      return 'Mức mưa';
    case 'water-leak-sensor':
      return 'Mức nước';
    case 'flame-sensor':
      return 'Cường độ lửa';
    default:
      return 'Giá trị analog';
  }
}

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

// Phase 6 validation (MASTER TASK — Final Project Readiness, không đổi
// sensorScenario JSON contract, chỉ chặn/ràng giá trị NGAY tại input trước
// khi lưu — không silently reorder timeline, đó là tính năng RIÊNG (sắp
// xếp) chưa làm, cố tình không lẫn 2 việc). time luôn >= 0 (không có khái
// niệm "trước khi bắt đầu chạy"). Range theo từng loại cảm biến khớp giá trị
// mặc định BE dùng trong SensorRuntimeHeaderGenerator.cs (DefaultDistanceCm,
// analog 0-4095 ADC thật của ESP32, nhiệt độ/độ ẩm theo dải cảm biến DHT
// thật).
const CLAMP_RANGES = {
  timeMs: { min: 0, max: Number.MAX_SAFE_INTEGER },
  distanceCm: { min: 0, max: 450 },
  analog: { min: 0, max: 4095 },
  temperature: { min: -40, max: 125 },
  humidity: { min: 0, max: 100 },
} as const;

function clamp(value: number, range: { min: number; max: number }): number {
  if (!Number.isFinite(value)) return range.min;
  return Math.min(range.max, Math.max(range.min, value));
}

// CLOSE REMAINING FINAL-LAB GAPS (STEP 6) — preview đơn giản dạng
// "mốc thời gian -> giá trị", KHÔNG phải JSON thô, KHÔNG dùng thư viện chart
// mới. Chỉ tóm tắt lại đúng field đã có trong SensorTimelineEntry theo từng
// loại cảm biến (không thêm field mới, không đổi contract). Kéo-thả sắp xếp
// lại mốc là FOLLOW_UP, không làm trong bài này — preview hiển thị đúng thứ
// tự mảng timeline hiện có.
function summarizeEntry(type: string, row: SensorTimelineEntry): string {
  if (type === 'hc-sr04') return `${row.distanceCm ?? 400}cm`;
  if (type === 'pir-motion-sensor') return booleanStateLabel(type, row.motion ?? false);
  if (LINE_TRACKING_TYPES.has(type)) return PATTERN_LABEL[row.pattern ?? 'lost'] ?? (row.pattern ?? 'lost');
  if (HAS_DETECTED.has(type)) {
    const state = booleanStateLabel(type, row.detected ?? false);
    return HAS_ANALOG.has(type) ? `${state} (${row.analog ?? (row.detected ? 2800 : 300)})` : state;
  }
  if (DHT_TYPES.has(type)) return `${row.temperature ?? 25}°C / ${row.humidity ?? 50}%`;
  return '—';
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
            <h3 className="text-sm font-bold text-slate-100">Kịch bản cảm biến</h3>
            <p className="text-[11px] text-slate-500">
              Kịch bản cảm biến cho phép mô phỏng sự thay đổi của môi trường theo thời gian để kiểm tra phản ứng của
              chương trình.
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
              Chưa có cảm biến nào hỗ trợ kịch bản trên canvas — thêm qua nút &quot;+&quot; trước (HC-SR04, PIR, Line
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

                <div className="mb-2.5 flex flex-wrap items-center gap-1.5 overflow-x-auto rounded border border-slate-700 bg-[#1a1a1a] px-2 py-1.5">
                  <span className="mr-1 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Xem trước:
                  </span>
                  {entry.timeline.map((row, idx) => (
                    <span key={idx} className="flex shrink-0 items-center gap-1.5">
                      <span className="whitespace-nowrap rounded bg-cyan-500/10 px-1.5 py-0.5 text-[11px] text-cyan-300">
                        {(row.timeMs / 1000).toString().replace(/\.0$/, '')}s → {summarizeEntry(type, row)}
                      </span>
                      {idx < entry.timeline.length - 1 && <span className="text-slate-600">→</span>}
                    </span>
                  ))}
                </div>

                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Các mốc kịch bản
                </div>

                <div className="space-y-1.5">
                  {entry.timeline.map((row, idx) => {
                    const updateRow = (patch: Partial<SensorTimelineEntry>) => {
                      const next = entry.timeline.map((r, i) => (i === idx ? { ...r, ...patch } : r));
                      updateTimeline(component.id, component.type, next);
                    };

                    return (
                      <div key={idx} className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-slate-500">Thời gian:</span>
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          value={row.timeMs / 1000}
                          onChange={(e) =>
                            updateRow({ timeMs: clamp(Math.round(Number(e.target.value) * 1000), CLAMP_RANGES.timeMs) })
                          }
                          className={`w-20 rounded border bg-[#1a1a1a] px-2 py-1 text-xs text-slate-100 ${
                            idx > 0 && row.timeMs <= entry.timeline[idx - 1].timeMs
                              ? 'border-amber-500'
                              : 'border-slate-600'
                          }`}
                          placeholder="Thời gian"
                        />
                        <span className="text-[11px] text-slate-500">giây →</span>
                        {idx > 0 && row.timeMs <= entry.timeline[idx - 1].timeMs && (
                          <span className="text-[10px] text-amber-500" title="Mốc thời gian nên tăng dần theo thứ tự — mốc này không sau mốc trước đó">
                            ⚠ không tăng dần
                          </span>
                        )}

                        {type === 'hc-sr04' && (
                          <>
                            <span className="text-[11px] text-slate-500">Khoảng cách:</span>
                            <input
                              type="number"
                              min={CLAMP_RANGES.distanceCm.min}
                              max={CLAMP_RANGES.distanceCm.max}
                              value={row.distanceCm ?? 400}
                              onChange={(e) => updateRow({ distanceCm: clamp(Number(e.target.value), CLAMP_RANGES.distanceCm) })}
                              className="w-20 rounded border border-slate-600 bg-[#1a1a1a] px-2 py-1 text-xs text-slate-100"
                            />
                            <span className="text-[11px] text-slate-500">cm (0-450)</span>
                          </>
                        )}

                        {type === 'pir-motion-sensor' && (
                          <label className="flex items-center gap-1.5 text-xs text-slate-300">
                            <input type="checkbox" checked={row.motion ?? false} onChange={(e) => updateRow({ motion: e.target.checked })} />
                            {booleanStateLabel(type, row.motion ?? false)}
                          </label>
                        )}

                        {LINE_TRACKING_TYPES.has(type) && (
                          <>
                            <span className="text-[11px] text-slate-500">Vị trí line:</span>
                            <select
                              value={row.pattern ?? 'lost'}
                              onChange={(e) => updateRow({ pattern: e.target.value })}
                              className="rounded border border-slate-600 bg-[#1a1a1a] px-2 py-1 text-xs text-slate-100"
                            >
                              {patternOptions.map((p) => (
                                <option key={p} value={p}>
                                  {PATTERN_LABEL[p] ?? p}
                                </option>
                              ))}
                            </select>
                          </>
                        )}

                        {HAS_DETECTED.has(type) && (
                          <>
                            <label className="flex items-center gap-1.5 text-xs text-slate-300">
                              <input
                                type="checkbox"
                                checked={row.detected ?? false}
                                onChange={(e) => updateRow({ detected: e.target.checked })}
                              />
                              {booleanStateLabel(type, row.detected ?? false)}
                            </label>
                            {HAS_ANALOG.has(type) && (
                              <>
                                <span className="text-[11px] text-slate-500">{analogFieldLabel(type)}:</span>
                                <input
                                  type="number"
                                  min={CLAMP_RANGES.analog.min}
                                  max={CLAMP_RANGES.analog.max}
                                  value={row.analog ?? (row.detected ? 2800 : 300)}
                                  onChange={(e) => updateRow({ analog: clamp(Number(e.target.value), CLAMP_RANGES.analog) })}
                                  className="w-20 rounded border border-slate-600 bg-[#1a1a1a] px-2 py-1 text-xs text-slate-100"
                                  placeholder="0-4095"
                                />
                              </>
                            )}
                          </>
                        )}

                        {DHT_TYPES.has(type) && (
                          <>
                            <span className="text-[11px] text-slate-500">Nhiệt độ:</span>
                            <input
                              type="number"
                              step="0.1"
                              min={CLAMP_RANGES.temperature.min}
                              max={CLAMP_RANGES.temperature.max}
                              value={row.temperature ?? 25}
                              onChange={(e) => updateRow({ temperature: clamp(Number(e.target.value), CLAMP_RANGES.temperature) })}
                              className="w-20 rounded border border-slate-600 bg-[#1a1a1a] px-2 py-1 text-xs text-slate-100"
                            />
                            <span className="text-[11px] text-slate-500">°C</span>
                            <span className="text-[11px] text-slate-500">Độ ẩm:</span>
                            <input
                              type="number"
                              step="0.1"
                              min={CLAMP_RANGES.humidity.min}
                              max={CLAMP_RANGES.humidity.max}
                              value={row.humidity ?? 50}
                              onChange={(e) => updateRow({ humidity: clamp(Number(e.target.value), CLAMP_RANGES.humidity) })}
                              className="w-20 rounded border border-slate-600 bg-[#1a1a1a] px-2 py-1 text-xs text-slate-100"
                            />
                            <span className="text-[11px] text-slate-500">%</span>
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
                  <Plus className="h-3 w-3" /> Thêm mốc
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
