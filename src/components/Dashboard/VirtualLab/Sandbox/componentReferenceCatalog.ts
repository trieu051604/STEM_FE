// Nguồn dữ liệu DUY NHẤT cho "linh kiện reference" (label/icon/pins/badge/...)
// dùng chung bởi CircuitBuilderTeacherMode.tsx (sidebar cũ) và
// ComponentPalettePopup.tsx (popup mới, mở qua nút "+" trên canvas) — tách ra
// từ CircuitBuilderTeacherMode.tsx (2026-07-27) để không hardcode trùng lặp
// dữ liệu linh kiện ở 2 nơi (đúng yêu cầu "không hardcode trùng lặp lung tung
// nếu đã có registry"). Đây là bảng HIỂN THỊ (label/icon/badge cho UI) —
// KHÔNG phải Component Support Matrix chính thức (đó là robotKitComponents.ts,
// nguồn sự thật cho supportLevel/pins/wiringRules/runtimeAdapter thật). Badge
// ở đây PHẢI khớp đúng supportLevel thật trong robotKitComponents.ts/BE —
// không tự suy đoán ở đây.
import type { Cpu } from 'lucide-react';
import {
  Antenna,
  BatteryFull,
  Bot,
  Boxes,
  Camera,
  Circle,
  CircuitBoard,
  Cloud,
  CloudRain,
  Container,
  Disc,
  Disc3,
  Droplets,
  Fan,
  Flame,
  FlaskConical,
  Gauge,
  Grid3x3,
  Hand,
  Hash,
  Keyboard,
  Layers,
  Lightbulb,
  MonitorSmartphone,
  Move,
  Package,
  Palette,
  Plane,
  Radio,
  RectangleHorizontal,
  RotateCw,
  Route,
  ScanLine,
  Settings2,
  SlidersHorizontal,
  Sprout,
  Sun,
  Thermometer,
  ToggleLeft,
  Tv,
  Vibrate,
  Volume2,
  Weight,
  Wifi,
  Wind,
  Zap,
} from 'lucide-react';

export type ComponentIcon = typeof Cpu;

export type PaletteCategory =
  | 'Basic'
  | 'Display'
  | 'Input'
  | 'Sensor'
  | 'Output/Actuator'
  | 'Robot Kit'
  | 'Mechanical'
  | 'BOM/Accessories';

export interface ComponentReference {
  label: string;
  summary: string;
  role: string;
  pins: string[];
  sample: string;
  icon: ComponentIcon;
  iconClassName: string;
  // Optional — chỉ set cho nhóm linh kiện mới (Robot giao hàng mini) để tránh
  // phải tự xác nhận lại độ chính xác runtime của 7 linh kiện cũ (không thuộc
  // phạm vi task này). "Mô phỏng được" | "Kiểm tra nối dây" | "Chỉ hiển thị" |
  // "Phụ kiện BOM" — xem PHẦN 7 trong yêu cầu gốc.
  badge?: string;
}

export const COMPONENT_REFERENCES: Record<string, ComponentReference> = {
  led: {
    label: 'LED',
    summary: '2 chân phân cực: A và C',
    role: 'Phát sáng khi dòng đi đúng chiều.',
    pins: ['A', 'C'],
    sample: 'D13 -> A, C -> GND',
    icon: Lightbulb,
    iconClassName: 'bg-rose-50 text-rose-600',
    // Runtime-supported thật (LedModel.cs) — xem LEGACY_COMPONENTS_SUMMARY
    // trong robotKitComponents.ts. Trước task Component Library (2026-07-27)
    // field này chưa từng được set cho 7 linh kiện gốc — badge chỉ âm thầm
    // không hiện gì (không sai, nhưng thiếu) thay vì "Mô phỏng được" đúng như
    // Yêu cầu 6 (LED/Buzzer phải ghi đúng).
    badge: 'Mô phỏng được',
  },
  resistor: {
    label: 'Điện trở',
    summary: '2 chân không phân cực',
    role: 'Giới hạn dòng, thường đặt nối tiếp với LED.',
    pins: ['1', '2'],
    sample: 'D13 -> 1, 2 -> LED A',
    icon: Zap,
    iconClassName: 'bg-amber-50 text-amber-700',
    badge: 'Kiểm tra nối dây',
  },
  push_button: {
    label: 'Push Button',
    summary: 'Dùng cặp 1.l và 2.r',
    role: 'Công tắc tạm thời cho tín hiệu digital.',
    pins: ['1.l', '2.r'],
    sample: 'D2 -> 1.l, 2.r -> GND',
    icon: ToggleLeft,
    iconClassName: 'bg-sky-50 text-sky-700',
    badge: 'Kiểm tra nối dây',
  },
  buzzer: {
    label: 'Buzzer',
    summary: '2 chân: tín hiệu và GND',
    role: 'Phát âm thanh bằng HIGH/LOW hoặc PWM.',
    pins: ['1 (+)', '2 (-)'],
    sample: 'D9 -> 1, 2 -> GND',
    icon: Volume2,
    iconClassName: 'bg-violet-50 text-violet-700',
    // Runtime-supported thật (BuzzerModel.cs).
    badge: 'Mô phỏng được',
  },
  potentiometer: {
    label: 'Biến trở',
    summary: '3 chân: VCC, SIG, GND',
    role: 'Tạo giá trị analog thay đổi liên tục.',
    pins: ['VCC', 'SIG', 'GND'],
    sample: '5V -> VCC, SIG -> A0',
    icon: SlidersHorizontal,
    iconClassName: 'bg-emerald-50 text-emerald-700',
    badge: 'Kiểm tra nối dây',
  },
  servo: {
    label: 'Servo',
    summary: '3 chân: GND, V+, PWM',
    role: 'Điều khiển góc quay qua chân PWM.',
    pins: ['GND', 'V+', 'PWM'],
    sample: '5V -> V+, PWM -> D9',
    icon: RotateCw,
    iconClassName: 'bg-orange-50 text-orange-700',
    badge: 'Kiểm tra nối dây',
  },
  dht22: {
    label: 'Cảm biến DHT22',
    summary: '4 chân: VCC, SDA, NC, GND',
    role: 'Đo nhiệt độ/độ ẩm, trả dữ liệu qua chân SDA.',
    pins: ['VCC', 'SDA', 'NC', 'GND'],
    sample: '3V3 -> VCC, SDA -> D4, GND -> GND',
    icon: Thermometer,
    iconClassName: 'bg-cyan-50 text-cyan-700',
    badge: 'Kiểm tra nối dây',
  },

  // ===== Robot giao hàng mini =====
  hc_sr04: {
    label: 'HC-SR04 Ultrasonic Sensor',
    summary: '4 chân: VCC, TRIG, ECHO, GND',
    role: 'Đo khoảng cách bằng sóng siêu âm.',
    pins: ['VCC', 'TRIG', 'ECHO', 'GND'],
    sample: '5V -> VCC, TRIG -> GPIO, ECHO -> GPIO, GND -> GND',
    icon: Gauge,
    iconClassName: 'bg-cyan-50 text-cyan-700',
    badge: 'Kiểm tra nối dây',
  },
  l298n: {
    label: 'L298N Motor Driver',
    summary: '13 chân: IN1-4, ENA/ENB, OUT1-4, VIN, GND, 5V',
    role: 'Điều khiển chiều/tốc độ 2 động cơ DC từ tín hiệu GPIO — trạng thái forward/backward/stopped/brake được suy ra THẬT từ QEMU (đọc digitalWrite IN1-4), hiện ngay trên card. Tên chân đã đối chiếu với components101.com (chuẩn breakout L298N phổ biến) — hình minh hoạ là sơ đồ khối chung, KHÔNG phải ảnh linh kiện thật (không có part L298N/relay module nào trong kho Fritzing chính thức đang dùng).',
    pins: ['IN1', 'IN2', 'IN3', 'IN4', 'ENA', 'ENB', 'OUT1', 'OUT2', 'OUT3', 'OUT4', 'VIN', 'GND', '5V'],
    sample: 'GPIO -> IN1..IN4, OUT1/2 -> Motor A, OUT3/4 -> Motor B, VIN -> Battery (+), GND -> chung',
    icon: CircuitBoard,
    iconClassName: 'bg-purple-50 text-purple-700',
    badge: 'Mô phỏng được',
  },
  dc_motor: {
    label: 'DC Geared Motor / TT Motor',
    summary: '2 chân: terminal1, terminal2',
    role: 'Động cơ bánh xe — PHẢI cấp nguồn qua OUT của L298N, không nối thẳng ESP32. Trạng thái quay hiện trên card L298N tương ứng (Motor A/B), vì động cơ chỉ theo tín hiệu điều khiển của L298N.',
    pins: ['terminal1', 'terminal2'],
    sample: 'terminal1/2 -> L298N OUT1/2 (hoặc OUT3/4)',
    icon: RotateCw,
    iconClassName: 'bg-orange-50 text-orange-700',
    badge: 'Mô phỏng được',
  },
  battery_pack: {
    label: 'Battery Pack 7.4V (2x18650)',
    summary: '2 cực: + và -',
    role: 'Nguồn cấp cho L298N — không mô phỏng điện áp thật.',
    pins: ['+', '-'],
    sample: '+ -> L298N VIN, - -> GND chung',
    icon: BatteryFull,
    iconClassName: 'bg-lime-50 text-lime-700',
    badge: 'Kiểm tra nối dây',
  },
  power_switch: {
    label: 'Power Switch',
    summary: '2 chân: IN, OUT',
    role: 'Ngắt/nối nguồn giữa Battery Pack và L298N.',
    pins: ['IN', 'OUT'],
    sample: 'Battery (+) -> IN, OUT -> L298N VIN',
    icon: ToggleLeft,
    iconClassName: 'bg-sky-50 text-sky-700',
    badge: 'Kiểm tra nối dây',
  },
  robot_wheel: {
    label: 'Robot Wheel',
    summary: 'Linh kiện cơ khí, không có chân điện',
    role: 'Lắp vào trục DC Motor — chỉ hiển thị trong sơ đồ lắp ráp.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Circle,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Chỉ hiển thị',
  },
  caster_wheel: {
    label: 'Caster Wheel',
    summary: 'Linh kiện cơ khí, không có chân điện',
    role: 'Bánh xe tự lựa đỡ phía sau chassis — chỉ hiển thị.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Disc,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Chỉ hiển thị',
  },
  robot_chassis: {
    label: 'Robot Chassis',
    summary: 'Linh kiện cơ khí, không có chân điện',
    role: 'Khung đế gắn toàn bộ linh kiện — chỉ hiển thị.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: RectangleHorizontal,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Chỉ hiển thị',
  },
  breadboard: {
    label: 'Breadboard',
    summary: 'Chưa mô phỏng netlist breadboard thật',
    role: 'Dùng để tham khảo bố trí dây — nối dây thật vẫn qua canvas như bình thường.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Grid3x3,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Chỉ hiển thị',
  },
  delivery_box: {
    label: 'Mini Delivery Box',
    summary: 'Linh kiện cơ khí, không có chân điện',
    role: 'Khoang chở hàng gắn trên chassis — chỉ hiển thị.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Package,
    iconClassName: 'bg-amber-50 text-amber-700',
    badge: 'Chỉ hiển thị',
  },

  // ===== Ngoài Robot giao hàng mini — nhóm "output-easy" mở rộng thêm =====
  rgb_led: {
    label: 'RGB LED',
    summary: '4 chân: R, G, B, COM',
    role: 'Mỗi kênh bật/tắt độc lập qua digitalWrite — không có độ sáng trung gian (QEMU không đọc PWM).',
    pins: ['R', 'G', 'B', 'COM'],
    sample: 'GPIO -> R/G/B, COM -> GND (common-cathode) hoặc 5V (common-anode)',
    icon: Lightbulb,
    iconClassName: 'bg-pink-50 text-pink-600',
    badge: 'Mô phỏng được',
  },

  // ===== Thư viện linh kiện mở rộng (Component Library) — không thuộc Robot
  // giao hàng mini, phục vụ các bài demo khác. Mọi item wiring-validation ở
  // đây dừng ở mức "structural only" phía BE (không có ValidateComponentWiring
  // branch riêng, giống Power Switch) — badge phản ánh đúng mức hỗ trợ thật,
  // KHÔNG có item nào trong nhóm này là "Mô phỏng được" (không có runtime
  // adapter mới trong task này). =====

  // --- Real @wokwi/elements — wiring-validation ---
  flame_sensor: {
    label: 'Flame Sensor',
    summary: '4 chân: VCC, GND, DOUT, AOUT',
    role: 'Phát hiện ngọn lửa qua tia hồng ngoại — dùng để demo cảnh báo cháy.',
    pins: ['VCC', 'GND', 'DOUT', 'AOUT'],
    sample: '5V -> VCC, GND -> GND, DOUT -> GPIO',
    icon: Flame,
    iconClassName: 'bg-orange-50 text-orange-700',
    badge: 'Kiểm tra nối dây',
  },
  gas_sensor: {
    label: 'MQ Gas Sensor',
    summary: '4 chân: AOUT, DOUT, GND, VCC',
    role: 'Đo nồng độ khí gas/khói (kiểu module MQ-2/MQ-135).',
    pins: ['AOUT', 'DOUT', 'GND', 'VCC'],
    sample: '5V -> VCC, GND -> GND, AOUT -> GPIO analog',
    icon: Wind,
    iconClassName: 'bg-lime-50 text-lime-700',
    badge: 'Kiểm tra nối dây',
  },
  pir_motion_sensor: {
    label: 'PIR Motion Sensor',
    summary: '3 chân: VCC, OUT, GND',
    role: 'Phát hiện chuyển động bằng hồng ngoại thụ động.',
    pins: ['VCC', 'OUT', 'GND'],
    sample: '5V -> VCC, OUT -> GPIO, GND -> GND',
    icon: Radio,
    iconClassName: 'bg-amber-50 text-amber-700',
    badge: 'Kiểm tra nối dây',
  },
  photoresistor_sensor: {
    label: 'Light Sensor / LDR',
    summary: '4 chân: VCC, GND, DO, AO',
    role: 'Đo cường độ ánh sáng qua quang trở.',
    pins: ['VCC', 'GND', 'DO', 'AO'],
    sample: '5V -> VCC, GND -> GND, AO -> GPIO analog',
    icon: Sun,
    iconClassName: 'bg-yellow-50 text-yellow-700',
    badge: 'Kiểm tra nối dây',
  },
  ntc_temperature_sensor: {
    label: 'Temperature Sensor (NTC)',
    summary: '3 chân: GND, VCC, OUT',
    role: 'Đo nhiệt độ qua nhiệt điện trở NTC.',
    pins: ['GND', 'VCC', 'OUT'],
    sample: '5V -> VCC, GND -> GND, OUT -> GPIO analog',
    icon: Thermometer,
    iconClassName: 'bg-cyan-50 text-cyan-700',
    badge: 'Kiểm tra nối dây',
  },
  hx711: {
    label: 'Load Cell HX711',
    summary: '4 chân: VCC, DT, SCK, GND',
    role: 'Bộ khuếch đại tín hiệu cảm biến cân nặng (load cell).',
    pins: ['VCC', 'DT', 'SCK', 'GND'],
    sample: '5V -> VCC, GND -> GND, DT/SCK -> GPIO',
    icon: Weight,
    iconClassName: 'bg-stone-50 text-stone-700',
    badge: 'Kiểm tra nối dây',
  },
  ir_receiver: {
    label: 'IR Receiver',
    summary: '3 chân: GND, VCC, DAT',
    role: 'Nhận tín hiệu hồng ngoại từ remote.',
    pins: ['GND', 'VCC', 'DAT'],
    sample: '5V -> VCC, GND -> GND, DAT -> GPIO',
    icon: Antenna,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Kiểm tra nối dây',
  },
  membrane_keypad: {
    label: 'Keypad (4x4)',
    summary: '8 chân: R1-4, C1-4',
    role: 'Bàn phím màng, quét theo ma trận hàng/cột.',
    pins: ['R1', 'R2', 'R3', 'R4', 'C1', 'C2', 'C3', 'C4'],
    sample: 'R1-4/C1-4 -> GPIO (8 chân)',
    icon: Keyboard,
    iconClassName: 'bg-violet-50 text-violet-700',
    badge: 'Kiểm tra nối dây',
  },
  ssd1306: {
    label: 'OLED SSD1306',
    summary: '8 chân: DATA(SDA), CLK(SCL), DC, RST, CS, 3V3, VIN, GND',
    role: 'Màn hình OLED nhỏ, giao tiếp I2C/SPI.',
    pins: ['DATA', 'CLK', 'DC', 'RST', 'CS', '3V3', 'VIN', 'GND'],
    sample: 'DATA -> SDA, CLK -> SCL, VIN -> 5V, GND -> GND',
    icon: MonitorSmartphone,
    iconClassName: 'bg-sky-50 text-sky-700',
    badge: 'Kiểm tra nối dây',
  },
  lcd1602: {
    label: 'LCD 16x2',
    summary: '16 chân song song: VSS, VDD, V0, RS, RW, E, D0-7, A, K',
    role: 'Màn hình LCD ký tự 16x2, giao tiếp song song 4/8-bit.',
    pins: ['VSS', 'VDD', 'V0', 'RS', 'RW', 'E', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'A', 'K'],
    sample: 'VDD -> 5V, VSS -> GND, RS/E/D4-7 -> GPIO',
    icon: MonitorSmartphone,
    iconClassName: 'bg-emerald-50 text-emerald-700',
    badge: 'Kiểm tra nối dây',
  },
  lcd1602_i2c: {
    label: 'LCD 16x2 I2C',
    summary: '4 chân: GND, VCC, SDA, SCL',
    role: 'LCD 16x2 gắn module I2C — chỉ cần 4 dây thay vì 16.',
    pins: ['GND', 'VCC', 'SDA', 'SCL'],
    sample: 'VCC -> 5V, GND -> GND, SDA/SCL -> GPIO I2C',
    icon: MonitorSmartphone,
    iconClassName: 'bg-emerald-50 text-emerald-700',
    badge: 'Kiểm tra nối dây',
  },
  neopixel: {
    label: 'NeoPixel / LED Strip',
    summary: '4 chân: VDD, DOUT, VSS, DIN',
    role: 'Dải LED địa chỉ hoá — chỉ mô phỏng hiển thị, KHÔNG mô phỏng dữ liệu WS2812 thật (QEMU không đọc được giao thức timing chính xác).',
    pins: ['VDD', 'DOUT', 'VSS', 'DIN'],
    sample: '5V -> VDD, GND -> VSS, DIN -> GPIO',
    icon: Lightbulb,
    iconClassName: 'bg-fuchsia-50 text-fuchsia-700',
    badge: 'Kiểm tra nối dây',
  },
  led_bar_graph: {
    label: 'LED Bar Graph',
    summary: '20 chân: A1-10 (Anode), C1-10 (Cathode)',
    role: '10 LED xếp hàng, mỗi LED 1 cặp Anode/Cathode riêng.',
    pins: ['A1..A10', 'C1..C10'],
    sample: 'A1-10 -> GPIO, C1-10 -> GND (qua điện trở)',
    icon: Gauge,
    iconClassName: 'bg-rose-50 text-rose-600',
    badge: 'Kiểm tra nối dây',
  },
  '7segment': {
    label: 'Seven Segment Display',
    summary: '10 chân: COM.1/COM.2, A-G, DP',
    role: 'Hiển thị 1 chữ số qua 7 đoạn LED + dấu chấm.',
    pins: ['COM.1', 'COM.2', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'DP'],
    sample: 'A-G/DP -> GPIO (qua điện trở), COM -> GND/5V',
    icon: Hash,
    iconClassName: 'bg-red-50 text-red-600',
    badge: 'Kiểm tra nối dây',
  },
  stepper_motor: {
    label: 'Stepper Motor',
    summary: '4 chân: A-, A+, B+, B-',
    role: 'Động cơ bước — CHỈ hiển thị, chưa có wiring validation/runtime (cần driver kiểu ULN2003/A4988 + logic riêng, để bản sau).',
    pins: [],
    sample: 'Không cần nối dây trong bản này',
    icon: Move,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Chỉ hiển thị',
  },
  ili9341: {
    label: 'TFT Display (ILI9341)',
    summary: 'Màn hình màu SPI — chỉ hiển thị',
    role: 'Màn hình TFT màu — CHỈ hiển thị, chưa wiring validation/runtime.',
    pins: [],
    sample: 'Không cần nối dây trong bản này',
    icon: Tv,
    iconClassName: 'bg-indigo-50 text-indigo-700',
    badge: 'Chỉ hiển thị',
  },
  dht11: {
    label: 'DHT11',
    summary: '4 chân: VCC, SDA, NC, GND',
    role: 'Đo nhiệt độ/độ ẩm (độ chính xác thấp hơn DHT22) — dùng chung hình dáng hiển thị với DHT22 (thư viện không có model riêng).',
    pins: ['VCC', 'SDA', 'NC', 'GND'],
    sample: '3V3 -> VCC, SDA -> GPIO, GND -> GND',
    icon: Thermometer,
    iconClassName: 'bg-cyan-50 text-cyan-700',
    badge: 'Kiểm tra nối dây',
  },

  // --- Fallback card — runtime-supported (RelayModel.cs, IN -> ON/OFF) ---
  relay_module: {
    label: 'Relay Module',
    summary: '6 chân: VCC, IN, GND, NO, COM, NC',
    role: 'Đóng/ngắt tải điện áp cao qua tín hiệu điều khiển digital. Tên chân đã đối chiếu với lastminuteengineers.com/circuitdigest.com (chuẩn module relay 1 kênh phổ biến) — hình minh hoạ là sơ đồ khối chung, KHÔNG phải ảnh linh kiện thật.',
    pins: ['VCC', 'IN', 'GND', 'NO', 'COM', 'NC'],
    sample: '5V -> VCC, GND -> GND, IN -> GPIO',
    icon: Settings2,
    iconClassName: 'bg-amber-50 text-amber-700',
    badge: 'Mô phỏng được',
  },
  fan: {
    label: 'Fan / DC Fan',
    summary: '2 cực: + và -',
    role: 'Quạt DC nhỏ — tải thụ động, thường điều khiển qua Relay/MOSFET.',
    pins: ['+', '-'],
    sample: '+ -> nguồn qua Relay, - -> GND',
    icon: Fan,
    iconClassName: 'bg-sky-50 text-sky-700',
    badge: 'Kiểm tra nối dây',
  },
  water_pump: {
    label: 'Water Pump / Mini Pump',
    summary: '2 cực: + và -',
    role: 'Bơm nước mini — tải thụ động, thường điều khiển qua Relay.',
    pins: ['+', '-'],
    sample: '+ -> nguồn qua Relay, - -> GND',
    icon: Droplets,
    iconClassName: 'bg-blue-50 text-blue-700',
    badge: 'Kiểm tra nối dây',
  },
  water_leak_sensor: {
    label: 'Water Leak Sensor',
    summary: '3 chân: VCC, GND, S',
    role: 'Phát hiện rò rỉ nước qua 2 dải điện cực.',
    pins: ['VCC', 'GND', 'S'],
    sample: '5V -> VCC, GND -> GND, S -> GPIO',
    icon: Droplets,
    iconClassName: 'bg-blue-50 text-blue-700',
    badge: 'Kiểm tra nối dây',
  },
  rain_sensor: {
    label: 'Rain Sensor',
    summary: '4 chân: VCC, GND, DO, AO',
    role: 'Phát hiện mưa qua tấm cảm biến độ dẫn điện.',
    pins: ['VCC', 'GND', 'DO', 'AO'],
    sample: '5V -> VCC, GND -> GND, DO -> GPIO',
    icon: CloudRain,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Kiểm tra nối dây',
  },
  // Pin SEMANTICS verified (VCC/GND/DO/AO, cross-vendor corroborated YL-69
  // module convention) + dedicated wiring rule đã có, nhưng pin GEOMETRY
  // (vị trí thật trên hình) CHƯA xác minh — chưa tìm được visual/CAD asset
  // thật khớp đúng module này (xem component-compatibility.json
  // wokwi-soil-moisture-sensor). Badge vẫn phải trung thực theo Phase 17.
  soil_moisture_sensor: {
    label: 'Soil Moisture Sensor',
    summary: '4 chân: VCC, GND, DO, AO',
    role: 'Đo độ ẩm đất qua 2 đầu dò.',
    pins: ['VCC', 'GND', 'DO', 'AO'],
    sample: '5V -> VCC, GND -> GND, AO -> GPIO analog',
    icon: Sprout,
    iconClassName: 'bg-green-50 text-green-700',
    badge: 'Chưa xác minh sơ đồ chân',
  },
  ir_obstacle_sensor: {
    label: 'IR Obstacle Sensor',
    summary: '3 chân: VCC, GND, OUT',
    role: 'Phát hiện vật cản qua hồng ngoại phản xạ.',
    pins: ['VCC', 'GND', 'OUT'],
    sample: '5V -> VCC, GND -> GND, OUT -> GPIO',
    icon: ScanLine,
    iconClassName: 'bg-orange-50 text-orange-700',
    badge: 'Kiểm tra nối dây',
  },
  line_tracking_sensor: {
    label: 'Line Tracking Sensor',
    summary: '3 chân: VCC, GND, OUT',
    role: 'Dò đường line đen/trắng cho robot dò line.',
    pins: ['VCC', 'GND', 'OUT'],
    sample: '5V -> VCC, GND -> GND, OUT -> GPIO',
    icon: Route,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Kiểm tra nối dây',
  },
  color_sensor: {
    label: 'Color Sensor',
    summary: '4 chân: VCC, GND, SDA, SCL (kiểu I2C, đơn giản hoá từ TCS34725)',
    role: 'Nhận diện màu sắc — đơn giản hoá theo bản I2C, không phải bản S0-S3 (TCS3200).',
    pins: ['VCC', 'GND', 'SDA', 'SCL'],
    sample: '5V -> VCC, GND -> GND, SDA/SCL -> GPIO I2C',
    icon: Palette,
    iconClassName: 'bg-pink-50 text-pink-600',
    badge: 'Kiểm tra nối dây',
  },
  vibration_sensor: {
    label: 'Vibration Sensor / SW-420',
    summary: '3 chân: VCC, GND, OUT',
    role: 'Phát hiện rung động cơ học.',
    pins: ['VCC', 'GND', 'OUT'],
    sample: '5V -> VCC, GND -> GND, OUT -> GPIO',
    icon: Vibrate,
    iconClassName: 'bg-amber-50 text-amber-700',
    badge: 'Kiểm tra nối dây',
  },

  // --- Fallback card — visual-only (không có pin, không vào netlist) ---
  solenoid_valve: {
    label: 'Solenoid / Valve',
    summary: 'Linh kiện cơ khí, chỉ hiển thị',
    role: 'Van điện từ — chỉ hiển thị trong sơ đồ, chưa wiring validation.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Settings2,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Chỉ hiển thị',
  },
  esp32_cam: {
    label: 'ESP32-CAM',
    summary: 'Chỉ hiển thị — chưa mô phỏng camera/AI thật',
    role: 'Module ESP32 tích hợp camera — chỉ hiển thị, KHÔNG xử lý ảnh/AI thật.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Camera,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Chỉ hiển thị',
  },
  wifi_cloud_node: {
    label: 'WiFi / Cloud Node',
    summary: 'Biểu tượng minh hoạ kết nối cloud — chỉ hiển thị',
    role: 'Đại diện cho 1 node/thiết bị kết nối WiFi/Cloud trong sơ đồ hệ thống — KHÔNG kết nối cloud thật.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Wifi,
    iconClassName: 'bg-sky-50 text-sky-700',
    badge: 'Chỉ hiển thị',
  },
  dashboard_cloud: {
    label: 'Dashboard / Cloud',
    summary: 'Biểu tượng minh hoạ dashboard giám sát — chỉ hiển thị',
    role: 'Đại diện cho dashboard/cloud service trong sơ đồ hệ thống — KHÔNG có dashboard thật phía sau.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Cloud,
    iconClassName: 'bg-sky-50 text-sky-700',
    badge: 'Chỉ hiển thị',
  },
  robot_arm_base: {
    label: 'Robot Arm Base',
    summary: 'Linh kiện cơ khí, chỉ hiển thị',
    role: 'Đế xoay của cánh tay robot — chỉ hiển thị.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Bot,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Chỉ hiển thị',
  },
  gripper: {
    label: 'Gripper',
    summary: 'Linh kiện cơ khí, chỉ hiển thị',
    role: 'Bộ kẹp gắn cuối cánh tay robot — chỉ hiển thị.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Hand,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Chỉ hiển thị',
  },
  conveyor_belt: {
    label: 'Conveyor Belt',
    summary: 'Linh kiện cơ khí, chỉ hiển thị',
    role: 'Băng chuyền — chỉ hiển thị trong sơ đồ bố trí.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Layers,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Chỉ hiển thị',
  },
  sorting_box: {
    label: 'Sorting Box',
    summary: 'Linh kiện cơ khí, chỉ hiển thị',
    role: 'Khay/hộp phân loại — chỉ hiển thị.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Boxes,
    iconClassName: 'bg-amber-50 text-amber-700',
    badge: 'Chỉ hiển thị',
  },
  ball: {
    label: 'Ball',
    summary: 'Đối tượng minh hoạ, chỉ hiển thị',
    role: 'Quả bóng — vật thể demo cho robot phân loại/nhặt vật.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Circle,
    iconClassName: 'bg-rose-50 text-rose-600',
    badge: 'Chỉ hiển thị',
  },
  fire_extinguisher: {
    label: 'Fire Extinguisher',
    summary: 'Đối tượng minh hoạ, chỉ hiển thị',
    role: 'Bình chữa cháy — vật thể demo cho bài an toàn cháy nổ.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Container,
    iconClassName: 'bg-red-50 text-red-600',
    badge: 'Chỉ hiển thị',
  },
  water_tank: {
    label: 'Water Tank',
    summary: 'Đối tượng minh hoạ, chỉ hiển thị',
    role: 'Bồn chứa nước — vật thể demo cho bài bơm nước/mực nước.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Container,
    iconClassName: 'bg-blue-50 text-blue-700',
    badge: 'Chỉ hiển thị',
  },
  drone_frame: {
    label: 'Drone Frame',
    summary: 'Linh kiện cơ khí, chỉ hiển thị',
    role: 'Khung drone — chỉ hiển thị, KHÔNG mô phỏng vật lý bay.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Plane,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Chỉ hiển thị',
  },
  propeller: {
    label: 'Propeller',
    summary: 'Linh kiện cơ khí, chỉ hiển thị',
    role: 'Cánh quạt drone — chỉ hiển thị.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Disc3,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Chỉ hiển thị',
  },
  drone_motor: {
    label: 'Drone Motor',
    summary: 'Linh kiện cơ khí, chỉ hiển thị',
    role: 'Động cơ brushless của drone — chỉ hiển thị, chưa có adapter runtime.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: RotateCw,
    iconClassName: 'bg-orange-50 text-orange-700',
    badge: 'Chỉ hiển thị',
  },
  stair_obstacle: {
    label: 'Stair / Obstacle Block',
    summary: 'Linh kiện cơ khí, chỉ hiển thị',
    role: 'Khối bậc thang/vật cản — dùng bố trí địa hình demo.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Layers,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Chỉ hiển thị',
  },
  trash_object: {
    label: 'Trash Object',
    summary: 'Đối tượng minh hoạ, chỉ hiển thị',
    role: 'Vật thể rác — demo cho robot dọn rác/phân loại.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Boxes,
    iconClassName: 'bg-stone-50 text-stone-700',
    badge: 'Chỉ hiển thị',
  },
  delivery_item: {
    label: 'Delivery Package / Item',
    summary: 'Đối tượng minh hoạ, chỉ hiển thị',
    role: 'Gói hàng/vật phẩm demo cho robot giao hàng/phân loại.',
    pins: [],
    sample: 'Không cần nối dây',
    icon: Package,
    iconClassName: 'bg-amber-50 text-amber-700',
    badge: 'Chỉ hiển thị',
  },

  // ===== Component mới (2026-07-28, task "pin/visual chuẩn theo thực tế") =====
  mpu6050: {
    label: 'IMU MPU6050',
    summary: '8 chân: VCC, GND, SCL, SDA, XDA, XCL, AD0, INT',
    role: 'Cảm biến gia tốc + con quay hồi chuyển 6 trục, giao tiếp I2C.',
    pins: ['VCC', 'GND', 'SCL', 'SDA', 'XDA', 'XCL', 'AD0', 'INT'],
    sample: 'VCC -> 3V3, GND -> GND, SDA/SCL -> GPIO I2C',
    icon: Gauge,
    iconClassName: 'bg-emerald-50 text-emerald-700',
    badge: 'Kiểm tra nối dây',
  },
  esc: {
    label: 'ESC (Electronic Speed Controller)',
    summary: '6 chân: SIG, GND, BATT+, BATT-, OUT+, OUT-',
    role: 'Bộ điều tốc động cơ — nhận tín hiệu PWM từ ESP32, cấp nguồn pin cho động cơ.',
    pins: ['SIG', 'GND', 'BATT+', 'BATT-', 'OUT+', 'OUT-'],
    sample: 'SIG -> GPIO PWM, BATT+/- -> Battery Pack, OUT+/- -> Motor',
    icon: Zap,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Kiểm tra nối dây',
  },
  heating_element: {
    label: 'Heating Element',
    summary: '2 cực: + và -',
    role: 'Thanh nhiệt trở — tải điện trở thuần, thường điều khiển qua Relay.',
    pins: ['+', '-'],
    sample: '+ -> nguồn qua Relay, - -> GND',
    icon: Thermometer,
    iconClassName: 'bg-orange-50 text-orange-700',
    badge: 'Kiểm tra nối dây',
  },
  // PIN_UNVERIFIED — xem robotKitComponents.ts (supportLevel: 'pin-unverified')
  // và component-compatibility.json (wokwi-ph-sensor). VCC/GND/PO suy đoán
  // theo tên gọi phổ biến, CHƯA có evidence xác minh.
  ph_sensor: {
    label: 'pH Sensor',
    summary: '3 chân: VCC, GND, PO (analog) — CHƯA xác minh',
    role: 'Đo độ pH dung dịch qua đầu dò điện cực, trả tín hiệu analog.',
    pins: ['VCC', 'GND', 'PO'],
    sample: '5V -> VCC, GND -> GND, PO -> GPIO analog',
    icon: FlaskConical,
    iconClassName: 'bg-cyan-50 text-cyan-700',
    badge: 'Chưa xác minh sơ đồ chân',
  },
  line_tracking_3ch: {
    label: 'Line Tracking Sensor (3 kênh)',
    summary: '5 chân: VCC, GND, OUT1, OUT2, OUT3',
    role: 'Module dò line TCRT5000 3 mắt — dò đường line đen/trắng với 3 điểm đo song song.',
    pins: ['VCC', 'GND', 'OUT1', 'OUT2', 'OUT3'],
    sample: '5V -> VCC, GND -> GND, OUT1-3 -> GPIO',
    icon: Route,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Kiểm tra nối dây',
  },
  lcd2004: {
    label: 'LCD 20x4 I2C',
    summary: '4 chân: GND, VCC, SDA, SCL',
    role: 'Màn hình LCD ký tự 20x4 gắn module I2C — element thật @wokwi/elements (LCD2004Element, numCols=20/numRows=4), buộc pins="i2c" (module 20x4 thực tế hầu như luôn dùng I2C backpack).',
    pins: ['GND', 'VCC', 'SDA', 'SCL'],
    sample: 'VCC -> 5V, GND -> GND, SDA/SCL -> GPIO I2C',
    icon: MonitorSmartphone,
    iconClassName: 'bg-emerald-50 text-emerald-700',
    badge: 'Kiểm tra nối dây',
  },
  line_tracking_5ch: {
    label: 'Line Tracking Sensor (5 kênh)',
    summary: '7 chân: VCC, GND, OUT1..OUT5',
    role: 'Module dò line TCRT5000 5 mắt — dò đường line đen/trắng với 5 điểm đo song song, phân giải cao hơn bản 3 kênh.',
    pins: ['VCC', 'GND', 'OUT1', 'OUT2', 'OUT3', 'OUT4', 'OUT5'],
    sample: '5V -> VCC, GND -> GND, OUT1-5 -> GPIO',
    icon: Route,
    iconClassName: 'bg-slate-100 text-slate-600',
    badge: 'Kiểm tra nối dây',
  },
};

export const UNKNOWN_COMPONENT_REFERENCE: ComponentReference = {
  label: 'Linh kiện',
  summary: 'Theo registry backend',
  role: 'Linh kiện đã được backend đánh dấu hỗ trợ.',
  pins: ['pin'],
  sample: 'Chọn pin trên canvas',
  icon: CircuitBoard,
  iconClassName: 'bg-slate-100 text-slate-600',
};

export function normalizeComponentType(type: string) {
  const normalized = type
    .toLowerCase()
    .trim()
    .replace(/^wokwi[-_]/, '')
    .replace(/-/g, '_');

  if (normalized === 'pushbutton' || normalized === 'button') return 'push_button';
  if (normalized === 'arduino' || normalized === 'arduino_uno') return 'arduino_uno';
  return normalized;
}

export function getComponentReference(componentType: string) {
  const normalizedType = normalizeComponentType(componentType);
  const reference = COMPONENT_REFERENCES[normalizedType];

  if (reference) return reference;

  return {
    ...UNKNOWN_COMPONENT_REFERENCE,
    label: componentType,
  };
}

// Phân nhóm theo đúng 6 category Wokwi-style user yêu cầu (Basic/Display/
// Input/Sensor/Output-Actuator/Robot Kit) + Mechanical + BOM/Accessories —
// tra cứu tĩnh theo key thay vì thêm field category vào từng entry ở trên
// (tránh phải sửa lại ~60 object literal chỉ để thêm 1 field, rủi ro gõ sai
// category cho từng cái). Danh sách dưới đây LÀ nguồn sự thật duy nhất cho
// việc phân nhóm palette — thêm component mới vào registry mà quên thêm vào
// đúng 1 trong các mảng này sẽ rơi vào nhóm mặc định "Output/Actuator" (xem
// getComponentCategory), không mất tích khỏi palette.
const CATEGORY_KEYS: Record<PaletteCategory, string[]> = {
  Basic: ['led', 'resistor', 'buzzer', 'rgb_led'],
  Input: ['push_button', 'potentiometer', 'membrane_keypad'],
  Display: ['ssd1306', 'lcd1602', 'lcd1602_i2c', 'lcd2004', 'ili9341', 'led_bar_graph', '7segment'],
  Sensor: [
    'dht22', 'dht11', 'hc_sr04', 'flame_sensor', 'gas_sensor', 'pir_motion_sensor',
    'photoresistor_sensor', 'ntc_temperature_sensor', 'hx711', 'ir_receiver',
    'water_leak_sensor', 'rain_sensor', 'soil_moisture_sensor', 'ir_obstacle_sensor',
    'line_tracking_sensor', 'color_sensor', 'vibration_sensor', 'mpu6050', 'ph_sensor',
    'line_tracking_3ch', 'line_tracking_5ch',
  ],
  'Output/Actuator': [
    'servo', 'l298n', 'dc_motor', 'neopixel', 'relay_module', 'fan', 'water_pump',
    'solenoid_valve', 'stepper_motor', 'esc', 'heating_element',
  ],
  'Robot Kit': [
    'robot_wheel', 'caster_wheel', 'robot_chassis', 'delivery_box', 'battery_pack',
    'power_switch', 'breadboard',
  ],
  Mechanical: [
    'robot_arm_base', 'gripper', 'conveyor_belt', 'sorting_box', 'ball',
    'fire_extinguisher', 'water_tank', 'drone_frame', 'propeller', 'drone_motor',
    'stair_obstacle', 'trash_object', 'delivery_item', 'esp32_cam', 'wifi_cloud_node',
    'dashboard_cloud',
  ],
  'BOM/Accessories': [],
};

const KEY_TO_CATEGORY: Record<string, PaletteCategory> = Object.entries(CATEGORY_KEYS).reduce(
  (acc, [category, keys]) => {
    keys.forEach((key) => { acc[key] = category as PaletteCategory; });
    return acc;
  },
  {} as Record<string, PaletteCategory>
);

export function getComponentCategory(componentType: string): PaletteCategory {
  const normalized = normalizeComponentType(componentType);
  return KEY_TO_CATEGORY[normalized] ?? 'Output/Actuator';
}

export const PALETTE_CATEGORY_ORDER: PaletteCategory[] = [
  'Basic', 'Display', 'Input', 'Sensor', 'Output/Actuator', 'Robot Kit', 'Mechanical', 'BOM/Accessories',
];
