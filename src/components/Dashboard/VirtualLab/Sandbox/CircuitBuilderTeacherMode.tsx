import {
  Cable,
  CheckCircle2,
  CircuitBoard,
  Cpu,
  Gauge,
  Lightbulb,
  PlusCircle,
  RefreshCw,
  RotateCw,
  SlidersHorizontal,
  Thermometer,
  ToggleLeft,
  Trash2,
  Volume2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CircuitCanvas } from './CircuitCanvas';
import type {
  ComponentGlueRegistryEntity,
  LabBoardType,
  LabCircuitComponent,
  LabCircuitConfig,
} from '@/services/dashboardApi';

interface BoardOption {
  value: LabBoardType;
  label: string;
  pinGroups: string[];
  simulatable: boolean;
}

const BOARD_OPTIONS: BoardOption[] = [
  { value: 'arduino_uno', label: 'Arduino Uno', pinGroups: ['D0-D13', 'A0-A5', '5V', '3.3V', 'GND'], simulatable: true },
  {
    value: 'esp32_devkit_v1',
    label: 'ESP32 DevKit V1',
    pinGroups: ['D2-D35', 'RX0/TX0', 'RX2/TX2', '3V3', 'VIN', 'GND'],
    simulatable: false,
  },
];

interface CircuitBuilderTeacherModeProps {
  value: LabCircuitConfig;
  onChange: (value: LabCircuitConfig) => void;
  componentOptions: ComponentGlueRegistryEntity[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

type ComponentIcon = typeof Cpu;
type Waypoint = { x: number; y: number };
type WireConnection = [string, string, string, Waypoint[]?];

interface ComponentReference {
  label: string;
  summary: string;
  role: string;
  pins: string[];
  sample: string;
  icon: ComponentIcon;
  iconClassName: string;
}

interface WireConnectionItem {
  connection: WireConnection;
  originalIndex: number;
}

const COMPONENT_REFERENCES: Record<string, ComponentReference> = {
  led: {
    label: 'LED',
    summary: '2 chân phân cực: A và C',
    role: 'Phát sáng khi dòng đi đúng chiều.',
    pins: ['A', 'C'],
    sample: 'D13 -> A, C -> GND',
    icon: Lightbulb,
    iconClassName: 'bg-rose-50 text-rose-600',
  },
  resistor: {
    label: 'Điện trở',
    summary: '2 chân không phân cực',
    role: 'Giới hạn dòng, thường đặt nối tiếp với LED.',
    pins: ['1', '2'],
    sample: 'D13 -> 1, 2 -> LED A',
    icon: Zap,
    iconClassName: 'bg-amber-50 text-amber-700',
  },
  push_button: {
    label: 'Push Button',
    summary: 'Dùng cặp 1.l và 2.r',
    role: 'Công tắc tạm thời cho tín hiệu digital.',
    pins: ['1.l', '2.r'],
    sample: 'D2 -> 1.l, 2.r -> GND',
    icon: ToggleLeft,
    iconClassName: 'bg-sky-50 text-sky-700',
  },
  buzzer: {
    label: 'Buzzer',
    summary: '2 chân: tín hiệu và GND',
    role: 'Phát âm thanh bằng HIGH/LOW hoặc PWM.',
    pins: ['1 (+)', '2 (-)'],
    sample: 'D9 -> 1, 2 -> GND',
    icon: Volume2,
    iconClassName: 'bg-violet-50 text-violet-700',
  },
  potentiometer: {
    label: 'Biến trở',
    summary: '3 chân: VCC, SIG, GND',
    role: 'Tạo giá trị analog thay đổi liên tục.',
    pins: ['VCC', 'SIG', 'GND'],
    sample: '5V -> VCC, SIG -> A0',
    icon: SlidersHorizontal,
    iconClassName: 'bg-emerald-50 text-emerald-700',
  },
  servo: {
    label: 'Servo',
    summary: '3 chân: GND, V+, PWM',
    role: 'Điều khiển góc quay qua chân PWM.',
    pins: ['GND', 'V+', 'PWM'],
    sample: '5V -> V+, PWM -> D9',
    icon: RotateCw,
    iconClassName: 'bg-orange-50 text-orange-700',
  },
  dht22: {
    label: 'Cảm biến DHT22',
    summary: '4 chân: VCC, SDA, NC, GND',
    role: 'Đo nhiệt độ/độ ẩm, trả dữ liệu qua chân SDA.',
    pins: ['VCC', 'SDA', 'NC', 'GND'],
    sample: '3V3 -> VCC, SDA -> D4, GND -> GND',
    icon: Thermometer,
    iconClassName: 'bg-cyan-50 text-cyan-700',
  },
};

const UNKNOWN_COMPONENT_REFERENCE: ComponentReference = {
  label: 'Linh kiện',
  summary: 'Theo registry backend',
  role: 'Linh kiện đã được backend đánh dấu hỗ trợ.',
  pins: ['pin'],
  sample: 'Chọn pin trên canvas',
  icon: CircuitBoard,
  iconClassName: 'bg-slate-100 text-slate-600',
};

const WIRE_PALETTE = [
  { label: 'GND', color: 'black', note: 'GND, Ground, C' },
  { label: 'Nguồn', color: 'red', note: '5V, 3.3V, VCC, Vin' },
  { label: 'Digital', color: 'green', note: 'I/O số' },
  { label: 'Analog', color: 'blue', note: 'A0-A5' },
];

const WIRE_COLOR_HEX: Record<string, string> = {
  black: '#111827',
  red: '#ef4444',
  green: '#22c55e',
  blue: '#2563eb',
};

const QUICK_REFERENCES = [
  { title: 'LED cơ bản', value: 'D13 -> LED A | LED C -> GND' },
  { title: 'LED có điện trở', value: 'D13 -> R1 | R2 -> LED A | LED C -> GND' },
  { title: 'Nút nhấn INPUT_PULLUP', value: 'D2 -> 1.l | 2.r -> GND' },
  { title: 'Biến trở analog', value: '5V -> VCC | SIG -> A0 | GND -> GND' },
];

function normalizeComponentType(type: string) {
  const normalized = type
    .toLowerCase()
    .trim()
    .replace(/^wokwi[-_]/, '')
    .replace(/-/g, '_');

  if (normalized === 'pushbutton' || normalized === 'button') return 'push_button';
  if (normalized === 'arduino' || normalized === 'arduino_uno') return 'arduino_uno';
  return normalized;
}

function getParts(value: LabCircuitConfig): LabCircuitComponent[] {
  return Array.isArray(value.parts) ? value.parts : [];
}

function getComponentReference(componentType: string) {
  const normalizedType = normalizeComponentType(componentType);
  const reference = COMPONENT_REFERENCES[normalizedType];

  if (reference) return reference;

  return {
    ...UNKNOWN_COMPONENT_REFERENCE,
    label: componentType,
  };
}

function getDefaultAttrs(componentType: string): Record<string, string> {
  const normalizedType = normalizeComponentType(componentType);

  if (normalizedType === 'led') return { color: 'red' };
  if (normalizedType === 'push_button') return { color: 'blue' };
  if (normalizedType === 'resistor') return { value: '220' };
  return {};
}

function createPart(componentType: string, index: number): LabCircuitComponent {
  return {
    id: `${componentType}-${Date.now()}-${index}`,
    type: componentType,
    x: 80 + (index % 4) * 130,
    y: 320 + Math.floor(index / 4) * 95,
    attrs: getDefaultAttrs(componentType),
    pinMapping: {},
  };
}

function getWireConnectionItems(connections: LabCircuitConfig['connections']): WireConnectionItem[] {
  if (!Array.isArray(connections)) return [];

  return connections.reduce<WireConnectionItem[]>((items, connection, originalIndex) => {
    if (!Array.isArray(connection)) return items;

    const [source, target, colorValue, pathValue] = connection;
    if (typeof source !== 'string' || typeof target !== 'string') return items;

    const color = typeof colorValue === 'string' && colorValue ? colorValue : 'green';
    const isWaypoint = (value: unknown): value is Waypoint =>
      typeof value === 'object' && value !== null &&
      typeof (value as Waypoint).x === 'number' && typeof (value as Waypoint).y === 'number';
    const path = Array.isArray(pathValue) ? pathValue.filter(isWaypoint) : undefined;
    const normalizedConnection: WireConnection = path && path.length === 2
      ? [source, target, color, path]
      : [source, target, color];

    items.push({ connection: normalizedConnection, originalIndex });
    return items;
  }, []);
}

function connectionBelongsToPart(connection: unknown, partId: string) {
  if (!Array.isArray(connection)) return false;

  const [source, target] = connection;
  return (
    (typeof source === 'string' && source.startsWith(`${partId}:`)) ||
    (typeof target === 'string' && target.startsWith(`${partId}:`))
  );
}

export const CircuitBuilderTeacherMode = ({
  value,
  onChange,
  componentOptions,
  isLoading,
  error,
  onRetry,
}: CircuitBuilderTeacherModeProps) => {
  const parts = getParts(value);
  const supportedComponents = componentOptions.filter((component) => component.supported);
  const unsupportedCount = componentOptions.length - supportedComponents.length;
  const wireItems = getWireConnectionItems(value.connections);
  const wireConnections = wireItems.map((item) => item.connection);
  const selectedBoard: LabBoardType = value.board === 'esp32_devkit_v1' ? 'esp32_devkit_v1' : 'arduino_uno';
  const activeBoardOption = BOARD_OPTIONS.find((option) => option.value === selectedBoard) ?? BOARD_OPTIONS[0];
  const boardLabel = activeBoardOption.label;

  const handleBoardChange = (nextBoard: LabBoardType) => {
    if (nextBoard === selectedBoard) return;
    // Chuyển board coi như mạch mới: pin layout khác hẳn nên dây nối cũ
    // (theo toạ độ board trước) không còn hợp lệ.
    onChange({
      ...value,
      board: nextBoard,
      parts,
      connections: [],
    });
  };

  const updateParts = (nextParts: LabCircuitComponent[]) => {
    onChange({
      ...value,
      board: value.board ?? 'arduino_uno',
      parts: nextParts,
      connections: value.connections ?? [],
    });
  };

  const handleAddPart = (componentType: string) => {
    updateParts([...parts, createPart(componentType, parts.length)]);
  };

  const handleRemovePart = (id: string) => {
    const currentConnections = Array.isArray(value.connections) ? value.connections : [];

    onChange({
      ...value,
      board: value.board ?? 'arduino_uno',
      parts: parts.filter((part) => part.id !== id),
      connections: currentConnections.filter((connection) => !connectionBelongsToPart(connection, id)),
    });
  };

  const handleWireConnect = (
    sourceId: string,
    sourcePin: string,
    targetId: string,
    targetPin: string,
    color: string
  ) => {
    const currentConnections = Array.isArray(value.connections) ? value.connections : [];
    const newConnection = [`${sourceId}:${sourcePin}`, `${targetId}:${targetPin}`, color, []];

    onChange({
      ...value,
      board: value.board ?? 'arduino_uno',
      connections: [...currentConnections, newConnection],
    });
  };

  const handleWireDelete = (index: number) => {
    const currentConnections = [...(Array.isArray(value.connections) ? value.connections : [])];
    currentConnections.splice(index, 1);

    onChange({
      ...value,
      board: value.board ?? 'arduino_uno',
      connections: currentConnections,
    });
  };

  const handleCanvasWireDelete = (index: number) => {
    handleWireDelete(wireItems[index]?.originalIndex ?? index);
  };

  const handleCanvasWireWaypointChange = (index: number, waypoints: Waypoint[]) => {
    const item = wireItems[index];
    if (!item) return;
    const currentConnections = [...(Array.isArray(value.connections) ? value.connections : [])];
    const [source, target, color] = item.connection;
    currentConnections[item.originalIndex] = [source, target, color, waypoints];

    onChange({
      ...value,
      board: value.board ?? 'arduino_uno',
      connections: currentConnections,
    });
  };

  const handleCanvasWireColorChange = (index: number, color: string) => {
    const item = wireItems[index];
    if (!item) return;
    const currentConnections = [...(Array.isArray(value.connections) ? value.connections : [])];
    const [source, target, , waypoints] = item.connection;
    currentConnections[item.originalIndex] = waypoints ? [source, target, color, waypoints] : [source, target, color];

    onChange({
      ...value,
      board: value.board ?? 'arduino_uno',
      connections: currentConnections,
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
              <CircuitBoard className="h-4 w-4" />
              Sandbox chuẩn Wokwi
            </div>
            <h4 className="mt-1 text-lg font-bold text-slate-900">Thiết kế mạch đáp án</h4>
            <p className="mt-1 text-sm text-slate-500">
              Chọn board cho mạch, linh kiện rời lấy theo registry backend.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase text-slate-500">Board</div>
              <div className="mt-1 truncate text-sm font-bold text-slate-900">{boardLabel}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase text-slate-500">Linh kiện</div>
              <div className="mt-1 text-sm font-bold text-slate-900">{parts.length}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase text-slate-500">Dây nối</div>
              <div className="mt-1 text-sm font-bold text-slate-900">{wireItems.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_280px]">
        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h5 className="text-sm font-bold text-slate-800">Chip chính</h5>
                <p className="text-xs text-slate-500">Chọn board</p>
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                <Cpu className="h-4 w-4" />
              </span>
            </div>

            <select
              value={selectedBoard}
              onChange={(e) => handleBoardChange(e.target.value as LabBoardType)}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-800 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-300"
            >
              {BOARD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="mt-3 rounded-lg border border-teal-100 bg-teal-50/60 p-3">
              <div className="flex items-center gap-2 text-sm font-bold text-teal-900">
                <CheckCircle2 className="h-4 w-4" />
                {activeBoardOption.label}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {activeBoardOption.pinGroups.map((pinGroup) => (
                  <span
                    key={pinGroup}
                    className="rounded border border-teal-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-teal-800"
                  >
                    {pinGroup}
                  </span>
                ))}
              </div>
              {!activeBoardOption.simulatable && (
                <p className="mt-2 text-[11px] font-medium text-amber-700">
                  Board này mới hỗ trợ hiển thị &amp; nối dây trên canvas — biên dịch/chạy code thật hiện chỉ dùng được với Arduino Uno.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h5 className="text-sm font-bold text-slate-800">Linh kiện</h5>
                <p className="text-xs text-slate-500">{supportedComponents.length} loại khả dụng</p>
              </div>
              {error && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  disabled={!onRetry}
                  className="h-8 px-2"
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  Tải lại
                </Button>
              )}
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                {error}
              </div>
            )}

            <div className="mt-3 space-y-2">
              {isLoading && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang tải linh kiện...
                </div>
              )}

              {!isLoading &&
                supportedComponents.map((component) => {
                  const reference = getComponentReference(component.componentType);
                  const Icon = reference.icon;

                  return (
                    <button
                      key={component.componentType}
                      type="button"
                      onClick={() => handleAddPart(component.componentType)}
                      className="group flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/50"
                    >
                      <span
                        className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${reference.iconClassName}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-bold text-slate-800">
                            {component.label || reference.label}
                          </span>
                          <PlusCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-teal-700" />
                        </span>
                        <span className="mt-1 block text-xs leading-4 text-slate-500">
                          {reference.summary}
                        </span>
                        <span className="mt-2 flex flex-wrap gap-1">
                          {reference.pins.map((pin) => (
                            <span
                              key={`${component.componentType}-${pin}`}
                              className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600"
                            >
                              {pin}
                            </span>
                          ))}
                        </span>
                      </span>
                    </button>
                  );
                })}

              {!isLoading && supportedComponents.length === 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs font-semibold text-amber-800">
                  Chưa có linh kiện được hỗ trợ trong registry.
                </div>
              )}
            </div>

            {!isLoading && unsupportedCount > 0 && (
              <p className="mt-3 text-[11px] text-slate-500">
                {unsupportedCount} linh kiện trong registry đang tắt hỗ trợ.
              </p>
            )}
          </section>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h5 className="text-sm font-bold text-slate-800">Canvas mạch</h5>
              <p className="text-xs text-slate-500">Pin thật theo Wokwi Elements, dây nối dạng elbow.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {WIRE_PALETTE.map((item) => (
                <span
                  key={item.color}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600"
                  title={item.note}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: WIRE_COLOR_HEX[item.color] }}
                  />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="h-[560px] bg-[#222]">
            <CircuitCanvas
              engine={null}
              boardType={selectedBoard}
              components={parts}
              connections={wireConnections}
              onComponentMove={(id, x, y) => {
                updateParts(
                  parts.map((part) => {
                    if (part.id !== id) return part;
                    return { ...part, x, y };
                  })
                );
              }}
              onWireConnect={handleWireConnect}
              onWireDelete={handleCanvasWireDelete}
              onWireWaypointChange={handleCanvasWireWaypointChange}
              onWireColorChange={handleCanvasWireColorChange}
              onComponentDelete={(id) => handleRemovePart(id)}
              onComponentAttrChange={(id, attrs) => {
                updateParts(
                  parts.map((part) => {
                    if (part.id !== id) return part;
                    return { ...part, attrs: { ...part.attrs, ...attrs } };
                  })
                );
              }}
              onComponentRotate={(id, rotate) => {
                updateParts(
                  parts.map((part) => {
                    if (part.id !== id) return part;
                    return { ...part, rotate };
                  })
                );
              }}
            />
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-sm font-bold text-slate-800">Danh sách linh kiện</h5>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                {parts.length}
              </span>
            </div>

            <div className="mt-3 max-h-[220px] space-y-2 overflow-y-auto pr-1">
              {parts.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs font-semibold text-slate-500">
                  Chưa có linh kiện rời.
                </div>
              )}

              {parts.map((part) => {
                const reference = getComponentReference(part.type);
                const Icon = reference.icon;

                return (
                  <div
                    key={part.id}
                    className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2"
                  >
                    <span
                      className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${reference.iconClassName}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-slate-800">{reference.label}</div>
                      <div className="mt-0.5 break-all font-mono text-[10px] text-slate-500">{part.id}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePart(part.id)}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label="Xóa linh kiện"
                      title="Xóa linh kiện"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Cable className="h-4 w-4 text-slate-500" />
                <h5 className="text-sm font-bold text-slate-800">Dây nối</h5>
              </div>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                {wireItems.length}
              </span>
            </div>

            <div className="mt-3 max-h-[220px] space-y-2 overflow-y-auto pr-1">
              {wireItems.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs font-semibold text-slate-500">
                  Chưa có dây nối.
                </div>
              )}

              {wireItems.map(({ connection, originalIndex }) => {
                const [source, target, color] = connection;

                return (
                  <div
                    key={`${source}-${target}-${originalIndex}`}
                    className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2"
                  >
                    <span
                      className="mt-1 h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: WIRE_COLOR_HEX[color] ?? color }}
                    />
                    <div className="min-w-0 flex-1 font-mono text-[11px] leading-4 text-slate-600">
                      <div className="break-all">{source}</div>
                      <div className="text-slate-400">{'->'}</div>
                      <div className="break-all">{target}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleWireDelete(originalIndex)}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label="Xóa dây nối"
                      title="Xóa dây nối"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-slate-500" />
              <h5 className="text-sm font-bold text-slate-800">Quick reference</h5>
            </div>

            <div className="mt-3 space-y-2">
              {QUICK_REFERENCES.map((item) => (
                <div key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-xs font-bold text-slate-700">{item.title}</div>
                  <div className="mt-1 font-mono text-[11px] leading-4 text-slate-500">{item.value}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
