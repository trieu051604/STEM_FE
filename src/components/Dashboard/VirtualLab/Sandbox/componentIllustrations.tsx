// Nguồn illustration DÙNG CHUNG giữa CircuitCanvas.tsx (canvas, fallback-card
// không có element @wokwi/elements thật) và ComponentPalettePopup.tsx (popup
// "+"/palette). Tách ra từ CircuitCanvas.tsx (2026-07-27, task "hoàn thiện
// thumbnail palette giống Wokwi") — ROBOT_KIT_FALLBACK_CARDS +
// getFallbackIllustration() giữ NGUYÊN 100% logic/SVG cũ (đã test PASS qua
// L298N regression thật), chỉ đổi vị trí file. Không đổi kích thước
// width/height trong ROBOT_KIT_FALLBACK_CARDS — đây vẫn là bounding box thật
// dùng để tính pin-dot trong pinMaps.ts, không được đổi.
import type { ReactNode } from 'react';
import {
  CircuitBoard,
  RotateCw,
  Circle,
  Disc,
  RectangleHorizontal,
  BatteryFull,
  ToggleLeft,
  Grid3x3,
  Package,
  Fan,
  Droplets,
  CloudRain,
  Sprout,
  ScanLine,
  Route,
  Palette,
  Camera,
  Wifi,
  Cloud,
  Bot,
  Hand,
  Boxes,
  Container,
  Plane,
  Disc3,
  Layers,
  Settings2,
  Vibrate,
  Zap,
  Thermometer,
  FlaskConical,
} from 'lucide-react';
import { normalizeComponentType } from './componentTypeNormalize';

export const ROBOT_KIT_FALLBACK_CARDS: Record<
  string,
  { label: string; icon: typeof CircuitBoard; width: number; height: number; badge: string }
> = {
  'l298n': { label: 'L298N Motor Driver', icon: CircuitBoard, width: 180, height: 100, badge: 'Mô phỏng được' },
  'dc-motor': { label: 'DC Motor', icon: RotateCw, width: 60, height: 50, badge: 'Mô phỏng được' },
  'battery-pack': { label: 'Battery Pack 7.4V', icon: BatteryFull, width: 90, height: 50, badge: 'Kiểm tra nối dây' },
  'power-switch': { label: 'Power Switch', icon: ToggleLeft, width: 70, height: 36, badge: 'Kiểm tra nối dây' },
  'robot-wheel': { label: 'Robot Wheel', icon: Circle, width: 56, height: 56, badge: 'Chỉ hiển thị' },
  'caster-wheel': { label: 'Caster Wheel', icon: Disc, width: 40, height: 40, badge: 'Chỉ hiển thị' },
  'robot-chassis': { label: 'Robot Chassis', icon: RectangleHorizontal, width: 200, height: 130, badge: 'Chỉ hiển thị' },
  'breadboard': { label: 'Breadboard', icon: Grid3x3, width: 220, height: 90, badge: 'Chỉ hiển thị' },
  'delivery-box': { label: 'Mini Delivery Box', icon: Package, width: 80, height: 70, badge: 'Chỉ hiển thị' },

  // ===== Thư viện linh kiện mở rộng — Actuator/Sensor không có element thật
  // (wiring-validation — width/height PHẢI khớp đúng toạ độ trong
  // pinMaps.ts, xem RELAY_MODULE_PINS/FAN_PINS/... ) =====
  'relay-module': { label: 'Relay Module', icon: Settings2, width: 90, height: 50, badge: 'Kiểm tra nối dây' },
  'fan': { label: 'Fan / DC Fan', icon: Fan, width: 60, height: 50, badge: 'Kiểm tra nối dây' },
  'water-pump': { label: 'Water Pump / Mini Pump', icon: Droplets, width: 60, height: 50, badge: 'Kiểm tra nối dây' },
  'water-leak-sensor': { label: 'Water Leak Sensor', icon: Droplets, width: 90, height: 50, badge: 'Kiểm tra nối dây' },
  'rain-sensor': { label: 'Rain Sensor', icon: CloudRain, width: 90, height: 50, badge: 'Kiểm tra nối dây' },
  'soil-moisture-sensor': { label: 'Soil Moisture Sensor', icon: Sprout, width: 90, height: 50, badge: 'Kiểm tra nối dây' },
  'ir-obstacle-sensor': { label: 'IR Obstacle Sensor', icon: ScanLine, width: 90, height: 50, badge: 'Kiểm tra nối dây' },
  'line-tracking-sensor': { label: 'Line Tracking Sensor', icon: Route, width: 90, height: 50, badge: 'Kiểm tra nối dây' },
  'color-sensor': { label: 'Color Sensor', icon: Palette, width: 90, height: 50, badge: 'Kiểm tra nối dây' },
  'vibration-sensor': { label: 'Vibration Sensor / SW-420', icon: Vibrate, width: 90, height: 50, badge: 'Kiểm tra nối dây' },

  // ===== Thư viện linh kiện mở rộng — visual-only (không có pin, không vào
  // netlist — cố tình KHÔNG có entry trong pinMaps.ts) =====
  'solenoid-valve': { label: 'Solenoid / Valve', icon: Settings2, width: 70, height: 50, badge: 'Chỉ hiển thị' },
  'esp32-cam': { label: 'ESP32-CAM', icon: Camera, width: 70, height: 60, badge: 'Chỉ hiển thị' },
  'wifi-cloud-node': { label: 'WiFi / Cloud Node', icon: Wifi, width: 70, height: 60, badge: 'Chỉ hiển thị' },
  'dashboard-cloud': { label: 'Dashboard / Cloud', icon: Cloud, width: 70, height: 60, badge: 'Chỉ hiển thị' },
  'robot-arm-base': { label: 'Robot Arm Base', icon: Bot, width: 90, height: 90, badge: 'Chỉ hiển thị' },
  'gripper': { label: 'Gripper', icon: Hand, width: 60, height: 60, badge: 'Chỉ hiển thị' },
  'conveyor-belt': { label: 'Conveyor Belt', icon: Layers, width: 200, height: 50, badge: 'Chỉ hiển thị' },
  'sorting-box': { label: 'Sorting Box', icon: Boxes, width: 90, height: 70, badge: 'Chỉ hiển thị' },
  'ball': { label: 'Ball', icon: Circle, width: 40, height: 40, badge: 'Chỉ hiển thị' },
  'fire-extinguisher': { label: 'Fire Extinguisher', icon: Container, width: 50, height: 80, badge: 'Chỉ hiển thị' },
  'water-tank': { label: 'Water Tank', icon: Container, width: 80, height: 90, badge: 'Chỉ hiển thị' },
  'drone-frame': { label: 'Drone Frame', icon: Plane, width: 120, height: 100, badge: 'Chỉ hiển thị' },
  'propeller': { label: 'Propeller', icon: Disc3, width: 60, height: 60, badge: 'Chỉ hiển thị' },
  'drone-motor': { label: 'Drone Motor', icon: RotateCw, width: 50, height: 50, badge: 'Chỉ hiển thị' },
  'stair-obstacle': { label: 'Stair / Obstacle Block', icon: Layers, width: 120, height: 60, badge: 'Chỉ hiển thị' },
  'trash-object': { label: 'Trash Object', icon: Boxes, width: 60, height: 60, badge: 'Chỉ hiển thị' },
  'delivery-item': { label: 'Delivery Package / Item', icon: Package, width: 60, height: 60, badge: 'Chỉ hiển thị' },

  // ===== Component mới (2026-07-28, task "pin/visual chuẩn theo thực tế") —
  // ESC/Heating Element/pH Sensor KHÔNG có element @wokwi/elements thật, tự vẽ
  // fallback-card (width/height khớp pinMaps.ts ESC_PINS/HEATING_ELEMENT_PINS/
  // PH_SENSOR_PINS). MPU6050 KHÔNG có entry ở đây — đó là element thật
  // (wokwi-mpu6050), tự có bounding box riêng, chỉ cần thumbnail palette qua
  // getExtraIllustration() bên dưới. =====
  'esc': { label: 'ESC (Electronic Speed Controller)', icon: Zap, width: 90, height: 50, badge: 'Kiểm tra nối dây' },
  'heating-element': { label: 'Heating Element', icon: Thermometer, width: 60, height: 50, badge: 'Kiểm tra nối dây' },
  'ph-sensor': { label: 'pH Sensor', icon: FlaskConical, width: 90, height: 50, badge: 'Kiểm tra nối dây' },

  // Line Tracking đa kênh (2026-07-28) — width khớp đúng LINE_TRACKING_3CH_PINS
  // / LINE_TRACKING_5CH_PINS trong pinMaps.ts.
  'line-tracking-3ch': { label: 'Line Tracking Sensor (3 kênh)', icon: Route, width: 100, height: 50, badge: 'Kiểm tra nối dây' },
  'line-tracking-5ch': { label: 'Line Tracking Sensor (5 kênh)', icon: Route, width: 150, height: 50, badge: 'Kiểm tra nối dây' },
};

// Minh hoạ SVG tự vẽ cho linh kiện KHÔNG có element thật trong @wokwi/elements
// (2026-07-27) — thay thế icon lucide trơn bằng hình dáng gợi nhớ phần cứng
// thật (tự vẽ 100%, không copy asset ngoài, license rõ ràng vì là code của
// dự án). viewBox luôn khớp ĐÚNG width/height khai báo trong
// ROBOT_KIT_FALLBACK_CARDS — không đổi kích thước card (bounding box này vẫn
// là nguồn tính toạ độ pin-dot trong pinMaps.ts, đổi kích thước ở đây sẽ làm
// lệch pin/wire) khi dùng trong canvas. Khi dùng làm THUMBNAIL palette (xem
// getComponentIllustration() bên dưới), width/height truyền vào vẫn lấy từ
// ROBOT_KIT_FALLBACK_CARDS (giữ đúng tỉ lệ thật) nhưng render trong khung cố
// định 44x44 qua preserveAspectRatio — không phá hình.
export function getFallbackIllustration(type: string, width: number, height: number): ReactNode | null {
  const vb = `0 0 ${width} ${height}`;
  const svgProps = { viewBox: vb, width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet' as const };

  switch (type) {
    case 'l298n':
      return (
        <svg {...svgProps}>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={4} fill="#14532d" stroke="#166534" strokeWidth={1} />
          {/* Terminal blocks hàng trên (OUT1-4/VIN/GND) và hàng dưới (ENA/IN1-4/ENB/5V) */}
          <rect x={8} y={4} width={width - 16} height={10} rx={1.5} fill="#1d4ed8" />
          <rect x={8} y={height - 14} width={width - 16} height={10} rx={1.5} fill="#1d4ed8" />
          {Array.from({ length: 7 }).map((_, i) => (
            <rect key={`t-${i}`} x={11 + i * ((width - 22) / 6)} y={5.5} width={3} height={7} fill="#facc15" />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <rect key={`b-${i}`} x={11 + i * ((width - 22) / 6)} y={height - 12.5} width={3} height={7} fill="#facc15" />
          ))}
          {/* Heatsink/chip trung tâm */}
          <rect x={width / 2 - 22} y={height / 2 - 16} width={44} height={32} rx={2} fill="#27272a" stroke="#52525b" strokeWidth={1} />
          <circle cx={width / 2 - 14} cy={height / 2} r={2} fill="#ef4444" />
        </svg>
      );
    case 'dc-motor':
      return (
        <svg {...svgProps}>
          <rect x={2} y={height * 0.2} width={width * 0.4} height={height * 0.6} rx={3} fill="#eab308" />
          <circle cx={width * 0.62} cy={height / 2} r={height * 0.42} fill="#a1a1aa" stroke="#71717a" strokeWidth={1.5} />
          <circle cx={width * 0.62} cy={height / 2} r={height * 0.14} fill="#52525b" />
          <line x1={width - 4} y1={height / 2 - 4} x2={width + 2} y2={height / 2 - 8} stroke="#ef4444" strokeWidth={2} />
          <line x1={width - 4} y1={height / 2 + 4} x2={width + 2} y2={height / 2 + 8} stroke="#18181b" strokeWidth={2} />
        </svg>
      );
    case 'battery-pack':
      return (
        <svg {...svgProps}>
          <rect x={4} y={height * 0.15} width={width - 8} height={height * 0.7} rx={5} fill="#18181b" stroke="#3f3f46" strokeWidth={1} />
          <rect x={width * 0.15} y={height * 0.28} width={width * 0.3} height={height * 0.44} rx={4} fill="#3f3f46" />
          <rect x={width * 0.55} y={height * 0.28} width={width * 0.3} height={height * 0.44} rx={4} fill="#3f3f46" />
          <line x1={2} y1={height / 2} x2={-4} y2={height / 2} stroke="#ef4444" strokeWidth={2.5} />
          <line x1={width - 2} y1={height / 2} x2={width + 4} y2={height / 2} stroke="#18181b" strokeWidth={2.5} />
          <text x={6} y={height * 0.12} fontSize={8} fill="#ef4444" fontWeight="bold">+</text>
          <text x={width - 12} y={height * 0.12} fontSize={8} fill="#e4e4e7" fontWeight="bold">-</text>
        </svg>
      );
    case 'power-switch':
      return (
        <svg {...svgProps}>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill="#27272a" stroke="#52525b" strokeWidth={1} />
          <rect x={width * 0.3} y={4} width={width * 0.18} height={height * 0.55} rx={2} fill="#dc2626" transform={`rotate(-20 ${width * 0.39} ${height * 0.3})`} />
          <circle cx={width * 0.75} cy={height / 2} r={2} fill="#22c55e" />
        </svg>
      );
    case 'breadboard':
      return (
        <svg {...svgProps}>
          <rect x={1} y={1} width={width - 2} height={height - 2} rx={3} fill="#fafaf9" stroke="#d6d3d1" strokeWidth={1} />
          <line x1={8} y1={10} x2={width - 8} y2={10} stroke="#ef4444" strokeWidth={1.5} />
          <line x1={8} y1={16} x2={width - 8} y2={16} stroke="#3b82f6" strokeWidth={1.5} />
          <line x1={8} y1={height - 16} x2={width - 8} y2={height - 16} stroke="#ef4444" strokeWidth={1.5} />
          <line x1={8} y1={height - 10} x2={width - 8} y2={height - 10} stroke="#3b82f6" strokeWidth={1.5} />
          {Array.from({ length: Math.floor((width - 24) / 8) }).map((_, col) =>
            Array.from({ length: 5 }).map((__, row) => (
              <circle key={`${col}-${row}`} cx={12 + col * 8} cy={28 + row * ((height - 56) / 4)} r={0.9} fill="#a8a29e" />
            ))
          )}
        </svg>
      );
    case 'robot-wheel':
      return (
        <svg {...svgProps}>
          <circle cx={width / 2} cy={height / 2} r={width / 2 - 2} fill="#18181b" stroke="#3f3f46" strokeWidth={1.5} />
          <circle cx={width / 2} cy={height / 2} r={width * 0.28} fill="#52525b" />
          <circle cx={width / 2} cy={height / 2} r={width * 0.08} fill="#a1a1aa" />
          {Array.from({ length: 5 }).map((_, i) => {
            const angle = (i * 2 * Math.PI) / 5;
            const x2 = width / 2 + width * 0.25 * Math.cos(angle);
            const y2 = height / 2 + width * 0.25 * Math.sin(angle);
            return <line key={i} x1={width / 2} y1={height / 2} x2={x2} y2={y2} stroke="#a1a1aa" strokeWidth={2} />;
          })}
        </svg>
      );
    case 'caster-wheel':
      return (
        <svg {...svgProps}>
          <rect x={width * 0.35} y={2} width={width * 0.3} height={height * 0.3} rx={2} fill="#71717a" />
          <circle cx={width / 2} cy={height * 0.62} r={height * 0.34} fill="#a1a1aa" stroke="#52525b" strokeWidth={1.5} />
          <circle cx={width * 0.42} cy={height * 0.52} r={height * 0.1} fill="#e4e4e7" opacity={0.7} />
        </svg>
      );
    case 'robot-chassis':
      return (
        <svg {...svgProps}>
          <rect x={3} y={3} width={width - 6} height={height - 6} rx={8} fill="#dbeafe" stroke="#93c5fd" strokeWidth={2} opacity={0.85} />
          {[[14, 14], [width - 14, 14], [14, height - 14], [width - 14, height - 14]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={4} fill="#fff" stroke="#60a5fa" strokeWidth={1.5} />
          ))}
          <rect x={width / 2 - 30} y={height / 2 - 18} width={60} height={36} rx={4} fill="#bfdbfe" stroke="#60a5fa" strokeWidth={1} opacity={0.6} />
        </svg>
      );
    case 'delivery-box':
      return (
        <svg {...svgProps}>
          <rect x={2} y={height * 0.25} width={width - 4} height={height * 0.72} fill="#b45309" stroke="#78350f" strokeWidth={1} />
          <rect x={2} y={height * 0.2} width={width - 4} height={height * 0.14} fill="#92400e" />
          <line x1={width / 2} y1={height * 0.25} x2={width / 2} y2={height - 2} stroke="#fbbf24" strokeWidth={3} />
          <line x1={2} y1={height * 0.25} x2={width - 2} y2={height - 2} stroke="#78350f" strokeWidth={1.5} />
          <line x1={width - 2} y1={height * 0.25} x2={2} y2={height - 2} stroke="#78350f" strokeWidth={1.5} />
        </svg>
      );
    case 'relay-module':
      return (
        <svg {...svgProps}>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill="#1d4ed8" stroke="#1e40af" strokeWidth={1} />
          <rect x={width * 0.5} y={height * 0.15} width={width * 0.42} height={height * 0.7} rx={2} fill="#18181b" />
          <circle cx={width * 0.71} cy={height * 0.28} r={1.6} fill="#facc15" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={width * 0.08} y={height * 0.2 + i * (height * 0.25)} width={width * 0.14} height={height * 0.16} fill="#facc15" />
          ))}
          <circle cx={width * 0.3} cy={height * 0.85} r={2} fill="#22c55e" />
        </svg>
      );
    case 'fan':
      return (
        <svg {...svgProps}>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={4} fill="#3f3f46" stroke="#52525b" strokeWidth={1} />
          <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.4} fill="#18181b" />
          {[0, 1, 2, 3].map((i) => {
            const angle = (i * Math.PI) / 2;
            const r = Math.min(width, height) * 0.34;
            const x = width / 2 + r * Math.cos(angle);
            const y = height / 2 + r * Math.sin(angle);
            return <ellipse key={i} cx={x} cy={y} rx={7} ry={3.5} fill="#71717a" transform={`rotate(${(angle * 180) / Math.PI} ${x} ${y})`} />;
          })}
          <circle cx={width / 2} cy={height / 2} r={4} fill="#a1a1aa" />
        </svg>
      );
    case 'water-pump':
      return (
        <svg {...svgProps}>
          <rect x={width * 0.15} y={height * 0.25} width={width * 0.6} height={height * 0.6} rx={height * 0.25} fill="#2563eb" stroke="#1e40af" strokeWidth={1.5} />
          <rect x={width * 0.62} y={height * 0.1} width={width * 0.18} height={height * 0.28} rx={2} fill="#93c5fd" />
          <line x1={2} y1={height * 0.55} x2={width * 0.15} y2={height * 0.55} stroke="#18181b" strokeWidth={2} />
          <line x1={width * 0.75} y1={height * 0.75} x2={width - 2} y2={height * 0.85} stroke="#ef4444" strokeWidth={2} />
        </svg>
      );
    case 'water-leak-sensor':
      return (
        <svg {...svgProps}>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill="#b91c1c" stroke="#7f1d1d" strokeWidth={1} />
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={i} x1={8} y1={10 + i * ((height - 20) / 4)} x2={width - 8} y2={10 + i * ((height - 20) / 4)} stroke="#fca5a5" strokeWidth={1.2} />
          ))}
          <circle cx={width - 12} cy={height / 2} r={2} fill="#22c55e" />
        </svg>
      );
    case 'rain-sensor':
      return (
        <svg {...svgProps}>
          <rect x={2} y={2} width={width - 4} height={height * 0.55} fill="#a8a29e" stroke="#78716c" strokeWidth={1} />
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={i} x1={6 + i * ((width - 12) / 5)} y1={4} x2={6 + i * ((width - 12) / 5)} y2={height * 0.53} stroke="#57534e" strokeWidth={1} />
          ))}
          <rect x={2} y={height * 0.58} width={width - 4} height={height * 0.38} rx={2} fill="#1d4ed8" />
          <circle cx={width - 12} cy={height * 0.77} r={1.8} fill="#facc15" />
        </svg>
      );
    case 'soil-moisture-sensor':
      return (
        <svg {...svgProps}>
          <rect x={width * 0.2} y={height * 0.55} width={width * 0.6} height={height * 0.35} rx={2} fill="#1d4ed8" />
          <rect x={width * 0.32} y={2} width={5} height={height * 0.58} fill="#a1a1aa" />
          <rect x={width * 0.58} y={2} width={5} height={height * 0.58} fill="#a1a1aa" />
          <circle cx={width * 0.68} cy={height * 0.72} r={1.8} fill="#22c55e" />
        </svg>
      );
    case 'vibration-sensor':
      return (
        <svg {...svgProps}>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill="#166534" stroke="#14532d" strokeWidth={1} />
          <rect x={width * 0.32} y={height * 0.22} width={width * 0.36} height={height * 0.56} rx={height * 0.15} fill="#a1a1aa" stroke="#52525b" strokeWidth={1} />
          <circle cx={width * 0.78} cy={height * 0.3} r={1.6} fill="#facc15" />
        </svg>
      );
    case 'ir-obstacle-sensor':
    case 'line-tracking-sensor':
      return (
        <svg {...svgProps}>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill="#1e3a8a" stroke="#1e40af" strokeWidth={1} />
          <circle cx={width * 0.32} cy={height / 2} r={height * 0.22} fill="#18181b" />
          <circle cx={width * 0.32} cy={height / 2} r={height * 0.1} fill="#3b0764" />
          <circle cx={width * 0.6} cy={height / 2} r={height * 0.22} fill="#18181b" />
          <circle cx={width * 0.6} cy={height / 2} r={height * 0.1} fill="#312e81" />
          <circle cx={width * 0.85} cy={height * 0.3} r={1.8} fill="#22c55e" />
        </svg>
      );
    case 'esp32-cam':
      return (
        <svg {...svgProps}>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill="#7f1d1d" stroke="#450a0a" strokeWidth={1} />
          <circle cx={width / 2} cy={height * 0.42} r={Math.min(width, height) * 0.22} fill="#18181b" stroke="#3f3f46" strokeWidth={1.5} />
          <circle cx={width / 2} cy={height * 0.42} r={Math.min(width, height) * 0.1} fill="#3b82f6" opacity={0.6} />
          <rect x={width * 0.2} y={height * 0.72} width={width * 0.6} height={height * 0.14} fill="#facc15" opacity={0.85} />
        </svg>
      );
    case 'wifi-cloud-node':
      return (
        <svg {...svgProps}>
          <path d={`M ${width * 0.3} ${height * 0.62} a ${width * 0.16} ${width * 0.16} 0 1 1 ${width * 0.02} 0 a ${width * 0.22} ${width * 0.22} 0 0 1 ${width * 0.4} 0 a ${width * 0.14} ${width * 0.14} 0 1 1 0.1 0 z`} fill="#e0f2fe" />
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M ${width / 2 - 10 + i * 3} ${height * 0.82} A ${10 - i * 3} ${10 - i * 3} 0 0 1 ${width / 2 + 10 - i * 3} ${height * 0.82}`}
              fill="none"
              stroke="#0284c7"
              strokeWidth={1.6}
            />
          ))}
          <circle cx={width / 2} cy={height * 0.82} r={1.6} fill="#0284c7" />
        </svg>
      );
    case 'dashboard-cloud':
      return (
        <svg {...svgProps}>
          <path d={`M ${width * 0.28} ${height * 0.6} a ${width * 0.15} ${width * 0.15} 0 1 1 ${width * 0.02} 0 a ${width * 0.2} ${width * 0.2} 0 0 1 ${width * 0.4} 0 a ${width * 0.13} ${width * 0.13} 0 1 1 0.1 0 z`} fill="#f0fdf4" />
          <rect x={width * 0.28} y={height * 0.68} width={width * 0.14} height={height * 0.18} fill="#16a34a" />
          <rect x={width * 0.46} y={height * 0.58} width={width * 0.14} height={height * 0.28} fill="#22c55e" />
          <rect x={width * 0.64} y={height * 0.5} width={width * 0.14} height={height * 0.36} fill="#4ade80" />
        </svg>
      );
    case 'robot-arm-base':
      return (
        <svg {...svgProps}>
          <rect x={width * 0.3} y={height * 0.75} width={width * 0.4} height={height * 0.2} rx={3} fill="#3f3f46" />
          <circle cx={width / 2} cy={height * 0.7} r={width * 0.12} fill="#71717a" stroke="#52525b" strokeWidth={1.5} />
          <rect x={width / 2 - 5} y={height * 0.28} width={10} height={height * 0.44} fill="#a1a1aa" transform={`rotate(-18 ${width / 2} ${height * 0.7})`} />
          <circle cx={width / 2} cy={height * 0.7} r={width * 0.06} fill="#facc15" />
          <rect x={width * 0.32} y={height * 0.12} width={width * 0.3} height={9} rx={3} fill="#d4d4d8" transform={`rotate(-18 ${width * 0.32} ${height * 0.28})`} />
        </svg>
      );
    case 'gripper':
      return (
        <svg {...svgProps}>
          <rect x={width * 0.42} y={2} width={width * 0.16} height={height * 0.32} fill="#71717a" />
          <path d={`M ${width * 0.5} ${height * 0.32} L ${width * 0.14} ${height * 0.85} L ${width * 0.3} ${height * 0.95} L ${width * 0.5} ${height * 0.55} Z`} fill="#a1a1aa" />
          <path d={`M ${width * 0.5} ${height * 0.32} L ${width * 0.86} ${height * 0.85} L ${width * 0.7} ${height * 0.95} L ${width * 0.5} ${height * 0.55} Z`} fill="#a1a1aa" />
        </svg>
      );
    case 'conveyor-belt':
      return (
        <svg {...svgProps}>
          <rect x={4} y={height * 0.3} width={width - 8} height={height * 0.4} rx={height * 0.2} fill="#27272a" stroke="#52525b" strokeWidth={1.5} />
          {Array.from({ length: Math.floor(width / 18) }).map((_, i) => (
            <line key={i} x1={12 + i * 18} y1={height * 0.34} x2={12 + i * 18} y2={height * 0.66} stroke="#52525b" strokeWidth={2} />
          ))}
          <circle cx={height * 0.5 + 4} cy={height / 2} r={height * 0.2} fill="#71717a" />
          <circle cx={width - height * 0.5 - 4} cy={height / 2} r={height * 0.2} fill="#71717a" />
        </svg>
      );
    case 'drone-frame':
      return (
        <svg {...svgProps}>
          <line x1={6} y1={6} x2={width - 6} y2={height - 6} stroke="#3f3f46" strokeWidth={4} />
          <line x1={width - 6} y1={6} x2={6} y2={height - 6} stroke="#3f3f46" strokeWidth={4} />
          <rect x={width / 2 - 12} y={height / 2 - 10} width={24} height={20} rx={3} fill="#18181b" />
          {[[6, 6], [width - 6, 6], [6, height - 6], [width - 6, height - 6]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={7} fill="none" stroke="#a1a1aa" strokeWidth={2} />
          ))}
        </svg>
      );
    case 'propeller':
      return (
        <svg {...svgProps}>
          <ellipse cx={width / 2} cy={height / 2} rx={width * 0.46} ry={height * 0.14} fill="#52525b" />
          <ellipse cx={width / 2} cy={height / 2} rx={width * 0.14} ry={height * 0.46} fill="#52525b" />
          <circle cx={width / 2} cy={height / 2} r={4} fill="#facc15" />
        </svg>
      );
    case 'color-sensor':
      return (
        <svg {...svgProps}>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill="#1e293b" stroke="#334155" strokeWidth={1} />
          <rect x={width * 0.32} y={height * 0.16} width={width * 0.36} height={height * 0.68} rx={2} fill="#18181b" />
          <circle cx={width * 0.42} cy={height * 0.36} r={2.4} fill="#ef4444" />
          <circle cx={width * 0.58} cy={height * 0.36} r={2.4} fill="#22c55e" />
          <circle cx={width * 0.5} cy={height * 0.62} r={2.4} fill="#3b82f6" />
          <circle cx={width * 0.14} cy={height * 0.5} r={1.6} fill="#facc15" />
        </svg>
      );
    case 'solenoid-valve':
      return (
        <svg {...svgProps}>
          <rect x={width * 0.28} y={2} width={width * 0.44} height={height * 0.32} rx={2} fill="#1d4ed8" stroke="#1e40af" strokeWidth={1} />
          {Array.from({ length: 4 }).map((_, i) => (
            <line key={i} x1={width * 0.28} y1={4 + i * (height * 0.08)} x2={width * 0.72} y2={4 + i * (height * 0.08)} stroke="#93c5fd" strokeWidth={0.8} />
          ))}
          <rect x={width * 0.14} y={height * 0.4} width={width * 0.72} height={height * 0.42} rx={height * 0.18} fill="#a1a1aa" stroke="#71717a" strokeWidth={1.2} />
          <rect x={2} y={height * 0.48} width={width * 0.16} height={height * 0.24} fill="#71717a" />
          <rect x={width - 2 - width * 0.16} y={height * 0.48} width={width * 0.16} height={height * 0.24} fill="#71717a" />
        </svg>
      );
    case 'ball':
      return (
        <svg {...svgProps}>
          <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) / 2 - 2} fill="#ef4444" />
          <circle cx={width * 0.38} cy={height * 0.36} r={Math.min(width, height) * 0.16} fill="#fca5a5" opacity={0.7} />
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M ${width / 2} 2 Q ${width * (0.3 + i * 0.2)} ${height / 2} ${width / 2} ${height - 2}`}
              stroke="#b91c1c"
              strokeWidth={0.8}
              fill="none"
              opacity={0.5}
            />
          ))}
        </svg>
      );
    case 'fire-extinguisher':
      return (
        <svg {...svgProps}>
          <rect x={width * 0.2} y={height * 0.2} width={width * 0.6} height={height * 0.72} rx={width * 0.28} fill="#dc2626" stroke="#7f1d1d" strokeWidth={1.2} />
          <rect x={width * 0.36} y={2} width={width * 0.28} height={height * 0.16} rx={2} fill="#18181b" />
          <path d={`M ${width * 0.64} ${height * 0.14} q ${width * 0.32} ${height * 0.06} ${width * 0.2} ${height * 0.34}`} stroke="#18181b" strokeWidth={2} fill="none" />
          <rect x={width * 0.06} y={height * 0.3} width={width * 0.2} height={height * 0.08} fill="#18181b" />
          <text x={width * 0.32} y={height * 0.62} fontSize={Math.min(width, height) * 0.16} fill="#fef2f2" fontWeight="bold">FIRE</text>
        </svg>
      );
    case 'water-tank':
      return (
        <svg {...svgProps}>
          <rect x={width * 0.36} y={2} width={width * 0.28} height={height * 0.1} rx={2} fill="#0284c7" />
          <rect x={width * 0.16} y={height * 0.14} width={width * 0.68} height={height * 0.78} rx={width * 0.16} fill="#38bdf8" opacity={0.3} stroke="#0284c7" strokeWidth={1.4} />
          <rect x={width * 0.16} y={height * 0.48} width={width * 0.68} height={height * 0.44} rx={width * 0.16} fill="#0284c7" opacity={0.55} />
          <line x1={width * 0.16} y1={height * 0.48} x2={width * 0.84} y2={height * 0.48} stroke="#e0f2fe" strokeWidth={1} opacity={0.8} />
        </svg>
      );
    case 'drone-motor':
      return (
        <svg {...svgProps}>
          <circle cx={width / 2} cy={height * 0.42} r={Math.min(width, height) * 0.32} fill="#18181b" stroke="#3f3f46" strokeWidth={1.4} />
          <circle cx={width / 2} cy={height * 0.42} r={Math.min(width, height) * 0.14} fill="#52525b" />
          {Array.from({ length: 3 }).map((_, i) => {
            const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
            const x = width / 2 + Math.min(width, height) * 0.22 * Math.cos(angle);
            const y = height * 0.42 + Math.min(width, height) * 0.22 * Math.sin(angle);
            return <circle key={i} cx={x} cy={y} r={1.6} fill="#71717a" />;
          })}
          <rect x={width * 0.42} y={height * 0.72} width={width * 0.16} height={height * 0.24} fill="#3f3f46" />
          {['#ef4444', '#18181b', '#facc15'].map((c, i) => (
            <line key={i} x1={width * 0.5 + (i - 1) * 3} y1={height * 0.9} x2={width * 0.5 + (i - 1) * 6} y2={height} stroke={c} strokeWidth={1.6} />
          ))}
        </svg>
      );
    case 'stair-obstacle':
      return (
        <svg {...svgProps}>
          <rect x={2} y={height * 0.68} width={width * 0.3} height={height * 0.3} fill="#71717a" stroke="#52525b" strokeWidth={0.8} />
          <rect x={width * 0.34} y={height * 0.42} width={width * 0.3} height={height * 0.56} fill="#52525b" stroke="#3f3f46" strokeWidth={0.8} />
          <rect x={width * 0.66} y={height * 0.12} width={width * 0.32} height={height * 0.86} fill="#3f3f46" stroke="#27272a" strokeWidth={0.8} />
        </svg>
      );
    case 'trash-object':
      return (
        <svg {...svgProps}>
          <rect x={width * 0.16} y={2} width={width * 0.68} height={height * 0.14} rx={2} fill="#52525b" />
          <path d={`M ${width * 0.22} ${height * 0.16} h ${width * 0.56} l ${-width * 0.05} ${height * 0.8} h ${-width * 0.46} z`} fill="#71717a" stroke="#3f3f46" strokeWidth={0.8} />
          {[0.36, 0.5, 0.64].map((x, i) => (
            <line key={i} x1={width * x} y1={height * 0.26} x2={width * x} y2={height * 0.86} stroke="#3f3f46" strokeWidth={1.2} />
          ))}
        </svg>
      );
    case 'delivery-item':
      return (
        <svg {...svgProps}>
          <rect x={width * 0.14} y={height * 0.2} width={width * 0.72} height={height * 0.68} fill="#b45309" stroke="#78350f" strokeWidth={1} />
          <line x1={width / 2} y1={height * 0.2} x2={width / 2} y2={height * 0.88} stroke="#fbbf24" strokeWidth={2.6} />
          <line x1={width * 0.14} y1={height * 0.2} x2={width * 0.86} y2={height * 0.88} stroke="#78350f" strokeWidth={1} />
          <line x1={width * 0.86} y1={height * 0.2} x2={width * 0.14} y2={height * 0.88} stroke="#78350f" strokeWidth={1} />
        </svg>
      );
    case 'line-tracking-3ch':
    case 'line-tracking-5ch': {
      const channels = type === 'line-tracking-5ch' ? 5 : 3;
      const startX = 34;
      const endX = width - 12;
      const step = channels > 1 ? (endX - startX) / (channels - 1) : 0;
      return (
        <svg {...svgProps}>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill="#1e3a8a" stroke="#1e40af" strokeWidth={1} />
          {Array.from({ length: channels }).map((_, i) => {
            const cx = startX + step * i;
            return (
              <g key={i}>
                <circle cx={cx - 4} cy={height * 0.4} r={height * 0.16} fill="#18181b" />
                <circle cx={cx - 4} cy={height * 0.4} r={height * 0.07} fill="#3b0764" />
                <circle cx={cx + 4} cy={height * 0.4} r={height * 0.16} fill="#18181b" />
                <circle cx={cx + 4} cy={height * 0.4} r={height * 0.07} fill="#312e81" />
              </g>
            );
          })}
          <text x={6} y={height * 0.3} fontSize={7} fill="#93c5fd" fontWeight="bold">{channels}CH</text>
          <circle cx={width - 6} cy={height * 0.2} r={1.6} fill="#22c55e" />
        </svg>
      );
    }
    case 'sorting-box':
      return (
        <svg {...svgProps}>
          <rect x={2} y={height * 0.24} width={width - 4} height={height * 0.72} rx={2} fill="#b45309" stroke="#78350f" strokeWidth={1.2} />
          <line x1={width / 3} y1={height * 0.24} x2={width / 3} y2={height - 2} stroke="#78350f" strokeWidth={1.4} />
          <line x1={(width * 2) / 3} y1={height * 0.24} x2={(width * 2) / 3} y2={height - 2} stroke="#78350f" strokeWidth={1.4} />
          <rect x={2} y={height * 0.14} width={width - 4} height={height * 0.12} fill="#92400e" />
        </svg>
      );
    case 'esc':
      return (
        <svg {...svgProps}>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill="#1e293b" stroke="#334155" strokeWidth={1} />
          <rect x={width * 0.32} y={height * 0.22} width={width * 0.36} height={height * 0.32} rx={2} fill="#18181b" />
          {Array.from({ length: 6 }).map((_, i) => (
            <rect key={i} x={width * 0.35 + (i % 3) * (width * 0.11)} y={i < 3 ? height * 0.26 : height * 0.42} width={width * 0.06} height={height * 0.1} fill="#facc15" />
          ))}
          <circle cx={width * 0.85} cy={height * 0.2} r={1.8} fill="#22c55e" />
          <line x1={2} y1={height * 0.85} x2={width * 0.2} y2={height * 0.85} stroke="#ef4444" strokeWidth={2} />
          <line x1={2} y1={height * 0.65} x2={width * 0.2} y2={height * 0.65} stroke="#18181b" strokeWidth={2} />
        </svg>
      );
    case 'heating-element':
      return (
        <svg {...svgProps}>
          <rect x={2} y={height * 0.15} width={width - 4} height={height * 0.7} rx={4} fill="#78350f" stroke="#451a03" strokeWidth={1} />
          {Array.from({ length: 5 }).map((_, i) => (
            <path
              key={i}
              d={`M ${6 + i * ((width - 12) / 4)} ${height * 0.25} q 4 ${height * 0.25} 0 ${height * 0.5}`}
              stroke="#f97316"
              strokeWidth={1.6}
              fill="none"
            />
          ))}
          <line x1={2} y1={height / 2} x2={-4} y2={height / 2} stroke="#ef4444" strokeWidth={2.5} />
          <line x1={width - 2} y1={height / 2} x2={width + 4} y2={height / 2} stroke="#18181b" strokeWidth={2.5} />
        </svg>
      );
    case 'ph-sensor':
      return (
        <svg {...svgProps}>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill="#0e7490" stroke="#155e75" strokeWidth={1} />
          <rect x={width * 0.12} y={height * 0.18} width={width * 0.34} height={height * 0.64} rx={2} fill="#a5f3fc" opacity={0.85} />
          <circle cx={width * 0.29} cy={height * 0.28} r={2.2} fill="#0e7490" />
          <text x={width * 0.55} y={height * 0.62} fontSize={11} fill="#e0f2fe" fontWeight="bold">pH</text>
        </svg>
      );
    default:
      return null;
  }
}

// ===== Thumbnail riêng cho PALETTE (ComponentPalettePopup.tsx) — nhóm linh
// kiện dùng element @wokwi/elements THẬT trong canvas (LED/Buzzer/RGB LED/
// Resistor/Servo/OLED/LCD/7-Segment/...) không có SVG "fallback-card" nào ở
// trên (canvas render trực tiếp qua createWokwiElement(), không qua
// renderFallbackCard()) — cần 1 hình minh hoạ RIÊNG chỉ để hiển thị trong
// popup, không đụng gì tới cách canvas render các linh kiện này (đã PASS,
// không được đổi). Cũng phủ nốt vài fallback-card visual-only còn thiếu SVG
// (Solenoid/Valve, Ball, Trash Object, Delivery Item, Water Tank, Fire
// Extinguisher, Stair/Obstacle). viewBox cố định 0 0 44 44 — không liên quan
// pinMaps.ts (chỉ dùng trong popup, không phải bounding box canvas).
function getExtraIllustration(type: string): ReactNode | null {
  const svgProps = { viewBox: '0 0 44 44', width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid meet' as const };

  switch (type) {
    case 'led':
      return (
        <svg {...svgProps}>
          <path d="M14 24 a8 8 0 1 1 16 0 v6 h-16 z" fill="#f87171" stroke="#b91c1c" strokeWidth={0.8} />
          <rect x={14} y={30} width={16} height={4} fill="#e4e4e7" />
          <line x1={19} y1={34} x2={16} y2={42} stroke="#a1a1aa" strokeWidth={2} />
          <line x1={25} y1={34} x2={28} y2={42} stroke="#a1a1aa" strokeWidth={2} />
        </svg>
      );
    case 'buzzer':
      return (
        <svg {...svgProps}>
          <circle cx={22} cy={20} r={15} fill="#27272a" stroke="#52525b" strokeWidth={1.5} />
          <circle cx={22} cy={20} r={7} fill="#52525b" />
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * Math.PI) / 4;
            return <circle key={i} cx={22 + 11 * Math.cos(angle)} cy={20 + 11 * Math.sin(angle)} r={0.9} fill="#18181b" />;
          })}
          <line x1={16} y1={34} x2={14} y2={42} stroke="#a1a1aa" strokeWidth={2} />
          <line x1={28} y1={34} x2={30} y2={42} stroke="#a1a1aa" strokeWidth={2} />
        </svg>
      );
    case 'rgb-led':
      return (
        <svg {...svgProps}>
          <path d="M22 6 a10 10 0 0 1 10 10 v8 h-20 v-8 a10 10 0 0 1 10-10 z" fill="#3f3f46" />
          <path d="M22 6 a10 10 0 0 0 -10 10 v8 h6.6 v-13 a10 10 0 0 1 3.4 -5 z" fill="#ef4444" />
          <path d="M22 6 v18 h-3.3 v-16.6 a10 10 0 0 1 3.3 -1.4 z" fill="#22c55e" opacity={0.9} />
          <path d="M22 6 a10 10 0 0 1 10 10 v8 h-6.6 v-13 a10 10 0 0 0 -3.4 -5 z" fill="#3b82f6" opacity={0.9} />
          <rect x={13} y={24} width={18} height={4} fill="#e4e4e7" />
          {[16, 20, 24, 28].map((x, i) => (
            <line key={i} x1={x} y1={28} x2={x - 2 + i} y2={42} stroke="#a1a1aa" strokeWidth={1.6} />
          ))}
        </svg>
      );
    case 'resistor':
      return (
        <svg {...svgProps}>
          <line x1={2} y1={22} x2={11} y2={22} stroke="#a1a1aa" strokeWidth={2} />
          <rect x={11} y={16} width={22} height={12} rx={6} fill="#f5deb3" stroke="#d6b370" strokeWidth={1} />
          <rect x={16} y={16} width={3} height={12} fill="#78350f" />
          <rect x={21} y={16} width={3} height={12} fill="#18181b" />
          <rect x={26} y={16} width={3} height={12} fill="#dc2626" />
          <line x1={33} y1={22} x2={42} y2={22} stroke="#a1a1aa" strokeWidth={2} />
        </svg>
      );
    case 'push_button':
      return (
        <svg {...svgProps}>
          <rect x={8} y={8} width={28} height={28} rx={4} fill="#e4e4e7" stroke="#a1a1aa" strokeWidth={1} />
          <circle cx={22} cy={22} r={9} fill="#3f3f46" />
          <circle cx={22} cy={22} r={4} fill="#18181b" />
          {[[10, 10], [34, 10], [10, 34], [34, 34]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={1.6} fill="#71717a" />
          ))}
        </svg>
      );
    case 'servo':
      return (
        <svg {...svgProps}>
          <rect x={8} y={14} width={20} height={24} rx={2} fill="#2563eb" stroke="#1e40af" strokeWidth={1} />
          <rect x={11} y={6} width={14} height={10} rx={1.5} fill="#93c5fd" />
          <rect x={15} y={2} width={6} height={6} fill="#e5e7eb" />
          <line x1={28} y1={30} x2={40} y2={26} stroke="#78350f" strokeWidth={1.6} />
          <line x1={28} y1={33} x2={40} y2={32} stroke="#dc2626" strokeWidth={1.6} />
          <line x1={28} y1={36} x2={40} y2={38} stroke="#f97316" strokeWidth={1.6} />
        </svg>
      );
    case '7segment':
      return (
        <svg {...svgProps}>
          <rect x={4} y={4} width={36} height={36} rx={2} fill="#18181b" stroke="#3f3f46" strokeWidth={1} />
          <rect x={12} y={9} width={16} height={3} fill="#ef4444" />
          <rect x={9} y={12} width={3} height={13} fill="#ef4444" />
          <rect x={28} y={12} width={3} height={13} fill="#ef4444" />
          <rect x={12} y={23.5} width={16} height={3} fill="#7f1d1d" />
          <rect x={9} y={26} width={3} height={13} fill="#ef4444" />
          <rect x={28} y={26} width={3} height={13} fill="#7f1d1d" />
          <rect x={12} y={37} width={16} height={3} fill="#ef4444" />
        </svg>
      );
    case 'led-bar-graph':
      return (
        <svg {...svgProps}>
          <rect x={3} y={15} width={38} height={14} rx={2} fill="#18181b" stroke="#3f3f46" strokeWidth={1} />
          {Array.from({ length: 10 }).map((_, i) => (
            <rect key={i} x={5.5 + i * 3.6} y={18} width={2.4} height={8} fill="#ef4444" opacity={0.4 + (i % 3) * 0.2} />
          ))}
        </svg>
      );
    case 'ssd1306':
      return (
        <svg {...svgProps}>
          <rect x={4} y={9} width={36} height={24} rx={2} fill="#18181b" stroke="#3f3f46" strokeWidth={1} />
          <rect x={8} y={13} width={28} height={16} fill="#0369a1" opacity={0.35} />
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 8 }).map((__, c) => (
              <rect key={`${r}-${c}`} x={10 + c * 3.2} y={15 + r * 3.2} width={1.6} height={1.6} fill="#38bdf8" opacity={0.8} />
            ))
          )}
        </svg>
      );
    case 'lcd1602':
    case 'lcd1602-i2c':
      return (
        <svg {...svgProps}>
          <rect x={2} y={7} width={type === 'lcd1602-i2c' ? 32 : 40} height={26} rx={2} fill="#1d4ed8" stroke="#1e3a8a" strokeWidth={1} />
          <rect x={5} y={10} width={type === 'lcd1602-i2c' ? 26 : 34} height={20} fill="#4ade80" />
          {Array.from({ length: 2 }).map((_, r) =>
            Array.from({ length: 6 }).map((__, c) => (
              <rect
                key={`${r}-${c}`}
                x={7.5 + c * (type === 'lcd1602-i2c' ? 4 : 5)}
                y={13 + r * 7}
                width={2.4}
                height={4}
                fill="#166534"
                opacity={0.75}
              />
            ))
          )}
          {type === 'lcd1602-i2c' && (
            <>
              <rect x={34} y={14} width={8} height={12} rx={1} fill="#7e22ce" />
              {[16.5, 19.5, 22.5, 25.5].map((y, i) => (
                <circle key={i} cx={38} cy={y} r={0.7} fill="#facc15" />
              ))}
            </>
          )}
        </svg>
      );
    case 'lcd2004':
      return (
        <svg {...svgProps}>
          <rect x={2} y={4} width={30} height={36} rx={2} fill="#1d4ed8" stroke="#1e3a8a" strokeWidth={1} />
          <rect x={4} y={6} width={26} height={32} fill="#4ade80" />
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 6 }).map((__, c) => (
              <rect key={`${r}-${c}`} x={5.5 + c * 4} y={8 + r * 7.4} width={2.6} height={4.4} fill="#166534" opacity={0.75} />
            ))
          )}
          <rect x={34} y={12} width={8} height={16} rx={1} fill="#7e22ce" />
          {[15, 18.5, 22, 25.5].map((y, i) => (
            <circle key={i} cx={38} cy={y} r={0.7} fill="#facc15" />
          ))}
        </svg>
      );
    case 'ili9341':
      return (
        <svg {...svgProps}>
          <rect x={4} y={4} width={36} height={36} rx={2} fill="#18181b" stroke="#3f3f46" strokeWidth={1} />
          <rect x={8} y={8} width={28} height={28} fill="#0f172a" />
          <rect x={8} y={8} width={7} height={28} fill="#ef4444" opacity={0.7} />
          <rect x={15} y={8} width={7} height={28} fill="#22c55e" opacity={0.7} />
          <rect x={22} y={8} width={7} height={28} fill="#3b82f6" opacity={0.7} />
          <rect x={29} y={8} width={7} height={28} fill="#facc15" opacity={0.7} />
        </svg>
      );
    case 'flame-sensor':
      return (
        <svg {...svgProps}>
          <rect x={4} y={4} width={36} height={36} rx={3} fill="#7c2d12" stroke="#431407" strokeWidth={1} />
          <circle cx={15} cy={20} r={7} fill="#18181b" />
          <circle cx={15} cy={20} r={3} fill="#3b0764" />
          <path d="M29 30 c-4 2 -6 7 -3 11 c1 -3 3 -3 4 -1 c2 -3 1 -7 -1 -10 z" fill="#f97316" />
          <circle cx={31} cy={10} r={1.6} fill="#22c55e" />
        </svg>
      );
    case 'pir-motion-sensor':
      return (
        <svg {...svgProps}>
          <rect x={4} y={22} width={36} height={16} rx={2} fill="#27272a" />
          <path d="M6 24 a16 16 0 0 1 32 0 z" fill="#f5f5f4" opacity={0.92} />
          {[14, 22, 30].map((x, i) => (
            <line key={i} x1={x} y1={24 - i} x2={x} y2={10} stroke="#d4d4d8" strokeWidth={0.8} />
          ))}
        </svg>
      );
    case 'gas-sensor':
      return (
        <svg {...svgProps}>
          <rect x={6} y={28} width={32} height={10} rx={2} fill="#1d4ed8" />
          <circle cx={22} cy={18} r={14} fill="#a1a1aa" stroke="#71717a" strokeWidth={1.5} />
          <circle cx={22} cy={18} r={6} fill="#52525b" />
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * Math.PI) / 3;
            return <circle key={i} cx={22 + 10 * Math.cos(angle)} cy={18 + 10 * Math.sin(angle)} r={0.9} fill="#3f3f46" />;
          })}
        </svg>
      );
    case 'dht22':
    case 'dht11':
      return (
        <svg {...svgProps}>
          <rect x={8} y={4} width={28} height={30} rx={4} fill="#2563eb" stroke="#1e3a8a" strokeWidth={1} />
          {[11, 16, 21, 26].map((y, i) => (
            <line key={i} x1={12} y1={y} x2={32} y2={y} stroke="#93c5fd" strokeWidth={1.2} />
          ))}
          {[14, 20, 26, 32].map((x, i) => (
            <rect key={i} x={x} y={34} width={2} height={6} fill="#a1a1aa" />
          ))}
        </svg>
      );
    // color-sensor/solenoid-valve/ball/trash-object/delivery-item/water-tank/
    // fire-extinguisher/stair-obstacle: xử lý ở getFallbackIllustration() phía
    // trên (2026-07-28) — dùng đúng width/height card thật thay vì 44x44 cố
    // định, không duplicate SVG ở đây nữa (getComponentIllustration() ưu tiên
    // getFallbackIllustration() trước, các case dưới đây không còn được gọi
    // tới cho 8 type này, chỉ giữ lại type CHƯA có fallback-card).
    case 'mpu6050':
      return (
        <svg {...svgProps}>
          <rect x={4} y={12} width={36} height={20} rx={2} fill="#166534" stroke="#14532d" strokeWidth={1} />
          <rect x={14} y={16} width={16} height={12} rx={1} fill="#18181b" />
          <circle cx={22} cy={22} r={3} fill="#3f3f46" />
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={i} x1={6 + i * 4.6} y1={32} x2={6 + i * 4.6} y2={38} stroke="#a1a1aa" strokeWidth={1.4} />
          ))}
        </svg>
      );
    default:
      return null;
  }
}

// getComponentIllustration() — dùng bởi ComponentPalettePopup.tsx (và có thể
// dùng lại ở nơi khác cần thumbnail cố định-kích thước, khác renderFallbackCard()
// trong CircuitCanvas.tsx vốn dùng đúng width/height thật của card). Nhận
// componentType RAW từ BE (vd 'wokwi-l298n') — tự normalize qua
// componentTypeNormalize.ts, KHÔNG đụng tới bất kỳ logic render canvas nào.
// Thứ tự ưu tiên: (1) SVG fallback-card đã có sẵn (26 item, dùng lại nguyên,
// đúng tỉ lệ card thật) — (2) SVG riêng cho palette (nhóm real @wokwi/elements
// + vài fallback visual-only còn thiếu) — (3) null, caller tự fallback icon
// lucide cũ.
export function getComponentIllustration(componentType: string): ReactNode | null {
  const type = normalizeComponentType(componentType);
  const config = ROBOT_KIT_FALLBACK_CARDS[type];
  if (config) {
    const illustration = getFallbackIllustration(type, config.width, config.height);
    if (illustration) return illustration;
  }
  return getExtraIllustration(type);
}
