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
            { timeMs: 0, temperature: 25, humidity: 55 },
            { timeMs: 5000, temperature: 30, humidity: 50 },
            { timeMs: 9000, temperature: 38, humidity: 40 },
            { timeMs: 14000, temperature: 26, humidity: 58 },
          ],
        },
      },
    },
  },
  expectedBehavior: 'Serial Monitor in nhiệt độ/độ ẩm mỗi giây, khớp đúng kịch bản; LED bật đúng khoảng 9s-14s (nhiệt độ 38°C > ngưỡng 35°C), tắt các thời điểm còn lại.',
  testSteps: [
    'Bấm Run/Compile.',
    'Theo dõi Serial Monitor: giá trị nhiệt độ/độ ẩm đổi đúng theo 4 mốc kịch bản.',
    'Xác nhận LED CHỈ bật trong khoảng nhiệt độ > 35°C, tắt các thời điểm khác.',
  ],
  serialExpectedOutput: 'Nhiet do: 25.00 C, Do am: 55.00 %\n...\nNhiet do: 38.00 C, Do am: 40.00 %\nCANH BAO: NHIET DO CAO!\n...',
  teacherNotes: 'Nhấn mạnh với học sinh: StemFlowDHT là helper RIÊNG của StemFlow (không phải thư viện DHT.h thật ngoài đời) — nếu học sinh tự ý #include <DHT.h> thật, sketch sẽ KHÔNG nhận được dữ liệu mô phỏng.',
  limitations: 'Không dùng được thư viện DHT.h/Adafruit Unified Sensor thật; giá trị hoàn toàn theo kịch bản timeline, không có nhiễu/sai số ngẫu nhiên như cảm biến thật.',
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
  ...ROBOT_DELIVERY_MINI_LABS,
];
