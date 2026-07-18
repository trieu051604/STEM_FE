import '@wokwi/elements';
import React, { createElement, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { SimulationEngine } from './SimulationEngine';
import { attachLed } from './glue/led';
import { attachButton } from './glue/button';
import type { LabCircuitComponent } from '@/services/dashboardApi';
import { Toolbar, COMPONENT_COLOR_OPTIONS } from './Toolbar';
import { getPinCoords } from './pinMaps';
import { HelpCircle } from 'lucide-react';

export type Waypoint = { x: number; y: number };
export type Connection = [string, string, string, Waypoint[]?];

export interface PartVisualState {
  value?: '0' | '1';
  buzzing?: boolean;
}

interface CircuitCanvasProps {
  engine: SimulationEngine | null;
  boardType?: string;
  components?: LabCircuitComponent[];
  connections?: Connection[];
  // Trạng thái LED/Buzzer từ event mock-runner (thay cho glue avr8js —
  // engine ở trên chỉ còn dùng khi boardType === 'arduino_uno', ESP32 luôn
  // truyền engine={null} và dùng partStates thay thế).
  partStates?: Record<string, PartVisualState>;
  onComponentMove?: (id: string, x: number, y: number) => void;
  onWireConnect?: (sourceId: string, sourcePin: string, targetId: string, targetPin: string, color: string) => void;
  onWireDelete?: (index: number) => void;
  onWireWaypointChange?: (index: number, waypoints: Waypoint[]) => void;
  onWireColorChange?: (index: number, color: string) => void;
  onComponentDelete?: (id: string) => void;
  onComponentAttrChange?: (id: string, attrs: Record<string, string>) => void;
  onComponentRotate?: (id: string, rotate: number) => void;
}

function getBoardTagName(boardType: string) {
  const normalized = boardType.toLowerCase();
  if (normalized === 'esp32_devkit_v1' || normalized === 'esp32-devkit-v1') return 'wokwi-esp32-devkit-v1';
  return 'wokwi-arduino-uno';
}

function normalizeComponentType(type: string) {
  const normalized = type.toLowerCase();
  if (normalized === 'push_button' || normalized === 'button' || normalized === 'pushbutton') return 'push_button';
  if (normalized === 'wokwi-led') return 'led';
  if (normalized === 'wokwi-pushbutton') return 'push_button';
  if (normalized === 'wokwi-buzzer') return 'buzzer';
  if (normalized === 'wokwi-servo') return 'servo';
  if (normalized === 'wokwi-potentiometer') return 'potentiometer';
  if (normalized === 'wokwi-resistor') return 'resistor';
  return normalized;
}

// Một số phần tử @wokwi/elements (board: wokwi-arduino-uno, wokwi-esp32-devkit-v1)
// không tự khai báo CSS `:host` — mặc định trình duyệt coi custom element chưa
// style là `display: inline`, khiến bounding box của chính element chỉ cao
// bằng 1 dòng chữ (~20px) dù SVG bên trong Shadow DOM cao gấp 10 lần. Việc
// này không chỉ có thể làm hụt hình khi render, mà còn khiến mọi phép đo
// offsetWidth/offsetHeight (dùng để tính tâm xoay ở getRotatedOwnerCoord) sai
// hoàn toàn. Ép `display: inline-block` qua inline style (luôn thắng mọi rule
// :host vì style attribute có độ ưu tiên cao nhất) để bounding box luôn khớp
// đúng kích thước SVG thật, áp dụng đồng loạt cho mọi phần tử wokwi-*.
function createWokwiElement(tagName: string, props: Record<string, unknown>) {
  const { style, ...rest } = props;
  return createElement(tagName, {
    ...rest,
    style: { display: 'inline-block', ...(style as Record<string, unknown> | undefined) },
  });
}

// `<wokwi-led color="...">` chấp nhận thẳng chuỗi này làm CSS `fill` cho SVG
// bên trong Shadow DOM (xem led-element.js: fill="${color}") — nếu giá trị
// không phải 1 trong các màu hợp lệ (bị hỏng dữ liệu, hoặc rơi về undefined),
// SVG spec sẽ âm thầm fallback `fill` về đen thay vì báo lỗi, đúng như hiện
// tượng "chọn màu nào cũng ra đen". Validate trước khi set để luôn fail-safe
// về đỏ thay vì đen, và log rõ khi giá trị không hợp lệ để dễ truy vết.
const VALID_LED_COLORS = new Set(COMPONENT_COLOR_OPTIONS.led.options.map((o) => o.value));
function getLedColor(color: string | undefined): string {
  if (color && VALID_LED_COLORS.has(color)) return color;
  if (color) console.warn(`[CircuitCanvas] Invalid LED color "${color}" — falling back to red`);
  return 'red';
}

function getAutoWireColor(sourcePin: string, targetPin: string) {
  const isGnd = (p: string) => p.toLowerCase().includes('gnd') || p.toLowerCase().includes('ground') || p.toLowerCase() === 'c';
  const isPower = (p: string) => p === '5V' || p === '3.3V' || p === '3V3' || p === 'VCC' || p.toLowerCase() === 'vin' || p === 'V+';
  const isAnalog = (p: string) => /^A[0-9]+$/.test(p);

  if (isGnd(sourcePin) || isGnd(targetPin)) return 'black';
  if (isPower(sourcePin) || isPower(targetPin)) return 'red';
  if (isAnalog(sourcePin) || isAnalog(targetPin)) return 'blue';
  return 'green';
}

function getElbowPath(x1: number, y1: number, x2: number, y2: number) {
  const midX = x1 + (x2 - x1) / 2;
  return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
}

function getWaypointPath(src: Waypoint, wp0: Waypoint, wp1: Waypoint, tgt: Waypoint) {
  return `M ${src.x} ${src.y} L ${wp0.x} ${wp0.y} L ${wp1.x} ${wp1.y} L ${tgt.x} ${tgt.y}`;
}

function getDefaultWaypoints(src: Waypoint, tgt: Waypoint): [Waypoint, Waypoint] {
  const midX = src.x + (tgt.x - src.x) / 2;
  return [{ x: midX, y: src.y }, { x: midX, y: tgt.y }];
}

// Waypoint tuỳ chỉnh được lưu thẳng vào connections[] (đi qua backend, có thể
// là dữ liệu cũ/hỏng không đúng shape {x,y}). Chỉ tin dữ liệu đã lưu khi cả 2
// điểm là số hữu hạn thật sự — nếu không, 1 toạ độ NaN/undefined sẽ khiến path
// nối vào 1 điểm vô nghĩa, nhìn như 1 đoạn chéo bất thường ngay trước target.
function getValidStoredWaypoints(waypoints: Waypoint[] | undefined): [Waypoint, Waypoint] | null {
  if (!waypoints || waypoints.length !== 2) return null;
  const isFiniteCoord = (wp: unknown): wp is Waypoint =>
    typeof wp === 'object' && wp !== null &&
    Number.isFinite((wp as Waypoint).x) && Number.isFinite((wp as Waypoint).y);
  if (!isFiniteCoord(waypoints[0]) || !isFiniteCoord(waypoints[1])) return null;
  return [waypoints[0], waypoints[1]];
}

// Toạ độ pin trong pinMaps.ts được đo ở góc xoay 0°, quanh gốc trên-trái của
// bounding box. Khi linh kiện xoay bằng CSS transform (quanh tâm hình học của
// chính element được render), phải áp đúng phép xoay này cho toạ độ pin thì
// dây nối mới bám đúng chân thật sau khi xoay — nếu không sẽ lệch dù logic
// kết nối (sourcePin/targetPin) vẫn đúng.
function rotatePoint(px: number, py: number, cx: number, cy: number, angleDeg: number): Waypoint {
  if (!angleDeg) return { x: px, y: py };
  const rad = (angleDeg * Math.PI) / 180;
  const dx = px - cx;
  const dy = py - cy;
  return {
    x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
    y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
  };
}

export const CircuitCanvas = ({
  engine,
  boardType = 'arduino_uno',
  components = [],
  connections = [],
  partStates,
  onComponentMove,
  onWireConnect,
  onWireDelete,
  onWireWaypointChange,
  onWireColorChange,
  onComponentDelete,
  onComponentAttrChange,
  onComponentRotate,
}: CircuitCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLElement | null>(null);
  const componentRefs = useRef(new Map<string, HTMLElement | null>());
  const boardTagName = getBoardTagName(boardType);

  // Board position & rotation (draggable) — "arduino" id is kept as the fixed
  // main-board slot regardless of which board type is actually selected.
  const [arduinoPos, setArduinoPos] = useState({ x: 350, y: 80 });
  const [arduinoRotate, setArduinoRotate] = useState(0);

  // Selection
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [selectedWireIndex, setSelectedWireIndex] = useState<number | null>(null);

  // Dragging
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Wire waypoint dragging
  const [draggingWaypoint, setDraggingWaypoint] = useState<{ connectionIndex: number; waypointIndex: 0 | 1 } | null>(null);

  // Wiring
  const [isDrawingWire, setIsDrawingWire] = useState(false);
  const [wireStart, setWireStart] = useState<{ id: string; pinName: string; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredPin, setHoveredPin] = useState<{ id: string; pinName: string; label: string } | null>(null);

  // Kích thước thật đã render của board/linh kiện — cần để xoay đúng quanh
  // tâm hình học (khớp với CSS transformOrigin: 'center center').
  const [elementSizes, setElementSizes] = useState<Record<string, { width: number; height: number }>>({});

  // Zoom
  const [zoom, setZoom] = useState(1);
  const MIN_ZOOM = 0.3;
  const MAX_ZOOM = 3;

  const setComponentRef = (id: string) => (element: Element | null) => {
    componentRefs.current.set(id, element as HTMLElement | null);
  };

  useEffect(() => {
    components.forEach((component) => {
      const type = normalizeComponentType(component.type);
      if (type === 'led') {
        const el = componentRefs.current.get(component.id);
        if (el) {
          el.setAttribute('color', getLedColor(component.attrs?.color));
          // @ts-ignore
          el.color = getLedColor(component.attrs?.color);
        }
      }
    });
  }, [components]);

  // Đo kích thước thật của board + từng linh kiện đã render (web components
  // của @wokwi/elements có kích thước nội tại riêng, không set qua CSS), để
  // tính đúng tâm xoay cho pin coords bên dưới. @wokwi/elements là LitElement:
  // lần render Shadow DOM đầu tiên sau khi mount được LIT TỰ HOÃN LẠI qua 1
  // microtask riêng (không đồng bộ với commit của React), nên đo ngay trong
  // useLayoutEffect có thể ra offsetWidth/Height=0 — đặc biệt khi đổi
  // boardType ('arduino' dùng chung 1 key cho cả 2 loại board), lúc đó phải
  // xoá ngay cache kích thước CŨ trước (không dùng nhầm số đo của board
  // trước đó), rồi đợi `element.updateComplete` (Promise chuẩn của Lit, báo
  // đúng thời điểm Shadow DOM đã render xong) trước khi đo lại — đợi qua
  // microtask thay vì setTimeout/rAF/ResizeObserver vì 3 cơ chế đó phụ thuộc
  // vào nhịp compositor/paint, có thể bị trì hoãn vô thời hạn ở 1 số môi
  // trường (tab ẩn, preview headless, throttle nền), còn microtask luôn được
  // xử lý ngay khi call stack hiện tại rỗng, không phụ thuộc render loop.
  const measureSizes = useCallback(() => {
    setElementSizes((prev) => {
      let changed = false;
      const next = { ...prev };

      const apply = (id: string, el: HTMLElement | null) => {
        if (!el) return;
        const width = el.offsetWidth;
        const height = el.offsetHeight;
        if (width === 0 || height === 0) return;
        if (!prev[id] || prev[id].width !== width || prev[id].height !== height) {
          next[id] = { width, height };
          changed = true;
        }
      };

      apply('arduino', boardRef.current);
      componentRefs.current.forEach((el, id) => apply(id, el));

      return changed ? next : prev;
    });
  }, []);

  useLayoutEffect(() => {
    setElementSizes((prev) => {
      if (!prev.arduino) return prev;
      const { arduino: _dropped, ...rest } = prev;
      return rest;
    });
  }, [boardType]);

  useEffect(() => {
    let cancelled = false;
    measureSizes();

    const pending: Array<HTMLElement & { updateComplete?: Promise<unknown> }> = [];
    if (boardRef.current) pending.push(boardRef.current);
    componentRefs.current.forEach((el) => {
      if (el) pending.push(el);
    });

    Promise.all(pending.map((el) => el.updateComplete ?? Promise.resolve())).then(() => {
      if (!cancelled) measureSizes();
    });

    return () => {
      cancelled = true;
    };
  }, [components, boardType, measureSizes]);

  // Glue logic — the simulation engine only emulates AVR (Arduino Uno), so
  // pin attach only makes sense while that board is selected.
  useEffect(() => {
    if (!engine || boardType !== 'arduino_uno') return;
    components.forEach((component) => {
      const element = componentRefs.current.get(component.id);
      if (!element) return;

      const conn = connections.find(c => c[0].startsWith(component.id + ':') || c[1].startsWith(component.id + ':'));
      if (!conn) return;

      const arduinoEnd = conn[0].startsWith('arduino:') ? conn[0] : (conn[1].startsWith('arduino:') ? conn[1] : null);
      if (!arduinoEnd) return;

      const arduinoPinStr = arduinoEnd.split(':')[1];
      let pinNum = parseInt(arduinoPinStr);
      if (arduinoPinStr.startsWith('A')) pinNum = parseInt(arduinoPinStr.substring(1)) + 14;
      if (isNaN(pinNum)) return;

      const type = normalizeComponentType(component.type);
      if (type === 'led') attachLed(engine, element, pinNum);
      if (type === 'push_button') attachButton(engine, element, pinNum);
    });
  }, [engine, boardType, components, connections]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'r' || e.key === 'R') {
        if (selectedPartId === 'arduino' || (!selectedPartId && draggingId === 'arduino')) {
          setArduinoRotate((prev) => (prev + 90) % 360);
        } else if (selectedPartId && onComponentRotate) {
          const comp = components.find((c) => c.id === selectedPartId);
          if (comp) {
            onComponentRotate(selectedPartId, ((comp.rotate ?? 0) + 90) % 360);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPartId, draggingId, components, onComponentRotate, selectedWireIndex, onWireDelete, onComponentDelete]);

  const boardPins = getPinCoords(boardType);
  const selectedComponent = components.find((c) => c.id === selectedPartId);
  const selectedComponentType = selectedComponent ? normalizeComponentType(selectedComponent.type) : null;
  const selectedColorConfig = selectedComponentType ? COMPONENT_COLOR_OPTIONS[selectedComponentType] : undefined;
  const selectedConnection = selectedWireIndex !== null ? connections[selectedWireIndex] : undefined;
  const selectedWireColor = selectedConnection ? (selectedConnection[2] || 'green') : null;

  // Xoay toạ độ pin (đo ở góc 0°) quanh tâm hình học thật của owner, khớp với
  // CSS transformOrigin: 'center center' đang dùng khi render board/linh kiện.
  const getRotatedOwnerCoord = useCallback(
    (ownerId: string, coord: { x: number; y: number }, rotateDeg: number): Waypoint => {
      const size = elementSizes[ownerId];
      if (!size) return { x: coord.x, y: coord.y };
      return rotatePoint(coord.x, coord.y, size.width / 2, size.height / 2, rotateDeg);
    },
    [elementSizes]
  );

  // Toạ độ tuyệt đối (trên canvas) của 1 chân, đã tính xoay — dùng chung cho
  // việc vẽ dây, xử lý bấm chân, và mặc định vị trí waypoint.
  const getPinAbsCoord = useCallback(
    (id: string, pin: string): Waypoint | null => {
      if (id === 'arduino') {
        const coord = boardPins[pin];
        if (!coord) {
          console.error(`[CircuitCanvas] Unknown pin "${pin}" on arduino — wire not rendered`);
          return null;
        }
        const rotated = getRotatedOwnerCoord('arduino', coord, arduinoRotate);
        return { x: arduinoPos.x + rotated.x, y: arduinoPos.y + rotated.y };
      }
      const comp = components.find((c) => c.id === id);
      if (!comp) {
        console.error(`[CircuitCanvas] Unknown component "${id}" — wire not rendered`);
        return null;
      }
      const type = normalizeComponentType(comp.type);
      const compPins = getPinCoords(type);
      const coord = compPins[pin];
      if (!coord) {
        console.error(`[CircuitCanvas] Unknown pin "${pin}" on component "${id}" (type "${type}") — wire not rendered`);
        return null;
      }
      const rotated = getRotatedOwnerCoord(id, coord, comp.rotate ?? 0);
      return { x: comp.x + rotated.x, y: comp.y + rotated.y };
    },
    [boardPins, arduinoPos, arduinoRotate, components, getRotatedOwnerCoord]
  );

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top - 48) / zoom;
    setMousePos({ x, y });

    if (draggingId) {
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;
      if (draggingId === 'arduino') {
        setArduinoPos({ x: newX, y: newY });
      } else if (onComponentMove) {
        onComponentMove(draggingId, newX, newY);
      }
    }

    if (draggingWaypoint && onWireWaypointChange) {
      const conn = connections[draggingWaypoint.connectionIndex];
      if (conn) {
        const [src, tgt, , storedWaypoints] = conn;
        const [srcId, srcPin] = src.split(':');
        const [tgtId, tgtPin] = tgt.split(':');
        const srcCoord = getPinAbsCoord(srcId, srcPin);
        const tgtCoord = getPinAbsCoord(tgtId, tgtPin);
        if (srcCoord && tgtCoord) {
          const base = getValidStoredWaypoints(storedWaypoints) ?? getDefaultWaypoints(srcCoord, tgtCoord);
          const next: Waypoint[] = [base[0], base[1]];
          next[draggingWaypoint.waypointIndex] = { x, y };
          onWireWaypointChange(draggingWaypoint.connectionIndex, next);
        }
      }
    }
  };

  const handlePointerUp = () => {
    setDraggingId(null);
    setDraggingWaypoint(null);
    if (isDrawingWire) {
      setIsDrawingWire(false);
      setWireStart(null);
    }
  };

  const handlePointerDownBackground = () => {
    setSelectedPartId(null);
    setSelectedWireIndex(null);
  };

  const handleComponentPointerDown = (e: React.PointerEvent, compId: string) => {
    e.stopPropagation();
    setSelectedPartId(compId === 'arduino' ? 'arduino' : compId);
    setSelectedWireIndex(null);
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const mx = (e.clientX - containerRect.left) / zoom;
    const my = (e.clientY - containerRect.top - 48) / zoom;

    if (compId === 'arduino') {
      setDragOffset({ x: mx - arduinoPos.x, y: my - arduinoPos.y });
    } else {
      const comp = components.find((c) => c.id === compId);
      if (comp) {
        setDragOffset({ x: mx - comp.x, y: my - comp.y });
      }
    }
    setDraggingId(compId);
  };

  const handlePinPointerDown = (e: React.PointerEvent, partId: string, pinName: string, absX: number, absY: number) => {
    e.stopPropagation();
    setIsDrawingWire(true);
    setWireStart({ id: partId, pinName, x: absX, y: absY });
  };

  const handlePinPointerUp = (e: React.PointerEvent, partId: string, pinName: string) => {
    e.stopPropagation();
    if (isDrawingWire && wireStart) {
      if (wireStart.id !== partId) {
        const isDuplicate = connections.some(conn => {
          const [src, tgt] = conn;
          const s1 = `${wireStart.id}:${wireStart.pinName}`;
          const t1 = `${partId}:${pinName}`;
          return (src === s1 && tgt === t1) || (src === t1 && tgt === s1);
        });

        if (!isDuplicate && onWireConnect) {
          const color = getAutoWireColor(wireStart.pinName, pinName);
          onWireConnect(wireStart.id, wireStart.pinName, partId, pinName, color);
        }
      }
    }
    setIsDrawingWire(false);
    setWireStart(null);
  };

  // React đăng ký listener wheel/touch ở gốc DOM với { passive: true } mặc
  // định (theo khuyến nghị trình duyệt cho hiệu năng scroll) — gọi
  // preventDefault() qua JSX onWheel bị trình duyệt âm thầm bỏ qua trong
  // 1 listener passive (kèm cảnh báo "Unable to preventDefault inside
  // passive event listener"), khiến hành vi cuộn mặc định vẫn "chuyền" lên
  // container cha (scroll chaining) dù zoom state vẫn đổi. Phải tự gắn
  // listener qua addEventListener với { passive: false } mới tôn trọng
  // đúng preventDefault().
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
    };

    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelNative);
  }, []);

  const renderPinDots = (
    pins: Record<string, { x: number; y: number; label: string }>,
    ownerId: string,
    ownerX: number,
    ownerY: number,
    rotateDeg: number
  ) =>
    Object.entries(pins).map(([pinName, coord]) => {
      const rotated = getRotatedOwnerCoord(ownerId, coord, rotateDeg);
      return (
        <div
          key={`${ownerId}-pin-${pinName}`}
          className={`absolute z-20 border cursor-crosshair transition-all hover:scale-[1.8] hover:opacity-100 ${
            isDrawingWire
              ? 'opacity-60 bg-yellow-400/80 border-yellow-500'
              : 'opacity-0 bg-green-500/90 border-green-600'
          }`}
          style={{
            left: coord.x - 3,
            top: coord.y - 3,
            width: 7,
            height: 7,
            borderRadius: 1,
          }}
          onPointerDown={(e) => handlePinPointerDown(e, ownerId, pinName, ownerX + rotated.x, ownerY + rotated.y)}
          onPointerUp={(e) => handlePinPointerUp(e, ownerId, pinName)}
          onPointerEnter={() => setHoveredPin({ id: ownerId, pinName, label: `${ownerId}:${pinName}` })}
          onPointerLeave={() => setHoveredPin(null)}
        />
      );
    });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#222222] overflow-hidden touch-none"
      style={{ minHeight: '500px' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerDown={handlePointerDownBackground}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        }}
      />

      <Toolbar
        selectedColorTarget={
          selectedPartId && selectedComponent && selectedColorConfig
            ? { partId: selectedPartId, typeLabel: selectedColorConfig.label, currentColor: selectedComponent.attrs?.color }
            : null
        }
        colorOptions={selectedColorConfig?.options}
        onChangeColor={(color) => {
          if (selectedPartId && onComponentAttrChange) {
            onComponentAttrChange(selectedPartId, { color });
          }
        }}
        selectedWireColor={selectedWireColor}
        onChangeWireColor={(color) => {
          if (selectedWireIndex !== null && onWireColorChange) {
            onWireColorChange(selectedWireIndex, color);
          }
        }}
        hasSelection={!!selectedPartId || selectedWireIndex !== null}
        onDelete={() => {
          if (selectedWireIndex !== null && onWireDelete) {
            onWireDelete(selectedWireIndex);
            setSelectedWireIndex(null);
          } else if (selectedPartId && onComponentDelete) {
            if (selectedPartId === 'arduino') return;
            onComponentDelete(selectedPartId);
            setSelectedPartId(null);
          }
        }}
        onRotate={() => {
          if (selectedPartId === 'arduino') {
            setArduinoRotate((prev) => (prev + 90) % 360);
          } else if (selectedPartId && onComponentRotate) {
            const comp = components.find((c) => c.id === selectedPartId);
            if (comp) {
              onComponentRotate(selectedPartId, ((comp.rotate ?? 0) + 90) % 360);
            }
          }
        }}
      />

      <div className="absolute bottom-3 right-3 z-50 bg-[#2d2d2d]/80 text-gray-300 px-2 py-1 rounded text-xs font-mono select-none pointer-events-none">
        {Math.round(zoom * 100)}%
      </div>

      <div
        className="absolute inset-0 mt-12"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 10, width: `${100 / zoom}%`, height: `${100 / zoom}%`, overflow: 'visible' }}>
          {isDrawingWire && wireStart && (
            <path
              d={getElbowPath(wireStart.x, wireStart.y, mousePos.x, mousePos.y)}
              stroke={getAutoWireColor(wireStart.pinName, hoveredPin ? hoveredPin.pinName : '')}
              strokeWidth={3 / zoom}
              fill="none"
              strokeDasharray="6 3"
              className="opacity-80"
            />
          )}

          {connections.map((conn, index) => {
            const [src, tgt, color, storedWaypoints] = conn;
            const [srcId, srcPin] = src.split(':');
            const [tgtId, tgtPin] = tgt.split(':');

            const srcCoord = getPinAbsCoord(srcId, srcPin);
            const tgtCoord = getPinAbsCoord(tgtId, tgtPin);

            if (!srcCoord || !tgtCoord) return null;

            const isSelected = selectedWireIndex === index;
            const waypoints = getValidStoredWaypoints(storedWaypoints) ?? getDefaultWaypoints(srcCoord, tgtCoord);
            const pathD = getWaypointPath(srcCoord, waypoints[0], waypoints[1], tgtCoord);

            return (
              <g
                key={`conn-${index}`}
                className="pointer-events-auto cursor-pointer"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedWireIndex(index);
                  setSelectedPartId(null);
                }}
              >
                <path
                  d={pathD}
                  stroke="transparent"
                  strokeWidth={15 / zoom}
                  fill="none"
                />
                <path
                  d={pathD}
                  stroke={isSelected ? '#22c55e' : (color || 'green')}
                  strokeWidth={isSelected ? 4 / zoom : 3 / zoom}
                  fill="none"
                  className={isSelected ? 'drop-shadow-md' : ''}
                />

                {isSelected && onWireWaypointChange && waypoints.map((wp, wpIndex) => (
                  <circle
                    key={`wp-${index}-${wpIndex}`}
                    cx={wp.x}
                    cy={wp.y}
                    r={5 / zoom}
                    fill={
                      draggingWaypoint?.connectionIndex === index && draggingWaypoint.waypointIndex === wpIndex
                        ? '#a855f7'
                        : '#9ca3af'
                    }
                    stroke="white"
                    strokeWidth={1.5 / zoom}
                    className="cursor-move pointer-events-auto"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelectedWireIndex(index);
                      setSelectedPartId(null);
                      setDraggingWaypoint({ connectionIndex: index, waypointIndex: wpIndex as 0 | 1 });
                    }}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        <div
          className="absolute"
          style={{
            left: arduinoPos.x,
            top: arduinoPos.y,
            cursor: draggingId === 'arduino' ? 'grabbing' : 'grab',
            userSelect: 'none',
            zIndex: draggingId === 'arduino' ? 30 : 5,
            transform: arduinoRotate ? `rotate(${arduinoRotate}deg)` : undefined,
            transformOrigin: 'center center',
          }}
          onPointerDown={(e) => handleComponentPointerDown(e, 'arduino')}
        >
          {createWokwiElement(boardTagName, { ref: boardRef, style: { pointerEvents: 'none' } })}
          {renderPinDots(boardPins, 'arduino', arduinoPos.x, arduinoPos.y, arduinoRotate)}

          {selectedPartId === 'arduino' && (
            <div className="absolute inset-0 -m-2 border border-dashed border-[#22c55e] pointer-events-none" style={{ zIndex: 15 }} />
          )}
        </div>

        {components.map((component) => {
          const type = normalizeComponentType(component.type);
          const isSelected = selectedPartId === component.id;
          const compPins = getPinCoords(type);
          const partState = partStates?.[component.id];

          const style: CSSProperties = {
            position: 'absolute',
            left: component.x,
            top: component.y,
            cursor: draggingId === component.id ? 'grabbing' : 'grab',
            userSelect: 'none',
            zIndex: isSelected ? 30 : 5,
            transform: component.rotate ? `rotate(${component.rotate}deg)` : undefined,
            transformOrigin: 'center center',
          };

          let renderElement = null;
          if (type === 'led') {
            renderElement = createWokwiElement('wokwi-led', {
              ref: setComponentRef(component.id),
              color: getLedColor(component.attrs?.color),
              value: partState?.value ?? '0',
              style: { pointerEvents: 'none' },
            });
          } else if (type === 'push_button') {
            renderElement = createWokwiElement('wokwi-pushbutton', {
              ref: setComponentRef(component.id),
              color: component.attrs?.color || 'blue',
              style: { pointerEvents: 'none' },
            });
          } else if (type === 'buzzer') {
            renderElement = createWokwiElement('wokwi-buzzer', {
              ref: setComponentRef(component.id),
              hassignal: partState?.buzzing ? 'true' : 'false',
              style: { pointerEvents: 'none' },
            });
          } else if (type === 'potentiometer') {
            renderElement = createWokwiElement('wokwi-potentiometer', {
              ref: setComponentRef(component.id),
              style: { pointerEvents: 'none' },
            });
          } else if (type === 'servo') {
            renderElement = createWokwiElement('wokwi-servo', {
              ref: setComponentRef(component.id),
              style: { pointerEvents: 'none' },
            });
          } else if (type === 'resistor') {
            renderElement = createWokwiElement('wokwi-resistor', {
              ref: setComponentRef(component.id),
              value: component.attrs?.value || '1000',
              style: { pointerEvents: 'none' },
            });
          } else {
            renderElement = (
              <div className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-xs text-gray-300 pointer-events-none">
                {component.type}
              </div>
            );
          }

          return (
            <div key={component.id} style={style} onPointerDown={(e) => handleComponentPointerDown(e, component.id)}>
              {renderElement}

              {isSelected && (
                <div className="absolute inset-0 -m-2 border border-dashed border-[#22c55e] pointer-events-none" style={{ zIndex: 15 }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[#22c55e] bg-[#222] rounded-full p-0.5">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                </div>
              )}

              {renderPinDots(compPins, component.id, component.x, component.y, component.rotate ?? 0)}
            </div>
          );
        })}

        {hoveredPin && !isDrawingWire && (
          <div
            className="absolute z-50 bg-white text-black px-2 py-0.5 text-xs font-mono border border-gray-400 pointer-events-none shadow-sm whitespace-nowrap"
            style={{ left: mousePos.x + 12, top: mousePos.y - 24 }}
          >
            {hoveredPin.label}
          </div>
        )}

        {components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-gray-500 font-medium">Thêm linh kiện từ menu phía trên để bắt đầu.</p>
          </div>
        )}
      </div>
    </div>
  );
};
