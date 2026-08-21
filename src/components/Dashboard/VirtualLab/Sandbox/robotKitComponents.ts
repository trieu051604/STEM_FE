// Component Registry — bộ linh kiện "Robot giao hàng mini" + khung mở rộng
// cho custom component sau này.
//
// Đây KHÔNG phải danh sách trang trí palette — mỗi field dưới đây ánh xạ
// thẳng tới 1 phần thật của hệ thống:
//   - componentType    -> khớp ComponentGlueRegistry.ComponentType (BE DB) và
//                         type string dùng trong DiagramJson.parts[].type
//   - pins             -> khớp SupportedPins trong VirtualLabDiagramService.cs
//                         (BE) và pinMaps.ts (FE) — 2 nguồn PHẢI đồng bộ tay,
//                         chưa có codegen dùng chung (xem backlog).
//   - wiringRules       -> mô tả NGẮN đúng logic thật trong
//                         ValidateComponentWiring() (BE) — không phải thứ
//                         được thực thi từ đây, chỉ để đọc/đối chiếu.
//   - runtimeAdapter    -> tên class C# thật xử lý map GPIO -> part-state
//                         (null nếu component đó BE hoàn toàn bỏ qua khi chạy).
//   - renderer          -> "wokwi-element:<tag>" nếu có element thật trong
//                         @wokwi/elements, hoặc "fallback-card" nếu dùng
//                         renderFallbackCard() trong CircuitCanvas.tsx.
//   - supportLevel      -> nguồn DUY NHẤT cho badge hiển thị (palette + BOM
//                         panel đều đọc field này, không tự suy đoán riêng).
//
// Kiến trúc hiện tại KHÔNG (chưa) tự động hoá việc thêm 1 component mới —
// vẫn cần sửa tay ở nhiều nơi (xem "Cần sửa thủ công khi thêm component mới"
// ở cuối file). Registry này là bước 1 (nguồn sự thật tập trung, dễ audit),
// chưa phải bước cuối (codegen/tự động đồng bộ pinMaps+SupportedPins+renderer
// từ 1 định nghĩa duy nhất) — xem VIRTUAL_LAB_PLAN.md backlog.

// Bước 1 của kế hoạch chuẩn hoá Registry (xem VIRTUAL_LAB_PLAN.md mục
// "COMPONENT PLATFORM — Chuẩn hoá Registry"): union type liệt kê tường minh
// mọi componentType đã biết trong hệ thống robot kit + mở rộng. Khai báo tay
// (không suy ra tự động từ mảng runtime để tránh phải đổi ROBOT_KIT_COMPONENTS
// sang "as const" — thay đổi đó có thể làm literal-hoá toàn bộ field khác,
// rủi ro cascade type error không cần thiết cho bước an toàn đầu tiên này).
// Dùng type này để annotate tham số/biến ở bất kỳ đâu cần string type an toàn
// (VD: `function xxx(type: KnownComponentTypeId)`) — TypeScript sẽ tự báo lỗi
// biên dịch nếu gõ sai/quên 1 chỗ, thay vì để runtime âm thầm sai (đúng vấn đề
// "sửa tay 7 chỗ, dễ quên" đã ghi nhận). Đây là bước ÁP DỤNG DẦN — chưa retrofit
// hết mọi chỗ đang dùng string trần trong CircuitCanvas.tsx/CircuitBuilderTeacherMode.tsx
// (xem plan các bước tiếp theo).
export type KnownComponentTypeId =
  | 'wokwi-hc-sr04'
  | 'wokwi-l298n'
  | 'wokwi-dc-motor'
  | 'wokwi-robot-wheel'
  | 'wokwi-caster-wheel'
  | 'wokwi-robot-chassis'
  | 'wokwi-battery-pack'
  | 'wokwi-power-switch'
  | 'wokwi-breadboard'
  | 'wokwi-delivery-box'
  | 'wokwi-rgb-led';

export type RobotKitCategory =
  | 'electronics'
  | 'sensor'
  | 'actuator'
  | 'motor-driver'
  | 'power'
  | 'mechanical'
  | 'accessory'
  | 'bom-only'
  | 'display'
  | 'communication';

export type ComponentSource = 'wokwi' | 'stem' | 'custom';

export type SupportLevel =
  | 'runtime-supported'
  | 'wiring-validation'
  // Visual exists, but pin identity/geometry has NO evidence (provider
  // metadata, datasheet, manufacturer doc, verified open-source part) — an
  // invented/eyeballed pin position, not a wiring rule waiting to be
  // written. Distinct from 'wiring-validation' (real pins, rule pending)
  // — see Verified External Component Assets milestone, Phase 20.
  | 'pin-unverified'
  | 'visual-only'
  | 'bom-only';

export const SUPPORT_LEVEL_BADGE: Record<SupportLevel, string> = {
  'runtime-supported': 'Mô phỏng được',
  'wiring-validation': 'Kiểm tra nối dây',
  'pin-unverified': 'Chưa xác minh sơ đồ chân',
  'visual-only': 'Chỉ hiển thị',
  'bom-only': 'Phụ kiện BOM',
};

export interface ComponentRegistryEntry {
  /** Khớp đúng ComponentGlueRegistry.ComponentType khi có (null nếu bom-only/board field, không phải part trong parts[]). */
  componentType: string | null;
  displayName: string;
  category: RobotKitCategory;
  /** wokwi = có element @wokwi/elements thật; stem = tự định nghĩa cho dự án này; custom = do giáo viên/dev thêm sau, chưa chuẩn hoá. */
  source: ComponentSource;
  supportLevel: SupportLevel;
  quantity: number;
  quantityLabel?: string;
  pins: string[];
  /** Giá trị attrs mặc định khi kéo vào canvas (createPart()/getDefaultAttrs() trong CircuitBuilderTeacherMode.tsx). */
  defaultProps: Record<string, string>;
  /** Mô tả ngắn đúng logic ValidateComponentWiring() (BE) — không phải code thực thi được. */
  wiringRules: string[];
  /** Tên class C# thật xử lý runtime (null = BE không có adapter, component bị bỏ qua lúc chạy). */
  runtimeAdapter: string | null;
  renderer: string;
  notes: string;
  /** Nguồn hình dáng/tham khảo trực quan — Wokwi/@wokwi/elements, Fritzing, Cirkit Designer, Tinkercad, hoặc "custom-svg" (tự vẽ card). Optional — chỉ set cho item thuộc "Thư viện linh kiện mở rộng" (PHẦN 7 yêu cầu Component Library), item Robot Delivery Kit cũ không set lại (source ở trên đã đủ). */
  visualSource?: string;
  /** Ghi chú license nếu asset không phải tự vẽ 100% (vd: "@wokwi/elements — MIT license, xem package.json"). */
  licenseNote?: string;
}

// Suy ra tương thích ngược cho code cũ đang import RobotKitComponentEntry/ROBOT_KIT_COMPONENTS.
export type RobotKitComponentEntry = ComponentRegistryEntry;

function deriveFlags(entry: ComponentRegistryEntry) {
  return {
    visualSupported: entry.supportLevel !== 'bom-only',
    wiringValidationSupported: entry.supportLevel === 'wiring-validation' || entry.supportLevel === 'runtime-supported',
    runtimeSupported: entry.supportLevel === 'runtime-supported',
    accessoryOnly: entry.supportLevel === 'bom-only',
  };
}

export const ROBOT_KIT_COMPONENTS: ComponentRegistryEntry[] = [
  {
    componentType: null,
    displayName: 'ESP32 DevKit V1',
    category: 'electronics',
    source: 'wokwi',
    supportLevel: 'runtime-supported',
    quantity: 1,
    pins: ['GPIO0..GPIO35 (tập con an toàn)', '3V3', '5V', 'VIN', 'GND'],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: 'QemuEsp32Runner (chạy firmware thật qua QEMU, không phải interpreter)',
    renderer: 'wokwi-element:wokwi-esp32-devkit-v1',
    notes: 'Board chính — lưu ở field board của Lab/Project, không phải 1 phần tử trong parts[]. Runtime qua QEMU đã hoạt động trước task này, không đổi.',
  },
  {
    componentType: 'wokwi-hc-sr04',
    displayName: 'HC-SR04 Ultrasonic Sensor',
    category: 'sensor',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'TRIG', 'ECHO', 'GND'],
    defaultProps: {},
    wiringRules: [
      'TRIG phải reach 1 GPIO ESP32 (error nếu thiếu).',
      'ECHO phải reach 1 GPIO ESP32 (error nếu thiếu).',
      'VCC phải reach 3V3/5V (error nếu thiếu).',
      'GND phải reach ground chung (error nếu thiếu).',
    ],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-hc-sr04',
    notes:
      'Element @wokwi/elements thật, wiring validation đầy đủ ở BE (đã có từ trước, chỉ chưa từng nối FE tới lúc task này). CHƯA mô phỏng khoảng cách thật — xem "Limitation kỹ thuật" trong VIRTUAL_LAB_PLAN.md: QEMU hiện chỉ đọc log ra (digitalWrite qua SF_EVENT), không có cơ chế ghi/inject tín hiệu input (ECHO) ngược vào máy ảo đang chạy. distanceCm chỉ là thuộc tính khai báo cho mục đích tài liệu/UI, KHÔNG ảnh hưởng firmware thật — không được coi là runtime-supported.',
  },
  {
    componentType: 'wokwi-l298n',
    displayName: 'L298N Motor Driver',
    category: 'motor-driver',
    source: 'stem',
    supportLevel: 'runtime-supported',
    quantity: 1,
    pins: ['IN1', 'IN2', 'IN3', 'IN4', 'ENA', 'ENB', 'OUT1', 'OUT2', 'OUT3', 'OUT4', 'VIN', 'GND', '5V'],
    defaultProps: {},
    wiringRules: [
      'IN1/IN2/IN3/IN4 phải mỗi chân reach 1 GPIO ESP32 (error nếu thiếu).',
      'VIN phải reach nguồn (3V3/5V hoặc Battery Pack +) (error nếu thiếu).',
      'GND phải reach ground chung hoặc Battery Pack - (error nếu thiếu).',
      'ENA/ENB không nối -> chỉ warning (module thật thường có jumper mặc định full-speed).',
    ],
    runtimeAdapter: 'L298nModel (STEM.Application/UseCases/Simulation/Runners/Educational/Components/L298nModel.cs) — gọi từ QemuEsp32Runner.ComponentIndex',
    renderer: 'fallback-card (không có element @wokwi/elements cho L298N)',
    notes:
      'Runtime THẬT: đọc digitalWrite trên IN1/IN2 (Motor A) và IN3/IN4 (Motor B) qua SF_EVENT có sẵn từ QEMU, suy ra forward/backward/stopped/brake theo đúng bảng sự thật L298N, emit part-state "l298n" mỗi khi state đổi. FE hiện trực tiếp trên card (A:.../B:...). KHÔNG đọc ENA/ENB (QEMU không instrument analogWrite/ledcWrite PWM) — coi như luôn enabled, đây là giới hạn kỹ thuật đã biết, không phải thiếu sót.',
  },
  {
    componentType: 'wokwi-dc-motor',
    displayName: 'DC Geared Motor / TT Motor',
    category: 'actuator',
    source: 'stem',
    supportLevel: 'runtime-supported',
    quantity: 2,
    pins: ['terminal1', 'terminal2'],
    defaultProps: {},
    wiringRules: [
      'terminal1/terminal2 KHÔNG được reach GPIO ESP32 trực tiếp (error rõ ràng — động cơ DC hút dòng vượt khả năng GPIO, bắt buộc qua OUT của L298N).',
    ],
    runtimeAdapter: 'Không có adapter riêng — trạng thái quay của DC Motor CHÍNH LÀ trạng thái Motor A/B của L298N nó đấu vào (động cơ chỉ là tải thụ động theo tín hiệu điều khiển), nên hiển thị trên card L298N tương ứng, không lặp lại trên card DC Motor.',
    renderer: 'fallback-card',
    notes: 'Runtime-supported theo đúng nghĩa "trạng thái quay được mô phỏng thật" — nhưng hiển thị gộp trên L298N card (đúng bản chất điện: DC Motor không tự có logic, chỉ theo L298N).',
  },
  {
    componentType: 'wokwi-robot-wheel',
    displayName: 'Robot Wheel',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 2,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only — không có pin, không tham gia netlist/Analyze() (cố tình không có entry trong SupportedPins). Kéo thả/save/reload bình thường.',
  },
  {
    componentType: 'wokwi-caster-wheel',
    displayName: 'Caster Wheel',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only, giống Robot Wheel.',
  },
  {
    componentType: 'wokwi-robot-chassis',
    displayName: 'Robot Chassis',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only, khung đế lớn nhất trong bộ.',
  },
  {
    componentType: 'wokwi-battery-pack',
    displayName: 'Battery Pack 7.4V Li-ion / 2x18650',
    category: 'power',
    source: 'stem',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['+', '-'],
    defaultProps: {},
    wiringRules: [
      'Không có rule riêng bắt buộc — được L298N tham chiếu tới (VIN/GND) qua IsPowerOrBatteryPositive/IsGroundOrBatteryNegative.',
    ],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Không mô phỏng điện áp 7.4V thật trong phase này — chỉ công nhận đúng cực tính khi L298N tham chiếu tới.',
  },
  {
    componentType: 'wokwi-power-switch',
    displayName: 'Power Switch',
    category: 'power',
    source: 'stem',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['IN', 'OUT'],
    defaultProps: {},
    wiringRules: ['Structural-only (warning chung "wiring validation for wokwi-power-switch is structural only in MVP") — chưa có logic đồ thị riêng cho công tắc.'],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Wiring validation dừng ở mức structural-only, không crash, không chặn Run.',
  },
  {
    componentType: 'wokwi-breadboard',
    displayName: 'Breadboard',
    category: 'accessory',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Chưa implement netlist breadboard thật (rail nối ngầm giữa các lỗ) — cố tình KHÔNG có entry trong SupportedPins nên không tham gia validation. Kéo thả được nhưng không có pin/wiring.',
  },
  {
    componentType: null,
    displayName: 'Jumper Wires',
    category: 'bom-only',
    source: 'stem',
    supportLevel: 'bom-only',
    quantity: 1,
    quantityLabel: '1 bộ',
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'none (BOM-only, không có trên canvas)',
    notes: 'Không phải component độc lập — hệ thống đã có connection/wire riêng. Chỉ liệt kê trong BOM.',
  },
  {
    componentType: null,
    displayName: 'USB Cable Type-C/Micro USB',
    category: 'bom-only',
    source: 'stem',
    supportLevel: 'bom-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'none (BOM-only)',
    notes: 'Accessory-only — không cần canvas/runtime.',
  },
  {
    componentType: null,
    displayName: 'Mounting Screws & Nuts',
    category: 'bom-only',
    source: 'stem',
    supportLevel: 'bom-only',
    quantity: 1,
    quantityLabel: '1 bộ',
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'none (BOM-only)',
    notes: 'Accessory-only — không cần canvas/runtime.',
  },
  {
    componentType: 'wokwi-delivery-box',
    displayName: 'Mini Delivery Box',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only, khoang chở hàng gắn trên chassis.',
  },
];

// Derived flags giữ để tương thích ngược với RobotKitBomPanel.tsx và mọi chỗ
// khác đang đọc visualSupported/wiringValidationSupported/runtimeSupported/
// accessoryOnly trực tiếp — tính TỪ supportLevel (nguồn sự thật duy nhất),
// không lưu trùng lặp có thể lệch nhau.
export function getComponentFlags(entry: ComponentRegistryEntry) {
  return deriveFlags(entry);
}

export function getRobotKitEntry(componentType: string): ComponentRegistryEntry | undefined {
  return ROBOT_KIT_COMPONENTS.find((item) => item.componentType === componentType);
}

// ===== Ngoài Robot giao hàng mini — nhóm "output-easy" mở rộng thêm =====
// Không thuộc bộ Robot Delivery Kit (bảng chính ở trên) — tách riêng để
// không làm sai lệch số lượng "14 mục" BOM panel. Bằng chứng cụ thể rằng
// nhóm output-only (chỉ cần digitalWrite, giống LED/Buzzer/L298N) mở rộng
// được an toàn theo đúng pattern cũ, không cần khả năng runtime mới.
export const NEXT_TIER_COMPONENTS: ComponentRegistryEntry[] = [
  {
    componentType: 'wokwi-rgb-led',
    displayName: 'RGB LED',
    category: 'electronics',
    source: 'wokwi',
    supportLevel: 'runtime-supported',
    quantity: 1,
    pins: ['R', 'G', 'B', 'COM'],
    defaultProps: {},
    wiringRules: [
      'R/G/B mỗi chân phải reach 1 GPIO ESP32 (error nếu thiếu).',
      'COM phải reach GND hoặc nguồn (error nếu thiếu) — tuỳ common-anode/cathode.',
    ],
    runtimeAdapter: 'RgbLedModel.cs — 3 kênh độc lập, mỗi kênh chỉ bật/tắt qua digitalWrite (không có độ sáng trung gian, QEMU không đọc PWM).',
    renderer: 'wokwi-element:wokwi-rgb-led',
    notes: 'Runtime-supported thật — verify build sạch, cùng pattern LED/Buzzer. Element thật dùng property ledRed/ledGreen/ledBlue (số 0/1, không phải màu liên tục).',
  },
];

// ===== Component ngoài Robot Delivery Kit, đang chạy trong hệ thống =====
// Không thuộc "Robot giao hàng mini" nhưng liệt kê ở đây để Component Support
// Matrix phản ánh ĐÚNG toàn bộ hệ thống (yêu cầu #2 — matrix phải bao gồm cả
// linh kiện cũ). Nguồn sự thật CHÍNH của các component này vẫn là
// COMPONENT_REFERENCES trong CircuitBuilderTeacherMode.tsx + SupportedPins
// (BE) — bảng dưới đây chỉ là bản tóm tắt supportLevel, KHÔNG dùng để render.
export const LEGACY_COMPONENTS_SUMMARY: Array<{
  componentType: string;
  displayName: string;
  supportLevel: SupportLevel;
  runtimeAdapter: string | null;
}> = [
  { componentType: 'wokwi-led', displayName: 'LED', supportLevel: 'runtime-supported', runtimeAdapter: 'LedModel.cs' },
  { componentType: 'wokwi-buzzer', displayName: 'Buzzer', supportLevel: 'runtime-supported', runtimeAdapter: 'BuzzerModel.cs' },
  { componentType: 'wokwi-resistor', displayName: 'Điện trở', supportLevel: 'wiring-validation', runtimeAdapter: null },
  { componentType: 'wokwi-pushbutton', displayName: 'Push Button', supportLevel: 'wiring-validation', runtimeAdapter: null },
  { componentType: 'wokwi-servo', displayName: 'Servo', supportLevel: 'wiring-validation', runtimeAdapter: null },
  { componentType: 'wokwi-potentiometer', displayName: 'Potentiometer', supportLevel: 'wiring-validation', runtimeAdapter: null },
  { componentType: 'wokwi-dht22', displayName: 'DHT22', supportLevel: 'wiring-validation', runtimeAdapter: null },
];

// ===== Thư viện linh kiện mở rộng (Component Library, 2026-07-27) =====
// Không thuộc Robot Delivery Kit — phục vụ các bài demo khác (sensor, actuator,
// robot/cơ khí, display/communication). KHÔNG có item nào runtime-supported
// trong đợt này (task này tạm dừng runtime mới) — mọi wiring-validation ở đây
// dừng ở "structural only" phía BE (không có ValidateComponentWiring branch
// riêng, giống Power Switch/HC-SR04 trước khi có logic riêng). quantity=1 cho
// mọi item — KHÔNG ràng buộc BOM (mảng này không được RobotKitBomPanel đọc,
// giáo viên kéo thả bao nhiêu tuỳ ý).
export const EXTENDED_COMPONENT_LIBRARY: ComponentRegistryEntry[] = [
  // --- Real @wokwi/elements — wiring-validation ---
  {
    componentType: 'wokwi-flame-sensor',
    displayName: 'Flame Sensor',
    category: 'sensor',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'GND', 'DOUT', 'AOUT'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP) — chưa có rule riêng theo từng chân.'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-flame-sensor',
    notes: 'Element thật @wokwi/elements — chỉ hiển thị + wiring validation, chưa mô phỏng phát hiện lửa thật.',
    visualSource: '@wokwi/elements flame-sensor-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-gas-sensor',
    displayName: 'MQ Gas Sensor',
    category: 'sensor',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['AOUT', 'DOUT', 'GND', 'VCC'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-gas-sensor',
    notes: 'Element thật @wokwi/elements (kiểu module MQ-2/MQ-135).',
    visualSource: '@wokwi/elements gas-sensor-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-pir-motion-sensor',
    displayName: 'PIR Motion Sensor',
    category: 'sensor',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'OUT', 'GND'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-pir-motion-sensor',
    notes: 'Element thật @wokwi/elements.',
    visualSource: '@wokwi/elements pir-motion-sensor-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-photoresistor-sensor',
    displayName: 'Light Sensor / LDR',
    category: 'sensor',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'GND', 'DO', 'AO'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-photoresistor-sensor',
    notes: 'Element thật @wokwi/elements.',
    visualSource: '@wokwi/elements photoresistor-sensor-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-ntc-temperature-sensor',
    displayName: 'Temperature Sensor (NTC)',
    category: 'sensor',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['GND', 'VCC', 'OUT'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-ntc-temperature-sensor',
    notes: 'Element thật @wokwi/elements.',
    visualSource: '@wokwi/elements ntc-temperature-sensor-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-hx711',
    displayName: 'Load Cell HX711',
    category: 'sensor',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'DT', 'SCK', 'GND'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-hx711',
    notes: 'Element thật @wokwi/elements.',
    visualSource: '@wokwi/elements hx711-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-ir-receiver',
    displayName: 'IR Receiver',
    category: 'sensor',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['GND', 'VCC', 'DAT'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-ir-receiver',
    notes: 'Element thật @wokwi/elements.',
    visualSource: '@wokwi/elements ir-receiver-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-membrane-keypad',
    displayName: 'Keypad (4x4)',
    category: 'communication',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['R1', 'R2', 'R3', 'R4', 'C1', 'C2', 'C3', 'C4'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-membrane-keypad',
    notes: 'Element thật @wokwi/elements, mặc định 4x4 (columns=4).',
    visualSource: '@wokwi/elements membrane-keypad-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-ssd1306',
    displayName: 'OLED SSD1306',
    category: 'display',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['DATA', 'CLK', 'DC', 'RST', 'CS', '3V3', 'VIN', 'GND'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-ssd1306',
    notes: 'Element thật @wokwi/elements — chỉ hiển thị khung/vỏ, chưa vẽ nội dung màn hình thật (cần I2C protocol layer, ngoài phạm vi task này).',
    visualSource: '@wokwi/elements ssd1306-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-lcd1602',
    displayName: 'LCD 16x2',
    category: 'display',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VSS', 'VDD', 'V0', 'RS', 'RW', 'E', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'A', 'K'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-lcd1602',
    notes: 'Element thật @wokwi/elements, bản 16 chân song song (pins="full", mặc định).',
    visualSource: '@wokwi/elements lcd1602-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-lcd1602-i2c',
    displayName: 'LCD 16x2 I2C',
    category: 'display',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['GND', 'VCC', 'SDA', 'SCL'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-lcd1602 (thuộc tính pins="i2c")',
    notes: 'Dùng LẠI element thật wokwi-lcd1602, chỉ đổi thuộc tính pins sang "i2c" để hiện đúng 4 chân GND/VCC/SDA/SCL thay vì 16 chân song song.',
    visualSource: '@wokwi/elements lcd1602-element (pins="i2c")',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-neopixel',
    displayName: 'NeoPixel / LED Strip',
    category: 'actuator',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VDD', 'DOUT', 'VSS', 'DIN'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-neopixel',
    notes: '1 LED địa chỉ hoá — chỉ hiển thị, KHÔNG mô phỏng giao thức WS2812 timing thật (QEMU không đọc được).',
    visualSource: '@wokwi/elements neopixel-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-led-bar-graph',
    displayName: 'LED Bar Graph',
    category: 'actuator',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-led-bar-graph',
    notes: 'Element thật @wokwi/elements — 10 LED, mỗi LED 1 cặp Anode/Cathode riêng.',
    visualSource: '@wokwi/elements led-bar-graph-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-7segment',
    displayName: 'Seven Segment Display',
    category: 'actuator',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['COM.1', 'COM.2', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'DP'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-7segment',
    notes: 'Element thật @wokwi/elements, mặc định digits=1/pins="top" (1 chữ số). Toạ độ pin-dot tự tính tay theo đúng công thức pinXY()/pinPositions() trong source — nếu đổi digits/pins qua defaultProps khác mặc định, toạ độ sẽ lệch (chưa xử lý).',
    visualSource: '@wokwi/elements 7segment-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-stepper-motor',
    displayName: 'Stepper Motor',
    category: 'actuator',
    source: 'wokwi',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-stepper-motor',
    notes: 'Theo đúng yêu cầu "visual-only trước nếu chưa runtime" — element thật dùng để hiển thị đẹp, nhưng CỐ TÌNH không đăng ký pin/SupportedPins/wiring rule (giữ đúng ngữ nghĩa visual-only = không vào netlist).',
    visualSource: '@wokwi/elements stepper-motor-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-ili9341',
    displayName: 'TFT Display (ILI9341)',
    category: 'display',
    source: 'wokwi',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-ili9341',
    notes: 'Theo đúng yêu cầu "TFT display visual-only" — element thật để hiển thị đẹp, KHÔNG đăng ký pin/SupportedPins/wiring rule.',
    visualSource: '@wokwi/elements ili9341-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-dht11',
    displayName: 'DHT11',
    category: 'sensor',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'SDA', 'NC', 'GND'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP) — giống DHT22.'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-dht22 (dùng chung hình dáng — @wokwi/elements không có model DHT11 riêng)',
    notes: 'DHT11 và DHT22 dùng chung 1 element hiển thị thật (thư viện không phân biệt) — componentType/pins vẫn khai báo riêng để BOM/registry đúng tên thiết bị thật.',
    visualSource: '@wokwi/elements dht22-element (dùng lại hình dáng)',
    licenseNote: '@wokwi/elements — MIT license',
  },

  // --- Fallback card (tự vẽ) — runtime-supported (RelayModel.cs) ---
  {
    componentType: 'wokwi-relay-module',
    displayName: 'Relay Module',
    category: 'actuator',
    source: 'stem',
    supportLevel: 'runtime-supported',
    quantity: 1,
    pins: ['VCC', 'IN', 'GND', 'NO', 'COM', 'NC'],
    defaultProps: {},
    wiringRules: ['IN must reach an ESP32 GPIO.', 'VCC must connect to 3V3/5V.', 'GND must connect to ground.'],
    runtimeAdapter: 'RelayModel.cs (STEM.Application/UseCases/Simulation/Runners/Educational/Components/RelayModel.cs) — digitalWrite(IN) -> ON/OFF. NO/COM/NC là metadata, không mô phỏng chuyển mạch điện thật.',
    renderer: 'fallback-card',
    notes: 'Không có element @wokwi/elements cho relay module — card tự vẽ (icon + tên), tham khảo hình dáng module relay 1-kênh phổ biến.',
    visualSource: 'custom-svg (fallback-card, tham khảo hình dáng module relay Fritzing/thực tế)',
  },
  {
    componentType: 'wokwi-fan',
    displayName: 'Fan / DC Fan',
    category: 'actuator',
    source: 'stem',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['+', '-'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP) — tải thụ động, không có rule chặn nối trực tiếp GPIO như DC Motor (fan dòng nhỏ hơn).'],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Fallback card — không có element thật.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-water-pump',
    displayName: 'Water Pump / Mini Pump',
    category: 'actuator',
    source: 'stem',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['+', '-'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Fallback card — không có element thật.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-water-leak-sensor',
    displayName: 'Water Leak Sensor',
    category: 'sensor',
    source: 'stem',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'GND', 'S'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Fallback card — không có element thật.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-rain-sensor',
    displayName: 'Rain Sensor',
    category: 'sensor',
    source: 'stem',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'GND', 'DO', 'AO'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Fallback card — không có element thật.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-soil-moisture-sensor',
    displayName: 'Soil Moisture Sensor',
    category: 'sensor',
    source: 'stem',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'GND', 'DO', 'AO'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Fallback card — không có element thật.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-ir-obstacle-sensor',
    displayName: 'IR Obstacle Sensor',
    category: 'sensor',
    source: 'stem',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'GND', 'OUT'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Fallback card — không có element thật.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-line-tracking-sensor',
    displayName: 'Line Tracking Sensor',
    category: 'sensor',
    source: 'stem',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'GND', 'OUT'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Fallback card — không có element thật.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-color-sensor',
    displayName: 'Color Sensor',
    category: 'sensor',
    source: 'stem',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'GND', 'SDA', 'SCL'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Đơn giản hoá theo bản I2C (kiểu TCS34725), KHÔNG phải bản S0-S3 (TCS3200) — chọn để gọn số chân.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-vibration-sensor',
    displayName: 'Vibration Sensor / SW-420',
    category: 'sensor',
    source: 'stem',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'GND', 'OUT'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Fallback card tự vẽ — CỐ TÌNH không tái dùng tilt-switch-element thật của @wokwi (hình ống-bi-nghiêng khác hẳn module SW-420 PCB thật, tránh gây hiểu nhầm hình dáng).',
    visualSource: 'custom-svg (fallback-card)',
  },

  // --- Fallback card (tự vẽ) — visual-only (không có pin, không vào netlist) ---
  {
    componentType: 'wokwi-solenoid-valve',
    displayName: 'Solenoid / Valve',
    category: 'actuator',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only theo đúng yêu cầu.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-esp32-cam',
    displayName: 'ESP32-CAM',
    category: 'communication',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only — KHÔNG xử lý ảnh/AI thật (nằm ngoài phạm vi task này, xem "KHÔNG ĐƯỢC LÀM").',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-wifi-cloud-node',
    displayName: 'WiFi / Cloud Node',
    category: 'communication',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Biểu tượng minh hoạ trong sơ đồ hệ thống — KHÔNG kết nối cloud thật.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-dashboard-cloud',
    displayName: 'Dashboard / Cloud',
    category: 'communication',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Biểu tượng minh hoạ — KHÔNG có dashboard thật phía sau.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-robot-arm-base',
    displayName: 'Robot Arm Base',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only, linh kiện cơ khí thuần.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-gripper',
    displayName: 'Gripper',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only, linh kiện cơ khí thuần.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-conveyor-belt',
    displayName: 'Conveyor Belt',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only, linh kiện cơ khí thuần.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-sorting-box',
    displayName: 'Sorting Box',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only, linh kiện cơ khí thuần.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-ball',
    displayName: 'Ball',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only, đối tượng demo.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-fire-extinguisher',
    displayName: 'Fire Extinguisher',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only, đối tượng demo.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-water-tank',
    displayName: 'Water Tank',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only, đối tượng demo.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-drone-frame',
    displayName: 'Drone Frame',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only — KHÔNG mô phỏng vật lý bay (nằm ngoài phạm vi task này).',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-propeller',
    displayName: 'Propeller',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only, linh kiện cơ khí thuần.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-drone-motor',
    displayName: 'Drone Motor',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only — chưa có adapter runtime (khác DC Motor/L298N đã PASS).',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-stair-obstacle',
    displayName: 'Stair / Obstacle Block',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only, dùng bố trí địa hình demo.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-trash-object',
    displayName: 'Trash Object',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only, đối tượng demo.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    componentType: 'wokwi-delivery-item',
    displayName: 'Delivery Package / Item',
    category: 'mechanical',
    source: 'stem',
    supportLevel: 'visual-only',
    quantity: 1,
    pins: [],
    defaultProps: {},
    wiringRules: [],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Visual-only, đối tượng demo — khác wokwi-delivery-box (khoang chở hàng gắn cố định trên chassis Robot Delivery Kit).',
    visualSource: 'custom-svg (fallback-card)',
  },

  // --- Component mới (2026-07-28, task "pin/visual chuẩn theo thực tế") ---
  {
    componentType: 'wokwi-mpu6050',
    displayName: 'IMU MPU6050',
    category: 'sensor',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'GND', 'SCL', 'SDA', 'XDA', 'XCL', 'AD0', 'INT'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-mpu6050',
    notes: 'Element thật @wokwi/elements — 8 chân lấy trực tiếp từ pinInfo (không suy đoán). Chỉ hiển thị + wiring validation, chưa mô phỏng dữ liệu gia tốc/con quay hồi chuyển thật.',
    visualSource: '@wokwi/elements mpu6050-element',
    licenseNote: '@wokwi/elements — MIT license',
  },
  {
    componentType: 'wokwi-esc',
    displayName: 'ESC (Electronic Speed Controller)',
    category: 'actuator',
    source: 'stem',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['SIG', 'GND', 'BATT+', 'BATT-', 'OUT+', 'OUT-'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Không có element @wokwi/elements cho ESC — card tự vẽ. Wokwi không có part ESC tương ứng, xem "Wokwi không có" trong VIRTUAL_LAB_PLAN.md.',
    visualSource: 'custom-svg (fallback-card, tham khảo hình dáng ESC brushed-motor phổ biến)',
  },
  {
    componentType: 'wokwi-heating-element',
    displayName: 'Heating Element',
    category: 'actuator',
    source: 'stem',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['+', '-'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP) — tải điện trở thuần, giống Fan/Water Pump.'],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Không có element @wokwi/elements cho thanh nhiệt trở — card tự vẽ.',
    visualSource: 'custom-svg (fallback-card)',
  },
  {
    // PIN_UNVERIFIED (Verified External Component Assets milestone, Phase
    // 20/22) — VCC/GND/PO were never checked against any provider metadata,
    // datasheet, or manufacturer doc; also unresolved whether "pH Sensor"
    // should mean the raw probe (BNC electrode, not directly wireable) or
    // an interface/adapter board (VCC/GND/analog-signal — the thing that
    // actually gets wired). Do NOT promote to 'wiring-validation' without
    // real evidence settling both questions first.
    componentType: 'wokwi-ph-sensor',
    displayName: 'pH Sensor',
    category: 'sensor',
    source: 'stem',
    supportLevel: 'pin-unverified',
    quantity: 1,
    pins: ['VCC', 'GND', 'PO'],
    defaultProps: {},
    wiringRules: ['PIN_UNVERIFIED — no wiring rule until pin identity + geometry are evidenced.'],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'Không có element @wokwi/elements cho pH sensor — card tự vẽ. VCC/GND/PO là suy đoán theo tên gọi phổ biến, CHƯA có evidence xác minh (datasheet/manufacturer/provider) — xem PIN_UNVERIFIED.',
    visualSource: 'custom-svg (fallback-card, unverified pins)',
  },
  {
    componentType: 'wokwi-line-tracking-3ch',
    displayName: 'Line Tracking Sensor (3 kênh)',
    category: 'sensor',
    source: 'stem',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'GND', 'OUT1', 'OUT2', 'OUT3'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'BỔ SUNG bên cạnh wokwi-line-tracking-sensor (1 kênh) cũ, không thay thế — module TCRT5000 3 mắt phổ biến trong bài dò line nhiều mắt.',
    visualSource: 'custom-svg (fallback-card, tham khảo module TCRT5000 3-channel)',
  },
  {
    componentType: 'wokwi-line-tracking-5ch',
    displayName: 'Line Tracking Sensor (5 kênh)',
    category: 'sensor',
    source: 'stem',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['VCC', 'GND', 'OUT1', 'OUT2', 'OUT3', 'OUT4', 'OUT5'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'fallback-card',
    notes: 'BỔ SUNG bên cạnh wokwi-line-tracking-sensor (1 kênh) cũ, không thay thế — module TCRT5000 5 mắt, phân giải cao hơn bản 3 kênh.',
    visualSource: 'custom-svg (fallback-card, tham khảo module TCRT5000 5-channel)',
  },
  {
    componentType: 'wokwi-lcd2004',
    displayName: 'LCD 20x4 I2C',
    category: 'display',
    source: 'wokwi',
    supportLevel: 'wiring-validation',
    quantity: 1,
    pins: ['GND', 'VCC', 'SDA', 'SCL'],
    defaultProps: {},
    wiringRules: ['Structural-only (MVP).'],
    runtimeAdapter: null,
    renderer: 'wokwi-element:wokwi-lcd2004 (thuộc tính pins="i2c")',
    notes:
      'Dọn orphan (2026-07-28): BE SupportedPins từng có "wokwi-lcd2004" với pin sai (VCC/GND/SDA/SCL/A/K — không khớp source thật) nhưng FE/DB chưa từng nối tới. Xác nhận @wokwi/elements CÓ element thật (LCD2004Element extends LCD1602Element, numCols=20/numRows=4) — chọn hướng A (đồng bộ đầy đủ), sửa lại đúng 4 pin thật của pins="i2c" (không có A/K — đó là chân backlight chỉ tồn tại ở pins="full", không dùng ở bản 20x4 I2C).',
    visualSource: '@wokwi/elements lcd2004-element (subclass lcd1602-element)',
    licenseNote: '@wokwi/elements — MIT license',
  },
];

export function getExtendedLibraryEntry(componentType: string): ComponentRegistryEntry | undefined {
  return EXTENDED_COMPONENT_LIBRARY.find((item) => item.componentType === componentType);
}

// ===== Cần sửa thủ công khi thêm component mới (chưa tự động hoá) =====
// 1. BE: SupportedPins trong VirtualLabDiagramService.cs (nếu cần wiring
//    validation) + ValidateComponentWiring() nếu cần rule riêng ngoài
//    "structural only" mặc định.
// 2. BE: ComponentGlueRegistry — thêm dòng Supported=true (qua migration
//    HasData trong StemDbContext.cs, hoặc DB thật nếu dotnet ef tooling còn
//    lỗi provider — xem SQLScripts/AddRobotDeliveryKitComponentGlueRegistry.sql).
// 3. FE: pinMaps.ts — thêm PinCoord map nếu component có pin.
// 4. FE: CircuitCanvas.tsx — normalizeComponentType() + nhánh render (element
//    thật nếu có trong @wokwi/elements, hoặc thêm vào ROBOT_KIT_FALLBACK_CARDS).
// 5. FE: CircuitBuilderTeacherMode.tsx — COMPONENT_REFERENCES (icon/summary/
//    pins/sample/badge cho palette) + normalizeComponentType() riêng của file
//    này (dùng underscore, khác CircuitCanvas.tsx dùng hyphen).
// 6. FE: robotKitComponents.ts (file này) — entry cho BOM panel + tài liệu.
// 7. Nếu cần runtime thật: BE thêm XxxModel.cs (theo mẫu LedModel/BuzzerModel/
//    L298nModel) + nối vào QemuEsp32Runner.ComponentIndex, FE thêm case xử lý
//    event trong LabSandboxPage.tsx + StudentSandboxViewer.tsx.
//
// Đây CHÍNH LÀ backlog "codegen 1 định nghĩa duy nhất" — hiện tại registry
// này là tài liệu/nguồn tham chiếu tập trung, CHƯA phải cơ chế tự sinh code
// ở 7 điểm trên. Rủi ro thật: quên 1 trong 7 bước trên khi thêm component mới
// (đã từng xảy ra với type "dht22" ngắn không có tiền tố "wokwi-", xem
// SQLScripts/FixVirtualLabComponentTypeMismatch.sql).
