// Chuẩn hoá trạng thái quay CHUNG cho mọi linh kiện cơ khí quay (DC Motor
// shaft, Robot Wheel, Fan blade, Drone Motor propeller) — KHÔNG mô phỏng
// physics (không di chuyển chassis/drone trên canvas, xem TASK "STANDARDIZE
// MOTOR / ROTATING COMPONENT ANIMATION"). Nguồn dữ liệu LUÔN là partStates
// thật từ simulation runtime (L298nModel.cs/FanModel.cs/DroneMotorModel.cs
// qua QemuEsp32Runner) — không có state giả lập ở tầng FE.
import type { CSSProperties } from 'react';
import type { MotorDriveState } from './CircuitCanvas';

export type MotorSpinDirection = 'forward' | 'reverse';

export interface MotorVisualState {
  running: boolean;
  direction: MotorSpinDirection;
  // 0..1, dự phòng cho tốc độ theo PWM — LUÔN undefined trong thực tế hôm nay
  // vì QEMU chỉ instrument digitalWrite, không đọc được analogWrite/ledcWrite
  // (xem L298nModel.cs/RgbLedModel.cs comment) — không có nguồn dữ liệu thật
  // nào set field này, nhưng animation duration đã sẵn sàng đọc nó nếu BE sau
  // này bổ sung PWM.
  speed?: number;
}

export const STOPPED_VISUAL: MotorVisualState = { running: false, direction: 'forward' };

// L298nModel.ComputeState()'s 4 giá trị: forward/backward -> đang quay theo
// 2 chiều; stopped/brake -> đứng yên (không phân biệt phanh cứng hay đơn
// giản là chưa cấp điện ở tầng animation — cả 2 đều "không quay").
export function driveStateToVisual(state: MotorDriveState | undefined): MotorVisualState {
  if (state === 'forward') return { running: true, direction: 'forward' };
  if (state === 'backward') return { running: true, direction: 'reverse' };
  return STOPPED_VISUAL;
}

// Fan/DroneMotor — nhị phân on/off qua digitalWrite (FanModel.cs/
// DroneMotorModel.cs), không có khái niệm chiều quay ngược.
export function onOffToVisual(on: boolean | undefined): MotorVisualState {
  return on ? { running: true, direction: 'forward' } : STOPPED_VISUAL;
}

const BASE_SPIN_DURATION_MS = 900;

// animation-play-state (thay vì gắn/gỡ hẳn animation) — giữ animation LUÔN
// gắn sẵn trên phần tử, chỉ pause/resume, để dừng lại đúng ngay khung hình
// hiện tại thay vì giật về khung hình đầu mỗi lần bật lại. transformOrigin
// truyền vào bằng toạ độ cục bộ (px) của SVG chứa nó, khớp đúng tâm trục vẽ
// tay (không phải center theo % — nhiều hình có tâm KHÔNG phải chính giữa
// bounding box, vd Drone Motor).
export function spinStyle(visual: MotorVisualState | undefined, cx: number, cy: number): CSSProperties {
  const v = visual ?? STOPPED_VISUAL;
  const speedFactor = v.speed && v.speed > 0 ? v.speed : 1;
  return {
    transformOrigin: `${cx}px ${cy}px`,
    animationName: v.direction === 'reverse' ? 'stem-spin-ccw' : 'stem-spin-cw',
    animationDuration: `${BASE_SPIN_DURATION_MS / speedFactor}ms`,
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    animationPlayState: v.running ? 'running' : 'paused',
  };
}

// ---- Motor <-> Wheel/Propeller linkage (STEP 3/STEP 4 tối thiểu, không đổi
// DB) ----
// Robot Wheel/Propeller KHÔNG có kết nối điện nào (visual-only, không vào
// netlist — xem robotKitComponents.ts) nên không có cách nào tra cứu "wheel
// này gắn với motor nào" từ dữ liệu mạch thật. Heuristic tối thiểu: DC Motor/
// Drone Motor GẦN NHẤT trên canvas (khoảng cách Euclid). Suy biến an toàn khi
// không có motor nào trong diagram (giữ nguyên tĩnh, không lỗi).
export interface CanvasPoint {
  id: string;
  x: number;
  y: number;
}

export function findNearest(target: CanvasPoint, candidates: CanvasPoint[]): CanvasPoint | null {
  let best: CanvasPoint | null = null;
  let bestDist = Infinity;
  for (const candidate of candidates) {
    if (candidate.id === target.id) continue;
    const dx = candidate.x - target.x;
    const dy = candidate.y - target.y;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  return best;
}

// DC Motor -> L298N channel (STEP 2's "DC Motor rotation state CHÍNH LÀ
// motorA/motorB của L298N nó đấu vào", robotKitComponents.ts:191) — tra trực
// tiếp trong connections[] (đã có sẵn, không cần đổi DB): tìm dây nối
// terminal1/terminal2 của motor này tới OUTn của 1 L298N. OUT1/OUT2 ứng với
// motorA (kênh IN1/IN2), OUT3/OUT4 ứng với motorB (kênh IN3/IN4) — đúng thứ
// tự vật lý L298N thật.
export function findL298nChannel(
  dcMotorId: string,
  connections: readonly (readonly [string, string, ...unknown[]])[],
): { l298nId: string; channel: 'motorA' | 'motorB' } | null {
  const dcPrefix = `${dcMotorId}:`;
  for (const conn of connections) {
    const [a, b] = conn;
    const dcSide = a.startsWith(dcPrefix) ? a : b.startsWith(dcPrefix) ? b : null;
    if (!dcSide) continue;
    const other = dcSide === a ? b : a;
    const match = other.match(/^(.+):OUT([1-4])$/i);
    if (match) {
      const outNum = Number(match[2]);
      return { l298nId: match[1], channel: outNum <= 2 ? 'motorA' : 'motorB' };
    }
  }
  return null;
}
