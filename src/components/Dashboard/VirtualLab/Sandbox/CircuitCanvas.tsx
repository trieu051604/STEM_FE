import '@wokwi/elements';
import React, { createElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { SimulationEngine } from './SimulationEngine';
import { attachLed } from './glue/led';
import { attachButton } from './glue/button';
import type { LabCircuitComponent, MechanicalLink } from '@/services/dashboardApi';
import { Toolbar, COMPONENT_COLOR_OPTIONS } from './Toolbar';
import { getPinCoords, getPinKind } from './pinMaps';
import { HelpCircle, Plus } from 'lucide-react';
import { normalizeComponentType } from './componentTypeNormalize';
import { ROBOT_KIT_FALLBACK_CARDS, getFallbackIllustration } from './componentIllustrations';
import { getInteractionCapability } from './runtimeInteractionCapability';
import {
  type MotorVisualState,
  STOPPED_VISUAL,
  driveStateToVisual,
  onOffToVisual,
  findNearest,
  findL298nChannel,
} from './motorVisual';

export type Waypoint = { x: number; y: number };
export type Connection = [string, string, string, Waypoint[]?];

export type MotorDriveState = 'forward' | 'backward' | 'stopped' | 'brake';

export interface PartVisualState {
  value?: '0' | '1';
  buzzing?: boolean;
  // L298N — suy ra thật từ cặp chân IN qua QEMU (xem L298nModel.cs), KHÔNG
  // phải giá trị giả định. undefined nghĩa là chưa nhận event nào cho motor đó.
  motorA?: MotorDriveState;
  motorB?: MotorDriveState;
  // RGB LED — mỗi kênh bật/tắt độc lập qua digitalWrite (xem RgbLedModel.cs).
  rgbR?: boolean;
  rgbG?: boolean;
  rgbB?: boolean;
  // WiFi/Cloud Node/Dashboard (Phase 1) — true khi đã nhận ít nhất 1
  // cloud-event cho componentId này (xem CloudDashboardPanel.tsx — nơi hiển
  // thị đầy đủ topic/value/log; ở đây chỉ 1 chấm nhỏ báo "đang có dữ liệu",
  // card 70x60 quá nhỏ để nhồi thêm danh sách topic).
  cloudLive?: boolean;
  // Relay Module — suy ra thật từ digitalWrite trên chân IN qua
  // RelayModel.cs (Educational runner). undefined = chưa nhận event nào.
  relay?: boolean;
  // Fan/Drone Motor — nhị phân ON/OFF suy ra thật từ digitalWrite qua
  // FanModel.cs/DroneMotorModel.cs (QemuEsp32Runner.ComponentIndex). undefined
  // = chưa nhận event nào (xem TASK "STANDARDIZE MOTOR / ROTATING COMPONENT
  // ANIMATION"). KHÔNG có PWM/tốc độ — QEMU chỉ instrument digitalWrite.
  fan?: boolean;
  droneMotor?: boolean;
  // Servo — góc thật 0-180 độ qua ServoModel.cs (`state:'angle'`). CHỈ có ở
  // Educational runner hôm nay (QEMU không đọc được PWM servo write() dùng
  // để tạo — xem ServoModel.cs/QemuEsp32Runner.cs, không phải thiếu sót ở
  // tầng FE). undefined = chưa nhận event nào -> hiển thị góc mặc định 90°.
  angle?: number;
}

// wokwi-led/wokwi-buzzer (Lit) khai báo `value`/`hasSignal` là boolean nội
// bộ (`this.value && ...`, `this.hasSignal`), nhưng property decorator
// không có `{ type: Boolean }`. Nếu truyền chuỗi ('0'/'false') qua React
// props, Lit lưu thẳng chuỗi đó vào property — và MỌI chuỗi non-empty đều
// truthy trong JS, kể cả '0'/'false', nên LED/Buzzer luôn hiển thị như đang
// bật dù giá trị logic là tắt. Đã verify thật qua trình duyệt (React +
// @wokwi/elements thật, không phải suy luận): value='0' (string) ->
// lightOn=true (SAI); value={false} (boolean) -> lightOn=false (ĐÚNG).
// Bắt buộc truyền boolean thật, không phải chuỗi '0'/'1'.
function isLedOn(state: PartVisualState | undefined): boolean {
  return state?.value === '1';
}

// wokwi-buzzer dùng property `hasSignal` (camelCase) — Lit tự suy ra tên
// attribute quan sát là `hassignal` (lowercase) khi không khai báo
// `attribute:` tường minh. React chỉ gán trực tiếp DOM property (bỏ qua
// serialize chuỗi qua attribute) khi TÊN PROP truyền vào khớp đúng case với
// property thật tồn tại sẵn trên instance — verify thật: prop `hassignal`
// (chữ thường, khớp tên attribute chứ không khớp property) luôn bị React đi
// qua đường attribute (kể cả khi truyền boolean, `true` cũng chỉ ra
// attribute="" rỗng, Lit đọc lại thành chuỗi rỗng falsy — vẫn sai theo
// hướng khác); còn prop `hasSignal` (đúng case) với giá trị boolean thật
// luôn được gán thẳng qua property, hoạt động đúng cả 2 chiều bật/tắt.
function isBuzzerOn(state: PartVisualState | undefined): boolean {
  return !!state?.buzzing;
}

interface CircuitCanvasProps {
  engine: SimulationEngine | null;
  boardType?: string;
  components?: LabCircuitComponent[];
  connections?: Connection[];
  // Liên kết cơ khí TƯỜNG MINH (Robot Wheel/Propeller -> Motor) — tuỳ chọn.
  // Khi có, ƯU TIÊN dùng thay vì heuristic nearest-canvas-distance (xem
  // motorVisual.ts) vì đây là quan hệ diagram tác giả THẬT SỰ khai báo, không
  // phải suy đoán theo khoảng cách. Bỏ trống = giữ nguyên hành vi cũ 100%
  // (mọi diagram hiện có không khai báo field này).
  mechanicalLinks?: MechanicalLink[];
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
  // Nút "+" nổi trên canvas (Wokwi-style) — CHỈ hiện khi có callback này (opt-in,
  // không phá layout của bất kỳ nơi nào đang dùng CircuitCanvas mà chưa muốn
  // tính năng này). CircuitCanvas không tự biết registry/component options gì
  // cả — mọi state popup/fetch dữ liệu do component cha (LabSandboxPage/
  // CircuitBuilderTeacherMode) sở hữu, giữ đúng nguyên tắc cũ "cha truyền dữ
  // liệu xuống qua props", không thêm phụ thuộc API mới vào CircuitCanvas.
  onOpenPalette?: () => void;
  // Sau khi cha thêm 1 component mới (qua popup), truyền id đó vào đây để tự
  // động chọn nó trên canvas (yêu cầu "Sau khi thêm, component được selected")
  // — đổi giá trị (kể cả cùng string cũ, xem key đi kèm ở nơi gọi) sẽ kích
  // hoạt lại useEffect chọn lại, không cần biến CircuitCanvas thành fully
  // controlled component cho toàn bộ selection state.
  autoSelectId?: string | null;
  // Realtime input (STEP 5) — opt-in, same pattern as onOpenPalette above.
  // CircuitCanvas doesn't know about SignalR/simulation state at all; it just
  // reports press/release for push_button components while this callback is
  // provided. Only the parent (LabSandboxPage) decides whether/when to wire
  // it to virtualLabHub.setSimulationInput. When omitted, push_button behaves
  // exactly as before (drag/select only, no press semantics).
  onButtonInput?: (componentId: string, pressed: boolean) => void;
  // Realtime analog input (STEP 6) — same opt-in shape as onButtonInput.
  // Value is already clamped to the canonical ESP32 ADC range (0..4095)
  // before this fires; CircuitCanvas owns the slider widget, not the value's
  // meaning.
  onAnalogInput?: (componentId: string, value: number) => void;
  // Realtime sensor input (STEP 8) — same shape as onAnalogInput plus a
  // sensorKind label (STEP 9's DTO requirement). Only "light" is wired today
  // (photoresistor-sensor); a future sensor with a genuinely different value
  // shape gets its own prop rather than overloading this one.
  onSensorInput?: (componentId: string, sensorKind: string, value: number) => void;
}

function getBoardTagName(boardType: string) {
  const normalized = boardType.toLowerCase();
  if (normalized === 'esp32_devkit_v1' || normalized === 'esp32-devkit-v1') return 'wokwi-esp32-devkit-v1';
  return 'wokwi-arduino-uno';
}

// normalizeComponentType() tách ra componentTypeNormalize.ts (2026-07-27) —
// dùng chung với componentIllustrations.tsx, không định nghĩa lại ở đây.

// Lookup table cho mọi element THẬT trong @wokwi/elements thuộc "Component
// Library" mở rộng (khác Robot Delivery Kit — nhóm đó vẫn giữ if/else tường
// minh phía trên, không đổi để tránh rủi ro không cần thiết cho phần đã
// PASS). Dùng 1 bảng tra cứu thay vì lặp lại ~16 nhánh if/else gần giống hệt
// nhau — chỉ khác tag name, không có logic property đặc biệt nào (không
// component nào trong nhóm này cần property number/boolean phải gán qua ref
// như RGB LED — tất cả chỉ hiển thị tĩnh, không có part-state runtime).
const WOKWI_REAL_ELEMENT_TAGS: Record<string, string> = {
  'flame-sensor': 'wokwi-flame-sensor',
  'gas-sensor': 'wokwi-gas-sensor',
  'pir-motion-sensor': 'wokwi-pir-motion-sensor',
  'photoresistor-sensor': 'wokwi-photoresistor-sensor',
  'ntc-temperature-sensor': 'wokwi-ntc-temperature-sensor',
  'hx711': 'wokwi-hx711',
  'ir-receiver': 'wokwi-ir-receiver',
  'membrane-keypad': 'wokwi-membrane-keypad',
  'ssd1306': 'wokwi-ssd1306',
  'lcd1602': 'wokwi-lcd1602',
  'lcd1602-i2c': 'wokwi-lcd1602',
  'neopixel': 'wokwi-neopixel',
  'led-bar-graph': 'wokwi-led-bar-graph',
  '7segment': 'wokwi-7segment',
  'stepper-motor': 'wokwi-stepper-motor',
  'ili9341': 'wokwi-ili9341',
  'dht11': 'wokwi-dht22',
  'mpu6050': 'wokwi-mpu6050',
  'lcd2004': 'wokwi-lcd2004',
};

// Robot giao hàng mini — linh kiện KHÔNG có element thật trong @wokwi/elements
// (đã kiểm tra: L298N/DC Motor/Robot Wheel/Caster Wheel/Chassis/Battery
// Pack/Power Switch/Breadboard/Delivery Box không tồn tại trong package).
// Thay vì rơi vào fallback gray-box vô danh cũ (chỉ hiện đúng chuỗi type),
// dùng 1 card chung có icon + tên rõ ràng cho cả nhóm — kích thước PHẢI khớp
// đúng pin coords tương ứng trong pinMaps.ts (card chính là bounding box thật
// dùng để tính vị trí pin-dot). Linh kiện có pin (L298N/DC Motor/Battery
// Pack/Power Switch) vẫn nhận pin-dot bình thường qua renderPinDots() ở nơi
// gọi — không cần vẽ pin trong card này. Linh kiện cơ khí thuần (Wheel/Caster
// Wheel/Chassis/Breadboard/Delivery Box) không có entry trong pinMaps nên tự
// động không có pin-dot nào, đúng yêu cầu "visual-only không render pin-dot".

const MOTOR_STATE_LABEL: Record<MotorDriveState, string> = {
  forward: 'Tiến',
  backward: 'Lùi',
  stopped: 'Dừng',
  brake: 'Phanh',
};

const MOTOR_STATE_COLOR: Record<MotorDriveState, string> = {
  forward: 'text-emerald-400',
  backward: 'text-amber-400',
  stopped: 'text-slate-400',
  brake: 'text-red-400',
};

function renderFallbackCard(
  type: string,
  rawType: string,
  partState: PartVisualState | undefined,
  motorVisual?: MotorVisualState,
) {
  const config = ROBOT_KIT_FALLBACK_CARDS[type];
  if (!config) {
    // Type hoàn toàn chưa biết (kể cả chưa nằm trong bộ robot kit) — giữ
    // nguyên hành vi cũ 100% để không phá bất kỳ component nào khác đang
    // dùng đường fallback này.
    return (
      <div className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-xs text-gray-300 pointer-events-none">
        {rawType}
      </div>
    );
  }

  const Icon = config.icon;
  // L298N — trạng thái động cơ suy ra THẬT từ QEMU (L298nModel.cs), không
  // phải giả lập UI. Chưa có event nào (undefined) hiện "—" thay vì bịa trạng
  // thái mặc định. Nhãn "T"/"P" (Trái/Phải) thay cho "A"/"B" kỹ thuật — L298N
  // trong app này chỉ dùng cho robot 2 bánh (motorA=trái, motorB=phải theo
  // ROBOT_DELIVERY_PINS/circuitConfig của mọi bài robotics), nên nhãn theo
  // ngữ nghĩa dễ đọc hơn cho học sinh khi demo (Phase 6 hardening).
  const showMotorState = type === 'l298n';
  // Relay Module — trạng thái ON/OFF suy ra thật từ digitalWrite trên chân IN
  // (RelayModel.cs, Educational runner). Không animation phức tạp, chỉ nhãn.
  const showRelayState = type === 'relay-module';
  // Fan/Drone Motor — ON/OFF suy ra thật từ digitalWrite (FanModel.cs/
  // DroneMotorModel.cs). Cùng pattern nhãn với Relay ở trên; animation quay
  // thật đọc qua motorVisual (xem getFallbackIllustration bên dưới), nhãn chữ
  // chỉ là phụ trợ debug/đọc nhanh, không thay thế animation.
  const showFanState = type === 'fan';
  const showDroneMotorState = type === 'drone-motor';
  // WiFi/Cloud Phase 1 — chấm nhỏ báo đang nhận dữ liệu cloud-event (chi tiết
  // đầy đủ topic/value/log xem CloudDashboardPanel.tsx, KHÔNG nhồi vào đây).
  const showCloudDot = (type === 'wifi-cloud-node' || type === 'dashboard-cloud') && partState?.cloudLive;
  const illustration = getFallbackIllustration(type, config.width, config.height, motorVisual);

  // Có minh hoạ SVG riêng — hình chiếm gần hết card, tên/badge/motor-state
  // hiện dạng nhãn phủ mờ phía dưới (không đè lên chi tiết hình vẽ). Card
  // KHÔNG có minh hoạ riêng giữ NGUYÊN layout icon+tên cũ (an toàn, không
  // đổi hành vi cho những type chưa vẽ tới).
  if (illustration) {
    return (
      <div
        className="relative rounded-lg border border-slate-500 bg-slate-800 overflow-hidden pointer-events-none select-none"
        style={{ width: config.width, height: config.height }}
        title={`${config.label} — ${config.badge}`}
      >
        <div className="absolute inset-0">{illustration}</div>
        {showCloudDot && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="Đang nhận dữ liệu cloud" />
        )}
        <div
          className={`absolute left-0 right-0 bg-black/60 px-1 py-0.5 ${
            // L298N (ảnh thật): nửa dưới ảnh là hàng pin VIN/GND/5V/ENA-ENB —
            // nhãn phủ ở bottom-0 sẽ đè lên đúng terminal đó. Nửa trên ảnh chỉ
            // có heatsink/lỗ vít (không có pin), nên đặt nhãn ở top-0 thay vì
            // bottom-0 chỉ cho riêng type này (các fallback card khác vẫn giữ
            // nguyên bottom-0 — pin của chúng không nằm ở nửa dưới card).
            type === 'l298n' ? 'top-0' : 'bottom-0'
          }`}
        >
          <span className="block text-[9px] font-medium text-center leading-tight text-slate-100 truncate">
            {config.label}
          </span>
          {showMotorState && (
            <span className="block text-[8px] font-mono leading-tight text-center">
              <span className={MOTOR_STATE_COLOR[partState?.motorA ?? 'stopped']}>
                T:{partState?.motorA ? MOTOR_STATE_LABEL[partState.motorA] : '—'}
              </span>
              {' '}
              <span className={MOTOR_STATE_COLOR[partState?.motorB ?? 'stopped']}>
                P:{partState?.motorB ? MOTOR_STATE_LABEL[partState.motorB] : '—'}
              </span>
            </span>
          )}
          {showRelayState && (
            <span className={`block text-[8px] font-mono leading-tight text-center ${partState?.relay ? 'text-emerald-400' : 'text-slate-400'}`}>
              {partState?.relay === undefined ? '—' : partState.relay ? 'ON' : 'OFF'}
            </span>
          )}
          {showFanState && (
            <span className={`block text-[8px] font-mono leading-tight text-center ${partState?.fan ? 'text-emerald-400' : 'text-slate-400'}`}>
              {partState?.fan === undefined ? '—' : partState.fan ? 'ON' : 'OFF'}
            </span>
          )}
          {showDroneMotorState && (
            <span className={`block text-[8px] font-mono leading-tight text-center ${partState?.droneMotor ? 'text-emerald-400' : 'text-slate-400'}`}>
              {partState?.droneMotor === undefined ? '—' : partState.droneMotor ? 'ON' : 'OFF'}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-slate-500 bg-slate-700/90 flex flex-col items-center justify-center gap-1 pointer-events-none text-slate-100 select-none"
      style={{ width: config.width, height: config.height }}
      title={`${config.label} — ${config.badge}`}
    >
      <Icon className="w-5 h-5 opacity-90" />
      <span className="text-[10px] font-medium text-center leading-tight px-1">{config.label}</span>
      {showMotorState && (
        <span className="text-[9px] font-mono leading-tight">
          <span className={MOTOR_STATE_COLOR[partState?.motorA ?? 'stopped']}>
            A:{partState?.motorA ? MOTOR_STATE_LABEL[partState.motorA] : '—'}
          </span>
          {' '}
          <span className={MOTOR_STATE_COLOR[partState?.motorB ?? 'stopped']}>
            B:{partState?.motorB ? MOTOR_STATE_LABEL[partState.motorB] : '—'}
          </span>
        </span>
      )}
      {showRelayState && (
        <span className={`text-[9px] font-mono leading-tight ${partState?.relay ? 'text-emerald-400' : 'text-slate-400'}`}>
          {partState?.relay === undefined ? '—' : partState.relay ? 'ON' : 'OFF'}
        </span>
      )}
    </div>
  );
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

// WIRE ROUTING tuning — xem autoRoutedWaypoints (bên trong CircuitCanvas) cho
// thuật toán đầy đủ. WIRE_LANE_GAP: khoảng cách tối thiểu giữa 2 lane (đoạn
// trunk thẳng đứng) trước khi coi là va chạm. PIN_ESCAPE_DISTANCE: khoảng
// cách tối thiểu dây phải đi thẳng ra khỏi pin trước khi được phép đổi
// hướng (không đổi hướng ngay tại pin).
const WIRE_LANE_GAP = 8;
const PIN_ESCAPE_DISTANCE = 14;

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
  mechanicalLinks = [],
  partStates,
  onComponentMove,
  onWireConnect,
  onWireDelete,
  onWireWaypointChange,
  onWireColorChange,
  onComponentDelete,
  onComponentAttrChange,
  onComponentRotate,
  onOpenPalette,
  autoSelectId,
  onButtonInput,
  onAnalogInput,
  onSensorInput,
}: CircuitCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLElement | null>(null);
  const componentRefs = useRef(new Map<string, HTMLElement | null>());
  const boardTagName = getBoardTagName(boardType);
  // Light debounce for the potentiometer slider — visual state updates every
  // drag tick (local, free), but the actual SetSimulationInput call is capped
  // to at most one in flight per ~80ms so dragging doesn't spam SignalR.
  // analogInputPending holds the LATEST value per component while a timer is
  // in flight, so a fast drag still ends up sending the final position, not
  // whatever value happened to be current when the timer was first armed.
  const analogInputTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const analogInputPending = useRef(new Map<string, number>());
  const [analogPreview, setAnalogPreview] = useState<Record<string, number>>({});
  // INTERACTIVE SENSOR CONTROLS milestone — same "input control is user-
  // controlled local preview, output visual is simulation-event-controlled"
  // separation as analogPreview (STEP 11): this never reads back from a
  // simulation event, it's purely the last value the user clicked.
  const [digitalSensorPreview, setDigitalSensorPreview] = useState<Record<string, boolean>>({});

  // Board position & rotation (draggable) — "arduino" id is kept as the fixed
  // main-board slot regardless of which board type is actually selected.
  const [arduinoPos, setArduinoPos] = useState({ x: 350, y: 80 });
  const [arduinoRotate, setArduinoRotate] = useState(0);

  // Selection
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [selectedWireIndex, setSelectedWireIndex] = useState<number | null>(null);

  // Tự chọn component vừa thêm qua popup "+" (yêu cầu "Sau khi thêm, component
  // được selected") — chỉ phản ứng khi autoSelectId THẬT SỰ đổi (id mới), so
  // sánh qua ref để tránh chọn lại vô ích mỗi lần cha re-render với cùng giá
  // trị (vd gõ code làm component cha render lại nhưng autoSelectId không đổi).
  const lastAutoSelectIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!autoSelectId || autoSelectId === lastAutoSelectIdRef.current) return;
    lastAutoSelectIdRef.current = autoSelectId;
    setSelectedPartId(autoSelectId);
    setSelectedWireIndex(null);
  }, [autoSelectId]);

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

  // Pan bằng chuột phải — offset tính bằng PIXEL MÀN HÌNH (áp dụng SAU scale
  // trong transform, xem world-layer bên dưới: `translate(pan) scale(zoom)`),
  // nên kéo pan cảm giác nhất quán bất kể đang zoom mức nào. Chỉ là view
  // state thuần tuý (giống zoom) — KHÔNG lưu vào diagram/DB, luôn reset về
  // {0,0} khi tải lại trang, đúng hành vi canvas app thông thường (Wokwi cũng
  // vậy — pan không phải 1 phần dữ liệu mạch).
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);

  const setComponentRef = (id: string) => (element: Element | null) => {
    componentRefs.current.set(id, element as HTMLElement | null);
  };

  // Trạng thái quay CHUẨN HOÁ cho mọi linh kiện cơ khí (STANDARDIZE MOTOR /
  // ROTATING COMPONENT ANIMATION) — tính 1 LẦN/render từ dữ liệu THẬT đã có
  // sẵn (partStates + connections), KHÔNG tạo state giả nào ở FE:
  //   - DC Motor: kênh L298N nó đấu vào qua OUT1-4 (tra trong connections[]),
  //     rồi đọc motorA/motorB thật của đúng L298N đó.
  //   - Fan/Drone Motor: ON/OFF thật qua FanModel.cs/DroneMotorModel.cs.
  //   - Robot Wheel/Propeller: KHÔNG có kết nối điện nào (visual-only, không
  //     vào netlist) — ƯU TIÊN mechanicalLinks[] tường minh (diagram tác giả
  //     tự khai báo targetId->motorId thật, xem MechanicalLink), CHỈ fallback
  //     về nearest-canvas-distance khi diagram không khai báo link nào cho
  //     đúng component đó (không phá diagram cũ chưa có field này).
  const motorVisualStates = useMemo(() => {
    const result: Record<string, MotorVisualState> = {};

    const dcMotors = components.filter((c) => normalizeComponentType(c.type) === 'dc-motor');
    const droneMotors = components.filter((c) => normalizeComponentType(c.type) === 'drone-motor');
    const wheels = components.filter((c) => normalizeComponentType(c.type) === 'robot-wheel');
    const propellers = components.filter((c) => normalizeComponentType(c.type) === 'propeller');
    const fans = components.filter((c) => normalizeComponentType(c.type) === 'fan');

    for (const motor of dcMotors) {
      const channel = findL298nChannel(motor.id, connections);
      const l298nState = channel ? partStates?.[channel.l298nId] : undefined;
      const driveState = channel?.channel === 'motorB' ? l298nState?.motorB : l298nState?.motorA;
      result[motor.id] = driveStateToVisual(driveState);
    }

    for (const drone of droneMotors) {
      result[drone.id] = onOffToVisual(partStates?.[drone.id]?.droneMotor);
    }

    for (const fan of fans) {
      result[fan.id] = onOffToVisual(partStates?.[fan.id]?.fan);
    }

    // resolveLinkedMotorId: mechanicalLinks[] trước, nearest-distance sau.
    const resolveLinkedMotorId = (
      target: { id: string; x: number; y: number },
      candidates: { id: string; x: number; y: number }[],
    ): string | null => {
      const explicitLink = mechanicalLinks.find((link) => link.targetId === target.id);
      if (explicitLink && result[explicitLink.motorId]) {
        return explicitLink.motorId;
      }
      return findNearest(target, candidates)?.id ?? null;
    };

    const dcMotorPoints = dcMotors.map((m) => ({ id: m.id, x: m.x, y: m.y }));
    for (const wheel of wheels) {
      const motorId = resolveLinkedMotorId({ id: wheel.id, x: wheel.x, y: wheel.y }, dcMotorPoints);
      result[wheel.id] = (motorId && result[motorId]) || STOPPED_VISUAL;
    }

    const droneMotorPoints = droneMotors.map((m) => ({ id: m.id, x: m.x, y: m.y }));
    for (const propeller of propellers) {
      const motorId = resolveLinkedMotorId({ id: propeller.id, x: propeller.x, y: propeller.y }, droneMotorPoints);
      result[propeller.id] = (motorId && result[motorId]) || STOPPED_VISUAL;
    }

    return result;
  }, [components, connections, mechanicalLinks, partStates]);

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

  // wokwi-rgb-led: ledRed/ledGreen/ledBlue là number (0/1), không phải
  // boolean. React chỉ gán thẳng qua DOM property cho custom element khi
  // value là boolean (nhánh đặc biệt trong react-dom cho phép value/hasSignal
  // ở trên hoạt động đúng); với number, React luôn đi qua
  // node.setAttribute(name, String(value)) — bị lowercase thành "ledred" và
  // Lit đọc lại thành STRING qua @property() mặc định type:String, ghi đè
  // luôn giá trị number nội bộ mà render() dùng. Verify thật: truyền
  // ledRed={1} qua JSX -> DOM property ledRed vẫn ở 0, LED không sáng. Phải
  // gán property trực tiếp qua ref, giống cách xử lý `color` ở trên.
  useEffect(() => {
    components.forEach((component) => {
      const type = normalizeComponentType(component.type);
      if (type !== 'rgb-led') return;
      const el = componentRefs.current.get(component.id);
      if (!el) return;
      const state = partStates?.[component.id];
      // @ts-ignore
      el.ledRed = state?.rgbR ? 1 : 0;
      // @ts-ignore
      el.ledGreen = state?.rgbG ? 1 : 0;
      // @ts-ignore
      el.ledBlue = state?.rgbB ? 1 : 0;
    });
  }, [components, partStates]);

  // wokwi-servo: `angle` là number property (ServoElement.angle) — CÙNG lý
  // do RGB LED ở trên (React chỉ gán thẳng DOM property cho boolean qua JSX,
  // number luôn đi qua setAttribute -> Lit đọc lại thành string, ghi đè giá
  // trị nội bộ). Gán trực tiếp qua ref. Mặc định 90° (giữa hành trình) khi
  // chưa có event nào — KHÔNG bịa chuyển động, chỉ là vị trí nghỉ hợp lý.
  // STEP 6: KHÔNG dùng animation quay vô hạn — chỉ set góc tĩnh, phần "mượt"
  // do CSS transition bên trong bản thân wokwi-servo's shadow DOM tự xử lý
  // nếu có; nếu không, vẫn đúng yêu cầu "0/90/180 hiển thị khác nhau rõ
  // ràng", chỉ là chuyển động dạng snap thay vì tween.
  useEffect(() => {
    components.forEach((component) => {
      const type = normalizeComponentType(component.type);
      if (type !== 'servo') return;
      const el = componentRefs.current.get(component.id);
      if (!el) return;
      const angle = partStates?.[component.id]?.angle;
      // @ts-ignore
      el.angle = typeof angle === 'number' ? angle : 90;
    });
  }, [components, partStates]);

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

  // Vị trí gốc (không xoay/không theo pin cụ thể) của 1 owner — dùng làm
  // fallback khi 1 dây đã lưu tham chiếu tới pin không còn tồn tại trong
  // pinMaps hiện tại (vd sau khi đổi tên chân board). Không có fallback này,
  // dây đó bị bỏ render hoàn toàn (xem getPinAbsCoord ở trên), tức là không
  // thể click để chọn+xóa qua UI — dữ liệu cũ kẹt vĩnh viễn trong DiagramJson
  // mà người dùng không có cách nào tự dọn (đã xảy ra thật với Lab[132213]
  // sau lần đổi D13->GPIO13, phải xóa tay qua SQL).
  const getOwnerFallbackCoord = useCallback(
    (id: string): Waypoint | null => {
      if (id === 'arduino') return { x: arduinoPos.x, y: arduinoPos.y };
      const comp = components.find((c) => c.id === id);
      return comp ? { x: comp.x, y: comp.y } : null;
    },
    [arduinoPos, components]
  );

  // WIRE ROUTING — fan-out/fan-in với lane riêng cho từng dây, thay cho
  // getDefaultWaypoints() cũ (đã lỗi thời, giữ lại chỉ làm fallback cuối cùng
  // bên dưới): getDefaultWaypoints() tính midX ĐỘC LẬP cho từng dây, chỉ dựa
  // vào src.x/tgt.x của chính nó — khi nhiều dây nối giữa 2 cụm linh kiện gần
  // nhau (vd 4 GPIO ESP32 -> 4 chân L298N, các chân cách nhau ~25px) thì
  // midX của chúng gần như trùng nhau, khiến đoạn trunk (thân dây thẳng
  // đứng) chồng lên nhau nhìn như 1 "bó" dây duy nhất.
  //
  // Thuật toán mới xử lý TOÀN BỘ connections theo thứ tự index ổn định
  // (deterministic — không Math.random(), cùng 1 diagram JSON luôn ra cùng 1
  // kết quả): mỗi dây thử đặt lane tại midX tự nhiên trước; nếu đoạn trunk
  // đó (đường thẳng đứng tại 1 toạ độ X, trải theo khoảng Y từ src tới tgt)
  // chồng Y-range với 1 trunk đã đăng ký ở X cách đó < WIRE_LANE_GAP, thì
  // dịch sang lane kế tiếp (+gap, -gap, +2*gap, -2*gap, ...) và thử lại —
  // đúng yêu cầu "detect collision -> tăng lane offset -> thử lại". Lane
  // cũng bị ép cách CẢ src.x lẫn tgt.x tối thiểu PIN_ESCAPE_DISTANCE, để dây
  // không đổi hướng ngay tại pin.
  //
  // CHỈ áp dụng cho dây CHƯA có waypoint tuỳ chỉnh đã lưu (storedWaypoints) —
  // dây người dùng tự kéo tay giữ nguyên 100% hành vi cũ, không bị auto-route
  // đè lên, và không tính vào danh sách occupied (đó là lựa chọn có chủ ý
  // của người dùng, không phải đối tượng auto-router cần né).
  const autoRoutedWaypoints = useMemo(() => {
    type OccupiedTrunk = { x: number; yMin: number; yMax: number };
    const occupied: OccupiedTrunk[] = [];
    const results: Array<[Waypoint, Waypoint] | null> = [];

    const collidesAt = (x: number, yMin: number, yMax: number) =>
      occupied.some((seg) => Math.abs(seg.x - x) < WIRE_LANE_GAP && yMin <= seg.yMax && yMax >= seg.yMin);

    connections.forEach((conn, index) => {
      const [src, tgt, , storedWaypoints] = conn;
      if (getValidStoredWaypoints(storedWaypoints)) {
        results[index] = null;
        return;
      }

      const [srcId, srcPin] = src.split(':');
      const [tgtId, tgtPin] = tgt.split(':');
      const srcCoord = getPinAbsCoord(srcId, srcPin) ?? getOwnerFallbackCoord(srcId);
      const tgtCoord = getPinAbsCoord(tgtId, tgtPin) ?? getOwnerFallbackCoord(tgtId);
      if (!srcCoord || !tgtCoord) {
        results[index] = null;
        return;
      }

      const dx = tgtCoord.x - srcCoord.x;
      const naturalMidX = srcCoord.x + dx / 2;
      const yMin = Math.min(srcCoord.y, tgtCoord.y);
      const yMax = Math.max(srcCoord.y, tgtCoord.y);

      const minLaneX = Math.min(srcCoord.x, tgtCoord.x) + PIN_ESCAPE_DISTANCE;
      const maxLaneX = Math.max(srcCoord.x, tgtCoord.x) - PIN_ESCAPE_DISTANCE;
      // src/tgt quá gần nhau để chừa đủ escape distance cả 2 phía — chấp
      // nhận midX chưa clamp thay vì ép ra 1 khoảng rỗng (minLaneX>maxLaneX).
      const clamp = (x: number) => (minLaneX <= maxLaneX ? Math.min(Math.max(x, minLaneX), maxLaneX) : naturalMidX);

      let laneX = clamp(naturalMidX);
      let attempt = 0;
      // Giới hạn an toàn — 1 khu vực trong lab giáo dục hiếm khi có quá vài
      // chục dây chồng nhau; tránh vòng lặp vô hạn nếu có.
      while (collidesAt(laneX, yMin, yMax) && attempt < 40) {
        attempt++;
        const step = Math.ceil(attempt / 2) * WIRE_LANE_GAP * (attempt % 2 === 0 ? -1 : 1);
        laneX = clamp(naturalMidX + step);
      }

      occupied.push({ x: laneX, yMin, yMax });
      results[index] = [
        { x: laneX, y: srcCoord.y },
        { x: laneX, y: tgtCoord.y },
      ];
    });

    return results;
  }, [connections, getPinAbsCoord, getOwnerFallbackCoord]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;

    // Pan chuột phải — cập nhật panOffset trực tiếp từ delta client, KHÔNG
    // chạm gì tới draggingId/isDrawingWire/draggingWaypoint (early return),
    // nên không có cách nào 1 thao tác kéo chuột trái đang dở (component/dây/
    // waypoint) bị pan "cướp" giữa chừng — 2 chế độ tương tác loại trừ lẫn
    // nhau hoàn toàn qua isPanning.
    if (isPanning && panStartRef.current) {
      const { clientX, clientY, panX, panY } = panStartRef.current;
      setPanOffset({ x: panX + (e.clientX - clientX), y: panY + (e.clientY - clientY) });
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - 48 - panOffset.y) / zoom;
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
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      return;
    }
    setDraggingId(null);
    setDraggingWaypoint(null);
    if (isDrawingWire) {
      setIsDrawingWire(false);
      setWireStart(null);
    }
  };

  // Chỉ chuột phải (button === 2) mới pan — chuột trái (button === 0) giữ
  // nguyên 100% hành vi cũ (bấm nền để bỏ chọn). preventDefault() ở đây CHƯA đủ để chặn context menu thật của
  // trình duyệt (nó mở ra ở sự kiện "contextmenu" riêng, bắn SAU "pointerdown")
  // — phải chặn thêm ở onContextMenu của container (xem JSX).
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      setSelectedPartId(null);
      setSelectedWireIndex(null);
      setIsPanning(true);
      panStartRef.current = { clientX: e.clientX, clientY: e.clientY, panX: panOffset.x, panY: panOffset.y };
      return;
    }
    setSelectedPartId(null);
    setSelectedWireIndex(null);
  };

  const handleComponentPointerDown = (e: React.PointerEvent, compId: string) => {
    // Chuột phải trên linh kiện: KHÔNG chọn/kéo component — để nguyên ý định
    // "chuột phải = pan" nhất quán trên toàn canvas, không riêng vùng trống.
    // Không stopPropagation() ở đây để pointerdown còn nổi bọt lên container,
    // kích hoạt handleCanvasPointerDown xử lý pan như bình thường.
    if (e.button === 2) return;

    e.stopPropagation();
    setSelectedPartId(compId === 'arduino' ? 'arduino' : compId);
    setSelectedWireIndex(null);
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const mx = (e.clientX - containerRect.left - panOffset.x) / zoom;
    const my = (e.clientY - containerRect.top - 48 - panOffset.y) / zoom;

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

  const ANALOG_MAX = 4095;

  // sensorKind: undefined -> plain analog (Potentiometer), set -> sensor
  // (e.g. "light" for the photoresistor) — routes to onSensorInput instead of
  // onAnalogInput, matching the distinct wire shape STEP 9 asked for.
  const handleAnalogSliderChange = (componentId: string, rawValue: number, sensorKind?: string) => {
    const value = Math.round(Math.min(Math.max(rawValue, 0), ANALOG_MAX));
    setAnalogPreview((prev) => ({ ...prev, [componentId]: value }));

    const send = sensorKind
      ? (v: number) => onSensorInput?.(componentId, sensorKind, v)
      : (v: number) => onAnalogInput?.(componentId, v);
    if (!onAnalogInput && !onSensorInput) return;

    analogInputPending.current.set(componentId, value);
    const timers = analogInputTimers.current;
    if (timers.has(componentId)) return; // a send is already scheduled; it will read the pending map at fire time

    timers.set(
      componentId,
      setTimeout(() => {
        timers.delete(componentId);
        const latest = analogInputPending.current.get(componentId);
        analogInputPending.current.delete(componentId);
        if (latest !== undefined) {
          send(latest);
        }
      }, 80)
    );
  };

  // INTERACTIVE SENSOR CONTROLS milestone — a discrete click, not a slider
  // drag, so no debounce needed (unlike handleAnalogSliderChange above).
  // Reuses onButtonInput as-is: SetSimulationInput's wire contract for
  // inputType="digital" is identical whether the true physical thing is a
  // pushbutton or a PIR/Water Leak/Vibration sensor — the backend's
  // ISimulationInputChannel/DigitalSensorModel.TryReadLiveInput don't care
  // (STEP 8/12: reuse the existing contract, no new fields).
  const handleDigitalSensorToggle = (componentId: string, nextValue: boolean) => {
    setDigitalSensorPreview((prev) => ({ ...prev, [componentId]: nextValue }));
    onButtonInput?.(componentId, nextValue);
  };

  const handlePinPointerDown = (e: React.PointerEvent, partId: string, pinName: string, absX: number, absY: number) => {
    // Chuột phải trên pin: không bắt đầu vẽ dây — để nổi bọt lên container
    // cho pan (giống handleComponentPointerDown).
    if (e.button === 2) return;
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
    rotateDeg: number,
    ownerType: string
  ) =>
    Object.entries(pins).map(([pinName, coord]) => {
      const rotated = getRotatedOwnerCoord(ownerId, coord, rotateDeg);
      const kind = getPinKind(ownerType, pinName);
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
          onPointerEnter={() => setHoveredPin({ id: ownerId, pinName, label: `${ownerId}:${pinName} (${kind})` })}
          onPointerLeave={() => setHoveredPin(null)}
        />
      );
    });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#222222] overflow-hidden touch-none"
      style={{ minHeight: '500px', cursor: isPanning ? 'grabbing' : 'grab' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerDown={handleCanvasPointerDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          // Lưới chấm nền nằm NGOÀI world-layer (chỉ để tô nền, không phải
          // linh kiện thật) — dịch cùng panOffset để cảm giác "gắn liền" với
          // mạch khi pan, thay vì đứng yên trong lúc mọi thứ khác trôi qua.
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
        }}
      />

      {onOpenPalette && (
        <button
          type="button"
          onClick={onOpenPalette}
          title="Thêm linh kiện"
          aria-label="Thêm linh kiện"
          // top-16 (không phải top-3) — Toolbar render NGAY SAU đây là 1 thanh
          // ngang cao 48px (h-12) phủ z-50 kín chiều rộng canvas (tô nền đặc
          // bg-[#2d2d2d]), CAO HƠN z-30 của nút này — đặt trong vùng 0-48px
          // khiến nút vừa bị che khuất vừa không nhận được click (xác nhận
          // thật qua document.elementFromPoint: điểm giữa nút trả về đúng span
          // hint-text bên trong Toolbar, không phải nút). Đặt hẳn xuống dưới
          // thanh Toolbar để không tranh chấp layer với nó.
          className="absolute left-3 top-16 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 bg-[#2a2a2a]/90 text-slate-100 shadow-lg backdrop-blur transition-colors hover:bg-teal-600 hover:border-teal-500"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

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
        className="absolute inset-0"
        style={{
          // translate() ĐỨNG TRƯỚC scale() trong chuỗi transform CSS — theo
          // đúng thứ tự áp dụng transform (phải sang trái), scale() được áp
          // cho nội dung TRƯỚC, translate() dịch kết quả đã scale đó đi 1
          // khoảng CỐ ĐỊNH theo pixel màn hình SAU — nhờ vậy panOffset (tính
          // bằng pixel màn hình thật từ handleCanvasPointerDown/handlePointerMove)
          // luôn cho cảm giác kéo nhất quán dù đang zoom mức nào, không cần
          // tự chia panOffset cho zoom ở bất kỳ đâu khác trong file.
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
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

            const srcResolvedCoord = getPinAbsCoord(srcId, srcPin);
            const tgtResolvedCoord = getPinAbsCoord(tgtId, tgtPin);
            // Pin không resolve được (vd tên chân đã đổi/không còn tồn tại)
            // vẫn fallback về vị trí owner để dây tiếp tục render+chọn được,
            // thay vì biến mất hoàn toàn (xem comment ở getOwnerFallbackCoord).
            const srcCoord = srcResolvedCoord ?? getOwnerFallbackCoord(srcId);
            const tgtCoord = tgtResolvedCoord ?? getOwnerFallbackCoord(tgtId);

            if (!srcCoord || !tgtCoord) return null;

            const isBroken = !srcResolvedCoord || !tgtResolvedCoord;
            const isSelected = selectedWireIndex === index;
            // Waypoint tuỳ chỉnh đã lưu (người dùng tự kéo) > lane tự động
            // (autoRoutedWaypoints — fan-out/fan-in không chồng lane) >
            // getDefaultWaypoints (fallback cuối, chỉ dùng khi vì lý do gì đó
            // pin không resolve được trong lúc tính autoRoutedWaypoints).
            const waypoints =
              getValidStoredWaypoints(storedWaypoints) ??
              autoRoutedWaypoints[index] ??
              getDefaultWaypoints(srcCoord, tgtCoord);
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
                {isBroken && (
                  <title>{`Dây lỗi: pin "${srcPin}" hoặc "${tgtPin}" không còn tồn tại — bấm để chọn rồi xóa`}</title>
                )}
                <path
                  d={pathD}
                  stroke="transparent"
                  strokeWidth={15 / zoom}
                  fill="none"
                />
                <path
                  d={pathD}
                  stroke={isBroken ? '#ef4444' : (isSelected ? '#22c55e' : (color || 'green'))}
                  strokeWidth={isSelected ? 4 / zoom : 3 / zoom}
                  strokeDasharray={isBroken ? `${6 / zoom} ${3 / zoom}` : undefined}
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
            // 11, không phải 5: phải cao hơn z-index 10 của lớp <svg> vẽ dây
            // nối bên trên — nếu không, hit-path vô hình (rộng 15px, dùng để
            // bấm-chọn dây) của 1 dây đã vẽ có thể "che" mất pin-dot (z-20
            // nhưng chỉ có hiệu lực TRONG stacking context của chính wrapper
            // này) khi dây đó đi ngang toạ độ chân cắm, khiến pointerdown rơi
            // vào dây thay vì chân — không vẽ được dây tiếp theo, không báo
            // lỗi gì. Board không có tình huống "được chọn cao hơn 30" nên
            // không đụng nhánh draggingId === 'arduino' ? 30.
            zIndex: draggingId === 'arduino' ? 30 : 11,
            transform: arduinoRotate ? `rotate(${arduinoRotate}deg)` : undefined,
            transformOrigin: 'center center',
          }}
          onPointerDown={(e) => handleComponentPointerDown(e, 'arduino')}
        >
          {createWokwiElement(boardTagName, { ref: boardRef, style: { pointerEvents: 'none' } })}
          {renderPinDots(boardPins, 'arduino', arduinoPos.x, arduinoPos.y, arduinoRotate, boardTagName)}

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
            // 11: xem giải thích ở wrapper board phía trên (cùng lý do).
            zIndex: isSelected ? 30 : 11,
            transform: component.rotate ? `rotate(${component.rotate}deg)` : undefined,
            transformOrigin: 'center center',
          };

          let renderElement = null;
          if (type === 'led') {
            renderElement = createWokwiElement('wokwi-led', {
              ref: setComponentRef(component.id),
              color: getLedColor(component.attrs?.color),
              value: isLedOn(partState),
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
              hasSignal: isBuzzerOn(partState),
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
          } else if (type === 'dht22') {
            renderElement = createWokwiElement('wokwi-dht22', {
              ref: setComponentRef(component.id),
              style: { pointerEvents: 'none' },
            });
          } else if (type === 'hc-sr04') {
            renderElement = createWokwiElement('wokwi-hc-sr04', {
              ref: setComponentRef(component.id),
              style: { pointerEvents: 'none' },
            });
          } else if (type === 'rgb-led') {
            // ledRed/ledGreen/ledBlue là number nên KHÔNG truyền qua JSX prop
            // (React chỉ gán thẳng DOM property cho boolean trên custom
            // element — xem effect ở trên); property được gán trực tiếp qua
            // ref sau khi mount.
            renderElement = createWokwiElement('wokwi-rgb-led', {
              ref: setComponentRef(component.id),
              style: { pointerEvents: 'none' },
            });
          } else if (WOKWI_REAL_ELEMENT_TAGS[type]) {
            // Thư viện linh kiện mở rộng — mọi component có element thật
            // trong @wokwi/elements (không cần state runtime nào, chỉ hiển
            // thị tĩnh) đi qua đây thay vì if/else riêng từng loại.
            renderElement = createWokwiElement(WOKWI_REAL_ELEMENT_TAGS[type], {
              ref: setComponentRef(component.id),
              // LCD 16x2 I2C dùng LẠI element wokwi-lcd1602 thật nhưng đổi
              // thuộc tính `pins` sang chế độ 'i2c' (string — an toàn qua
              // JSX, không dính bug number/attribute như RGB LED) để hiển
              // thị đúng 4 chân GND/VCC/SDA/SCL thay vì 16 chân song song.
              // wokwi-lcd2004 (LCD 20x4) mặc định pins='full' (16 chân song
              // song) — module 20x4 thực tế hầu như luôn dùng qua I2C
              // backpack, ép 'i2c' để khớp đúng LCD2004_PINS (4 chân).
              ...(type === 'lcd1602-i2c' || type === 'lcd2004' ? { pins: 'i2c' } : {}),
              style: { pointerEvents: 'none' },
            });
          } else {
            // Robot giao hàng mini (L298N/DC Motor/Battery Pack/Power Switch/
            // Wheel/Caster Wheel/Chassis/Breadboard/Delivery Box), thư viện mở
            // rộng không có element thật (Relay/Fan/cảm biến rời rạc/robot cơ
            // khí/...), và bất kỳ type nào khác chưa có element @wokwi/elements
            // thật đều rơi vào đây — renderFallbackCard() tự phân biệt card có
            // icon+tên (đã đăng ký trong ROBOT_KIT_FALLBACK_CARDS) và type hoàn
            // toàn lạ (gray box cũ, không đổi hành vi).
            renderElement = renderFallbackCard(type, component.type, partState, motorVisualStates[component.id]);
          }

          // Capability-driven, not a type-name switch — component.type (the
          // raw diagram type, e.g. "wokwi-pushbutton") is looked up once
          // against runtimeInteractionCapability.ts's table, which mirrors
          // the backend's RuntimeCapabilityResolver. A future canonical type
          // (static or Registry-imported) gets the right interaction UI just
          // by having an entry there — no new branch needed here.
          const interactionCapability = getInteractionCapability(component.type);
          const isPressableButton = interactionCapability?.kind === 'digital' && Boolean(onButtonInput);
          const isAnalogPotentiometer = interactionCapability?.kind === 'analog' && Boolean(onAnalogInput);
          const isLightSensor = interactionCapability?.kind === 'sensor' && Boolean(onSensorInput);
          const sensorKind = interactionCapability?.kind === 'sensor' ? interactionCapability.sensorKind : 'light';
          const analogValue = analogPreview[component.id] ?? 0;
          const isDigitalSensor = interactionCapability?.kind === 'digital-sensor' && Boolean(onButtonInput);
          const digitalSensorLabels = interactionCapability?.kind === 'digital-sensor' ? interactionCapability : null;
          const digitalSensorValue = digitalSensorPreview[component.id] ?? false;

          return (
            <div
              key={component.id}
              style={isPressableButton ? { ...style, cursor: 'pointer' } : style}
              onPointerDown={(e) => {
                handleComponentPointerDown(e, component.id);
                if (isPressableButton) {
                  onButtonInput!(component.id, true);
                }
              }}
              // Not stopPropagation()'d — the container's own handlePointerUp
              // (drag-end/wire-end) still needs to see this event bubble up,
              // exactly as it did before this prop existed.
              onPointerUp={isPressableButton ? () => onButtonInput!(component.id, false) : undefined}
              // Safety net: a real momentary pushbutton releases when you lift
              // your finger, but the pointer can leave this element's bounds
              // while still physically held down (e.g. a small drag) with no
              // pointerup ever landing back on it — without this, the button
              // would stay latched "pressed" in ComponentInputs indefinitely.
              onPointerLeave={isPressableButton ? () => onButtonInput!(component.id, false) : undefined}
            >
              {renderElement}

              {(isAnalogPotentiometer || isLightSensor) && (
                // Deliberately plain — STEP 6 says not to over-design this.
                // stopPropagation on pointerdown so dragging the slider thumb
                // doesn't also start a component-drag via the wrapper's own
                // onPointerDown above.
                <div
                  className="absolute flex items-center gap-1 bg-[#1a1a1a] border border-gray-600 rounded px-1"
                  style={{ top: '100%', left: 0, marginTop: 4, zIndex: 20, width: 90 }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <input
                    type="range"
                    min={0}
                    max={ANALOG_MAX}
                    value={analogValue}
                    onChange={(e) =>
                      handleAnalogSliderChange(component.id, Number(e.target.value), isLightSensor ? sensorKind : undefined)
                    }
                    className="w-full"
                  />
                  <span className="text-[9px] text-gray-300 font-mono w-8 text-right">{analogValue}</span>
                </div>
              )}

              {isDigitalSensor && digitalSensorLabels && (
                // Persistent toggle, deliberately NOT the pushbutton's
                // press/hold-on-body affordance (STEP 3: these sensors are
                // "state until changed", not "state while held") — same
                // compact below-component placement as the analog slider.
                <button
                  type="button"
                  className={`absolute text-[9px] font-mono rounded px-1.5 py-0.5 border whitespace-nowrap ${
                    digitalSensorValue
                      ? 'bg-amber-600/80 border-amber-400 text-white'
                      : 'bg-[#1a1a1a] border-gray-600 text-gray-300'
                  }`}
                  style={{ top: '100%', left: 0, marginTop: 4, zIndex: 20 }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => handleDigitalSensorToggle(component.id, !digitalSensorValue)}
                >
                  {digitalSensorValue ? digitalSensorLabels.onLabel : digitalSensorLabels.offLabel}
                </button>
              )}

              {isSelected && (
                <div className="absolute inset-0 -m-2 border border-dashed border-[#22c55e] pointer-events-none" style={{ zIndex: 15 }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[#22c55e] bg-[#222] rounded-full p-0.5">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                </div>
              )}

              {renderPinDots(compPins, component.id, component.x, component.y, component.rotate ?? 0, type)}
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
