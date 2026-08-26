// StemFlow Virtual Lab — Bộ 14 bài tập mẫu + module "Robot Giao Hàng Mini" (LAB01-LAB08,
// ACCELERATION PHASE 5) = 22 bài (Component Library đã hỗ trợ runtime hôm nay).
//
// NGUỒN SỰ THẬT ĐÃ ĐỐI CHIẾU TRỰC TIẾP VỚI SOURCE (không suy đoán) trước khi viết file này:
// - STEM_BE/STEM.Application/Dtos/Labs/LabDtos.cs           — CreateLabRequest, đúng field BE nhận.
// - STEM_BE/STEM.Core/Entities/Simulations/Lab.cs            — LabCategories chỉ có 4 giá trị cố định
//   (physics/chemistry/biology/robotics) — KHÔNG được đặt category tự do.
// - STEM_BE/.../VirtualLabDiagramService.cs (SupportedPins, ValidateComponentWiring) — đúng tên pin
//   từng loại linh kiện + rule nối dây bắt buộc (LED/Buzzer/RGB LED/L298N/DC Motor/HC-SR04/DHT).
//   Board part trong `connections` LUÔN dùng id cố định "arduino" (kể cả board là ESP32).
// - STEM_BE/.../Runners/Qemu/SensorRuntimeHeaderGenerator.cs — cơ chế "Sensor Input Bridge":
//   digitalRead()/analogRead()/pulseIn() bị tiêm macro tự động cho các chân đã nối cảm biến hỗ trợ
//   (HC-SR04/PIR/Line Tracking 3-5ch/Water Leak/Flame/Rain/Soil Moisture/Vibration) theo kịch bản
//   `sensorScenario` nhúng trong diagramJson — sketch chỉ cần gọi hàm Arduino chuẩn với đúng số GPIO
//   đã nối, KHÔNG cần code gì đặc biệt. RIÊNG DHT11/DHT22 không qua digitalRead — phải dùng class
//   StemFlowDHT("id") (id khớp đúng `parts[].id` trong diagram), xem Bài 10.
// - STEM_FE/.../Sandbox/pinMaps.ts (ESP32_SAFE_GPIOS/ESP32_RISKY_GPIOS) — mọi GPIO dùng trong file
//   này đều nằm trong danh sách an toàn [13,14,16,17,18,19,21,22,23,25,26,27,32,33], tránh strapping
//   pin/UART0.
//
// PHẠM VI: 14 bài gốc (LED/Buzzer/RGB LED/L298N xe 2 bánh/tránh vật cản HC-SR04/dò line 3ch/
// robot giao hàng mini/rò rỉ nước/cháy Flame/DHT nhiệt-ẩm/PIR/mưa/độ ẩm đất/rung SW-420)
// + module "Robot Giao Hàng Mini" LAB01-LAB08 (ROBOT_DELIVERY_MINI_LABS, xuất riêng để dùng làm
// 1 chuỗi bài tiến trình độc lập) tái sử dụng đúng logic điện của Bài 4/5/7 phía trên, thêm 1 bộ
// GPIO chung (ROBOT_DELIVERY_PINS) xuyên suốt LAB02-LAB08. KHÔNG có bài nào dùng WiFi/MQTT/HTTP/
// cloud/camera AI/drone/robot physics thật.
//
// CÁCH DÙNG: đây là DỮ LIỆU THUẦN (không tự động thêm lab vào hệ thống, không đổi API/route nào).
// Giáo viên/admin dùng `toCreateLabRequest(exercise, classIds)` để lấy đúng payload rồi gọi
// `labsApi.create(...)` (POST /api/labs — ĐÃ CÓ SẴN, không cần route mới) khi tạo lab thật, hoặc
// copy tay từng field vào modal "Tạo phòng thí nghiệm mới" đang có sẵn trong VirtualLabPage.

import type {
  CreateLabRequest,
  LabCategory,
  LabCircuitConfig,
} from '@/services/dashboardApi';

export type ExerciseLevel = 'beginner' | 'intermediate';

export interface VirtualLabSampleExercise {
  title: string;
  slug: string;
  category: LabCategory;
  level: ExerciseLevel;
  estimatedTimeMinutes: number;
  objective: string;
  description: string;
  /** Đúng type string trong ComponentGlueRegistry / VirtualLabDiagramService.SupportedPins */
  components: string[];
  /** Tóm tắt mức hỗ trợ runtime thật của từng linh kiện dùng trong bài (badge thật, không suy đoán) */
  supportedLevel: string;
  wiringGuide: string[];
  starterCode: string;
  circuitConfig: LabCircuitConfig;
  expectedBehavior: string;
  testSteps: string[];
  serialExpectedOutput?: string;
  teacherNotes: string;
  limitations: string;
  /**
   * Nhãn module cho các bài thuộc 1 chuỗi tiến trình nhiều Lab (ví dụ "Robot
   * Giao Hàng Mini" cho LAB01-08) — dùng để TemplatePickerModal gom nhóm hiển
   * thị dưới 1 tiêu đề thay vì trộn lẫn với các bài đơn lẻ khác. Optional —
   * undefined nghĩa là bài đơn lẻ, không thuộc module nào (14 bài gốc).
   */
  module?: string;
  /** STEP 13 (Phase 6 hardening) — "Kiến thức cần nhớ", concise, per-lab. Optional: only the 8 Robot Delivery labs populate this. */
  keyConcepts?: string[];
  /** "Gợi ý" — 1 gợi ý gỡ lỗi ngắn cho lỗi thường gặp nhất của bài, không phải đáp án đầy đủ. */
  hints?: string[];
  /** "Câu hỏi mở rộng" — câu hỏi tư duy, không có đáp án cố định trong bài. */
  extensionQuestions?: string[];
}

/** Board part id CỐ ĐỊNH mà VirtualLabDiagramService dùng cho mọi board (kể cả ESP32) trong connections[]. */
const BOARD = 'arduino';
const GND = `${BOARD}:GND.1`;

export function toCreateLabRequest(
  exercise: VirtualLabSampleExercise,
  classIds: number[] = []
): CreateLabRequest {
  return {
    title: exercise.title,
    description: exercise.description,
    category: exercise.category,
    thumbnailUrl: '',
    simulationMode: 'custom_sandbox',
    boardType: 'esp32_devkit_v1',
    starterCode: exercise.starterCode,
    circuitConfig: exercise.circuitConfig,
    allowedComponentTypes: exercise.components,
    wokwiProjectId: null,
    wokwiProjectUrl: null,
    classIds,
    status: 'draft',
    linkedAssignmentId: null,
  };
}

// ============================================================================
// Bài 1 — LED Blink cơ bản
// ============================================================================
const led1StarterCode = `// StemFlow Virtual Lab — Bai 1: LED Blink co ban
// ESP32 DevKit v1 — LED: A (anode) -> GPIO13, C (cathode) -> GND

const int LED_PIN = 13;
bool ledState = false;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  ledState = !ledState;
  digitalWrite(LED_PIN, ledState ? HIGH : LOW);
  Serial.println(ledState ? "LED: ON" : "LED: OFF");
  delay(1000);
}
`;

const led1: VirtualLabSampleExercise = {
  title: 'LED Blink cơ bản',
  slug: 'led-blink-co-ban',
  category: 'physics',
  level: 'beginner',
  estimatedTimeMinutes: 15,
  objective: 'Hiểu cách ESP32 điều khiển tín hiệu digital OUTPUT qua digitalWrite() và quan sát trạng thái qua Serial Monitor.',
  description: 'Nhấp nháy 1 LED mỗi giây bằng digitalWrite HIGH/LOW, in trạng thái ON/OFF ra Serial Monitor.',
  components: ['wokwi-led'],
  supportedLevel: 'wokwi-led: Mô phỏng được (LedModel.cs — QEMU đọc digitalWrite thật, LED sáng/tắt đúng theo code).',
  wiringGuide: [
    'Đặt 1 ESP32 DevKit v1 và 1 LED lên canvas.',
    'Nối LED chân A (anode) -> ESP32 GPIO13.',
    'Nối LED chân C (cathode) -> ESP32 GND.',
  ],
  starterCode: led1StarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'led1', type: 'wokwi-led', x: 260, y: 120, pinMapping: { A: 13 } },
    ],
    connections: [
      [`${BOARD}:GPIO13`, 'led1:A'],
      ['led1:C', GND],
    ],
  },
  expectedBehavior: 'LED bật 1 giây, tắt 1 giây, lặp lại liên tục. Serial Monitor in "LED: ON"/"LED: OFF" đúng nhịp.',
  testSteps: [
    'Bấm Run/Compile — chờ firmware nạp xong.',
    'Quan sát LED trên canvas: phải sáng/tắt đều đặn mỗi 1 giây.',
    'Mở Serial Monitor (115200 baud): mỗi lần đổi trạng thái phải có 1 dòng log tương ứng.',
  ],
  serialExpectedOutput: 'LED: ON\nLED: OFF\nLED: ON\nLED: OFF\n...',
  teacherNotes: 'Bài nhập môn — nên làm đầu tiên để học sinh quen giao diện canvas + code editor + Serial Monitor trước khi sang cảm biến.',
  limitations: 'Không có điện trở giới hạn dòng trong sơ đồ mẫu (mô phỏng không tính hỏng LED do quá dòng) — có thể thêm wokwi-resistor nối tiếp nếu muốn dạy đúng thực tế.',
};

// ============================================================================
// Bài 2 — Buzzer cảnh báo
// ============================================================================
const buzzer1StarterCode = `// StemFlow Virtual Lab — Bai 2: Buzzer canh bao
// ESP32 DevKit v1 — Buzzer: chan 1 (tin hieu) -> GPIO25, chan 2 -> GND

const int BUZZER_PIN = 25;

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
}

void loop() {
  digitalWrite(BUZZER_PIN, HIGH);
  Serial.println("Buzzer: BEEP");
  delay(300);

  digitalWrite(BUZZER_PIN, LOW);
  Serial.println("Buzzer: SILENT");
  delay(700);
}
`;

const buzzer1: VirtualLabSampleExercise = {
  title: 'Buzzer cảnh báo',
  slug: 'buzzer-canh-bao',
  category: 'physics',
  level: 'beginner',
  estimatedTimeMinutes: 15,
  objective: 'Điều khiển buzzer phát âm thanh theo chu kỳ bằng digitalWrite(), làm nền tảng cho các bài cảnh báo (Bài 8-14).',
  description: 'Buzzer kêu 0.3s, im lặng 0.7s, lặp lại liên tục.',
  components: ['wokwi-buzzer'],
  supportedLevel: 'wokwi-buzzer: Mô phỏng được (BuzzerModel.cs — QEMU đọc digitalWrite thật, phát/tắt tiếng đúng theo code).',
  wiringGuide: [
    'Đặt 1 ESP32 DevKit v1 và 1 Buzzer lên canvas.',
    'Nối Buzzer chân 1 (+) -> ESP32 GPIO25.',
    'Nối Buzzer chân 2 (-) -> ESP32 GND.',
  ],
  starterCode: buzzer1StarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'buzzer1', type: 'wokwi-buzzer', x: 260, y: 120, pinMapping: { '1': 25 } },
    ],
    connections: [
      [`${BOARD}:GPIO25`, 'buzzer1:1'],
      ['buzzer1:2', GND],
    ],
  },
  expectedBehavior: 'Buzzer kêu ngắt quãng theo chu kỳ 0.3s kêu / 0.7s im lặng. Serial Monitor in đúng trạng thái BEEP/SILENT.',
  testSteps: [
    'Bấm Run/Compile.',
    'Quan sát biểu tượng buzzer đổi trạng thái theo đúng chu kỳ trên canvas.',
    'Kiểm tra Serial Monitor khớp với chu kỳ bật/tắt.',
  ],
  serialExpectedOutput: 'Buzzer: BEEP\nBuzzer: SILENT\nBuzzer: BEEP\n...',
  teacherNotes: 'Có thể mở rộng cho học sinh khá: đổi delay() để tạo giai điệu đơn giản hoặc dùng tone()/noTone() nếu core ESP32 hỗ trợ trong sandbox.',
  limitations: 'digitalWrite chỉ bật/tắt biên độ cố định — không mô phỏng cao độ (tone) hay âm lượng thật.',
};

// ============================================================================
// Bài 3 — RGB LED đổi màu
// ============================================================================
const rgbStarterCode = `// StemFlow Virtual Lab — Bai 3: RGB LED doi mau
// ESP32 DevKit v1 — RGB LED (common-cathode): R->GPIO25, G->GPIO26, B->GPIO27, COM->GND

const int PIN_R = 25;
const int PIN_G = 26;
const int PIN_B = 27;

void setColor(bool r, bool g, bool b, const char* name) {
  digitalWrite(PIN_R, r ? HIGH : LOW);
  digitalWrite(PIN_G, g ? HIGH : LOW);
  digitalWrite(PIN_B, b ? HIGH : LOW);
  Serial.print("Mau: ");
  Serial.println(name);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_R, OUTPUT);
  pinMode(PIN_G, OUTPUT);
  pinMode(PIN_B, OUTPUT);
}

void loop() {
  setColor(true, false, false, "DO");
  delay(1000);
  setColor(false, true, false, "XANH LA");
  delay(1000);
  setColor(false, false, true, "XANH DUONG");
  delay(1000);
  setColor(true, true, true, "TRANG");
  delay(1000);
  setColor(false, false, false, "TAT");
  delay(1000);
}
`;

const rgb1: VirtualLabSampleExercise = {
  title: 'RGB LED đổi màu',
  slug: 'rgb-led-doi-mau',
  category: 'physics',
  level: 'beginner',
  estimatedTimeMinutes: 20,
  objective: 'Hiểu nguyên lý pha màu ánh sáng cộng (RGB) bằng cách bật/tắt độc lập 3 kênh digital.',
  description: 'Lần lượt hiện màu đỏ, xanh lá, xanh dương, trắng (3 kênh cùng bật) và tắt — mỗi màu giữ 1 giây, in tên màu ra Serial.',
  components: ['wokwi-rgb-led'],
  supportedLevel: 'wokwi-rgb-led: Mô phỏng được — mỗi kênh bật/tắt độc lập qua digitalWrite thật. LƯU Ý: không có độ sáng trung gian (QEMU không đọc PWM), chỉ HIGH/LOW.',
  wiringGuide: [
    'Đặt 1 ESP32 DevKit v1 và 1 RGB LED (common-cathode) lên canvas.',
    'Nối chân R -> GPIO25, chân G -> GPIO26, chân B -> GPIO27.',
    'Nối chân COM -> GND (common-cathode).',
  ],
  starterCode: rgbStarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'rgb1', type: 'wokwi-rgb-led', x: 260, y: 120, pinMapping: { R: 25, G: 26, B: 27 } },
    ],
    connections: [
      [`${BOARD}:GPIO25`, 'rgb1:R'],
      [`${BOARD}:GPIO26`, 'rgb1:G'],
      [`${BOARD}:GPIO27`, 'rgb1:B'],
      ['rgb1:COM', GND],
    ],
  },
  expectedBehavior: 'RGB LED đổi màu tuần tự: Đỏ -> Xanh lá -> Xanh dương -> Trắng -> Tắt, mỗi màu 1 giây, lặp vô hạn.',
  testSteps: [
    'Bấm Run/Compile.',
    'Quan sát RGB LED đổi đúng thứ tự 5 trạng thái màu.',
    'Đối chiếu Serial Monitor: tên màu in ra phải khớp màu đang hiển thị.',
  ],
  serialExpectedOutput: 'Mau: DO\nMau: XANH LA\nMau: XANH DUONG\nMau: TRANG\nMau: TAT\n...',
  teacherNotes: 'Vì QEMU không đọc PWM nên KHÔNG thể dạy trộn màu bằng analogWrite (VD: tím = R+B mờ) — chỉ dạy được tổ hợp bật/tắt nhị phân (8 màu gốc tối đa).',
  limitations: 'Không mô phỏng độ sáng trung gian/PWM — mọi kênh chỉ HIGH hoặc LOW.',
};

// ============================================================================
// Bài 4 — Xe 2 bánh điều khiển bằng L298N
// ============================================================================
const l298nCarStarterCode = `// StemFlow Virtual Lab — Bai 4: Xe 2 banh dieu khien bang L298N
// ESP32 DevKit v1 — L298N: IN1=13, IN2=14 (Motor A) | IN3=16, IN4=17 (Motor B) | ENA=18, ENB=19

const int IN1 = 13, IN2 = 14, IN3 = 16, IN4 = 17;
const int ENA = 18, ENB = 19;

void carForward()  { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);  Serial.println("Trang thai: TIEN"); }
void carBackward() { digitalWrite(IN1, LOW);  digitalWrite(IN2, HIGH); digitalWrite(IN3, LOW);  digitalWrite(IN4, HIGH); Serial.println("Trang thai: LUI"); }
void carTurnLeft() { digitalWrite(IN1, LOW);  digitalWrite(IN2, LOW);  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);  Serial.println("Trang thai: RE TRAI"); }
void carTurnRight(){ digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW);  Serial.println("Trang thai: RE PHAI"); }
void carStop()      { digitalWrite(IN1, LOW);  digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW);  Serial.println("Trang thai: DUNG"); }

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  digitalWrite(ENA, HIGH);
  digitalWrite(ENB, HIGH);
}

void loop() {
  carForward();   delay(2000);
  carStop();      delay(1000);
  carBackward();  delay(2000);
  carStop();      delay(1000);
  carTurnLeft();  delay(1000);
  carStop();      delay(1000);
  carTurnRight(); delay(1000);
  carStop();      delay(2000);
}
`;

const l298nCar: VirtualLabSampleExercise = {
  title: 'Xe 2 bánh điều khiển bằng L298N',
  slug: 'xe-2-banh-l298n',
  category: 'robotics',
  level: 'intermediate',
  estimatedTimeMinutes: 30,
  objective: 'Hiểu nguyên lý điều khiển chiều quay động cơ DC qua module cầu H (L298N) bằng 4 tín hiệu digital IN1-IN4.',
  description: 'Xe tự lặp chu trình: tiến 2s → dừng → lùi 2s → dừng → rẽ trái 1s → dừng → rẽ phải 1s → dừng.',
  components: ['wokwi-l298n', 'wokwi-dc-motor', 'wokwi-battery-pack'],
  supportedLevel: 'wokwi-l298n: Mô phỏng được (trạng thái forward/backward/stopped suy ra thật từ digitalWrite IN1-4, hiện trên card). wokwi-dc-motor: Mô phỏng được (theo trạng thái L298N tương ứng).',
  wiringGuide: [
    'Đặt ESP32 DevKit v1, 1 L298N, 2 DC Motor (Motor A + Motor B), 1 Battery Pack lên canvas.',
    'Nối ESP32 GPIO13->L298N IN1, GPIO14->IN2, GPIO16->IN3, GPIO17->IN4, GPIO18->ENA, GPIO19->ENB.',
    'Nối Motor A: terminal1/2 -> L298N OUT1/OUT2. Nối Motor B: terminal1/2 -> L298N OUT3/OUT4 (KHÔNG nối motor thẳng vào GPIO ESP32).',
    'Nối Battery Pack (+) -> L298N VIN, Battery Pack (-) -> L298N GND.',
    'Nối L298N GND -> ESP32 GND (chung mass tín hiệu).',
  ],
  starterCode: l298nCarStarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'l298n1', type: 'wokwi-l298n', x: 220, y: 120, pinMapping: { IN1: 13, IN2: 14, IN3: 16, IN4: 17, ENA: 18, ENB: 19 } },
      { id: 'motorA', type: 'wokwi-dc-motor', x: 60, y: 60, pinMapping: {} },
      { id: 'motorB', type: 'wokwi-dc-motor', x: 60, y: 200, pinMapping: {} },
      { id: 'battery1', type: 'wokwi-battery-pack', x: 400, y: 120, pinMapping: {} },
    ],
    connections: [
      [`${BOARD}:GPIO13`, 'l298n1:IN1'],
      [`${BOARD}:GPIO14`, 'l298n1:IN2'],
      [`${BOARD}:GPIO16`, 'l298n1:IN3'],
      [`${BOARD}:GPIO17`, 'l298n1:IN4'],
      [`${BOARD}:GPIO18`, 'l298n1:ENA'],
      [`${BOARD}:GPIO19`, 'l298n1:ENB'],
      ['motorA:terminal1', 'l298n1:OUT1'],
      ['motorA:terminal2', 'l298n1:OUT2'],
      ['motorB:terminal1', 'l298n1:OUT3'],
      ['motorB:terminal2', 'l298n1:OUT4'],
      ['battery1:+', 'l298n1:VIN'],
      ['battery1:-', 'l298n1:GND'],
      ['l298n1:GND', GND],
    ],
  },
  expectedBehavior: 'Card L298N/2 motor đổi trạng thái forward/backward/turning/stopped đúng theo chu trình; Serial log khớp từng trạng thái.',
  testSteps: [
    'Bấm Run/Compile.',
    'Quan sát card L298N + 2 motor đổi trạng thái đúng thứ tự: TIEN -> DUNG -> LUI -> DUNG -> RE TRAI -> DUNG -> RE PHAI -> DUNG.',
    'Đối chiếu Serial Monitor khớp từng trạng thái, đúng thời lượng.',
  ],
  serialExpectedOutput: 'Trang thai: TIEN\nTrang thai: DUNG\nTrang thai: LUI\nTrang thai: DUNG\nTrang thai: RE TRAI\n...',
  teacherNotes: 'Bài nền tảng cho Bài 5-7 (dùng lại đúng khối L298N này). Không cần dạy vật lý chuyển động thật — chỉ cần học sinh hiểu đúng logic IN1-IN4 quyết định chiều quay.',
  limitations: 'Không có mô phỏng vật lý chuyển động thật của xe trên mặt phẳng (không có toạ độ/va chạm) — chỉ mô phỏng đúng trạng thái điện của motor.',
};

// ============================================================================
// Bài 5 — Robot tránh vật cản bằng HC-SR04
// ============================================================================
const obstacleAvoidStarterCode = `// StemFlow Virtual Lab — Bai 5: Robot tranh vat can bang HC-SR04
// ESP32 DevKit v1 — L298N nhu Bai 4; HC-SR04: TRIG=32, ECHO=33

const int IN1 = 13, IN2 = 14, IN3 = 16, IN4 = 17;
const int ENA = 18, ENB = 19;
const int TRIG_PIN = 32, ECHO_PIN = 33;
const float SAFE_DISTANCE_CM = 20.0;

void carForward()   { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW); }
void carTurnRight()  { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW); }
void carStop()       { digitalWrite(IN1, LOW);  digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW); }

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  return duration / 58.0;
}

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  digitalWrite(ENA, HIGH);
  digitalWrite(ENB, HIGH);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  float distance = readDistanceCm();
  Serial.print("Khoang cach: ");
  Serial.print(distance);
  Serial.println(" cm");

  if (distance > SAFE_DISTANCE_CM) {
    carForward();
    Serial.println("Trang thai: DI THANG");
  } else {
    carStop();
    Serial.println("Trang thai: DUNG - VAT CAN");
    delay(300);
    carTurnRight();
    Serial.println("Trang thai: RE PHAI TRANH VAT CAN");
    delay(500);
    carStop();
  }

  delay(300);
}
`;

const obstacleAvoid: VirtualLabSampleExercise = {
  title: 'Robot tránh vật cản bằng HC-SR04',
  slug: 'robot-tranh-vat-can-hcsr04',
  category: 'robotics',
  level: 'intermediate',
  estimatedTimeMinutes: 35,
  objective: 'Kết hợp cảm biến khoảng cách (pulseIn) với logic điều khiển động cơ để tạo hành vi tránh vật cản đơn giản.',
  description: 'Robot đi thẳng khi khoảng cách phía trước > 20cm; khi <= 20cm thì dừng và rẽ phải để tránh.',
  components: ['wokwi-l298n', 'wokwi-dc-motor', 'wokwi-battery-pack', 'wokwi-hc-sr04'],
  supportedLevel: 'wokwi-l298n/wokwi-dc-motor: Mô phỏng được (như Bài 4). wokwi-hc-sr04: giá trị khoảng cách mô phỏng qua kịch bản (Sensor Input Bridge) — pulseIn() đọc đúng giá trị đã cấu hình theo mốc thời gian, KHÔNG phải đo khoảng cách vật lý thật trong scene.',
  wiringGuide: [
    'Nối L298N + 2 DC Motor + Battery Pack giống hệt Bài 4.',
    'Đặt thêm 1 HC-SR04 phía trước robot.',
    'Nối HC-SR04: VCC -> ESP32 3V3, GND -> ESP32 GND, TRIG -> GPIO32, ECHO -> GPIO33.',
  ],
  starterCode: obstacleAvoidStarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'l298n1', type: 'wokwi-l298n', x: 220, y: 120, pinMapping: { IN1: 13, IN2: 14, IN3: 16, IN4: 17, ENA: 18, ENB: 19 } },
      { id: 'motorA', type: 'wokwi-dc-motor', x: 60, y: 60, pinMapping: {} },
      { id: 'motorB', type: 'wokwi-dc-motor', x: 60, y: 200, pinMapping: {} },
      { id: 'battery1', type: 'wokwi-battery-pack', x: 400, y: 120, pinMapping: {} },
      { id: 'us1', type: 'wokwi-hc-sr04', x: 220, y: 260, pinMapping: { TRIG: 32, ECHO: 33 } },
    ],
    connections: [
      [`${BOARD}:GPIO13`, 'l298n1:IN1'],
      [`${BOARD}:GPIO14`, 'l298n1:IN2'],
      [`${BOARD}:GPIO16`, 'l298n1:IN3'],
      [`${BOARD}:GPIO17`, 'l298n1:IN4'],
      [`${BOARD}:GPIO18`, 'l298n1:ENA'],
      [`${BOARD}:GPIO19`, 'l298n1:ENB'],
      ['motorA:terminal1', 'l298n1:OUT1'],
      ['motorA:terminal2', 'l298n1:OUT2'],
      ['motorB:terminal1', 'l298n1:OUT3'],
      ['motorB:terminal2', 'l298n1:OUT4'],
      ['battery1:+', 'l298n1:VIN'],
      ['battery1:-', 'l298n1:GND'],
      ['l298n1:GND', GND],
      [`${BOARD}:3V3`, 'us1:VCC'],
      [`${BOARD}:GPIO32`, 'us1:TRIG'],
      [`${BOARD}:GPIO33`, 'us1:ECHO'],
      ['us1:GND', GND],
    ],
    sensorScenario: {
      sensors: {
        us1: {
          type: 'wokwi-hc-sr04',
          timeline: [
            { timeMs: 0, distanceCm: 100 },
            { timeMs: 4000, distanceCm: 45 },
            { timeMs: 7000, distanceCm: 10 },
            { timeMs: 10000, distanceCm: 100 },
          ],
        },
      },
    },
  },
  expectedBehavior: 'Robot đi thẳng khi kịch bản khoảng cách > 20cm; tại mốc 7s (khoảng cách=10cm) robot dừng rồi rẽ phải; sau mốc 10s (khoảng cách trở lại 100cm) robot đi thẳng tiếp.',
  testSteps: [
    'Bấm Run/Compile.',
    'Theo dõi Serial Monitor: giá trị "Khoang cach" phải khớp đúng kịch bản đã cấu hình (100 -> 45 -> 10 -> 100 cm).',
    'Xác nhận robot đổi trạng thái DI THANG -> DUNG -> RE PHAI đúng lúc khoảng cách <= 20cm.',
  ],
  serialExpectedOutput: 'Khoang cach: 100.00 cm\nTrang thai: DI THANG\n...\nKhoang cach: 10.00 cm\nTrang thai: DUNG - VAT CAN\nTrang thai: RE PHAI TRANH VAT CAN\n...',
  teacherNotes: 'Giáo viên có thể sửa lại "sensorScenario.sensors.us1.timeline" trong diagram để đổi kịch bản vật cản (thêm mốc thời gian/khoảng cách khác) mà không cần sửa code.',
  limitations: 'Khoảng cách là kịch bản định sẵn theo thời gian (timeline), KHÔNG phải cảm biến đo vật cản thật trong không gian 3D/2D — robot không "nhìn thấy" vật cản thật nào trên canvas.',
};

// ============================================================================
// Bài 6 — Xe tự hành dò line
// ============================================================================
const lineFollowStarterCode = `// StemFlow Virtual Lab — Bai 6: Xe tu hanh do line
// ESP32 DevKit v1 — L298N nhu Bai 4; Line Tracking 3ch: OUT1(trai)=21, OUT2(giua)=22, OUT3(phai)=23

const int IN1 = 13, IN2 = 14, IN3 = 16, IN4 = 17;
const int ENA = 18, ENB = 19;
const int LEFT_PIN = 21, CENTER_PIN = 22, RIGHT_PIN = 23;

void carForward()   { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW); }
void carTurnLeft()   { digitalWrite(IN1, LOW);  digitalWrite(IN2, LOW);  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW); }
void carTurnRight()  { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW); }
void carStop()       { digitalWrite(IN1, LOW);  digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW); }

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  digitalWrite(ENA, HIGH);
  digitalWrite(ENB, HIGH);
  pinMode(LEFT_PIN, INPUT);
  pinMode(CENTER_PIN, INPUT);
  pinMode(RIGHT_PIN, INPUT);
}

void loop() {
  bool left = digitalRead(LEFT_PIN) == HIGH;
  bool center = digitalRead(CENTER_PIN) == HIGH;
  bool right = digitalRead(RIGHT_PIN) == HIGH;

  Serial.print("Line L/C/R: ");
  Serial.print(left); Serial.print(",");
  Serial.print(center); Serial.print(",");
  Serial.println(right);

  if (center) {
    carForward();
    Serial.println("Trang thai: DI THANG");
  } else if (left) {
    carTurnLeft();
    Serial.println("Trang thai: RE TRAI");
  } else if (right) {
    carTurnRight();
    Serial.println("Trang thai: RE PHAI");
  } else {
    carStop();
    Serial.println("Trang thai: MAT LINE - DUNG");
  }

  delay(200);
}
`;

const lineFollow: VirtualLabSampleExercise = {
  title: 'Xe tự hành dò line',
  slug: 'xe-tu-hanh-do-line',
  category: 'robotics',
  level: 'intermediate',
  estimatedTimeMinutes: 35,
  objective: 'Áp dụng logic rẽ nhánh (if/else) trên 3 tín hiệu digital độc lập để bám theo đường line.',
  description: 'Đọc 3 kênh trái/giữa/phải của Line Tracking Sensor: giữa phát hiện line -> đi thẳng, trái phát hiện -> rẽ trái, phải phát hiện -> rẽ phải, không kênh nào phát hiện -> dừng (mất line).',
  components: ['wokwi-l298n', 'wokwi-dc-motor', 'wokwi-battery-pack', 'wokwi-line-tracking-3ch'],
  supportedLevel: 'wokwi-l298n/wokwi-dc-motor: Mô phỏng được. wokwi-line-tracking-3ch: giá trị 3 kênh mô phỏng qua kịch bản Pattern (center/left/right/lost/intersection) trong Sensor Input Bridge.',
  wiringGuide: [
    'Nối L298N + 2 DC Motor + Battery Pack giống hệt Bài 4.',
    'Đặt thêm 1 Line Tracking Sensor (3 kênh) phía dưới đầu robot.',
    'Nối Line Tracking: VCC -> ESP32 3V3, GND -> ESP32 GND, OUT1(trái) -> GPIO21, OUT2(giữa) -> GPIO22, OUT3(phải) -> GPIO23.',
  ],
  starterCode: lineFollowStarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'l298n1', type: 'wokwi-l298n', x: 220, y: 120, pinMapping: { IN1: 13, IN2: 14, IN3: 16, IN4: 17, ENA: 18, ENB: 19 } },
      { id: 'motorA', type: 'wokwi-dc-motor', x: 60, y: 60, pinMapping: {} },
      { id: 'motorB', type: 'wokwi-dc-motor', x: 60, y: 200, pinMapping: {} },
      { id: 'battery1', type: 'wokwi-battery-pack', x: 400, y: 120, pinMapping: {} },
      { id: 'line1', type: 'wokwi-line-tracking-3ch', x: 220, y: 260, pinMapping: { OUT1: 21, OUT2: 22, OUT3: 23 } },
    ],
    connections: [
      [`${BOARD}:GPIO13`, 'l298n1:IN1'],
      [`${BOARD}:GPIO14`, 'l298n1:IN2'],
      [`${BOARD}:GPIO16`, 'l298n1:IN3'],
      [`${BOARD}:GPIO17`, 'l298n1:IN4'],
      [`${BOARD}:GPIO18`, 'l298n1:ENA'],
      [`${BOARD}:GPIO19`, 'l298n1:ENB'],
      ['motorA:terminal1', 'l298n1:OUT1'],
      ['motorA:terminal2', 'l298n1:OUT2'],
      ['motorB:terminal1', 'l298n1:OUT3'],
      ['motorB:terminal2', 'l298n1:OUT4'],
      ['battery1:+', 'l298n1:VIN'],
      ['battery1:-', 'l298n1:GND'],
      ['l298n1:GND', GND],
      [`${BOARD}:3V3`, 'line1:VCC'],
      [`${BOARD}:GPIO21`, 'line1:OUT1'],
      [`${BOARD}:GPIO22`, 'line1:OUT2'],
      [`${BOARD}:GPIO23`, 'line1:OUT3'],
      ['line1:GND', GND],
    ],
    sensorScenario: {
      sensors: {
        line1: {
          type: 'wokwi-line-tracking-3ch',
          timeline: [
            { timeMs: 0, pattern: 'center' },
            { timeMs: 3000, pattern: 'left' },
            { timeMs: 5000, pattern: 'center' },
            { timeMs: 7000, pattern: 'right' },
            { timeMs: 9000, pattern: 'center' },
            { timeMs: 11000, pattern: 'lost' },
          ],
        },
      },
    },
  },
  expectedBehavior: 'Robot đổi trạng thái theo đúng kịch bản: đi thẳng (0-3s) -> rẽ trái (3-5s) -> đi thẳng (5-7s) -> rẽ phải (7-9s) -> đi thẳng (9-11s) -> dừng vì mất line (sau 11s).',
  testSteps: [
    'Bấm Run/Compile.',
    'Theo dõi Serial Monitor: giá trị "Line L/C/R" đổi đúng theo kịch bản pattern đã cấu hình.',
    'Xác nhận robot rẽ đúng hướng ứng với từng pattern, và dừng hẳn khi "lost".',
  ],
  serialExpectedOutput: 'Line L/C/R: 0,1,0\nTrang thai: DI THANG\n...\nLine L/C/R: 0,0,0\nTrang thai: MAT LINE - DUNG',
  teacherNotes: 'Có thể nâng cấp lên Line Tracking 5 kênh (wokwi-line-tracking-5ch, thêm far-left/far-right) cho lớp khá hơn — cùng cơ chế Sensor Input Bridge, không cần đổi runtime.',
  limitations: 'Line là kịch bản pattern định sẵn theo thời gian, KHÔNG có line vẽ thật trên canvas để robot "đi theo" bằng thị giác — học sinh không tự vẽ đường line tuỳ ý.',
};

// ============================================================================
// Bài 7 — Robot giao hàng mini
// ============================================================================
const deliveryRobotStarterCode = `// StemFlow Virtual Lab — Bai 7: Robot giao hang mini
// ESP32 DevKit v1 — L298N + HC-SR04 nhu Bai 5; chassis/wheel/caster/delivery box chi hien thi

const int IN1 = 13, IN2 = 14, IN3 = 16, IN4 = 17;
const int ENA = 18, ENB = 19;
const int TRIG_PIN = 32, ECHO_PIN = 33;
const float SAFE_DISTANCE_CM = 20.0;
const unsigned long DELIVERY_TIME_MS = 8000UL;

void carForward()   { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW); }
void carTurnRight()  { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW); }
void carStop()       { digitalWrite(IN1, LOW);  digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW); }

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  return duration / 58.0;
}

unsigned long tripStart = 0;
bool delivered = false;

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  digitalWrite(ENA, HIGH);
  digitalWrite(ENB, HIGH);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  tripStart = millis();
  Serial.println("Trang thai: BAT DAU GIAO HANG");
}

void loop() {
  if (delivered) {
    carStop();
    delay(1000);
    return;
  }

  if (millis() - tripStart >= DELIVERY_TIME_MS) {
    carStop();
    delivered = true;
    Serial.println("Trang thai: DELIVERED");
    return;
  }

  float distance = readDistanceCm();
  Serial.print("Khoang cach: ");
  Serial.print(distance);
  Serial.println(" cm");

  if (distance > SAFE_DISTANCE_CM) {
    carForward();
    Serial.println("Trang thai: MOVING");
  } else {
    carStop();
    Serial.println("Trang thai: OBSTACLE");
    delay(300);
    carTurnRight();
    Serial.println("Trang thai: TURNING");
    delay(500);
  }

  delay(300);
}
`;

const deliveryRobot: VirtualLabSampleExercise = {
  title: 'Robot giao hàng mini',
  slug: 'robot-giao-hang-mini',
  category: 'robotics',
  level: 'intermediate',
  estimatedTimeMinutes: 40,
  objective: 'Kết hợp điều khiển động cơ, cảm biến tránh vật cản và logic đếm thời gian (millis()) để mô phỏng một hành trình giao hàng hoàn chỉnh.',
  description: 'Robot di chuyển và tránh vật cản (như Bài 5) trong 8 giây, sau đó tự dừng và báo "DELIVERED". Delivery box/chassis/wheel/caster chỉ là linh kiện hiển thị (visual-only), không có physics thật.',
  components: [
    'wokwi-l298n',
    'wokwi-dc-motor',
    'wokwi-battery-pack',
    'wokwi-hc-sr04',
    'wokwi-robot-chassis',
    'wokwi-robot-wheel',
    'wokwi-caster-wheel',
    'wokwi-delivery-box',
  ],
  supportedLevel: 'wokwi-l298n/wokwi-dc-motor/wokwi-hc-sr04: như Bài 4-5. wokwi-robot-chassis/wokwi-robot-wheel/wokwi-caster-wheel/wokwi-delivery-box: Chỉ hiển thị (không có chân điện, không vào netlist, không ảnh hưởng compile/run).',
  wiringGuide: [
    'Nối L298N + 2 DC Motor + Battery Pack + HC-SR04 giống hệt Bài 5.',
    'Kéo thả thêm (không cần nối dây): Robot Chassis, 2x Robot Wheel, 1x Caster Wheel, 1x Mini Delivery Box để hoàn thiện hình dáng robot trên canvas.',
  ],
  starterCode: deliveryRobotStarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'l298n1', type: 'wokwi-l298n', x: 220, y: 120, pinMapping: { IN1: 13, IN2: 14, IN3: 16, IN4: 17, ENA: 18, ENB: 19 } },
      { id: 'motorA', type: 'wokwi-dc-motor', x: 60, y: 60, pinMapping: {} },
      { id: 'motorB', type: 'wokwi-dc-motor', x: 60, y: 200, pinMapping: {} },
      { id: 'battery1', type: 'wokwi-battery-pack', x: 400, y: 120, pinMapping: {} },
      { id: 'us1', type: 'wokwi-hc-sr04', x: 220, y: 260, pinMapping: { TRIG: 32, ECHO: 33 } },
      { id: 'chassis1', type: 'wokwi-robot-chassis', x: 180, y: 320, pinMapping: {} },
      { id: 'wheelL', type: 'wokwi-robot-wheel', x: 30, y: 60, pinMapping: {} },
      { id: 'wheelR', type: 'wokwi-robot-wheel', x: 30, y: 260, pinMapping: {} },
      { id: 'caster1', type: 'wokwi-caster-wheel', x: 430, y: 320, pinMapping: {} },
      { id: 'box1', type: 'wokwi-delivery-box', x: 220, y: 380, pinMapping: {} },
    ],
    connections: [
      [`${BOARD}:GPIO13`, 'l298n1:IN1'],
      [`${BOARD}:GPIO14`, 'l298n1:IN2'],
      [`${BOARD}:GPIO16`, 'l298n1:IN3'],
      [`${BOARD}:GPIO17`, 'l298n1:IN4'],
      [`${BOARD}:GPIO18`, 'l298n1:ENA'],
      [`${BOARD}:GPIO19`, 'l298n1:ENB'],
      ['motorA:terminal1', 'l298n1:OUT1'],
      ['motorA:terminal2', 'l298n1:OUT2'],
      ['motorB:terminal1', 'l298n1:OUT3'],
      ['motorB:terminal2', 'l298n1:OUT4'],
      ['battery1:+', 'l298n1:VIN'],
      ['battery1:-', 'l298n1:GND'],
      ['l298n1:GND', GND],
      [`${BOARD}:3V3`, 'us1:VCC'],
      [`${BOARD}:GPIO32`, 'us1:TRIG'],
      [`${BOARD}:GPIO33`, 'us1:ECHO'],
      ['us1:GND', GND],
    ],
    sensorScenario: {
      sensors: {
        us1: {
          type: 'wokwi-hc-sr04',
          timeline: [
            { timeMs: 0, distanceCm: 100 },
            { timeMs: 4000, distanceCm: 12 },
            { timeMs: 5500, distanceCm: 100 },
          ],
        },
      },
    },
  },
  expectedBehavior: 'Robot MOVING trong 8 giây (có 1 lần OBSTACLE/TURNING khi khoảng cách=12cm ở giây thứ 4), sau đó dừng hẳn và in "DELIVERED" đúng 1 lần.',
  testSteps: [
    'Bấm Run/Compile.',
    'Theo dõi Serial Monitor đủ trình tự: BAT DAU GIAO HANG -> nhiều dòng MOVING -> OBSTACLE -> TURNING -> MOVING tiếp -> DELIVERED (đúng 1 lần, không lặp lại).',
    'Xác nhận sau khi DELIVERED, robot đứng yên hoàn toàn (không còn đổi trạng thái motor).',
  ],
  serialExpectedOutput: 'Trang thai: BAT DAU GIAO HANG\nKhoang cach: 100.00 cm\nTrang thai: MOVING\n...\nTrang thai: DELIVERED',
  teacherNotes: 'Bài tổng hợp, nên giao sau khi học sinh đã hoàn thành Bài 4 và Bài 5. Có thể yêu cầu học sinh tự đổi DELIVERY_TIME_MS hoặc thêm mốc vật cản thứ 2 trong sensorScenario.',
  limitations: 'Không có toạ độ di chuyển thật, không phát hiện đã "tới đích" bằng vị trí — chỉ dùng bộ đếm thời gian millis() để giả lập việc hoàn thành hành trình. Delivery box không rơi/thả hàng thật.',
};

// ============================================================================
// Bài 8-14 — nhóm cảnh báo (1 cảm biến digital + LED + Buzzer), dùng chung khung code
// ============================================================================
function buildAlertStarterCode(args: {
  labNo: number;
  labName: string;
  sensorLabel: string;
  alertMessage: string;
  normalMessage: string;
}) {
  return `// StemFlow Virtual Lab — Bai ${args.labNo}: ${args.labName}
// ESP32 DevKit v1 — ${args.sensorLabel}: chan tin hieu -> GPIO32; LED -> GPIO13; Buzzer -> GPIO25

const int SENSOR_PIN = 32;
const int LED_PIN = 13;
const int BUZZER_PIN = 25;

void setup() {
  Serial.begin(115200);
  pinMode(SENSOR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
}

void loop() {
  bool detected = digitalRead(SENSOR_PIN) == HIGH;

  digitalWrite(LED_PIN, detected ? HIGH : LOW);
  digitalWrite(BUZZER_PIN, detected ? HIGH : LOW);

  Serial.println(detected ? "${args.alertMessage}" : "${args.normalMessage}");

  delay(500);
}
`;
}

function buildAlertCircuitConfig(sensorType: string, sensorDigitalPin: string): LabCircuitConfig {
  return {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'sensor1', type: sensorType, x: 140, y: 120, pinMapping: { [sensorDigitalPin]: 32 } },
      { id: 'led1', type: 'wokwi-led', x: 320, y: 100, pinMapping: { A: 13 } },
      { id: 'buzzer1', type: 'wokwi-buzzer', x: 320, y: 220, pinMapping: { '1': 25 } },
    ],
    connections: [
      [`${BOARD}:3V3`, 'sensor1:VCC'],
      ['sensor1:GND', GND],
      [`${BOARD}:GPIO32`, `sensor1:${sensorDigitalPin}`],
      [`${BOARD}:GPIO13`, 'led1:A'],
      ['led1:C', GND],
      [`${BOARD}:GPIO25`, 'buzzer1:1'],
      ['buzzer1:2', GND],
    ],
  };
}

// ---- Bài 8 — Cảnh báo rò rỉ nước ----
const waterLeak: VirtualLabSampleExercise = {
  title: 'Cảnh báo rò rỉ nước',
  slug: 'canh-bao-ro-ri-nuoc',
  category: 'physics',
  level: 'beginner',
  estimatedTimeMinutes: 20,
  objective: 'Dùng cảm biến digital 1 chân để kích hoạt đồng thời 2 thiết bị cảnh báo (LED + buzzer).',
  description: 'Không có nước: LED tắt, buzzer im lặng. Có nước: LED sáng, buzzer kêu liên tục.',
  components: ['wokwi-water-leak-sensor', 'wokwi-led', 'wokwi-buzzer'],
  supportedLevel: 'wokwi-water-leak-sensor: giá trị Detected mô phỏng qua kịch bản Sensor Input Bridge (digitalRead trả đúng HIGH/LOW theo timeline; chân S dùng chung cho cả digital lẫn analog).',
  wiringGuide: [
    'Đặt ESP32 DevKit v1, 1 Water Leak Sensor, 1 LED, 1 Buzzer lên canvas.',
    'Nối Water Leak Sensor: VCC -> 3V3, GND -> GND, S -> GPIO32.',
    'Nối LED: A -> GPIO13, C -> GND.',
    'Nối Buzzer: 1 -> GPIO25, 2 -> GND.',
  ],
  starterCode: buildAlertStarterCode({
    labNo: 8,
    labName: 'Canh bao ro ri nuoc',
    sensorLabel: 'Water Leak Sensor (S)',
    alertMessage: 'CANH BAO: RO RI NUOC!',
    normalMessage: 'Binh thuong: khong co nuoc',
  }),
  circuitConfig: buildAlertCircuitConfig('wokwi-water-leak-sensor', 'S'),
  expectedBehavior: 'LED + buzzer đồng thời tắt khi không có nước, đồng thời bật khi phát hiện nước, đúng theo kịch bản.',
  testSteps: [
    'Bấm Run/Compile.',
    'Theo dõi Serial Monitor đổi giữa "Binh thuong" và "CANH BAO" đúng theo kịch bản sensorScenario.',
    'Xác nhận LED và buzzer LUÔN đồng bộ trạng thái với nhau.',
  ],
  serialExpectedOutput: 'Binh thuong: khong co nuoc\n...\nCANH BAO: RO RI NUOC!\n...',
  teacherNotes: 'Vào diagram, sửa "sensorScenario.sensors.sensor1.timeline" (field detected: true/false theo timeMs) để tạo kịch bản rò rỉ nước theo ý muốn.',
  limitations: 'Không mô phỏng lượng nước/mực nước tăng dần — chỉ có 2 trạng thái rời rạc detected=true/false.',
};

// ---- Bài 9 — Cảnh báo cháy bằng Flame Sensor ----
const flameAlert: VirtualLabSampleExercise = {
  title: 'Cảnh báo cháy bằng Flame Sensor',
  slug: 'canh-bao-chay-flame-sensor',
  category: 'physics',
  level: 'beginner',
  estimatedTimeMinutes: 20,
  objective: 'Ứng dụng cảm biến hồng ngoại phát hiện lửa cho hệ thống cảnh báo cháy đơn giản.',
  description: 'Khi Flame Sensor phát hiện lửa (DOUT=HIGH), LED và buzzer bật cảnh báo. Không mô phỏng vòi phun nước/chữa cháy thật.',
  components: ['wokwi-flame-sensor', 'wokwi-led', 'wokwi-buzzer'],
  supportedLevel: 'wokwi-flame-sensor: giá trị Detected mô phỏng qua kịch bản Sensor Input Bridge (digitalRead DOUT trả đúng HIGH/LOW theo timeline).',
  wiringGuide: [
    'Đặt ESP32 DevKit v1, 1 Flame Sensor, 1 LED, 1 Buzzer lên canvas.',
    'Nối Flame Sensor: VCC -> 3V3, GND -> GND, DOUT -> GPIO32.',
    'Nối LED: A -> GPIO13, C -> GND.',
    'Nối Buzzer: 1 -> GPIO25, 2 -> GND.',
  ],
  starterCode: buildAlertStarterCode({
    labNo: 9,
    labName: 'Canh bao chay bang Flame Sensor',
    sensorLabel: 'Flame Sensor (DOUT)',
    alertMessage: 'CANH BAO: PHAT HIEN LUA!',
    normalMessage: 'Binh thuong: khong co lua',
  }),
  circuitConfig: buildAlertCircuitConfig('wokwi-flame-sensor', 'DOUT'),
  expectedBehavior: 'LED + buzzer bật khi kịch bản detected=true (có lửa), tắt khi detected=false.',
  testSteps: [
    'Bấm Run/Compile.',
    'Theo dõi Serial Monitor đổi trạng thái đúng theo kịch bản.',
    'Xác nhận LED/buzzer phản ứng ĐÚNG NGAY tại mốc thời gian đã cấu hình (không trễ quá 1 vòng loop ~500ms).',
  ],
  serialExpectedOutput: 'Binh thuong: khong co lua\n...\nCANH BAO: PHAT HIEN LUA!\n...',
  teacherNotes: 'KHÔNG thêm phần điều khiển bơm nước/van chữa cháy thật trong bài này — pump/valve chưa có runtime hỗ trợ (xem Bài 13 phần Limitations).',
  limitations: 'Không mô phỏng cường độ lửa (chỉ digital HIGH/LOW), không có hành động chữa cháy tự động.',
};

// ---- Bài 11 — Cảnh báo chuyển động bằng PIR ----
const pirAlert: VirtualLabSampleExercise = {
  title: 'Cảnh báo chuyển động bằng PIR',
  slug: 'canh-bao-chuyen-dong-pir',
  category: 'physics',
  level: 'beginner',
  estimatedTimeMinutes: 20,
  objective: 'Sử dụng cảm biến hồng ngoại thụ động (PIR) để phát hiện chuyển động trong hệ thống an ninh cơ bản.',
  description: 'PIR phát hiện chuyển động (OUT=HIGH) -> LED + buzzer bật; không có chuyển động -> tắt.',
  components: ['wokwi-pir-motion-sensor', 'wokwi-led', 'wokwi-buzzer'],
  supportedLevel: 'wokwi-pir-motion-sensor: giá trị Motion mô phỏng qua kịch bản Sensor Input Bridge (digitalRead OUT trả đúng HIGH/LOW theo timeline).',
  wiringGuide: [
    'Đặt ESP32 DevKit v1, 1 PIR Motion Sensor, 1 LED, 1 Buzzer lên canvas.',
    'Nối PIR: VCC -> 3V3, GND -> GND, OUT -> GPIO32.',
    'Nối LED: A -> GPIO13, C -> GND.',
    'Nối Buzzer: 1 -> GPIO25, 2 -> GND.',
  ],
  starterCode: buildAlertStarterCode({
    labNo: 11,
    labName: 'Canh bao chuyen dong bang PIR',
    sensorLabel: 'PIR Motion Sensor (OUT)',
    alertMessage: 'CANH BAO: CO CHUYEN DONG!',
    normalMessage: 'Binh thuong: khong co chuyen dong',
  }),
  circuitConfig: buildAlertCircuitConfig('wokwi-pir-motion-sensor', 'OUT'),
  expectedBehavior: 'LED + buzzer bật khi kịch bản motion=true, tắt khi motion=false.',
  testSteps: [
    'Bấm Run/Compile.',
    'Theo dõi Serial Monitor đổi trạng thái đúng theo kịch bản motion.',
    'Xác nhận LED/buzzer luôn khớp trạng thái motion hiện tại.',
  ],
  serialExpectedOutput: 'Binh thuong: khong co chuyen dong\n...\nCANH BAO: CO CHUYEN DONG!\n...',
  teacherNotes: 'PIR dùng field "motion" (khác "detected" của nhóm Water Leak/Flame/Rain/Soil/Vibration) trong sensorScenario — nhắc học sinh/giáo viên chú ý đúng tên field khi tự chỉnh kịch bản.',
  limitations: 'Không mô phỏng góc quét/khoảng cách phát hiện thật của PIR — chỉ có 2 trạng thái motion=true/false theo kịch bản.',
};

// ---- Bài 12 — Cảnh báo mưa ----
const rainAlert: VirtualLabSampleExercise = {
  title: 'Cảnh báo mưa',
  slug: 'canh-bao-mua',
  category: 'physics',
  level: 'beginner',
  estimatedTimeMinutes: 20,
  objective: 'Ứng dụng cảm biến độ dẫn điện (Rain Sensor) cho hệ thống cảnh báo thời tiết cơ bản.',
  description: 'Rain Sensor phát hiện mưa (DO=HIGH) -> LED + buzzer bật; trời khô -> tắt.',
  components: ['wokwi-rain-sensor', 'wokwi-led', 'wokwi-buzzer'],
  supportedLevel: 'wokwi-rain-sensor: giá trị Detected mô phỏng qua kịch bản Sensor Input Bridge (digitalRead DO trả đúng HIGH/LOW theo timeline; có thêm analogRead AO nếu nối thêm).',
  wiringGuide: [
    'Đặt ESP32 DevKit v1, 1 Rain Sensor, 1 LED, 1 Buzzer lên canvas.',
    'Nối Rain Sensor: VCC -> 3V3, GND -> GND, DO -> GPIO32.',
    'Nối LED: A -> GPIO13, C -> GND.',
    'Nối Buzzer: 1 -> GPIO25, 2 -> GND.',
  ],
  starterCode: buildAlertStarterCode({
    labNo: 12,
    labName: 'Canh bao mua',
    sensorLabel: 'Rain Sensor (DO)',
    alertMessage: 'CANH BAO: TROI MUA!',
    normalMessage: 'Binh thuong: khong mua',
  }),
  circuitConfig: buildAlertCircuitConfig('wokwi-rain-sensor', 'DO'),
  expectedBehavior: 'LED + buzzer bật khi kịch bản detected=true (có mưa), tắt khi detected=false.',
  testSteps: [
    'Bấm Run/Compile.',
    'Theo dõi Serial Monitor đổi trạng thái đúng theo kịch bản.',
    'Xác nhận LED/buzzer luôn khớp trạng thái hiện tại.',
  ],
  serialExpectedOutput: 'Binh thuong: khong mua\n...\nCANH BAO: TROI MUA!\n...',
  teacherNotes: 'Có thể mở rộng cho học sinh khá: nối thêm AO -> 1 GPIO analog khác và dùng analogRead() để đọc mức độ mưa (0-4095) thay vì chỉ digital HIGH/LOW.',
  limitations: 'Giá trị analog (nếu dùng) là kịch bản định sẵn, không mô phỏng lượng mưa vật lý thật.',
};

// ---- Bài 13 — Cảm biến độ ẩm đất ----
const soilMoisture: VirtualLabSampleExercise = {
  title: 'Cảm biến độ ẩm đất',
  slug: 'cam-bien-do-am-dat',
  category: 'physics',
  level: 'beginner',
  estimatedTimeMinutes: 20,
  objective: 'Ứng dụng cảm biến độ ẩm đất cho hệ thống cảnh báo tưới cây cơ bản.',
  description: 'Đất khô (DO=HIGH) -> LED + buzzer bật cảnh báo cần tưới nước; đất đủ ẩm -> tắt.',
  components: ['wokwi-soil-moisture-sensor', 'wokwi-led', 'wokwi-buzzer'],
  supportedLevel: 'wokwi-soil-moisture-sensor: giá trị Detected mô phỏng qua kịch bản Sensor Input Bridge (digitalRead DO trả đúng HIGH/LOW theo timeline).',
  wiringGuide: [
    'Đặt ESP32 DevKit v1, 1 Soil Moisture Sensor, 1 LED, 1 Buzzer lên canvas.',
    'Nối Soil Moisture Sensor: VCC -> 3V3, GND -> GND, DO -> GPIO32.',
    'Nối LED: A -> GPIO13, C -> GND.',
    'Nối Buzzer: 1 -> GPIO25, 2 -> GND.',
  ],
  starterCode: buildAlertStarterCode({
    labNo: 13,
    labName: 'Cam bien do am dat',
    sensorLabel: 'Soil Moisture Sensor (DO)',
    alertMessage: 'CANH BAO: DAT KHO - CAN TUOI NUOC!',
    normalMessage: 'Binh thuong: dat du am',
  }),
  circuitConfig: buildAlertCircuitConfig('wokwi-soil-moisture-sensor', 'DO'),
  expectedBehavior: 'LED + buzzer bật khi kịch bản detected=true (đất khô), tắt khi detected=false (đất đủ ẩm).',
  testSteps: [
    'Bấm Run/Compile.',
    'Theo dõi Serial Monitor đổi trạng thái đúng theo kịch bản.',
    'Xác nhận LED/buzzer luôn khớp trạng thái hiện tại.',
  ],
  serialExpectedOutput: 'Binh thuong: dat du am\n...\nCANH BAO: DAT KHO - CAN TUOI NUOC!\n...',
  teacherNotes: 'KHÔNG thêm Water Pump điều khiển bơm tưới thật trong bài mẫu này — Water Pump (wokwi-water-pump) hiện chỉ ở mức "Kiểm tra nối dây" (structural only), chưa có runtime bật/tắt bơm thật theo tín hiệu Relay. Có thể thêm Water Pump dạng visual nếu chỉ minh hoạ, không yêu cầu chạy đúng logic bơm.',
  limitations: 'Không điều khiển bơm nước thật (xem Teacher Notes) — chỉ dừng ở mức cảnh báo LED/buzzer.',
};

// ---- Bài 14 — Giám sát độ rung SW-420 ----
const vibrationAlert: VirtualLabSampleExercise = {
  title: 'Giám sát độ rung SW-420',
  slug: 'giam-sat-do-rung-sw420',
  category: 'physics',
  level: 'beginner',
  estimatedTimeMinutes: 20,
  objective: 'Ứng dụng cảm biến rung động cơ học cho hệ thống cảnh báo an ninh/giám sát rung lắc.',
  description: 'SW-420 phát hiện rung (OUT=HIGH) -> LED + buzzer bật cảnh báo; không rung -> tắt.',
  components: ['wokwi-vibration-sensor', 'wokwi-led', 'wokwi-buzzer'],
  supportedLevel: 'wokwi-vibration-sensor: giá trị Detected mô phỏng qua kịch bản Sensor Input Bridge (digitalRead OUT trả đúng HIGH/LOW theo timeline; SW-420 không có chân analog).',
  wiringGuide: [
    'Đặt ESP32 DevKit v1, 1 Vibration Sensor (SW-420), 1 LED, 1 Buzzer lên canvas.',
    'Nối Vibration Sensor: VCC -> 3V3, GND -> GND, OUT -> GPIO32.',
    'Nối LED: A -> GPIO13, C -> GND.',
    'Nối Buzzer: 1 -> GPIO25, 2 -> GND.',
  ],
  starterCode: buildAlertStarterCode({
    labNo: 14,
    labName: 'Giam sat do rung SW-420',
    sensorLabel: 'Vibration Sensor SW-420 (OUT)',
    alertMessage: 'CANH BAO: PHAT HIEN RUNG DONG!',
    normalMessage: 'Binh thuong: khong rung',
  }),
  circuitConfig: buildAlertCircuitConfig('wokwi-vibration-sensor', 'OUT'),
  expectedBehavior: 'LED + buzzer bật khi kịch bản detected=true (có rung), tắt khi detected=false.',
  testSteps: [
    'Bấm Run/Compile.',
    'Theo dõi Serial Monitor đổi trạng thái đúng theo kịch bản.',
    'Xác nhận LED/buzzer luôn khớp trạng thái hiện tại.',
  ],
  serialExpectedOutput: 'Binh thuong: khong rung\n...\nCANH BAO: PHAT HIEN RUNG DONG!\n...',
  teacherNotes: 'Là bài cuối nhóm "cảm biến digital đơn + LED + Buzzer" — có thể dùng làm bài kiểm tra tổng hợp sau khi học xong Bài 8-13 (cùng khung logic, đổi tên cảm biến/pin).',
  limitations: 'Không mô phỏng cường độ/tần số rung — chỉ có 2 trạng thái rời rạc detected=true/false.',
};

// ============================================================================
// Bài 10 — Trạm đo nhiệt độ độ ẩm DHT (đặt cuối vì dùng StemFlowDHT class riêng)
// ============================================================================
const dhtStationStarterCode = `// StemFlow Virtual Lab — Bai 10: Tram do nhiet do do am DHT
// ESP32 DevKit v1 — DHT11 id="dht1" (SDA noi GPIO19 chi de kiem tra day noi,
// gia tri doc qua StemFlowDHT theo ID linh kien, KHONG theo pin vat ly)
#include "StemFlowDHT.h"

const int LED_PIN = 13;
const float TEMP_THRESHOLD_C = 35.0;

StemFlowDHT dht("dht1");

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  Serial.print("Nhiet do: ");
  Serial.print(temperature);
  Serial.print(" C, Do am: ");
  Serial.print(humidity);
  Serial.println(" %");

  bool overheat = temperature > TEMP_THRESHOLD_C;
  digitalWrite(LED_PIN, overheat ? HIGH : LOW);
  if (overheat) {
    Serial.println("CANH BAO: NHIET DO CAO!");
  }

  delay(1000);
}
`;

const dhtStation: VirtualLabSampleExercise = {
  title: 'Trạm đo nhiệt độ độ ẩm DHT',
  slug: 'tram-do-nhiet-do-do-am-dht',
  category: 'physics',
  level: 'beginner',
  estimatedTimeMinutes: 25,
  objective: 'Đọc dữ liệu nhiệt độ/độ ẩm qua class StemFlowDHT riêng của StemFlow (KHÔNG phải thư viện DHT.h thật) và ra quyết định cảnh báo theo ngưỡng.',
  description: 'Đọc nhiệt độ + độ ẩm mỗi giây, in ra Serial Monitor; bật LED cảnh báo khi nhiệt độ vượt 35°C.',
  components: ['wokwi-dht11'],
  supportedLevel: 'wokwi-dht11 (và wokwi-dht22): giá trị Temperature/Humidity mô phỏng qua kịch bản Sensor Input Bridge — BẮT BUỘC đọc qua class StemFlowDHT("id"), KHÔNG dùng thư viện DHT.h/Adafruit DHT thật (giao thức 1-wire timing thật không mô phỏng được qua wrapper digitalRead).',
  wiringGuide: [
    'Đặt ESP32 DevKit v1 và 1 DHT11 lên canvas, đặt id linh kiện là "dht1" (khớp đúng chuỗi id dùng trong StemFlowDHT("dht1") ở code).',
    'Nối DHT11: VCC -> 3V3, GND -> GND, SDA -> GPIO19 (chỉ để qua bước kiểm tra nối dây — StemFlowDHT đọc theo id, không đọc tín hiệu điện thật trên chân này).',
  ],
  starterCode: dhtStationStarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'dht1', type: 'wokwi-dht11', x: 260, y: 120, pinMapping: { SDA: 19 } },
    ],
    connections: [
      [`${BOARD}:3V3`, 'dht1:VCC'],
      [`${BOARD}:GPIO19`, 'dht1:SDA'],
      ['dht1:GND', GND],
    ],
    sensorScenario: {
      sensors: {
        dht1: {
          type: 'wokwi-dht11',
          timeline: [
            { timeMs: 0, temperature: 25, humidity: 60 },
            { timeMs: 3000, temperature: 30, humidity: 65 },
            { timeMs: 6000, temperature: 38, humidity: 70 },
            { timeMs: 9000, temperature: 26, humidity: 60 },
          ],
        },
      },
    },
  },
  expectedBehavior: 'Serial Monitor in nhiệt độ/độ ẩm mỗi giây, khớp đúng kịch bản 4 mốc (0s: 25°C/60%, 3s: 30°C/65%, 6s: 38°C/70%, 9s: 26°C/60%); LED bật đúng khoảng 6s-9s (nhiệt độ 38°C > ngưỡng 35°C), tắt các thời điểm còn lại.',
  testSteps: [
    'Bấm Run/Compile.',
    'Theo dõi Serial Monitor: giá trị nhiệt độ/độ ẩm đổi đúng theo 4 mốc kịch bản (0s/3s/6s/9s).',
    'Xác nhận LED CHỈ bật trong khoảng nhiệt độ > 35°C (mốc 6s, 38°C), tắt các thời điểm khác.',
  ],
  serialExpectedOutput: 'Nhiet do: 25.00 C, Do am: 60.00 %\n...\nNhiet do: 38.00 C, Do am: 70.00 %\nCANH BAO: NHIET DO CAO!\n...',
  teacherNotes: 'Nhấn mạnh với học sinh: StemFlowDHT là helper RIÊNG của StemFlow (không phải thư viện DHT.h thật ngoài đời) — nếu học sinh tự ý #include <DHT.h> thật, sketch sẽ KHÔNG nhận được dữ liệu mô phỏng.',
  limitations: 'Không dùng được thư viện DHT.h/Adafruit Unified Sensor thật; giá trị hoàn toàn theo kịch bản timeline, không có nhiễu/sai số ngẫu nhiên như cảm biến thật.',
};

// ============================================================================
// Bài 15 — Nút nhấn điều khiển LED (CLOSE REMAINING FINAL-LAB GAPS, LAB-A02)
//
// Input thật qua ISimulationInputChannel (nhấn giữ/thả nút trên canvas) ->
// ButtonModel.cs (Educational runtime) -> digitalRead() trong sketch -> LED.
// KHÔNG có state nào bị fake ở FE — LED chỉ đổi trạng thái vì firmware đọc
// digitalRead(BUTTON_PIN) thật mỗi vòng loop(). Cơ chế nhấn giữ/thả này đã có
// bằng chứng test thật production-pipeline tại
// RealtimeSimulationInputTests.ButtonPress_ReactsLive_WithoutRestart_ThenReleaseTurnsLedOffAgain
// (real EducationalSimulationRunner, real SimulationInputChannel, không mock).
// ============================================================================
const pushButtonStarterCode = `// StemFlow Virtual Lab — Bai 15: Nut nhan dieu khien LED
// ESP32 DevKit v1 — Button: 1.l -> GPIO27, 2.r -> GND | LED: A -> GPIO13, C -> GND

const int BUTTON_PIN = 27;
const int LED_PIN = 13;

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  if (digitalRead(BUTTON_PIN) == HIGH) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("Nut: DA NHAN - LED: ON");
  } else {
    digitalWrite(LED_PIN, LOW);
    Serial.println("Nut: DA THA - LED: OFF");
  }
  delay(100);
}
`;

const pushButtonLed: VirtualLabSampleExercise = {
  title: 'Nút nhấn điều khiển LED',
  slug: 'nut-nhan-dieu-khien-led',
  category: 'physics',
  level: 'beginner',
  estimatedTimeMinutes: 15,
  objective: 'Đọc tín hiệu digital INPUT thật từ nút nhấn tương tác trên canvas (nhấn giữ/thả) qua digitalRead(), điều khiển trực tiếp LED — không có logic giả lập ở giao diện.',
  description: 'Nhấn giữ nút trên canvas: LED sáng. Thả nút: LED tắt ngay. Toàn bộ quyết định nằm trong firmware (digitalRead), không phải ở FE.',
  components: ['wokwi-pushbutton', 'wokwi-led'],
  supportedLevel: 'wokwi-pushbutton: Class A — full runtime + tương tác thật (nhấn giữ/thả qua ISimulationInputChannel, ButtonModel.cs đọc INPUT thật, không mặc định HIGH/LOW giả). wokwi-led: Mô phỏng được đầy đủ.',
  wiringGuide: [
    'Đặt 1 ESP32 DevKit v1, 1 Nút nhấn (Push Button) và 1 LED lên canvas.',
    'Nối Nút nhấn chân 1.l -> ESP32 GPIO27.',
    'Nối Nút nhấn chân 2.r -> ESP32 GND.',
    'Nối LED chân A (anode) -> ESP32 GPIO13, chân C (cathode) -> ESP32 GND.',
  ],
  starterCode: pushButtonStarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'button1', type: 'wokwi-pushbutton', x: 220, y: 120, pinMapping: { '1.l': 27 } },
      { id: 'led1', type: 'wokwi-led', x: 340, y: 120, pinMapping: { A: 13 } },
    ],
    connections: [
      [`${BOARD}:GPIO27`, 'button1:1.l'],
      ['button1:2.r', GND],
      [`${BOARD}:GPIO13`, 'led1:A'],
      ['led1:C', GND],
    ],
  },
  expectedBehavior: 'Nhấn giữ nút trên canvas: LED sáng ngay lập tức, Serial Monitor in "Nut: DA NHAN - LED: ON". Thả nút: LED tắt ngay, Serial Monitor in "Nut: DA THA - LED: OFF". Không cần Restart để đổi trạng thái.',
  testSteps: [
    'Bấm Run/Compile — chờ firmware nạp xong.',
    'Nhấn giữ chuột trên biểu tượng nút nhấn trên canvas: xác nhận LED sáng ngay (không delay dài, không cần bấm Run lại).',
    'Thả chuột: xác nhận LED tắt ngay.',
    'Lặp lại nhấn/thả vài lần liên tục trong CÙNG 1 lần Run để xác nhận không bị "kẹt" trạng thái.',
    'Đối chiếu Serial Monitor khớp đúng từng lần nhấn/thả.',
  ],
  serialExpectedOutput: 'Nut: DA THA - LED: OFF\nNut: DA THA - LED: OFF\nNut: DA NHAN - LED: ON\nNut: DA NHAN - LED: ON\nNut: DA THA - LED: OFF\n...',
  teacherNotes: 'Bài minh hoạ input tương tác thật đầu tiên (khác các bài trước chỉ có output). Nhấn mạnh: đây không phải animation cố định — học sinh có thể tự đổi logic (ví dụ đảo ngược HIGH/LOW, thêm đếm số lần nhấn) và thấy phản hồi ngay.',
  limitations: 'Không có chống dội phím (debounce) trong code mẫu — nếu học sinh thêm logic đếm số lần nhấn, có thể thấy hiện tượng đếm nhiều lần cho 1 lần nhấn thật; đây là bài học tốt để giới thiệu khái niệm debounce ở bài nâng cao.',
};

// ============================================================================
// Bài 16 — Chiết áp điều khiển LED theo ngưỡng (LAB-B01)
//
// Input analog thật (0-4095) qua ISimulationInputChannel (kéo thanh trượt) ->
// PotentiometerModel.cs -> analogRead() trong sketch -> so ngưỡng -> LED.
// Ngưỡng nằm HOÀN TOÀN trong firmware — FE không hề biết ngưỡng 2000 là gì,
// chỉ gửi giá trị analog thô. Bằng chứng production-pipeline thật:
// RealtimeSimulationInputTests.PotentiometerSlider_ReactsLive_CrossingThresholdBothWays_WithoutRestart.
// ============================================================================
const potentiometerStarterCode = `// StemFlow Virtual Lab — Bai 16: Chiet ap dieu khien LED theo nguong
// ESP32 DevKit v1 — Chiet ap: SIG -> GPIO32 (ADC1), GND -> GND, VCC -> 3V3 | LED: A -> GPIO13, C -> GND

const int POT_PIN = 32;
const int LED_PIN = 13;
const int THRESHOLD = 2000;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int value = analogRead(POT_PIN);
  Serial.print("ADC: ");
  Serial.print(value);
  if (value >= THRESHOLD) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println(" - LED: ON");
  } else {
    digitalWrite(LED_PIN, LOW);
    Serial.println(" - LED: OFF");
  }
  delay(200);
}
`;

const potentiometerLed: VirtualLabSampleExercise = {
  title: 'Chiết áp điều khiển LED theo ngưỡng',
  slug: 'chiet-ap-dieu-khien-led-theo-nguong',
  category: 'physics',
  level: 'beginner',
  estimatedTimeMinutes: 15,
  objective: 'Đọc giá trị analog thật (0-4095, ADC 12-bit ESP32) từ chiết áp tương tác qua analogRead(), tự lập trình so sánh ngưỡng để bật/tắt LED — không hardcode LED theo vị trí thanh trượt ở FE.',
  description: 'Kéo thanh trượt chiết áp trên canvas: khi giá trị ADC >= 2000, LED bật; dưới 2000, LED tắt. Toàn bộ ngưỡng và quyết định nằm trong code firmware.',
  components: ['wokwi-potentiometer', 'wokwi-led'],
  supportedLevel: 'wokwi-potentiometer: Class A — full runtime + tương tác thật (kéo thanh trượt qua ISimulationInputChannel, PotentiometerModel.cs trả về đúng giá trị 0-4095 qua analogRead thật, không có logic bật/tắt LED nào ở FE). wokwi-led: Mô phỏng được đầy đủ.',
  wiringGuide: [
    'Đặt 1 ESP32 DevKit v1, 1 Chiết áp (Potentiometer) và 1 LED lên canvas.',
    'Nối Chiết áp SIG -> ESP32 GPIO32 (chân ADC1).',
    'Nối Chiết áp GND -> ESP32 GND, VCC -> ESP32 3V3.',
    'Nối LED chân A (anode) -> ESP32 GPIO13, chân C (cathode) -> ESP32 GND.',
  ],
  starterCode: potentiometerStarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'pot1', type: 'wokwi-potentiometer', x: 220, y: 120, pinMapping: { SIG: 32 } },
      { id: 'led1', type: 'wokwi-led', x: 340, y: 120, pinMapping: { A: 13 } },
    ],
    connections: [
      [`${BOARD}:GPIO32`, 'pot1:SIG'],
      ['pot1:GND', GND],
      [`${BOARD}:3V3`, 'pot1:VCC'],
      [`${BOARD}:GPIO13`, 'led1:A'],
      ['led1:C', GND],
    ],
  },
  expectedBehavior: 'Chưa chỉnh thanh trượt: giá trị ADC mặc định là 0 -> LED tắt. Kéo thanh trượt lên cao (>= 2000): LED bật ngay. Kéo xuống thấp (< 2000): LED tắt lại, không cần Restart.',
  testSteps: [
    'Bấm Run/Compile.',
    'Trước khi chỉnh gì: xác nhận LED tắt, Serial Monitor in ADC gần 0.',
    'Kéo thanh trượt chiết áp lên cao: xác nhận LED bật đúng lúc giá trị ADC vượt 2000 (đối chiếu số hiển thị trên Serial Monitor).',
    'Kéo thanh trượt xuống thấp: xác nhận LED tắt lại đúng lúc giá trị ADC xuống dưới 2000, trong CÙNG 1 lần Run.',
  ],
  serialExpectedOutput: 'ADC: 0 - LED: OFF\nADC: 1450 - LED: OFF\nADC: 2380 - LED: ON\nADC: 900 - LED: OFF\n...',
  teacherNotes: 'Nhấn mạnh yêu cầu bắt buộc: KHÔNG được tự ý bật/tắt LED bằng cách nào khác ngoài so sánh analogRead() với ngưỡng trong code — nếu học sinh chỉnh sửa mà quyết định bật/tắt nằm ngoài firmware thì bài không còn đúng mục tiêu học ADC.',
  limitations: 'Giá trị ADC là tuyến tính lý tưởng theo vị trí thanh trượt — không mô phỏng nhiễu điện áp hay sai số ADC thật của phần cứng.',
};

// ============================================================================
// Bài 17 — Cảm biến ánh sáng điều khiển đèn ngủ (LAB-B02)
//
// Input analog thật (0-4095) qua ISimulationInputChannel (kéo thanh trượt mô
// phỏng độ sáng) -> LightSensorModel.cs -> analogRead() trong sketch -> so
// ngưỡng -> LED. Cực tính NGƯỢC với Bài 16 (dưới ngưỡng = tối = bật đèn) để
// học sinh thấy rõ đây là logic do CHÍNH firmware quyết định, không phải một
// mẫu code copy-paste đổi tên. Bằng chứng production-pipeline thật:
// RealtimeSimulationInputTests.LightSensorValue_ReactsLive_CrossingThresholdBothWays_WithoutRestart.
// Chân DO (digital out) của module thật tồn tại nhưng KHÔNG có runtime mô
// phỏng (chỉ AO/analogRead được LightSensorModel hỗ trợ) — vì vậy DO cố tình
// không được nối trong sơ đồ mẫu này, đúng theo comment trong
// VirtualLabDiagramService.cs.
// ============================================================================
const lightSensorStarterCode = `// StemFlow Virtual Lab — Bai 17: Cam bien anh sang dieu khien den ngu
// ESP32 DevKit v1 — Cam bien anh sang: AO -> GPIO33 (ADC1), GND -> GND, VCC -> 3V3 | LED: A -> GPIO13, C -> GND

const int LIGHT_PIN = 33;
const int LED_PIN = 13;
const int THRESHOLD = 1500;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int brightness = analogRead(LIGHT_PIN);
  Serial.print("Do sang: ");
  Serial.print(brightness);
  if (brightness < THRESHOLD) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println(" - Toi - LED: ON");
  } else {
    digitalWrite(LED_PIN, LOW);
    Serial.println(" - Sang - LED: OFF");
  }
  delay(200);
}
`;

const lightSensorLed: VirtualLabSampleExercise = {
  title: 'Cảm biến ánh sáng điều khiển đèn ngủ',
  slug: 'cam-bien-anh-sang-dieu-khien-den-ngu',
  category: 'physics',
  level: 'beginner',
  estimatedTimeMinutes: 15,
  objective: 'Đọc giá trị analog thật (0-4095) từ cảm biến ánh sáng (quang trở) tương tác qua analogRead(), lập trình logic "đèn ngủ": trời tối thì tự bật đèn.',
  description: 'Kéo thanh trượt mô phỏng độ sáng trên canvas: khi giá trị dưới ngưỡng (trời tối), LED tự bật; khi trên ngưỡng (trời sáng), LED tắt.',
  components: ['wokwi-photoresistor-sensor', 'wokwi-led'],
  supportedLevel: 'wokwi-photoresistor-sensor: Class A — full runtime + tương tác thật qua chân AO (LightSensorModel.cs, cùng cơ chế analogRead 0-4095 như Chiết áp). Chân DO tồn tại trên linh kiện thật nhưng KHÔNG có runtime mô phỏng — không nối trong bài này. wokwi-led: Mô phỏng được đầy đủ.',
  wiringGuide: [
    'Đặt 1 ESP32 DevKit v1, 1 Cảm biến ánh sáng (Photoresistor/Light Sensor) và 1 LED lên canvas.',
    'Nối Cảm biến ánh sáng chân AO -> ESP32 GPIO33 (chân ADC1).',
    'Nối Cảm biến ánh sáng GND -> ESP32 GND, VCC -> ESP32 3V3.',
    'KHÔNG cần nối chân DO — chân này chưa có runtime mô phỏng.',
    'Nối LED chân A (anode) -> ESP32 GPIO13, chân C (cathode) -> ESP32 GND.',
  ],
  starterCode: lightSensorStarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'light1', type: 'wokwi-photoresistor-sensor', x: 220, y: 120, pinMapping: { AO: 33 } },
      { id: 'led1', type: 'wokwi-led', x: 340, y: 120, pinMapping: { A: 13 } },
    ],
    connections: [
      [`${BOARD}:GPIO33`, 'light1:AO'],
      ['light1:GND', GND],
      [`${BOARD}:3V3`, 'light1:VCC'],
      [`${BOARD}:GPIO13`, 'led1:A'],
      ['led1:C', GND],
    ],
  },
  expectedBehavior: 'Chưa chỉnh gì: giá trị mặc định là 0 (dưới ngưỡng 1500) -> coi như "tối" -> LED bật. Kéo thanh trượt lên cao (>= 1500, "sáng"): LED tắt. Kéo xuống thấp lại: LED bật lại, không cần Restart.',
  testSteps: [
    'Bấm Run/Compile.',
    'Trước khi chỉnh gì: xác nhận LED bật (mặc định coi là tối), Serial Monitor in "Toi - LED: ON".',
    'Kéo thanh trượt độ sáng lên cao: xác nhận LED tắt đúng lúc giá trị vượt 1500.',
    'Kéo xuống thấp lại: xác nhận LED bật lại, trong CÙNG 1 lần Run.',
  ],
  serialExpectedOutput: 'Do sang: 0 - Toi - LED: ON\nDo sang: 2600 - Sang - LED: OFF\nDo sang: 400 - Toi - LED: ON\n...',
  teacherNotes: 'So sánh trực tiếp với Bài 16 (Chiết áp): cùng cơ chế analogRead 0-4095, nhưng cực tính điều kiện NGƯỢC lại — nên cho học sinh làm 2 bài liên tiếp để thấy rõ ngưỡng và điều kiện bật/tắt là do CODE quyết định, không phải do loại linh kiện.',
  limitations: 'Giá trị ánh sáng là do người dùng kéo thanh trượt mô phỏng (không có mô hình quang học/cường độ ánh sáng thật); chân DO (ngưỡng cứng trên module thật) không được mô phỏng.',
};

// ============================================================================
// PHASE NEXT — LAB CATALOG FROM PROJECT DOC (danh sách (1).docx, 2026-08-26)
//
// 5 bài MỚI xây theo đúng tài liệu BOM gốc, chỉ dùng linh kiện/runtime ĐÃ CÓ
// (L298N/DC Motor/HC-SR04/Line-Tracking/Flame/DHT/Fan/Relay đều đã proven
// thật qua Docker/QEMU trong các milestone trước — không phát minh runtime
// mới). Cơ cấu servo (gripper/balance/kicker/nozzle) dùng digitalWrite đơn
// giản hoá — GIỐNG HỆT tiền lệ đã có và đã giải trình rõ cho Drone Motor
// (DroneMotorModel.cs's SIMPLIFIED_ELECTRICAL_MODEL): QEMU không instrument
// analogWrite/ledcWrite/Servo.write() (PWM_QEMU_GAP đã xác nhận nhiều lần
// trong dự án), và thư viện Servo.h CHƯA từng được dùng/verify trong sandbox
// compile này — dùng digitalWrite thay vì Servo.h để (a) tránh rủi ro
// compile thật chưa kiểm chứng, (b) vẫn cho ra 1 pin-state event THẬT quan
// sát được qua QEMU (không phải giả lập). wokwi-servo vẫn đặt trên canvas
// đúng vị trí điện (visual + wiring-ready thật) — chỉ CODE điều khiển là
// digitalWrite đơn giản hoá, ghi rõ trong limitations từng bài.
// Linh kiện cơ khí visual-only (Gripper/Ball/Water Tank/Sorting Box/Robot
// Wheel...) đều TÁI SỬ DỤNG entry đã có sẵn trong component-compatibility.json
// — không tạo type mới.
// ============================================================================

// ---- Bài "Robot nhặt rác lớp học" (doc #2) ----
const trashRobotStarterCode = `// StemFlow Virtual Lab — Robot nhat rac lop hoc
// ESP32 DevKit v1 — L298N nhu Bai 4; HC-SR04: TRIG=32,ECHO=33; Gripper (servo, dieu khien don gian hoa qua digitalWrite): GPIO21

const int IN1 = 13, IN2 = 14, IN3 = 16, IN4 = 17, ENA = 18, ENB = 19;
const int TRIG_PIN = 32, ECHO_PIN = 33;
const int GRIPPER_PIN = 21;
const float GRAB_DISTANCE_CM = 15.0;

void forward() { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW); digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW); }
void stopCar() { digitalWrite(IN1, LOW); digitalWrite(IN2, LOW); digitalWrite(IN3, LOW); digitalWrite(IN4, LOW); }

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  return duration / 58.0;
}

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  digitalWrite(ENA, HIGH); digitalWrite(ENB, HIGH);
  pinMode(TRIG_PIN, OUTPUT); pinMode(ECHO_PIN, INPUT);
  pinMode(GRIPPER_PIN, OUTPUT);
}

void loop() {
  float distance = readDistanceCm();
  if (distance > GRAB_DISTANCE_CM) {
    forward();
    digitalWrite(GRIPPER_PIN, LOW);
    Serial.println("Trang thai: DI CHUYEN");
  } else {
    stopCar();
    digitalWrite(GRIPPER_PIN, HIGH);
    Serial.println("Trang thai: DA GAP RAC");
  }
  delay(300);
}
`;

const trashRobot: VirtualLabSampleExercise = {
  title: 'Robot nhặt rác lớp học',
  slug: 'robot-nhat-rac-lop-hoc',
  category: 'robotics',
  level: 'intermediate',
  estimatedTimeMinutes: 35,
  objective: 'Kết hợp cảm biến khoảng cách HC-SR04 với cơ cấu gắp (gripper) để tự động dừng và "gắp" vật khi phát hiện trong tầm với — mở rộng logic tránh vật cản (Bài 4/5) sang hành động chấp hành.',
  description: 'Robot di chuyển tới khi phát hiện rác trong tầm gắp (<=15cm) thì dừng và kích hoạt gripper; ngoài tầm thì tiếp tục di chuyển.',
  components: ['wokwi-l298n', 'wokwi-dc-motor', 'wokwi-battery-pack', 'wokwi-hc-sr04', 'wokwi-servo', 'wokwi-gripper', 'wokwi-sorting-box', 'wokwi-robot-wheel', 'wokwi-caster-wheel', 'wokwi-robot-chassis'],
  supportedLevel: 'wokwi-l298n/wokwi-dc-motor/wokwi-hc-sr04: Mô phỏng được đầy đủ qua QEMU thật (đã proven ở LAB06/07/08). wokwi-servo: đặt đúng vị trí điện (PWM pin) nhưng code điều khiển bằng digitalWrite đơn giản hoá (xem Limitations) — KHÔNG dùng Servo.write() thật (PWM_QEMU_GAP). wokwi-gripper/wokwi-sorting-box/wokwi-robot-wheel/wokwi-caster-wheel/wokwi-robot-chassis: Chỉ hiển thị (visual-only, tái sử dụng đúng type đã có sẵn trong catalog).',
  wiringGuide: [
    'Nối L298N + 2 DC Motor + Battery Pack + HC-SR04 giống hệt LAB06.',
    'Nối Servo (gripper): GND -> ESP32 GND, V+ -> ESP32 5V/VIN, PWM -> ESP32 GPIO21.',
    'Đặt Gripper và Sorting Box (làm "Mini Trash Bin") cạnh robot — chỉ mang tính minh hoạ, không có kết nối điện.',
  ],
  starterCode: trashRobotStarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'l298n1', type: 'wokwi-l298n', x: 220, y: 120, pinMapping: { IN1: 13, IN2: 14, IN3: 16, IN4: 17, ENA: 18, ENB: 19 } },
      { id: 'motorL', type: 'wokwi-dc-motor', x: 60, y: 60, pinMapping: {} },
      { id: 'motorR', type: 'wokwi-dc-motor', x: 60, y: 200, pinMapping: {} },
      { id: 'battery1', type: 'wokwi-battery-pack', x: 400, y: 120, pinMapping: {} },
      { id: 'us1', type: 'wokwi-hc-sr04', x: 220, y: 20, pinMapping: { TRIG: 32, ECHO: 33 } },
      { id: 'servo1', type: 'wokwi-servo', x: 340, y: 260, pinMapping: { PWM: 21 } },
      { id: 'gripper1', type: 'wokwi-gripper', x: 400, y: 260, pinMapping: {} },
      { id: 'bin1', type: 'wokwi-sorting-box', x: 460, y: 260, pinMapping: {} },
      { id: 'chassis1', type: 'wokwi-robot-chassis', x: 180, y: 320, pinMapping: {} },
      { id: 'wheelL', type: 'wokwi-robot-wheel', x: 30, y: 60, pinMapping: {} },
      { id: 'wheelR', type: 'wokwi-robot-wheel', x: 30, y: 260, pinMapping: {} },
      { id: 'caster1', type: 'wokwi-caster-wheel', x: 430, y: 320, pinMapping: {} },
    ],
    connections: [
      [`${BOARD}:GPIO13`, 'l298n1:IN1'], [`${BOARD}:GPIO14`, 'l298n1:IN2'],
      [`${BOARD}:GPIO16`, 'l298n1:IN3'], [`${BOARD}:GPIO17`, 'l298n1:IN4'],
      [`${BOARD}:GPIO18`, 'l298n1:ENA'], [`${BOARD}:GPIO19`, 'l298n1:ENB'],
      ['motorL:terminal1', 'l298n1:OUT1'], ['motorL:terminal2', 'l298n1:OUT2'],
      ['motorR:terminal1', 'l298n1:OUT3'], ['motorR:terminal2', 'l298n1:OUT4'],
      ['battery1:+', 'l298n1:VIN'], ['battery1:-', 'l298n1:GND'], ['l298n1:GND', GND],
      [`${BOARD}:3V3`, 'us1:VCC'], [`${BOARD}:GPIO32`, 'us1:TRIG'], [`${BOARD}:GPIO33`, 'us1:ECHO'], ['us1:GND', GND],
      [`${BOARD}:GND.2`, 'servo1:GND'], [`${BOARD}:5V`, 'servo1:V+'], [`${BOARD}:GPIO21`, 'servo1:PWM'],
    ],
    sensorScenario: {
      sensors: {
        us1: {
          type: 'wokwi-hc-sr04',
          timeline: [
            { timeMs: 0, distanceCm: 100 },
            { timeMs: 5000, distanceCm: 10 },
          ],
        },
      },
    },
  },
  expectedBehavior: 'Ở 100cm: robot di chuyển, gripper mở (GRIPPER_PIN=LOW). Khi khoảng cách giảm còn 10cm (<=15cm): robot dừng, gripper đóng (GRIPPER_PIN=HIGH), in "Trang thai: DA GAP RAC".',
  testSteps: [
    'Bấm Run/Compile — chờ QEMU thật khởi động.',
    'Theo dõi Serial Monitor: "Trang thai: DI CHUYEN" khi 100cm, chuyển sang "Trang thai: DA GAP RAC" đúng lúc khoảng cách xuống 10cm.',
    'Xác nhận cả 2 motor (part-state l298n) chuyển forward->stopped đúng lúc chuyển trạng thái.',
  ],
  serialExpectedOutput: 'Trang thai: DI CHUYEN\n...\nTrang thai: DA GAP RAC',
  teacherNotes: 'Tái sử dụng logic tránh-vật-cản đã học ở LAB06/07 — điểm mới là gắn thêm 1 hành động chấp hành (gripper) khi tới ngưỡng, thay vì chỉ dừng xe.',
  limitations: 'Gripper điều khiển bằng digitalWrite đơn giản hoá (KHÔNG dùng thư viện Servo.h/Servo.write() thật) — QEMU không instrument PWM (PWM_QEMU_GAP) nên góc servo thật không được mô phỏng, chỉ có 2 trạng thái mở/đóng rời rạc quan sát qua pin-state của GPIO21. Không mô phỏng việc rác thật sự rơi vào thùng.',
};

// ---- Bài "Robot leo cầu thang nâng cao" (doc #4) ----
const stairRobotStarterCode = `// StemFlow Virtual Lab — Robot leo cau thang nang cao
// ESP32 DevKit v1 — L298N: IN1-4=13,14,16,17, ENA/ENB=18,19; Servo can bang (digitalWrite don gian hoa): GPIO21

const int IN1 = 13, IN2 = 14, IN3 = 16, IN4 = 17, ENA = 18, ENB = 19;
const int BALANCE_PIN = 21;
const unsigned long CLIMB_PHASE1_MS = 3000UL;
const unsigned long BALANCE_MS = 1000UL;
const unsigned long CLIMB_PHASE2_MS = 3000UL;

void forward() { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW); digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW); }
void stopCar() { digitalWrite(IN1, LOW); digitalWrite(IN2, LOW); digitalWrite(IN3, LOW); digitalWrite(IN4, LOW); }

int stage = 0;
unsigned long stageStart = 0;

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  digitalWrite(ENA, HIGH); digitalWrite(ENB, HIGH);
  pinMode(BALANCE_PIN, OUTPUT);
  stageStart = millis();
  forward();
  Serial.println("Trang thai: BAT DAU LEO");
}

void loop() {
  unsigned long elapsed = millis() - stageStart;
  if (stage == 0) {
    if (elapsed >= CLIMB_PHASE1_MS) {
      stage = 1; stageStart = millis();
      stopCar(); digitalWrite(BALANCE_PIN, HIGH);
      Serial.println("Trang thai: CAN BANG");
    }
  } else if (stage == 1) {
    if (elapsed >= BALANCE_MS) {
      stage = 2; stageStart = millis();
      digitalWrite(BALANCE_PIN, LOW); forward();
      Serial.println("Trang thai: TIEP TUC LEO");
    }
  } else if (stage == 2) {
    if (elapsed >= CLIMB_PHASE2_MS) {
      stage = 3;
      stopCar();
      Serial.println("Trang thai: HOAN THANH");
    }
  } else {
    stopCar();
    delay(1000);
    return;
  }
  delay(200);
}
`;

const stairRobot: VirtualLabSampleExercise = {
  title: 'Robot leo cầu thang nâng cao',
  slug: 'robot-leo-cau-thang-nang-cao',
  category: 'robotics',
  level: 'intermediate',
  estimatedTimeMinutes: 30,
  objective: 'Áp dụng máy trạng thái theo thời gian thực (millis(), không dùng delay() chặn chương trình) để mô phỏng chuỗi hành vi leo bậc thang: di chuyển -> giữ cân bằng -> di chuyển tiếp -> hoàn thành.',
  description: 'Robot leo bậc thang theo chuỗi thời gian cố định: leo 3s -> dừng giữ cân bằng 1s (servo) -> leo tiếp 3s -> dừng hẳn.',
  components: ['wokwi-l298n', 'wokwi-dc-motor', 'wokwi-battery-pack', 'wokwi-servo', 'wokwi-robot-wheel', 'wokwi-robot-chassis'],
  supportedLevel: 'wokwi-l298n/wokwi-dc-motor: Mô phỏng được đầy đủ qua QEMU. wokwi-servo: đặt đúng vị trí điện, code điều khiển bằng digitalWrite đơn giản hoá (xem Limitations). wokwi-robot-wheel (tái sử dụng cho "Stair Climbing Wheel" — KHÔNG có visual 3-spoke omni riêng, dùng chung Robot Wheel đã có)/wokwi-robot-chassis: Chỉ hiển thị.',
  wiringGuide: [
    'Nối L298N + 2 DC Motor + Battery Pack giống hệt Bài 4.',
    'Nối Servo (cân bằng): GND -> ESP32 GND, V+ -> ESP32 5V, PWM -> ESP32 GPIO21.',
  ],
  starterCode: stairRobotStarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'l298n1', type: 'wokwi-l298n', x: 220, y: 120, pinMapping: { IN1: 13, IN2: 14, IN3: 16, IN4: 17, ENA: 18, ENB: 19 } },
      { id: 'motorL', type: 'wokwi-dc-motor', x: 60, y: 60, pinMapping: {} },
      { id: 'motorR', type: 'wokwi-dc-motor', x: 60, y: 200, pinMapping: {} },
      { id: 'battery1', type: 'wokwi-battery-pack', x: 400, y: 120, pinMapping: {} },
      { id: 'servo1', type: 'wokwi-servo', x: 340, y: 260, pinMapping: { PWM: 21 } },
      { id: 'chassis1', type: 'wokwi-robot-chassis', x: 180, y: 320, pinMapping: {} },
      { id: 'wheelL', type: 'wokwi-robot-wheel', x: 30, y: 60, pinMapping: {} },
      { id: 'wheelR', type: 'wokwi-robot-wheel', x: 30, y: 260, pinMapping: {} },
    ],
    connections: [
      [`${BOARD}:GPIO13`, 'l298n1:IN1'], [`${BOARD}:GPIO14`, 'l298n1:IN2'],
      [`${BOARD}:GPIO16`, 'l298n1:IN3'], [`${BOARD}:GPIO17`, 'l298n1:IN4'],
      [`${BOARD}:GPIO18`, 'l298n1:ENA'], [`${BOARD}:GPIO19`, 'l298n1:ENB'],
      ['motorL:terminal1', 'l298n1:OUT1'], ['motorL:terminal2', 'l298n1:OUT2'],
      ['motorR:terminal1', 'l298n1:OUT3'], ['motorR:terminal2', 'l298n1:OUT4'],
      ['battery1:+', 'l298n1:VIN'], ['battery1:-', 'l298n1:GND'], ['l298n1:GND', GND],
      [`${BOARD}:GND.2`, 'servo1:GND'], [`${BOARD}:5V`, 'servo1:V+'], [`${BOARD}:GPIO21`, 'servo1:PWM'],
    ],
  },
  expectedBehavior: 'Forward 3s -> dừng + BALANCE_PIN=HIGH trong 1s ("Trang thai: CAN BANG") -> forward tiếp 3s -> dừng hẳn ("Trang thai: HOAN THANH"), không lặp lại.',
  testSteps: [
    'Bấm Run/Compile.',
    'Theo dõi Serial Monitor đủ trình tự: BAT DAU LEO -> CAN BANG -> TIEP TUC LEO -> HOAN THANH.',
    'Xác nhận cả 2 motor dừng hẳn (part-state stopped) trong khoảng CAN BANG, rồi forward trở lại ở TIEP TUC LEO.',
  ],
  serialExpectedOutput: 'Trang thai: BAT DAU LEO\nTrang thai: CAN BANG\nTrang thai: TIEP TUC LEO\nTrang thai: HOAN THANH',
  teacherNotes: 'Bài đầu tiên dùng máy trạng thái theo millis() với 4 giai đoạn rõ rệt — nên dạy sau khi học sinh đã quen millis() ở LAB08 (Robot Giao Hàng Mini).',
  limitations: 'Không mô phỏng vật lý leo bậc thang thật (ma sát/độ nghiêng/mô-men) — chỉ có chuỗi thời gian cố định. Servo cân bằng dùng digitalWrite đơn giản hoá, không có góc nghiêng thật (PWM_QEMU_GAP). Bánh xe dùng chung visual Robot Wheel, không có hình 3 nan omni riêng.',
};

// ---- Bài "Robot bóng đá mini" (doc #8) ----
const soccerRobotStarterCode = `// StemFlow Virtual Lab — Robot bong da mini
// ESP32 DevKit v1 — L298N nhu Bai 6; Line Tracking 3ch: OUT1/2/3=21,22,23; HC-SR04: TRIG=32,ECHO=33; Kicker (digitalWrite don gian hoa): GPIO25

const int IN1 = 13, IN2 = 14, IN3 = 16, IN4 = 17, ENA = 18, ENB = 19;
const int LEFT_PIN = 21, CENTER_PIN = 22, RIGHT_PIN = 23;
const int TRIG_PIN = 32, ECHO_PIN = 33;
const int KICKER_PIN = 25;
const float KICK_DISTANCE_CM = 10.0;

void carForward()  { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW); }
void carTurnLeft()  { digitalWrite(IN1, LOW);  digitalWrite(IN2, LOW);  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW); }
void carTurnRight() { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW); }
void carStop()      { digitalWrite(IN1, LOW);  digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW); }

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  return duration / 58.0;
}

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  digitalWrite(ENA, HIGH); digitalWrite(ENB, HIGH);
  pinMode(LEFT_PIN, INPUT); pinMode(CENTER_PIN, INPUT); pinMode(RIGHT_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT); pinMode(ECHO_PIN, INPUT);
  pinMode(KICKER_PIN, OUTPUT);
}

void loop() {
  float distance = readDistanceCm();

  if (distance <= KICK_DISTANCE_CM) {
    carStop();
    digitalWrite(KICKER_PIN, HIGH);
    Serial.println("Trang thai: SUT BONG");
    delay(500);
    digitalWrite(KICKER_PIN, LOW);
  } else {
    bool left = digitalRead(LEFT_PIN) == HIGH;
    bool center = digitalRead(CENTER_PIN) == HIGH;
    bool right = digitalRead(RIGHT_PIN) == HIGH;

    if (center) { carForward(); Serial.println("Trang thai: DI THANG"); }
    else if (left) { carTurnLeft(); Serial.println("Trang thai: RE TRAI"); }
    else if (right) { carTurnRight(); Serial.println("Trang thai: RE PHAI"); }
    else { carStop(); Serial.println("Trang thai: MAT LINE"); }
  }
  delay(200);
}
`;

const soccerRobot: VirtualLabSampleExercise = {
  title: 'Robot bóng đá mini',
  slug: 'robot-bong-da-mini',
  category: 'robotics',
  level: 'intermediate',
  estimatedTimeMinutes: 35,
  objective: 'Kết hợp 2 nguồn input độc lập (Line Tracking để bám sân, HC-SR04 để phát hiện bóng trong tầm sút) và quyết định ưu tiên hành động (sút bóng luôn được ưu tiên hơn bám line).',
  description: 'Robot bám line di chuyển trên sân; khi phát hiện bóng trong tầm sút (<=10cm) thì dừng bám line và sút (kích hoạt kicker).',
  components: ['wokwi-l298n', 'wokwi-dc-motor', 'wokwi-battery-pack', 'wokwi-line-tracking-3ch', 'wokwi-hc-sr04', 'wokwi-servo', 'wokwi-ball', 'wokwi-robot-wheel', 'wokwi-caster-wheel', 'wokwi-robot-chassis'],
  supportedLevel: 'wokwi-l298n/wokwi-dc-motor/wokwi-line-tracking-3ch/wokwi-hc-sr04: Mô phỏng được đầy đủ qua QEMU (đã proven riêng lẻ ở Bài "Xe tự hành dò line" và LAB06/07/08). wokwi-servo (kicker): digitalWrite đơn giản hoá (xem Limitations). wokwi-ball/wokwi-robot-wheel/wokwi-caster-wheel/wokwi-robot-chassis: Chỉ hiển thị.',
  wiringGuide: [
    'Nối L298N + 2 DC Motor + Battery Pack + Line Tracking 3 kênh giống hệt bài "Xe tự hành dò line".',
    'Nối thêm HC-SR04: VCC -> 3V3, TRIG -> GPIO32, ECHO -> GPIO33, GND -> GND.',
    'Nối Servo (kicker): GND -> ESP32 GND, V+ -> ESP32 5V, PWM -> ESP32 GPIO25.',
  ],
  starterCode: soccerRobotStarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'l298n1', type: 'wokwi-l298n', x: 220, y: 120, pinMapping: { IN1: 13, IN2: 14, IN3: 16, IN4: 17, ENA: 18, ENB: 19 } },
      { id: 'motorL', type: 'wokwi-dc-motor', x: 60, y: 60, pinMapping: {} },
      { id: 'motorR', type: 'wokwi-dc-motor', x: 60, y: 200, pinMapping: {} },
      { id: 'battery1', type: 'wokwi-battery-pack', x: 400, y: 120, pinMapping: {} },
      { id: 'line1', type: 'wokwi-line-tracking-3ch', x: 220, y: 260, pinMapping: { OUT1: 21, OUT2: 22, OUT3: 23 } },
      { id: 'us1', type: 'wokwi-hc-sr04', x: 220, y: 20, pinMapping: { TRIG: 32, ECHO: 33 } },
      { id: 'servo1', type: 'wokwi-servo', x: 340, y: 300, pinMapping: { PWM: 25 } },
      { id: 'ball1', type: 'wokwi-ball', x: 220, y: -30, pinMapping: {} },
      { id: 'chassis1', type: 'wokwi-robot-chassis', x: 180, y: 320, pinMapping: {} },
      { id: 'wheelL', type: 'wokwi-robot-wheel', x: 30, y: 60, pinMapping: {} },
      { id: 'wheelR', type: 'wokwi-robot-wheel', x: 30, y: 260, pinMapping: {} },
      { id: 'caster1', type: 'wokwi-caster-wheel', x: 430, y: 320, pinMapping: {} },
    ],
    connections: [
      [`${BOARD}:GPIO13`, 'l298n1:IN1'], [`${BOARD}:GPIO14`, 'l298n1:IN2'],
      [`${BOARD}:GPIO16`, 'l298n1:IN3'], [`${BOARD}:GPIO17`, 'l298n1:IN4'],
      [`${BOARD}:GPIO18`, 'l298n1:ENA'], [`${BOARD}:GPIO19`, 'l298n1:ENB'],
      ['motorL:terminal1', 'l298n1:OUT1'], ['motorL:terminal2', 'l298n1:OUT2'],
      ['motorR:terminal1', 'l298n1:OUT3'], ['motorR:terminal2', 'l298n1:OUT4'],
      ['battery1:+', 'l298n1:VIN'], ['battery1:-', 'l298n1:GND'], ['l298n1:GND', GND],
      [`${BOARD}:3V3`, 'line1:VCC'], [`${BOARD}:GPIO21`, 'line1:OUT1'], [`${BOARD}:GPIO22`, 'line1:OUT2'], [`${BOARD}:GPIO23`, 'line1:OUT3'], ['line1:GND', GND],
      [`${BOARD}:3V3`, 'us1:VCC'], [`${BOARD}:GPIO32`, 'us1:TRIG'], [`${BOARD}:GPIO33`, 'us1:ECHO'], ['us1:GND', GND],
      [`${BOARD}:GND.2`, 'servo1:GND'], [`${BOARD}:5V`, 'servo1:V+'], [`${BOARD}:GPIO25`, 'servo1:PWM'],
    ],
    sensorScenario: {
      sensors: {
        line1: { type: 'wokwi-line-tracking-3ch', timeline: [{ timeMs: 0, pattern: 'center' }] },
        us1: {
          type: 'wokwi-hc-sr04',
          timeline: [
            { timeMs: 0, distanceCm: 100 },
            { timeMs: 4000, distanceCm: 8 },
          ],
        },
      },
    },
  },
  expectedBehavior: 'Ban đầu bám line đi thẳng (line=center, 100cm). Khi khoảng cách còn 8cm (<=10cm): dừng ngay, kích hoạt kicker ("Trang thai: SUT BONG"), bất kể line đang ở trạng thái nào.',
  testSteps: [
    'Bấm Run/Compile.',
    'Xác nhận "Trang thai: DI THANG" khi line=center và bóng còn xa.',
    'Xác nhận chuyển ngay sang "Trang thai: SUT BONG" khi khoảng cách xuống 8cm, dù line vẫn đang center.',
  ],
  serialExpectedOutput: 'Trang thai: DI THANG\n...\nTrang thai: SUT BONG',
  teacherNotes: 'Điểm học thuật chính: thứ tự ưu tiên if/else — kiểm tra điều kiện sút bóng TRƯỚC khi xét line, để đảm bảo hành động ưu tiên cao hơn luôn thắng.',
  limitations: 'Kicker dùng digitalWrite đơn giản hoá (không Servo.write() thật, PWM_QEMU_GAP). Không mô phỏng vật lý bóng lăn/va chạm thật — "sút bóng" chỉ là 1 tín hiệu digital.',
};

// ---- Bài "Robot chữa cháy tự động" (doc #9) ----
const firefightRobotStarterCode = `// StemFlow Virtual Lab — Robot chua chay tu dong
// ESP32 DevKit v1 — L298N nhu Bai 4; Flame Sensor DOUT=21; Relay bom nuoc IN=25; Servo voi phun (digitalWrite don gian hoa): GPIO26

const int IN1 = 13, IN2 = 14, IN3 = 16, IN4 = 17, ENA = 18, ENB = 19;
const int FLAME_PIN = 21;
const int PUMP_RELAY_PIN = 25;
const int NOZZLE_PIN = 26;

void forward() { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW); digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW); }
void stopCar() { digitalWrite(IN1, LOW); digitalWrite(IN2, LOW); digitalWrite(IN3, LOW); digitalWrite(IN4, LOW); }

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  digitalWrite(ENA, HIGH); digitalWrite(ENB, HIGH);
  pinMode(FLAME_PIN, INPUT);
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(NOZZLE_PIN, OUTPUT);
}

void loop() {
  bool flame = digitalRead(FLAME_PIN) == HIGH;

  if (flame) {
    stopCar();
    digitalWrite(PUMP_RELAY_PIN, HIGH);
    digitalWrite(NOZZLE_PIN, HIGH);
    Serial.println("Trang thai: DANG DAP LUA");
  } else {
    forward();
    digitalWrite(PUMP_RELAY_PIN, LOW);
    digitalWrite(NOZZLE_PIN, LOW);
    Serial.println("Trang thai: TUAN TRA");
  }
  delay(300);
}
`;

const firefightRobot: VirtualLabSampleExercise = {
  title: 'Robot chữa cháy tự động',
  slug: 'robot-chua-chay-tu-dong',
  category: 'robotics',
  level: 'intermediate',
  estimatedTimeMinutes: 30,
  objective: 'Kết hợp cảm biến lửa (digital, đã học ở "Cảnh báo cháy bằng Flame Sensor") với cơ cấu chấp hành (bơm + vòi phun) để tự động phản ứng, thay vì chỉ cảnh báo.',
  description: 'Robot tuần tra (di chuyển) cho tới khi phát hiện lửa thì dừng lại và kích hoạt bơm nước + vòi phun.',
  components: ['wokwi-l298n', 'wokwi-dc-motor', 'wokwi-battery-pack', 'wokwi-flame-sensor', 'wokwi-relay-module', 'wokwi-servo', 'wokwi-water-tank', 'wokwi-robot-wheel', 'wokwi-caster-wheel', 'wokwi-robot-chassis'],
  supportedLevel: 'wokwi-l298n/wokwi-dc-motor/wokwi-flame-sensor/wokwi-relay-module: Mô phỏng được đầy đủ qua QEMU (đã proven riêng lẻ ở LAB06 và "Cảnh báo cháy bằng Flame Sensor"). wokwi-servo (vòi phun): digitalWrite đơn giản hoá (xem Limitations). wokwi-water-tank/wokwi-robot-wheel/wokwi-caster-wheel/wokwi-robot-chassis: Chỉ hiển thị.',
  wiringGuide: [
    'Nối L298N + 2 DC Motor + Battery Pack giống hệt Bài 4.',
    'Nối Flame Sensor: VCC -> 3V3, GND -> GND, DOUT -> GPIO21.',
    'Nối Relay (bơm nước): VCC -> 3V3, GND -> GND, IN -> GPIO25.',
    'Nối Servo (vòi phun): GND -> ESP32 GND, V+ -> ESP32 5V, PWM -> ESP32 GPIO26.',
  ],
  starterCode: firefightRobotStarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'l298n1', type: 'wokwi-l298n', x: 220, y: 120, pinMapping: { IN1: 13, IN2: 14, IN3: 16, IN4: 17, ENA: 18, ENB: 19 } },
      { id: 'motorL', type: 'wokwi-dc-motor', x: 60, y: 60, pinMapping: {} },
      { id: 'motorR', type: 'wokwi-dc-motor', x: 60, y: 200, pinMapping: {} },
      { id: 'battery1', type: 'wokwi-battery-pack', x: 400, y: 120, pinMapping: {} },
      { id: 'flame1', type: 'wokwi-flame-sensor', x: 220, y: 20, pinMapping: { DOUT: 21 } },
      { id: 'relay1', type: 'wokwi-relay-module', x: 340, y: 260, pinMapping: { IN: 25 } },
      { id: 'servo1', type: 'wokwi-servo', x: 460, y: 260, pinMapping: { PWM: 26 } },
      { id: 'tank1', type: 'wokwi-water-tank', x: 400, y: 320, pinMapping: {} },
      { id: 'chassis1', type: 'wokwi-robot-chassis', x: 180, y: 320, pinMapping: {} },
      { id: 'wheelL', type: 'wokwi-robot-wheel', x: 30, y: 60, pinMapping: {} },
      { id: 'wheelR', type: 'wokwi-robot-wheel', x: 30, y: 260, pinMapping: {} },
      { id: 'caster1', type: 'wokwi-caster-wheel', x: 430, y: 20, pinMapping: {} },
    ],
    connections: [
      [`${BOARD}:GPIO13`, 'l298n1:IN1'], [`${BOARD}:GPIO14`, 'l298n1:IN2'],
      [`${BOARD}:GPIO16`, 'l298n1:IN3'], [`${BOARD}:GPIO17`, 'l298n1:IN4'],
      [`${BOARD}:GPIO18`, 'l298n1:ENA'], [`${BOARD}:GPIO19`, 'l298n1:ENB'],
      ['motorL:terminal1', 'l298n1:OUT1'], ['motorL:terminal2', 'l298n1:OUT2'],
      ['motorR:terminal1', 'l298n1:OUT3'], ['motorR:terminal2', 'l298n1:OUT4'],
      ['battery1:+', 'l298n1:VIN'], ['battery1:-', 'l298n1:GND'], ['l298n1:GND', GND],
      [`${BOARD}:3V3`, 'flame1:VCC'], ['flame1:GND', GND], [`${BOARD}:GPIO21`, 'flame1:DOUT'],
      [`${BOARD}:3V3`, 'relay1:VCC'], ['relay1:GND', GND], [`${BOARD}:GPIO25`, 'relay1:IN'],
      [`${BOARD}:GND.2`, 'servo1:GND'], [`${BOARD}:5V`, 'servo1:V+'], [`${BOARD}:GPIO26`, 'servo1:PWM'],
    ],
    sensorScenario: {
      sensors: {
        flame1: {
          type: 'wokwi-flame-sensor',
          timeline: [
            { timeMs: 0, detected: false },
            { timeMs: 4000, detected: true },
          ],
        },
      },
    },
  },
  expectedBehavior: 'Ban đầu tuần tra (di chuyển, "Trang thai: TUAN TRA"). Khi phát hiện lửa (mốc 4s): dừng ngay, bật relay bơm + vòi phun, in "Trang thai: DANG DAP LUA".',
  testSteps: [
    'Bấm Run/Compile.',
    'Xác nhận "Trang thai: TUAN TRA" và cả 2 motor forward khi chưa có lửa.',
    'Xác nhận chuyển "Trang thai: DANG DAP LUA", cả 2 motor stopped, relay/vòi phun bật đúng lúc mốc 4s.',
  ],
  serialExpectedOutput: 'Trang thai: TUAN TRA\n...\nTrang thai: DANG DAP LUA',
  teacherNotes: 'Mở rộng trực tiếp từ "Cảnh báo cháy bằng Flame Sensor" — thay vì chỉ bật LED/buzzer, ở đây điều khiển thêm động cơ (dừng xe) và relay (bơm).',
  limitations: 'Không mô phỏng lưu lượng nước/áp suất phun thật (Water Pump vẫn ở mức structural-only theo component-compatibility.json). Vòi phun dùng digitalWrite đơn giản hoá (PWM_QEMU_GAP). Không mô phỏng cường độ lửa, chỉ digital HIGH/LOW.',
};

// ---- Bài "Hệ thống sấy nông sản thông minh" (doc #15) ----
const dryingSystemStarterCode = `// StemFlow Virtual Lab — He thong say nong san thong minh
// ESP32 DevKit v1 — DHT11 id="dht1" (SDA=GPIO19, chi de kiem tra day noi); Fan IN=13; Relay (may say) IN=14

#include "StemFlowDHT.h"

const int FAN_PIN = 13;
const int HEATER_RELAY_PIN = 14;
const float TARGET_TEMP_C = 40.0;

StemFlowDHT dht("dht1");

void setup() {
  Serial.begin(115200);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(HEATER_RELAY_PIN, OUTPUT);
}

void loop() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  Serial.print("Nhiet do: "); Serial.print(temperature);
  Serial.print(" C, Do am: "); Serial.print(humidity); Serial.println(" %");

  digitalWrite(FAN_PIN, HIGH);

  if (temperature < TARGET_TEMP_C) {
    digitalWrite(HEATER_RELAY_PIN, HIGH);
    Serial.println("Trang thai: DANG SAY (heater ON)");
  } else {
    digitalWrite(HEATER_RELAY_PIN, LOW);
    Serial.println("Trang thai: DU NHIET (heater OFF)");
  }
  delay(1000);
}
`;

const dryingSystem: VirtualLabSampleExercise = {
  title: 'Hệ thống sấy nông sản thông minh',
  slug: 'he-thong-say-nong-san-thong-minh',
  category: 'physics',
  level: 'intermediate',
  estimatedTimeMinutes: 30,
  objective: 'Kết hợp cảm biến nhiệt độ (DHT) với 2 cơ cấu chấp hành độc lập (Fan luôn bật để lưu thông khí, Relay điều khiển máy sấy theo ngưỡng nhiệt) trong cùng 1 vòng lặp điều khiển.',
  description: 'Quạt luôn chạy để lưu thông khí; máy sấy (qua relay) chỉ bật khi nhiệt độ dưới ngưỡng mục tiêu (40°C), tắt khi đã đủ nhiệt.',
  components: ['wokwi-dht11', 'wokwi-fan', 'wokwi-relay-module', 'wokwi-heating-element', 'wokwi-battery-pack'],
  supportedLevel: 'wokwi-dht11 (qua StemFlowDHT)/wokwi-fan/wokwi-relay-module: Mô phỏng được đầy đủ qua QEMU (đã proven riêng lẻ ở Bài 10 và các bài Relay/Fan trước). wokwi-heating-element: Structural-only (không có runtime bật/tắt riêng — nhiệt thật do Relay điều khiển, heating-element chỉ minh hoạ tải tiêu thụ).',
  wiringGuide: [
    'Đặt DHT11 với id "dht1" (khớp StemFlowDHT("dht1") trong code), SDA -> GPIO19 (chỉ để qua bước kiểm tra nối dây).',
    'Nối Fan: IN -> GPIO13, "+"/"-" -> Battery Pack.',
    'Nối Relay (máy sấy): VCC -> 3V3, GND -> GND, IN -> GPIO14.',
    'Nối Heating Element vào đường ra của Relay (NO/COM) và Battery Pack — chỉ mang tính minh hoạ tải.',
  ],
  starterCode: dryingSystemStarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'dht1', type: 'wokwi-dht11', x: 220, y: 20, pinMapping: { SDA: 19 } },
      { id: 'fan1', type: 'wokwi-fan', x: 220, y: 120, pinMapping: { IN: 13 } },
      { id: 'relay1', type: 'wokwi-relay-module', x: 340, y: 120, pinMapping: { IN: 14 } },
      { id: 'heater1', type: 'wokwi-heating-element', x: 460, y: 120, pinMapping: {} },
      { id: 'battery1', type: 'wokwi-battery-pack', x: 340, y: 220, pinMapping: {} },
    ],
    connections: [
      [`${BOARD}:3V3`, 'dht1:VCC'], [`${BOARD}:GPIO19`, 'dht1:SDA'], ['dht1:GND', GND],
      [`${BOARD}:GPIO13`, 'fan1:IN'], ['fan1:+', 'battery1:+'], ['fan1:-', 'battery1:-'],
      [`${BOARD}:3V3`, 'relay1:VCC'], ['relay1:GND', GND], [`${BOARD}:GPIO14`, 'relay1:IN'],
      ['battery1:+', 'relay1:COM'], ['relay1:NO', 'heater1:+'], ['heater1:-', 'battery1:-'],
    ],
    sensorScenario: {
      sensors: {
        dht1: {
          type: 'wokwi-dht11',
          timeline: [
            { timeMs: 0, temperature: 30, humidity: 70 },
            { timeMs: 5000, temperature: 45, humidity: 40 },
          ],
        },
      },
    },
  },
  expectedBehavior: 'Fan luôn bật (FAN_PIN=HIGH). Khi nhiệt độ 30°C (< 40°C): relay máy sấy bật ("DANG SAY"). Khi nhiệt độ tăng lên 45°C (>= 40°C): relay tắt ("DU NHIET").',
  testSteps: [
    'Bấm Run/Compile.',
    'Xác nhận Serial in đúng nhiệt độ/độ ẩm theo kịch bản.',
    'Xác nhận "Trang thai: DANG SAY" khi 30°C, chuyển "Trang thai: DU NHIET" đúng lúc nhiệt độ đạt 45°C.',
  ],
  serialExpectedOutput: 'Nhiet do: 30.00 C, Do am: 70.00 %\nTrang thai: DANG SAY (heater ON)\n...\nNhiet do: 45.00 C, Do am: 40.00 %\nTrang thai: DU NHIET (heater OFF)',
  teacherNotes: 'Điểm học thuật chính: 1 vòng lặp điều khiển 2 cơ cấu chấp hành ĐỘC LẬP theo 2 quy tắc khác nhau (Fan luôn bật, Relay theo ngưỡng) — không nhầm lẫn logic giữa 2 cơ cấu.',
  limitations: 'Heating Element không có runtime bật/tắt riêng (structural-only theo component-compatibility.json) — nhiệt độ thật do relay quyết định, không mô phỏng nhiệt lượng/tốc độ sấy thật. Không có màn hình LCD/OLED hiển thị (cần I2C, hiện chưa hỗ trợ — xem I2C_CAPABILITY_GAP).',
};

// ============================================================================
// ROBOT DELIVERY MINI — module LAB01-LAB08 (ACCELERATION PHASE 5)
//
// 8 bài tiến trình, MỖI bài xây trên bài trước, kết thúc ở robot giao hàng mini
// hoàn chỉnh (ESP32 + HC-SR04 + L298N + 2 DC Motor). LAB03/LAB07/LAB08 tái sử
// dụng ĐÚNG logic điện đã verify ở Bài 4/5/7 phía trên (không phát minh lại) —
// khác biệt duy nhất là numbering theo module riêng + 1 bộ chân GPIO CHUNG
// (ROBOT_DELIVERY_PINS) dùng xuyên suốt LAB02-LAB08, tránh lặp số GPIO rải rác
// từng file/từng bài như 3 bài gốc phía trên từng làm độc lập.
//
// GOLDEN RULE (kế thừa từ các milestone trước): L298N chỉ có runtime THẬT qua
// QEMU (L298nModel.cs đọc digitalWrite qua SF_EVENT) — KHÔNG có trong
// Educational interpreter. HC-SR04 (pulseIn) cũng CHỈ có qua QEMU
// (SensorRuntimeHeaderGenerator) — "Do not port pulseIn to Educational" đúng
// như chỉ định milestone. Vì vậy LAB02-LAB08 (có L298N và/hoặc HC-SR04) LUÔN
// resolve sang QEMU tự động qua ISimulationRunnerResolver hiện có (không cần
// set field "mode" nào ở đây — kiến trúc chọn runtime dựa trên linh kiện,
// không dựa trên nhãn bài học). Chỉ LAB01 (ESP32 + LED, không linh kiện nào
// cần QEMU) mới thật sự chạy qua Educational.
// ============================================================================
const ROBOT_DELIVERY_PINS = {
  MOTOR_L_IN1: 13, // Motor trái (Motor A trên L298N)
  MOTOR_L_IN2: 14,
  MOTOR_R_IN1: 16, // Motor phải (Motor B trên L298N)
  MOTOR_R_IN2: 17,
  MOTOR_ENA: 18,
  MOTOR_ENB: 19,
  HC_TRIG: 32,
  HC_ECHO: 33,
  WARNING_LED: 25,
} as const;

// ----------------------------------------------------------------------------
// LAB01 — ESP32 Digital Output (Educational)
// ----------------------------------------------------------------------------
const lab01StarterCode = `// Robot Delivery Mini - LAB01: ESP32 Digital Output
// Muc tieu: xac minh duong dieu khien co ban cua ESP32 truoc khi ghep dong co/cam bien.
// LED: A (anode) -> GPIO13, C (cathode) -> GND

const int LED_PIN = 13;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("Trang thai: LED ON");
  delay(500);
  digitalWrite(LED_PIN, LOW);
  Serial.println("Trang thai: LED OFF");
  delay(500);
}
`;

const robotDeliveryLab01: VirtualLabSampleExercise = {
  title: '[Robot Giao Hàng Mini] LAB01 — ESP32 Digital Output',
  slug: 'robot-delivery-lab01-esp32-output',
  module: 'Robot Giao Hàng Mini',
  category: 'robotics',
  level: 'beginner',
  estimatedTimeMinutes: 15,
  objective: 'Xác minh đường điều khiển digitalWrite/pinMode cơ bản của ESP32 hoạt động đúng trước khi ghép động cơ/cảm biến ở các bài sau.',
  description: 'Bài mở đầu module Robot Giao Hàng Mini (LAB01/8). Không yêu cầu tiên quyết. Nhiệm vụ: nháy LED mỗi 500ms và quan sát Serial Monitor khớp đúng trạng thái. Input: không có tín hiệu vào. Output: 1 tín hiệu digital ra LED.',
  components: ['wokwi-led'],
  supportedLevel: 'wokwi-led: Mô phỏng được đầy đủ. Code đủ đơn giản để chạy đúng dù hệ thống chọn Educational runtime hay QEMU — runner thực tế do cấu hình toàn hệ thống (SimulationRunner:DefaultMode) quyết định, không có override riêng theo từng Lab.',
  wiringGuide: [
    'Đặt ESP32 DevKit v1 và 1 LED lên canvas.',
    'Nối LED: chân A (anode) -> GPIO13, chân C (cathode) -> ESP32 GND.',
  ],
  starterCode: lab01StarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [{ id: 'led1', type: 'wokwi-led', x: 220, y: 120, pinMapping: { A: 13 } }],
    connections: [
      [`${BOARD}:GPIO13`, 'led1:A'],
      ['led1:C', GND],
    ],
  },
  expectedBehavior: 'LED nháy sáng/tắt đều đặn mỗi 500ms; Serial Monitor in "LED ON"/"LED OFF" khớp đúng từng nhịp.',
  testSteps: [
    'Bấm Run/Compile.',
    'Diagram hợp lệ (đúng 1 LED, đủ 2 kết nối A/C).',
    'Code parse được, Run trả PASS.',
    'Quan sát LED đổi trạng thái ON/OFF đúng chu kỳ, khớp Serial Monitor.',
  ],
  serialExpectedOutput: 'Trang thai: LED ON\nTrang thai: LED OFF\nTrang thai: LED ON\n...',
  teacherNotes: 'Bài nền tảng cho cả module — không yêu cầu tiên quyết. Học sinh cần hoàn thành PASS bài này trước khi sang LAB02 (giới thiệu L298N).',
  limitations: 'Chưa dùng linh kiện robot thật nào (L298N/HC-SR04) — thuần kiểm tra đường tín hiệu digital output.',
  keyConcepts: [
    "digitalWrite()/pinMode() điều khiển GPIO ở mức HIGH/LOW",
    "delay() tạm dừng chương trình theo mili giây",
  ],
  hints: [
    "Nếu LED không sáng, kiểm tra chiều nối A (dài)/C (ngắn) và đúng GPIO13",
  ],
  extensionQuestions: [
    "Nếu đổi delay(500) thành delay(100), điều gì thay đổi?",
    "Làm sao nháy LED theo mã Morse (chấm ngắn, gạch dài)?",
  ],
};

// ----------------------------------------------------------------------------
// LAB02 — L298N One Motor (QEMU)
// ----------------------------------------------------------------------------
const lab02StarterCode = `// Robot Delivery Mini - LAB02: L298N dieu khien 1 dong co
// ESP32 DevKit v1 - L298N Motor A (dieu khien): IN1=${ROBOT_DELIVERY_PINS.MOTOR_L_IN1}, IN2=${ROBOT_DELIVERY_PINS.MOTOR_L_IN2}, ENA=${ROBOT_DELIVERY_PINS.MOTOR_ENA}
// Motor B (chua dung, giu LOW de tat): IN3=${ROBOT_DELIVERY_PINS.MOTOR_R_IN1}, IN4=${ROBOT_DELIVERY_PINS.MOTOR_R_IN2}, ENB=${ROBOT_DELIVERY_PINS.MOTOR_ENB}
// L298N that luon co du 4 chan IN1-IN4 tren module (kha ca 2 kenh du chi dung 1) - noi day du,
// code chi dieu khien kenh A.

const int IN1 = ${ROBOT_DELIVERY_PINS.MOTOR_L_IN1};
const int IN2 = ${ROBOT_DELIVERY_PINS.MOTOR_L_IN2};
const int IN3 = ${ROBOT_DELIVERY_PINS.MOTOR_R_IN1};
const int IN4 = ${ROBOT_DELIVERY_PINS.MOTOR_R_IN2};
const int ENA = ${ROBOT_DELIVERY_PINS.MOTOR_ENA};
const int ENB = ${ROBOT_DELIVERY_PINS.MOTOR_ENB};

void motorForward() { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  Serial.println("Trang thai: FORWARD"); }
void motorStop()    { digitalWrite(IN1, LOW);  digitalWrite(IN2, LOW);  Serial.println("Trang thai: STOP"); }

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT);
  pinMode(ENB, OUTPUT);
  digitalWrite(ENA, HIGH);
  digitalWrite(ENB, HIGH);
  digitalWrite(IN3, LOW);  // Kenh B chua dung, giu tat
  digitalWrite(IN4, LOW);
}

void loop() {
  motorForward();
  delay(2000);
  motorStop();
  delay(2000);
}
`;

const robotDeliveryLab02: VirtualLabSampleExercise = {
  title: '[Robot Giao Hàng Mini] LAB02 — L298N Một Động Cơ',
  slug: 'robot-delivery-lab02-l298n-one-motor',
  module: 'Robot Giao Hàng Mini',
  category: 'robotics',
  level: 'beginner',
  estimatedTimeMinutes: 20,
  objective: 'Hiểu nguyên lý điều khiển 1 động cơ DC qua cầu H L298N bằng cặp tín hiệu digital IN1/IN2 — không nối động cơ trực tiếp vào ESP32.',
  description: 'Yêu cầu hoàn thành LAB01. Động cơ A lặp chu trình: quay tiến (FORWARD) 2s -> dừng (STOP) 2s. Input: 2 tín hiệu digitalWrite (IN1, IN2). Output: trạng thái động cơ hiển thị trên card L298N. L298N thật luôn có đủ 4 chân IN1-IN4 trên module (dù chỉ dùng 1 kênh) nên bài này vẫn nối đủ IN1-IN4/ENA/ENB — code chỉ điều khiển kênh A (IN1/IN2), kênh B (IN3/IN4) giữ LOW (tắt).',
  components: ['wokwi-l298n', 'wokwi-dc-motor', 'wokwi-battery-pack'],
  supportedLevel: 'wokwi-l298n: Mô phỏng được (trạng thái forward/stopped suy ra thật từ digitalWrite IN1/IN2 qua QEMU). wokwi-dc-motor: Mô phỏng được (theo trạng thái L298N tương ứng).',
  wiringGuide: [
    'Đặt ESP32 DevKit v1, 1 L298N, 1 DC Motor, 1 Battery Pack lên canvas.',
    `Nối ESP32 GPIO${ROBOT_DELIVERY_PINS.MOTOR_L_IN1} -> L298N IN1, GPIO${ROBOT_DELIVERY_PINS.MOTOR_L_IN2} -> IN2, GPIO${ROBOT_DELIVERY_PINS.MOTOR_R_IN1} -> IN3, GPIO${ROBOT_DELIVERY_PINS.MOTOR_R_IN2} -> IN4, GPIO${ROBOT_DELIVERY_PINS.MOTOR_ENA} -> ENA, GPIO${ROBOT_DELIVERY_PINS.MOTOR_ENB} -> ENB.`,
    'Nối Motor: terminal1/2 -> L298N OUT1/OUT2 (KHÔNG nối motor thẳng vào GPIO ESP32). Kênh B (OUT3/OUT4) không cần nối motor ở bài này.',
    'Nối Battery Pack (+) -> L298N VIN, Battery Pack (-) -> L298N GND. Nối L298N GND -> ESP32 GND.',
  ],
  starterCode: lab02StarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'l298n1', type: 'wokwi-l298n', x: 220, y: 120, pinMapping: { IN1: ROBOT_DELIVERY_PINS.MOTOR_L_IN1, IN2: ROBOT_DELIVERY_PINS.MOTOR_L_IN2, IN3: ROBOT_DELIVERY_PINS.MOTOR_R_IN1, IN4: ROBOT_DELIVERY_PINS.MOTOR_R_IN2, ENA: ROBOT_DELIVERY_PINS.MOTOR_ENA, ENB: ROBOT_DELIVERY_PINS.MOTOR_ENB } },
      { id: 'motorA', type: 'wokwi-dc-motor', x: 60, y: 60, pinMapping: {} },
      { id: 'battery1', type: 'wokwi-battery-pack', x: 400, y: 120, pinMapping: {} },
    ],
    connections: [
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_L_IN1}`, 'l298n1:IN1'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_L_IN2}`, 'l298n1:IN2'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_R_IN1}`, 'l298n1:IN3'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_R_IN2}`, 'l298n1:IN4'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_ENA}`, 'l298n1:ENA'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_ENB}`, 'l298n1:ENB'],
      ['motorA:terminal1', 'l298n1:OUT1'],
      ['motorA:terminal2', 'l298n1:OUT2'],
      ['battery1:+', 'l298n1:VIN'],
      ['battery1:-', 'l298n1:GND'],
      ['l298n1:GND', GND],
    ],
  },
  expectedBehavior: 'Card L298N/Motor A đổi trạng thái forward/stopped đúng chu kỳ 2s/2s; Serial log khớp FORWARD/STOP. Kênh B không có motor gắn nên không hiển thị trạng thái.',
  testSteps: [
    'Bấm Run/Compile.',
    'Diagram hợp lệ: đủ IN1-IN4/ENA/ENB trên L298N; không có kết nối trực tiếp motor -> ESP32 GPIO (bắt buộc qua L298N OUT).',
    'Quan sát card L298N/Motor A đổi FORWARD -> STOP đúng thứ tự, khớp Serial Monitor.',
  ],
  serialExpectedOutput: 'Trang thai: FORWARD\nTrang thai: STOP\nTrang thai: FORWARD\n...',
  teacherNotes: 'Yêu cầu hoàn thành LAB01. Dùng đúng bộ chân ROBOT_DELIVERY_PINS sẽ được tái sử dụng nguyên vẹn cho LAB03-LAB08 (Motor trái). Nối đủ IN1-IN4 dù chỉ dùng 1 kênh phản ánh đúng module L298N thật (luôn có 4 chân IN cố định).',
  limitations: 'Không có mô phỏng vật lý chuyển động thật — chỉ mô phỏng đúng trạng thái điện của động cơ. Chỉ 1 động cơ có tải thật, kênh B chỉ nối dây làm quen (chưa gắn motor).',
  keyConcepts: [
    "L298N là cầu H, dùng 2 chân IN điều khiển 1 động cơ (HIGH/LOW quyết định quay/dừng)",
    "ENA là chân cho phép động cơ hoạt động (enable)",
  ],
  hints: [
    "Nếu Motor A không đổi trạng thái, kiểm tra ENA đã set HIGH trong setup() chưa",
  ],
  extensionQuestions: [
    "Điều gì xảy ra nếu IN1 và IN2 cùng ở mức HIGH?",
    "Làm sao đảo chiều quay động cơ mà không đổi code, chỉ đổi cách nối dây?",
  ],
};

// ----------------------------------------------------------------------------
// LAB03 — L298N Two Motors (QEMU) — mở rộng LAB02 sang cả 2 động cơ
// ----------------------------------------------------------------------------
const lab03StarterCode = `// Robot Delivery Mini - LAB03: L298N dieu khien 2 dong co (trai/phai)
// ESP32 DevKit v1 - Motor trai: IN1=${ROBOT_DELIVERY_PINS.MOTOR_L_IN1}, IN2=${ROBOT_DELIVERY_PINS.MOTOR_L_IN2} | Motor phai: IN3=${ROBOT_DELIVERY_PINS.MOTOR_R_IN1}, IN4=${ROBOT_DELIVERY_PINS.MOTOR_R_IN2} | ENA=${ROBOT_DELIVERY_PINS.MOTOR_ENA}, ENB=${ROBOT_DELIVERY_PINS.MOTOR_ENB}

const int IN1 = ${ROBOT_DELIVERY_PINS.MOTOR_L_IN1}, IN2 = ${ROBOT_DELIVERY_PINS.MOTOR_L_IN2};
const int IN3 = ${ROBOT_DELIVERY_PINS.MOTOR_R_IN1}, IN4 = ${ROBOT_DELIVERY_PINS.MOTOR_R_IN2};
const int ENA = ${ROBOT_DELIVERY_PINS.MOTOR_ENA}, ENB = ${ROBOT_DELIVERY_PINS.MOTOR_ENB};

void forward()   { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);  Serial.println("Trang thai: FORWARD"); }
void stopCar()    { digitalWrite(IN1, LOW);  digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW);  Serial.println("Trang thai: STOP"); }
void turnLeft()   { digitalWrite(IN1, LOW);  digitalWrite(IN2, LOW);  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);  Serial.println("Trang thai: TURN LEFT"); }
void turnRight()  { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW);  Serial.println("Trang thai: TURN RIGHT"); }

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  digitalWrite(ENA, HIGH);
  digitalWrite(ENB, HIGH);
}

void loop() {
  forward();    delay(2000);
  stopCar();    delay(1000);
  turnLeft();   delay(1000);
  stopCar();    delay(1000);
  turnRight();  delay(1000);
  stopCar();    delay(2000);
}
`;

const robotDeliveryLab03: VirtualLabSampleExercise = {
  title: '[Robot Giao Hàng Mini] LAB03 — L298N Hai Động Cơ',
  slug: 'robot-delivery-lab03-two-motors',
  module: 'Robot Giao Hàng Mini',
  category: 'robotics',
  level: 'beginner',
  estimatedTimeMinutes: 25,
  objective: 'Mở rộng LAB02 sang điều khiển đồng thời 2 động cơ trái/phải để tạo các hành vi forward/stop/turnLeft/turnRight.',
  description: 'Yêu cầu hoàn thành LAB02. Robot lặp: tiến 2s -> dừng 1s -> rẽ trái 1s -> dừng 1s -> rẽ phải 1s -> dừng 2s. Chiến lược rẽ đơn giản: 1 bên dừng, 1 bên quay (không dùng lùi bánh đối diện). Input: 4 tín hiệu digitalWrite (IN1-IN4). Output: trạng thái 2 động cơ hiển thị độc lập.',
  components: ['wokwi-l298n', 'wokwi-dc-motor', 'wokwi-battery-pack'],
  supportedLevel: 'wokwi-l298n/wokwi-dc-motor: Mô phỏng được (như LAB02, mở rộng đủ 2 cặp IN1-4).',
  wiringGuide: [
    'Đặt ESP32 DevKit v1, 1 L298N, 2 DC Motor (trái + phải), 1 Battery Pack lên canvas.',
    `Nối GPIO${ROBOT_DELIVERY_PINS.MOTOR_L_IN1}->IN1, GPIO${ROBOT_DELIVERY_PINS.MOTOR_L_IN2}->IN2, GPIO${ROBOT_DELIVERY_PINS.MOTOR_R_IN1}->IN3, GPIO${ROBOT_DELIVERY_PINS.MOTOR_R_IN2}->IN4, GPIO${ROBOT_DELIVERY_PINS.MOTOR_ENA}->ENA, GPIO${ROBOT_DELIVERY_PINS.MOTOR_ENB}->ENB.`,
    'Nối Motor trái: terminal1/2 -> OUT1/OUT2. Nối Motor phải: terminal1/2 -> OUT3/OUT4.',
    'Nối Battery Pack + Battery Pack GND như LAB02.',
  ],
  starterCode: lab03StarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'l298n1', type: 'wokwi-l298n', x: 220, y: 120, pinMapping: { IN1: ROBOT_DELIVERY_PINS.MOTOR_L_IN1, IN2: ROBOT_DELIVERY_PINS.MOTOR_L_IN2, IN3: ROBOT_DELIVERY_PINS.MOTOR_R_IN1, IN4: ROBOT_DELIVERY_PINS.MOTOR_R_IN2, ENA: ROBOT_DELIVERY_PINS.MOTOR_ENA, ENB: ROBOT_DELIVERY_PINS.MOTOR_ENB } },
      { id: 'motorL', type: 'wokwi-dc-motor', x: 60, y: 60, pinMapping: {} },
      { id: 'motorR', type: 'wokwi-dc-motor', x: 60, y: 200, pinMapping: {} },
      { id: 'battery1', type: 'wokwi-battery-pack', x: 400, y: 120, pinMapping: {} },
    ],
    connections: [
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_L_IN1}`, 'l298n1:IN1'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_L_IN2}`, 'l298n1:IN2'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_R_IN1}`, 'l298n1:IN3'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_R_IN2}`, 'l298n1:IN4'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_ENA}`, 'l298n1:ENA'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_ENB}`, 'l298n1:ENB'],
      ['motorL:terminal1', 'l298n1:OUT1'],
      ['motorL:terminal2', 'l298n1:OUT2'],
      ['motorR:terminal1', 'l298n1:OUT3'],
      ['motorR:terminal2', 'l298n1:OUT4'],
      ['battery1:+', 'l298n1:VIN'],
      ['battery1:-', 'l298n1:GND'],
      ['l298n1:GND', GND],
    ],
  },
  expectedBehavior: 'Card L298N/2 motor đổi trạng thái đúng chu trình FORWARD -> STOP -> TURN LEFT -> STOP -> TURN RIGHT -> STOP; trong TURN LEFT, motor phải quay còn motor trái dừng (và ngược lại khi TURN RIGHT).',
  testSteps: [
    'Bấm Run/Compile.',
    'Quan sát 2 card motor đổi trạng thái ĐÚNG chu trình và ĐÚNG động cơ (rẽ trái: motor trái STOP, motor phải FORWARD — không phải ngược lại).',
    'Đối chiếu Serial Monitor khớp từng trạng thái.',
  ],
  serialExpectedOutput: 'Trang thai: FORWARD\nTrang thai: STOP\nTrang thai: TURN LEFT\nTrang thai: STOP\nTrang thai: TURN RIGHT\nTrang thai: STOP\n...',
  teacherNotes: 'Yêu cầu hoàn thành LAB02. Đây là nền tảng robot 2 bánh dùng lại nguyên vẹn cho LAB06-LAB08 — không đổi số GPIO từ bài này trở đi.',
  limitations: 'Không có mô phỏng vật lý chuyển động thật trên mặt phẳng — chỉ đúng trạng thái điện của từng động cơ.',
  keyConcepts: [
    "2 động cơ độc lập = 2 cặp IN (IN1/IN2 và IN3/IN4) trên cùng 1 module L298N",
    "Rẽ trái/phải bằng cách 1 bên dừng, bên kia chạy (differential steering đơn giản)",
  ],
  hints: [
    "Nếu cả 2 motor cùng quay lúc rẽ, kiểm tra lại logic turnLeft()/turnRight()",
  ],
  extensionQuestions: [
    "Làm sao rẽ \"gắt\" hơn bằng cách cho 1 bánh lùi thay vì chỉ dừng?",
    "Nếu muốn xe quay tại chỗ (spin), cần đổi gì trong turnLeft/turnRight?",
  ],
};

// ----------------------------------------------------------------------------
// LAB04 — HC-SR04 Distance (QEMU, chưa có động cơ)
// ----------------------------------------------------------------------------
const lab04StarterCode = `// Robot Delivery Mini - LAB04: Doc khoang cach HC-SR04
// ESP32 DevKit v1 - HC-SR04: TRIG=${ROBOT_DELIVERY_PINS.HC_TRIG}, ECHO=${ROBOT_DELIVERY_PINS.HC_ECHO}

const int TRIG_PIN = ${ROBOT_DELIVERY_PINS.HC_TRIG};
const int ECHO_PIN = ${ROBOT_DELIVERY_PINS.HC_ECHO};

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  return duration / 58.0;
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  float distance = readDistanceCm();
  Serial.print("Khoang cach: ");
  Serial.print(distance);
  Serial.println(" cm");
  delay(500);
}
`;

const robotDeliveryLab04: VirtualLabSampleExercise = {
  title: '[Robot Giao Hàng Mini] LAB04 — HC-SR04 Đọc Khoảng Cách',
  slug: 'robot-delivery-lab04-hc-sr04-distance',
  module: 'Robot Giao Hàng Mini',
  category: 'robotics',
  level: 'beginner',
  estimatedTimeMinutes: 20,
  objective: 'Hiểu cơ chế pulseIn() đọc khoảng cách từ HC-SR04 qua Sensor Input Bridge (kịch bản timeline), tách biệt với logic điều khiển động cơ.',
  description: 'Không yêu cầu tiên quyết (độc lập với LAB01-03). Đọc khoảng cách mỗi 500ms và in Serial, chưa điều khiển động cơ. Input: xung ECHO mô phỏng theo kịch bản. Output: giá trị khoảng cách (cm) qua Serial.',
  components: ['wokwi-hc-sr04'],
  supportedLevel: 'wokwi-hc-sr04: giá trị khoảng cách mô phỏng qua kịch bản (Sensor Input Bridge) — pulseIn() đọc đúng giá trị đã cấu hình theo mốc thời gian, KHÔNG phải đo khoảng cách vật lý thật trong scene.',
  wiringGuide: [
    'Đặt ESP32 DevKit v1 và 1 HC-SR04 lên canvas.',
    `Nối HC-SR04: VCC -> 3V3, GND -> GND, TRIG -> GPIO${ROBOT_DELIVERY_PINS.HC_TRIG}, ECHO -> GPIO${ROBOT_DELIVERY_PINS.HC_ECHO}.`,
  ],
  starterCode: lab04StarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [{ id: 'us1', type: 'wokwi-hc-sr04', x: 220, y: 120, pinMapping: { TRIG: ROBOT_DELIVERY_PINS.HC_TRIG, ECHO: ROBOT_DELIVERY_PINS.HC_ECHO } }],
    connections: [
      [`${BOARD}:3V3`, 'us1:VCC'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.HC_TRIG}`, 'us1:TRIG'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.HC_ECHO}`, 'us1:ECHO'],
      ['us1:GND', GND],
    ],
    sensorScenario: {
      sensors: {
        us1: {
          type: 'wokwi-hc-sr04',
          timeline: [
            { timeMs: 0, distanceCm: 100 },
            { timeMs: 4000, distanceCm: 50 },
            { timeMs: 8000, distanceCm: 20 },
          ],
        },
      },
    },
  },
  expectedBehavior: 'Serial Monitor in đúng 3 mốc khoảng cách theo kịch bản: 100cm (0-4s) -> 50cm (4-8s) -> 20cm (sau 8s).',
  testSteps: [
    'Bấm Run/Compile.',
    'Theo dõi Serial Monitor: giá trị "Khoang cach" khớp đúng 3 mốc kịch bản 100 -> 50 -> 20 cm.',
  ],
  serialExpectedOutput: 'Khoang cach: 100.00 cm\n...\nKhoang cach: 50.00 cm\n...\nKhoang cach: 20.00 cm\n...',
  teacherNotes: 'Có thể chạy song song với LAB01-03 (không phụ thuộc nhau) — cả hai nhánh hội tụ ở LAB06.',
  limitations: 'Khoảng cách là kịch bản định sẵn theo thời gian, không đo vật cản thật trong scene.',
  keyConcepts: [
    "HC-SR04 đo khoảng cách bằng thời gian phản hồi sóng siêu âm (pulseIn)",
    "Công thức quy đổi: khoảng cách (cm) = thời gian (µs) / 58",
  ],
  hints: [
    "Nếu Serial Monitor không hiện giá trị, kiểm tra Serial.begin(115200) đã gọi trong setup() chưa",
  ],
  extensionQuestions: [
    "Vì sao chia cho 58 mà không phải một số khác?",
    "Điều gì xảy ra nếu ECHO nối nhầm sang GPIO khác?",
  ],
};

// ----------------------------------------------------------------------------
// LAB05 — Obstacle Warning (QEMU, LED cảnh báo, chưa có động cơ)
// ----------------------------------------------------------------------------
const lab05StarterCode = `// Robot Delivery Mini - LAB05: Canh bao vat can bang LED
// ESP32 DevKit v1 - HC-SR04 nhu LAB04; LED canh bao: GPIO${ROBOT_DELIVERY_PINS.WARNING_LED}

const int TRIG_PIN = ${ROBOT_DELIVERY_PINS.HC_TRIG};
const int ECHO_PIN = ${ROBOT_DELIVERY_PINS.HC_ECHO};
const int WARNING_LED_PIN = ${ROBOT_DELIVERY_PINS.WARNING_LED};
const float WARNING_THRESHOLD_CM = 20.0;

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  return duration / 58.0;
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(WARNING_LED_PIN, OUTPUT);
}

void loop() {
  float distance = readDistanceCm();
  Serial.print("Khoang cach: ");
  Serial.print(distance);
  Serial.println(" cm");

  if (distance <= WARNING_THRESHOLD_CM) {
    digitalWrite(WARNING_LED_PIN, HIGH);
    Serial.println("Trang thai: WARNING ON");
  } else {
    digitalWrite(WARNING_LED_PIN, LOW);
    Serial.println("Trang thai: WARNING OFF");
  }

  delay(500);
}
`;

const robotDeliveryLab05: VirtualLabSampleExercise = {
  title: '[Robot Giao Hàng Mini] LAB05 — Cảnh Báo Vật Cản',
  slug: 'robot-delivery-lab05-obstacle-warning',
  module: 'Robot Giao Hàng Mini',
  category: 'robotics',
  level: 'beginner',
  estimatedTimeMinutes: 20,
  objective: 'Áp dụng logic ngưỡng (threshold) trên giá trị HC-SR04 để bật/tắt tín hiệu cảnh báo — bước trung gian trước khi điều khiển động cơ ở LAB06.',
  description: 'Yêu cầu hoàn thành LAB04. LED cảnh báo bật khi khoảng cách <= 20cm, tắt khi > 20cm. Input: khoảng cách HC-SR04. Output: 1 tín hiệu digital LED cảnh báo.',
  components: ['wokwi-hc-sr04', 'wokwi-led'],
  supportedLevel: 'wokwi-hc-sr04: như LAB04. wokwi-led: Mô phỏng đầy đủ.',
  wiringGuide: [
    'Nối HC-SR04 giống hệt LAB04.',
    `Thêm 1 LED cảnh báo: A -> GPIO${ROBOT_DELIVERY_PINS.WARNING_LED}, C -> GND.`,
  ],
  starterCode: lab05StarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'us1', type: 'wokwi-hc-sr04', x: 220, y: 120, pinMapping: { TRIG: ROBOT_DELIVERY_PINS.HC_TRIG, ECHO: ROBOT_DELIVERY_PINS.HC_ECHO } },
      { id: 'led1', type: 'wokwi-led', x: 400, y: 120, pinMapping: { A: ROBOT_DELIVERY_PINS.WARNING_LED } },
    ],
    connections: [
      [`${BOARD}:3V3`, 'us1:VCC'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.HC_TRIG}`, 'us1:TRIG'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.HC_ECHO}`, 'us1:ECHO'],
      ['us1:GND', GND],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.WARNING_LED}`, 'led1:A'],
      ['led1:C', GND],
    ],
    sensorScenario: {
      sensors: {
        us1: {
          type: 'wokwi-hc-sr04',
          timeline: [
            { timeMs: 0, distanceCm: 100 },
            { timeMs: 4000, distanceCm: 10 },
            { timeMs: 8000, distanceCm: 100 },
          ],
        },
      },
    },
  },
  expectedBehavior: 'LED cảnh báo OFF (0-4s, 100cm) -> ON (4-8s, 10cm) -> OFF (sau 8s, 100cm trở lại).',
  testSteps: [
    'Bấm Run/Compile.',
    'Xác nhận LED cảnh báo CHỈ bật đúng khoảng khoảng cách <= 20cm (mốc 4-8s).',
    'Đối chiếu Serial Monitor "WARNING ON"/"WARNING OFF" khớp đúng mốc.',
  ],
  serialExpectedOutput: 'Khoang cach: 100.00 cm\nTrang thai: WARNING OFF\n...\nKhoang cach: 10.00 cm\nTrang thai: WARNING ON\n...',
  teacherNotes: 'Yêu cầu hoàn thành LAB04. Ngưỡng cảnh báo (20cm) khác ngưỡng dừng xe ở LAB06 (30cm) một cách có chủ đích — cảnh báo sớm hơn hành động dừng thật.',
  limitations: 'Chưa có động cơ — thuần logic cảnh báo. Khoảng cách vẫn là kịch bản định sẵn.',
  keyConcepts: [
    "So sánh giá trị cảm biến với 1 ngưỡng (threshold) để ra quyết định bật/tắt",
    "Toán tử <= dùng để kiểm tra \"nhỏ hơn hoặc bằng\"",
  ],
  hints: [
    "Nếu LED luôn sáng hoặc luôn tắt, kiểm tra lại chiều so sánh (<= hay >=)",
  ],
  extensionQuestions: [
    "Nếu muốn cảnh báo ở 2 mức (gần/rất gần), cần thêm gì vào code?",
    "Điều gì xảy ra khi khoảng cách đúng bằng 20cm?",
  ],
};

// ----------------------------------------------------------------------------
// LAB06 — Robot Stop on Obstacle (QEMU) — CỔNG TÍCH HỢP QUAN TRỌNG NHẤT
// ----------------------------------------------------------------------------
const lab06StarterCode = `// Robot Delivery Mini - LAB06: Dung xe khi gap vat can (tich hop dau tien)
// ESP32 DevKit v1 - L298N 2 dong co nhu LAB03; HC-SR04 nhu LAB04

const int IN1 = ${ROBOT_DELIVERY_PINS.MOTOR_L_IN1}, IN2 = ${ROBOT_DELIVERY_PINS.MOTOR_L_IN2};
const int IN3 = ${ROBOT_DELIVERY_PINS.MOTOR_R_IN1}, IN4 = ${ROBOT_DELIVERY_PINS.MOTOR_R_IN2};
const int ENA = ${ROBOT_DELIVERY_PINS.MOTOR_ENA}, ENB = ${ROBOT_DELIVERY_PINS.MOTOR_ENB};
const int TRIG_PIN = ${ROBOT_DELIVERY_PINS.HC_TRIG}, ECHO_PIN = ${ROBOT_DELIVERY_PINS.HC_ECHO};
const float STOP_DISTANCE_CM = 30.0;

void forward()  { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);  Serial.println("Trang thai: FORWARD"); }
void stopCar()   { digitalWrite(IN1, LOW);  digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW);  Serial.println("Trang thai: STOP"); }

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  return duration / 58.0;
}

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  digitalWrite(ENA, HIGH);
  digitalWrite(ENB, HIGH);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  float distance = readDistanceCm();
  Serial.print("Khoang cach: ");
  Serial.print(distance);
  Serial.println(" cm");

  if (distance > STOP_DISTANCE_CM) {
    forward();
  } else {
    stopCar();
  }

  delay(300);
}
`;

const robotDeliveryLab06: VirtualLabSampleExercise = {
  title: '[Robot Giao Hàng Mini] LAB06 — Dừng Xe Khi Gặp Vật Cản (Tích Hợp)',
  slug: 'robot-delivery-lab06-stop-on-obstacle',
  module: 'Robot Giao Hàng Mini',
  category: 'robotics',
  level: 'intermediate',
  estimatedTimeMinutes: 30,
  objective: 'CỔNG KIẾN TRÚC QUAN TRỌNG NHẤT của module: lần đầu tích hợp đồng thời HC-SR04 (cảm biến) + L298N + 2 động cơ (chấp hành) trong 1 chương trình duy nhất.',
  description: 'Yêu cầu hoàn thành LAB03 và LAB05. Logic: khoảng cách > 30cm -> cả 2 motor FORWARD; khoảng cách <= 30cm -> cả 2 motor STOP. Input: khoảng cách HC-SR04. Output: trạng thái 2 động cơ.',
  components: ['wokwi-l298n', 'wokwi-dc-motor', 'wokwi-battery-pack', 'wokwi-hc-sr04'],
  supportedLevel: 'wokwi-l298n/wokwi-dc-motor: như LAB03. wokwi-hc-sr04: như LAB04/05. Cả 2 nhóm linh kiện đã verify độc lập ở các bài trước — bài này verify chúng hoạt động ĐÚNG khi chạy CHUNG 1 firmware QEMU.',
  wiringGuide: [
    'Nối L298N + 2 DC Motor + Battery Pack giống hệt LAB03.',
    'Đặt thêm 1 HC-SR04 phía trước robot, nối giống hệt LAB04/05.',
  ],
  starterCode: lab06StarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'l298n1', type: 'wokwi-l298n', x: 220, y: 120, pinMapping: { IN1: ROBOT_DELIVERY_PINS.MOTOR_L_IN1, IN2: ROBOT_DELIVERY_PINS.MOTOR_L_IN2, IN3: ROBOT_DELIVERY_PINS.MOTOR_R_IN1, IN4: ROBOT_DELIVERY_PINS.MOTOR_R_IN2, ENA: ROBOT_DELIVERY_PINS.MOTOR_ENA, ENB: ROBOT_DELIVERY_PINS.MOTOR_ENB } },
      { id: 'motorL', type: 'wokwi-dc-motor', x: 60, y: 60, pinMapping: {} },
      { id: 'motorR', type: 'wokwi-dc-motor', x: 60, y: 200, pinMapping: {} },
      { id: 'battery1', type: 'wokwi-battery-pack', x: 400, y: 120, pinMapping: {} },
      { id: 'us1', type: 'wokwi-hc-sr04', x: 220, y: 260, pinMapping: { TRIG: ROBOT_DELIVERY_PINS.HC_TRIG, ECHO: ROBOT_DELIVERY_PINS.HC_ECHO } },
    ],
    connections: [
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_L_IN1}`, 'l298n1:IN1'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_L_IN2}`, 'l298n1:IN2'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_R_IN1}`, 'l298n1:IN3'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_R_IN2}`, 'l298n1:IN4'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_ENA}`, 'l298n1:ENA'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_ENB}`, 'l298n1:ENB'],
      ['motorL:terminal1', 'l298n1:OUT1'],
      ['motorL:terminal2', 'l298n1:OUT2'],
      ['motorR:terminal1', 'l298n1:OUT3'],
      ['motorR:terminal2', 'l298n1:OUT4'],
      ['battery1:+', 'l298n1:VIN'],
      ['battery1:-', 'l298n1:GND'],
      ['l298n1:GND', GND],
      [`${BOARD}:3V3`, 'us1:VCC'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.HC_TRIG}`, 'us1:TRIG'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.HC_ECHO}`, 'us1:ECHO'],
      ['us1:GND', GND],
    ],
    sensorScenario: {
      sensors: {
        us1: {
          type: 'wokwi-hc-sr04',
          timeline: [
            { timeMs: 0, distanceCm: 100 },
            { timeMs: 5000, distanceCm: 15 },
          ],
        },
      },
    },
  },
  expectedBehavior: 'distance=100cm (0-5s) -> cả 2 motor FORWARD. distance=15cm (sau 5s) -> cả 2 motor STOP, không cần restart phiên chạy.',
  testSteps: [
    'Bấm Run/Compile.',
    'Xác nhận cả 2 card motor FORWARD trong 0-5s.',
    'Xác nhận cả 2 card motor chuyển STOP ngay sau mốc 5s (distance=15cm), giữ nguyên trong CÙNG 1 lần chạy.',
    'NẾU bài này FAIL: KHÔNG được sang LAB07/LAB08 — đây là cổng kiến trúc bắt buộc.',
  ],
  serialExpectedOutput: 'Khoang cach: 100.00 cm\nTrang thai: FORWARD\n...\nKhoang cach: 15.00 cm\nTrang thai: STOP\n...',
  teacherNotes: 'Yêu cầu hoàn thành LAB03 và LAB05. Đây là bài quan trọng nhất module — xác nhận kiến trúc tích hợp cảm biến+chấp hành hoạt động trước khi thêm hành vi phức tạp hơn (rẽ, chuỗi trạng thái).',
  limitations: 'Không rẽ tránh — chỉ dừng hẳn khi gặp vật cản. Hành vi rẽ được thêm ở LAB07.',
  keyConcepts: [
    "Tích hợp: giá trị cảm biến (input) quyết định hành vi động cơ (output) — nền tảng của robot tự hành",
    "Toàn bộ logic chạy trong 1 vòng loop() duy nhất, không cần 2 chương trình riêng",
  ],
  hints: [
    "Nếu motor không dừng khi có vật cản, kiểm tra lại STOP_DISTANCE_CM và chiều dấu so sánh >",
  ],
  extensionQuestions: [
    "Nếu ngưỡng dừng đổi thành 50cm, robot sẽ dừng sớm hơn hay muộn hơn?",
    "Vì sao bài này được gọi là \"cổng kiến trúc\" của cả module?",
  ],
};

// ----------------------------------------------------------------------------
// LAB07 — Obstacle Avoidance State Sequence (QEMU)
// ----------------------------------------------------------------------------
const lab07StarterCode = `// Robot Delivery Mini - LAB07: Chuoi trang thai tranh vat can (Forward->Stop->Turn->Forward)
// ESP32 DevKit v1 - L298N+HC-SR04 nhu LAB06

const int IN1 = ${ROBOT_DELIVERY_PINS.MOTOR_L_IN1}, IN2 = ${ROBOT_DELIVERY_PINS.MOTOR_L_IN2};
const int IN3 = ${ROBOT_DELIVERY_PINS.MOTOR_R_IN1}, IN4 = ${ROBOT_DELIVERY_PINS.MOTOR_R_IN2};
const int ENA = ${ROBOT_DELIVERY_PINS.MOTOR_ENA}, ENB = ${ROBOT_DELIVERY_PINS.MOTOR_ENB};
const int TRIG_PIN = ${ROBOT_DELIVERY_PINS.HC_TRIG}, ECHO_PIN = ${ROBOT_DELIVERY_PINS.HC_ECHO};
const float SAFE_DISTANCE_CM = 20.0;

void forward()    { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW); Serial.println("Trang thai: FORWARD"); }
void turnRight()   { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW); Serial.println("Trang thai: TURN"); }
void stopCar()     { digitalWrite(IN1, LOW);  digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW); Serial.println("Trang thai: STOP"); }

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  return duration / 58.0;
}

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  digitalWrite(ENA, HIGH);
  digitalWrite(ENB, HIGH);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  float distance = readDistanceCm();
  Serial.print("Khoang cach: ");
  Serial.print(distance);
  Serial.println(" cm");

  if (distance > SAFE_DISTANCE_CM) {
    forward();
  } else {
    stopCar();
    delay(300);
    turnRight();
    delay(500);
  }

  delay(300);
}
`;

const robotDeliveryLab07: VirtualLabSampleExercise = {
  title: '[Robot Giao Hàng Mini] LAB07 — Chuỗi Trạng Thái Tránh Vật Cản',
  slug: 'robot-delivery-lab07-obstacle-avoidance-sequence',
  module: 'Robot Giao Hàng Mini',
  category: 'robotics',
  level: 'intermediate',
  estimatedTimeMinutes: 30,
  objective: 'Mở rộng LAB06 thành chuỗi hành vi Forward -> Stop -> Turn -> Forward (chỉ dùng trạng thái động cơ điện, không mô phỏng vật lý 2D).',
  description: 'Yêu cầu hoàn thành LAB06 (bắt buộc PASS). Robot đi thẳng khi khoảng cách > 20cm; khi <= 20cm thì dừng rồi rẽ phải để tránh, sau đó tiếp tục đi thẳng khi đường lại thông thoáng. Input: khoảng cách HC-SR04. Output: chuỗi trạng thái động cơ FORWARD/STOP/TURN.',
  components: ['wokwi-l298n', 'wokwi-dc-motor', 'wokwi-battery-pack', 'wokwi-hc-sr04'],
  supportedLevel: 'Như LAB06 — không thêm linh kiện mới, chỉ mở rộng logic điều khiển.',
  wiringGuide: ['Sơ đồ nối dây giống hệt LAB06 (không đổi).'],
  starterCode: lab07StarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'l298n1', type: 'wokwi-l298n', x: 220, y: 120, pinMapping: { IN1: ROBOT_DELIVERY_PINS.MOTOR_L_IN1, IN2: ROBOT_DELIVERY_PINS.MOTOR_L_IN2, IN3: ROBOT_DELIVERY_PINS.MOTOR_R_IN1, IN4: ROBOT_DELIVERY_PINS.MOTOR_R_IN2, ENA: ROBOT_DELIVERY_PINS.MOTOR_ENA, ENB: ROBOT_DELIVERY_PINS.MOTOR_ENB } },
      { id: 'motorL', type: 'wokwi-dc-motor', x: 60, y: 60, pinMapping: {} },
      { id: 'motorR', type: 'wokwi-dc-motor', x: 60, y: 200, pinMapping: {} },
      { id: 'battery1', type: 'wokwi-battery-pack', x: 400, y: 120, pinMapping: {} },
      { id: 'us1', type: 'wokwi-hc-sr04', x: 220, y: 260, pinMapping: { TRIG: ROBOT_DELIVERY_PINS.HC_TRIG, ECHO: ROBOT_DELIVERY_PINS.HC_ECHO } },
    ],
    connections: [
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_L_IN1}`, 'l298n1:IN1'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_L_IN2}`, 'l298n1:IN2'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_R_IN1}`, 'l298n1:IN3'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_R_IN2}`, 'l298n1:IN4'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_ENA}`, 'l298n1:ENA'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_ENB}`, 'l298n1:ENB'],
      ['motorL:terminal1', 'l298n1:OUT1'],
      ['motorL:terminal2', 'l298n1:OUT2'],
      ['motorR:terminal1', 'l298n1:OUT3'],
      ['motorR:terminal2', 'l298n1:OUT4'],
      ['battery1:+', 'l298n1:VIN'],
      ['battery1:-', 'l298n1:GND'],
      ['l298n1:GND', GND],
      [`${BOARD}:3V3`, 'us1:VCC'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.HC_TRIG}`, 'us1:TRIG'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.HC_ECHO}`, 'us1:ECHO'],
      ['us1:GND', GND],
    ],
    sensorScenario: {
      sensors: {
        us1: {
          type: 'wokwi-hc-sr04',
          timeline: [
            { timeMs: 0, distanceCm: 100 },
            { timeMs: 4000, distanceCm: 45 },
            { timeMs: 7000, distanceCm: 10 },
            { timeMs: 10000, distanceCm: 100 },
          ],
        },
      },
    },
  },
  expectedBehavior: 'FORWARD (0-7s, 100/45cm) -> STOP rồi TURN tại mốc 7s (10cm) -> FORWARD lại sau mốc 10s (100cm trở lại) — đúng chuỗi Forward->Stop->Turn->Forward theo kịch bản.',
  testSteps: [
    'Bấm Run/Compile.',
    'Xác nhận đúng thứ tự sự kiện: FORWARD -> STOP -> TURN -> FORWARD, không lệch thứ tự.',
    'Đối chiếu Serial Monitor khớp từng mốc thời gian trong sensorScenario.',
  ],
  serialExpectedOutput: 'Khoang cach: 100.00 cm\nTrang thai: FORWARD\n...\nKhoang cach: 10.00 cm\nTrang thai: STOP\nTrang thai: TURN\n...\nKhoang cach: 100.00 cm\nTrang thai: FORWARD',
  teacherNotes: 'Yêu cầu hoàn thành LAB06 (PASS bắt buộc — LAB06 là cổng kiến trúc). Đây vẫn là mô phỏng trạng thái điện/thời gian, không có toạ độ 2D thật (đúng scope "No robot physics required" của module).',
  limitations: 'Không có mô phỏng vật lý 2D thật — chuỗi trạng thái xác định hoàn toàn theo kịch bản thời gian, không phải cảm biến "nhìn thấy" vật cản trong không gian.',
  keyConcepts: [
    "Chuỗi trạng thái (state sequence): Forward -> Stop -> Turn -> Forward, mỗi trạng thái là 1 hành vi rõ ràng",
    "delay() giữa các bước tạo đủ thời gian để hành vi \"nhìn thấy được\" trước khi đổi tiếp",
  ],
  hints: [
    "Nếu robot không rẽ đúng lúc, kiểm tra lại delay(300)/delay(500) giữa các bước",
  ],
  extensionQuestions: [
    "Nếu vật cản biến mất ngay giữa lúc đang rẽ, robot có phát hiện kịp không? Vì sao?",
    "Làm sao thêm hành vi \"lùi lại\" trước khi rẽ?",
  ],
};

// ----------------------------------------------------------------------------
// LAB08 — Complete Mini Delivery Robot (QEMU) — tích hợp cuối cùng + BOM cơ khí
// ----------------------------------------------------------------------------
const lab08StarterCode = `// Robot Delivery Mini - LAB08: Robot giao hang mini hoan chinh
// ESP32 DevKit v1 - L298N+HC-SR04 nhu LAB07; chassis/wheel/caster/delivery box chi hien thi

const int IN1 = ${ROBOT_DELIVERY_PINS.MOTOR_L_IN1}, IN2 = ${ROBOT_DELIVERY_PINS.MOTOR_L_IN2};
const int IN3 = ${ROBOT_DELIVERY_PINS.MOTOR_R_IN1}, IN4 = ${ROBOT_DELIVERY_PINS.MOTOR_R_IN2};
const int ENA = ${ROBOT_DELIVERY_PINS.MOTOR_ENA}, ENB = ${ROBOT_DELIVERY_PINS.MOTOR_ENB};
const int TRIG_PIN = ${ROBOT_DELIVERY_PINS.HC_TRIG}, ECHO_PIN = ${ROBOT_DELIVERY_PINS.HC_ECHO};
const float SAFE_DISTANCE_CM = 20.0;
const unsigned long DELIVERY_TIME_MS = 8000UL;

void forward()   { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW); }
void turnRight()  { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW); }
void stopCar()    { digitalWrite(IN1, LOW);  digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW); }

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  return duration / 58.0;
}

unsigned long tripStart = 0;
bool delivered = false;

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  digitalWrite(ENA, HIGH);
  digitalWrite(ENB, HIGH);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  tripStart = millis();
  Serial.println("Trang thai: BAT DAU GIAO HANG");
}

void loop() {
  if (delivered) {
    stopCar();
    delay(1000);
    return;
  }

  if (millis() - tripStart >= DELIVERY_TIME_MS) {
    stopCar();
    delivered = true;
    Serial.println("Trang thai: DELIVERED");
    return;
  }

  float distance = readDistanceCm();
  Serial.print("Khoang cach: ");
  Serial.print(distance);
  Serial.println(" cm");

  if (distance > SAFE_DISTANCE_CM) {
    forward();
    Serial.println("Trang thai: MOVING");
  } else {
    stopCar();
    Serial.println("Trang thai: OBSTACLE");
    delay(300);
    turnRight();
    Serial.println("Trang thai: TURNING");
    delay(500);
  }

  delay(300);
}
`;

const robotDeliveryLab08: VirtualLabSampleExercise = {
  title: '[Robot Giao Hàng Mini] LAB08 — Robot Giao Hàng Mini Hoàn Chỉnh',
  slug: 'robot-delivery-lab08-complete-mini-delivery-robot',
  module: 'Robot Giao Hàng Mini',
  category: 'robotics',
  level: 'intermediate',
  estimatedTimeMinutes: 40,
  objective: 'Bài tổng hợp cuối module: kết hợp toàn bộ LAB01-07 (output cơ bản, động cơ, cảm biến, chuỗi trạng thái, đếm thời gian) thành 1 robot giao hàng hoàn chỉnh, cộng thêm BOM cơ khí trực quan.',
  description: 'Yêu cầu hoàn thành LAB07. Robot di chuyển và tránh vật cản (như LAB07) trong 8 giây, sau đó tự dừng và báo "DELIVERED". Các linh kiện cơ khí (khung robot/bánh xe/bánh lái/hộp hàng) CHỈ hiển thị (visual-only), KHÔNG bắt buộc cho mô phỏng điện — không nối dây, không vào netlist, không ảnh hưởng compile/run.',
  components: [
    'wokwi-l298n',
    'wokwi-dc-motor',
    'wokwi-battery-pack',
    'wokwi-hc-sr04',
    'wokwi-robot-chassis',
    'wokwi-robot-wheel',
    'wokwi-caster-wheel',
    'wokwi-delivery-box',
  ],
  supportedLevel: 'wokwi-l298n/wokwi-dc-motor/wokwi-hc-sr04: như LAB06/07. wokwi-robot-chassis/wokwi-robot-wheel/wokwi-caster-wheel/wokwi-delivery-box: Chỉ hiển thị (không có chân điện, không vào netlist, không ảnh hưởng compile/run) — mô phỏng KHÔNG bị chặn bởi các linh kiện này.',
  wiringGuide: [
    'Nối L298N + 2 DC Motor + Battery Pack + HC-SR04 giống hệt LAB06/LAB07.',
    'Kéo thả thêm (không cần nối dây): Robot Chassis, 2x Robot Wheel, 1x Caster Wheel, 1x Mini Delivery Box để hoàn thiện hình dáng robot trên canvas.',
  ],
  starterCode: lab08StarterCode,
  circuitConfig: {
    board: 'esp32_devkit_v1',
    parts: [
      { id: 'l298n1', type: 'wokwi-l298n', x: 220, y: 120, pinMapping: { IN1: ROBOT_DELIVERY_PINS.MOTOR_L_IN1, IN2: ROBOT_DELIVERY_PINS.MOTOR_L_IN2, IN3: ROBOT_DELIVERY_PINS.MOTOR_R_IN1, IN4: ROBOT_DELIVERY_PINS.MOTOR_R_IN2, ENA: ROBOT_DELIVERY_PINS.MOTOR_ENA, ENB: ROBOT_DELIVERY_PINS.MOTOR_ENB } },
      { id: 'motorL', type: 'wokwi-dc-motor', x: 60, y: 60, pinMapping: {} },
      { id: 'motorR', type: 'wokwi-dc-motor', x: 60, y: 200, pinMapping: {} },
      { id: 'battery1', type: 'wokwi-battery-pack', x: 400, y: 120, pinMapping: {} },
      { id: 'us1', type: 'wokwi-hc-sr04', x: 220, y: 260, pinMapping: { TRIG: ROBOT_DELIVERY_PINS.HC_TRIG, ECHO: ROBOT_DELIVERY_PINS.HC_ECHO } },
      { id: 'chassis1', type: 'wokwi-robot-chassis', x: 180, y: 320, pinMapping: {} },
      { id: 'wheelL', type: 'wokwi-robot-wheel', x: 30, y: 60, pinMapping: {} },
      { id: 'wheelR', type: 'wokwi-robot-wheel', x: 30, y: 260, pinMapping: {} },
      { id: 'caster1', type: 'wokwi-caster-wheel', x: 430, y: 320, pinMapping: {} },
      { id: 'box1', type: 'wokwi-delivery-box', x: 220, y: 380, pinMapping: {} },
    ],
    connections: [
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_L_IN1}`, 'l298n1:IN1'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_L_IN2}`, 'l298n1:IN2'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_R_IN1}`, 'l298n1:IN3'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_R_IN2}`, 'l298n1:IN4'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_ENA}`, 'l298n1:ENA'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.MOTOR_ENB}`, 'l298n1:ENB'],
      ['motorL:terminal1', 'l298n1:OUT1'],
      ['motorL:terminal2', 'l298n1:OUT2'],
      ['motorR:terminal1', 'l298n1:OUT3'],
      ['motorR:terminal2', 'l298n1:OUT4'],
      ['battery1:+', 'l298n1:VIN'],
      ['battery1:-', 'l298n1:GND'],
      ['l298n1:GND', GND],
      [`${BOARD}:3V3`, 'us1:VCC'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.HC_TRIG}`, 'us1:TRIG'],
      [`${BOARD}:GPIO${ROBOT_DELIVERY_PINS.HC_ECHO}`, 'us1:ECHO'],
      ['us1:GND', GND],
    ],
    sensorScenario: {
      sensors: {
        us1: {
          type: 'wokwi-hc-sr04',
          timeline: [
            { timeMs: 0, distanceCm: 100 },
            { timeMs: 4000, distanceCm: 12 },
            { timeMs: 5500, distanceCm: 100 },
          ],
        },
      },
    },
  },
  expectedBehavior: 'Robot MOVING trong 8 giây (có 1 lần OBSTACLE/TURNING khi khoảng cách=12cm ở giây thứ 4), sau đó dừng hẳn và in "DELIVERED" đúng 1 lần, không lặp lại.',
  testSteps: [
    'Bấm Run/Compile.',
    'Theo dõi Serial Monitor đủ trình tự: BAT DAU GIAO HANG -> nhiều dòng MOVING -> OBSTACLE -> TURNING -> MOVING tiếp -> DELIVERED (đúng 1 lần).',
    'Xác nhận sau khi DELIVERED, robot đứng yên hoàn toàn (không còn đổi trạng thái motor).',
    'Xác nhận việc thêm/xoá linh kiện cơ khí (chassis/wheel/caster/box) KHÔNG làm compile/run thất bại.',
  ],
  serialExpectedOutput: 'Trang thai: BAT DAU GIAO HANG\nKhoang cach: 100.00 cm\nTrang thai: MOVING\n...\nTrang thai: DELIVERED',
  teacherNotes: 'Yêu cầu hoàn thành LAB07. Bài tổng hợp cuối module — nên giao sau khi học sinh đã PASS toàn bộ LAB01-07. Có thể yêu cầu học sinh tự đổi DELIVERY_TIME_MS hoặc thêm mốc vật cản thứ 2 trong sensorScenario.',
  limitations: 'Không có toạ độ di chuyển thật, không phát hiện "tới đích" bằng vị trí — chỉ dùng millis() để giả lập hoàn thành hành trình. Delivery box không rơi/thả hàng thật. Linh kiện cơ khí (wheel/chassis/caster/box) mang tính minh hoạ, không có mô phỏng vật lý.',
  keyConcepts: [
    "Tách biệt linh kiện điện (ESP32/HC-SR04/L298N/Motor) và linh kiện cơ khí trực quan (khung/bánh xe/hộp hàng) — cơ khí không tham gia mô phỏng điện",
    "millis() đếm thời gian trôi qua mà không chặn chương trình (khác delay())",
  ],
  hints: [
    "Nếu \"DELIVERED\" in ra nhiều lần liên tục, kiểm tra lại biến delivered đã được set true chưa",
  ],
  extensionQuestions: [
    "Vì sao dùng millis() thay vì đếm số vòng lặp loop()?",
    "Làm sao thêm 1 mốc vật cản thứ 2 vào hành trình 8 giây?",
  ],
};

export const ROBOT_DELIVERY_MINI_LABS: VirtualLabSampleExercise[] = [
  robotDeliveryLab01,
  robotDeliveryLab02,
  robotDeliveryLab03,
  robotDeliveryLab04,
  robotDeliveryLab05,
  robotDeliveryLab06,
  robotDeliveryLab07,
  robotDeliveryLab08,
];

export const VIRTUAL_LAB_SAMPLE_EXERCISES: VirtualLabSampleExercise[] = [
  led1,
  buzzer1,
  rgb1,
  l298nCar,
  obstacleAvoid,
  lineFollow,
  deliveryRobot,
  waterLeak,
  flameAlert,
  dhtStation,
  pirAlert,
  rainAlert,
  soilMoisture,
  vibrationAlert,
  pushButtonLed,
  potentiometerLed,
  lightSensorLed,
  trashRobot,
  stairRobot,
  soccerRobot,
  firefightRobot,
  dryingSystem,
  ...ROBOT_DELIVERY_MINI_LABS,
];
