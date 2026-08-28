import { useMemo, useState } from 'react';
import {
  Cable,
  CheckCircle2,
  Cpu,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CircuitCanvas } from './CircuitCanvas';
import { ComponentPalettePopup } from './ComponentPalettePopup';
import {
  getComponentReference,
  normalizeComponentType,
} from './componentReferenceCatalog';
import { getComponentIllustration } from './componentIllustrations';
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
}

// Arduino Uno đã bị bỏ khỏi lựa chọn board — toàn bộ lab mẫu/hệ thống này
// chỉ dùng ESP32 DevKit V1.
const BOARD_OPTIONS: BoardOption[] = [
  {
    value: 'esp32_devkit_v1',
    label: 'ESP32 DevKit V1',
    pinGroups: ['D2-D35', 'RX0/TX0', 'RX2/TX2', '3V3', 'VIN', 'GND'],
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

type Waypoint = { x: number; y: number };
type WireConnection = [string, string, string, Waypoint[]?];

interface WireConnectionItem {
  connection: WireConnection;
  originalIndex: number;
}

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

function getParts(value: LabCircuitConfig): LabCircuitComponent[] {
  return Array.isArray(value.parts) ? value.parts : [];
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
  // Thư viện linh kiện đã lên tới ~60 loại — cuộn thuần không còn đủ dùng,
  // cần lọc theo tên hiển thị (label BE hoặc reference FE) + componentType.
  const [paletteSearch, setPaletteSearch] = useState('');
  // Nút "+" trên canvas — entry point THÊM, không thay thế sidebar bên trái
  // (đã hoạt động từ trước, giữ nguyên 100%).
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [autoSelectPartId, setAutoSelectPartId] = useState<string | null>(null);
  const filteredComponents = useMemo(() => {
    const query = paletteSearch.trim().toLowerCase();
    if (!query) return supportedComponents;
    return supportedComponents.filter((component) => {
      const reference = getComponentReference(component.componentType);
      const haystack = `${component.label ?? ''} ${reference.label} ${component.componentType}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [supportedComponents, paletteSearch]);
  const wireItems = getWireConnectionItems(value.connections);
  const wireConnections = wireItems.map((item) => item.connection);
  const selectedBoard: LabBoardType = 'esp32_devkit_v1';
  const activeBoardOption = BOARD_OPTIONS.find((option) => option.value === selectedBoard) ?? BOARD_OPTIONS[0];

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
      board: value.board ?? 'esp32_devkit_v1',
      parts: nextParts,
      connections: value.connections ?? [],
    });
  };

  const handleAddPart = (componentType: string) => {
    const newPart = createPart(componentType, parts.length);
    updateParts([...parts, newPart]);
    setAutoSelectPartId(newPart.id);
  };

  const handleAddPartFromPalette = (componentType: string) => {
    handleAddPart(componentType);
    setIsPaletteOpen(false);
  };

  const handleRemovePart = (id: string) => {
    const currentConnections = Array.isArray(value.connections) ? value.connections : [];

    onChange({
      ...value,
      board: value.board ?? 'esp32_devkit_v1',
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
      board: value.board ?? 'esp32_devkit_v1',
      connections: [...currentConnections, newConnection],
    });
  };

  const handleWireDelete = (index: number) => {
    const currentConnections = [...(Array.isArray(value.connections) ? value.connections : [])];
    currentConnections.splice(index, 1);

    onChange({
      ...value,
      board: value.board ?? 'esp32_devkit_v1',
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
      board: value.board ?? 'esp32_devkit_v1',
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
      board: value.board ?? 'esp32_devkit_v1',
      connections: currentConnections,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_280px]">
        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h5 className="text-sm font-bold text-foreground">Chip chính</h5>
                <p className="text-xs text-muted-foreground">Chọn board</p>
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-400">
                <Cpu className="h-4 w-4" />
              </span>
            </div>

            <select
              value={selectedBoard}
              onChange={(e) => handleBoardChange(e.target.value as LabBoardType)}
              className="mt-3 w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm font-semibold text-foreground focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300/40"
            >
              {BOARD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="mt-3 rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-3">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-300">
                <CheckCircle2 className="h-4 w-4" />
                {activeBoardOption.label}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {activeBoardOption.pinGroups.map((pinGroup) => (
                  <span
                    key={pinGroup}
                    className="rounded border border-indigo-500/30 bg-transparent px-1.5 py-0.5 text-[11px] font-semibold text-indigo-300"
                  >
                    {pinGroup}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h5 className="text-sm font-bold text-foreground">Linh kiện</h5>
                <p className="text-xs text-muted-foreground">{supportedComponents.length} loại khả dụng</p>
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
              <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-500">
                {error}
              </div>
            )}

            {!isLoading && supportedComponents.length > 0 && (
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={paletteSearch}
                  onChange={(e) => setPaletteSearch(e.target.value)}
                  placeholder="Tìm linh kiện..."
                  className="w-full rounded-lg border border-border bg-card py-2 pl-8 pr-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300/40"
                />
              </div>
            )}

            <div className="mt-3 max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {isLoading && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-3 text-sm font-semibold text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang tải linh kiện...
                </div>
              )}

              {!isLoading && supportedComponents.length > 0 && filteredComponents.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-muted/50 px-3 py-6 text-center text-xs font-semibold text-muted-foreground">
                  Không tìm thấy linh kiện khớp "{paletteSearch}".
                </div>
              )}

              {!isLoading &&
                filteredComponents.map((component) => {
                  const reference = getComponentReference(component.componentType);
                  const Icon = reference.icon;
                  const illustration = getComponentIllustration(component.componentType);

                  return (
                    <button
                      key={component.componentType}
                      type="button"
                      onClick={() => handleAddPart(component.componentType)}
                      className="group flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/5"
                    >
                      {illustration ? (
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/50">
                          {illustration}
                        </span>
                      ) : (
                        <span
                          className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${reference.iconClassName}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-bold text-foreground">
                            {component.label || reference.label}
                          </span>
                          <PlusCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-indigo-300" />
                        </span>
                        {reference.badge && (
                          <span
                            className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                              reference.badge === 'Chỉ hiển thị'
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}
                          >
                            {reference.badge}
                          </span>
                        )}
                        <span className="mt-1 block text-xs leading-4 text-muted-foreground">
                          {reference.summary}
                        </span>
                        <span className="mt-2 flex flex-wrap gap-1">
                          {reference.pins.map((pin) => (
                            <span
                              key={`${component.componentType}-${pin}`}
                              className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
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
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-3 text-xs font-semibold text-amber-500">
                  Chưa có linh kiện được hỗ trợ trong registry.
                </div>
              )}
            </div>

            {!isLoading && unsupportedCount > 0 && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                {unsupportedCount} linh kiện trong registry đang tắt hỗ trợ.
              </p>
            )}
          </section>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h5 className="text-sm font-bold text-foreground">Canvas mạch</h5>
              <p className="text-xs text-muted-foreground">Pin thật theo Wokwi Elements, dây nối dạng elbow.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {WIRE_PALETTE.map((item) => (
                <span
                  key={item.color}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] font-semibold text-muted-foreground"
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
              onOpenPalette={() => setIsPaletteOpen(true)}
              autoSelectId={autoSelectPartId}
            />

            <ComponentPalettePopup
              open={isPaletteOpen}
              onClose={() => setIsPaletteOpen(false)}
              componentOptions={componentOptions}
              onSelect={handleAddPartFromPalette}
            />
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-sm font-bold text-foreground">Danh sách linh kiện</h5>
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                {parts.length}
              </span>
            </div>

            <div className="mt-3 max-h-[220px] space-y-2 overflow-y-auto pr-1">
              {parts.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-muted/50 px-3 py-6 text-center text-xs font-semibold text-muted-foreground">
                  Chưa có linh kiện rời.
                </div>
              )}

              {parts.map((part) => {
                const reference = getComponentReference(part.type);
                const Icon = reference.icon;
                const illustration = getComponentIllustration(part.type);

                return (
                  <div
                    key={part.id}
                    className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-2"
                  >
                    {illustration ? (
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card">
                        {illustration}
                      </span>
                    ) : (
                      <span
                        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${reference.iconClassName}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-foreground">{reference.label}</div>
                      <div className="mt-0.5 break-all font-mono text-[10px] text-muted-foreground">{part.id}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePart(part.id)}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
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

          <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Cable className="h-4 w-4 text-muted-foreground" />
                <h5 className="text-sm font-bold text-foreground">Dây nối</h5>
              </div>
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                {wireItems.length}
              </span>
            </div>

            <div className="mt-3 max-h-[220px] space-y-2 overflow-y-auto pr-1">
              {wireItems.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-muted/50 px-3 py-6 text-center text-xs font-semibold text-muted-foreground">
                  Chưa có dây nối.
                </div>
              )}

              {wireItems.map(({ connection, originalIndex }) => {
                const [source, target, color] = connection;

                return (
                  <div
                    key={`${source}-${target}-${originalIndex}`}
                    className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-2"
                  >
                    <span
                      className="mt-1 h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: WIRE_COLOR_HEX[color] ?? color }}
                    />
                    <div className="min-w-0 flex-1 font-mono text-[11px] leading-4 text-muted-foreground">
                      <div className="break-all">{source}</div>
                      <div className="text-muted-foreground">{'->'}</div>
                      <div className="break-all">{target}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleWireDelete(originalIndex)}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
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
        </aside>
      </div>
    </div>
  );
};
