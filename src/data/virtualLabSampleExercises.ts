// StemFlow Virtual Lab — Bộ 14 bài tập mẫu (Component Library đã hỗ trợ runtime hôm nay).
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
// PHẠM VI: chỉ 14 bài trong danh sách được duyệt (LED/Buzzer/RGB LED/L298N xe 2 bánh/tránh vật cản
// HC-SR04/dò line 3ch/robot giao hàng mini/rò rỉ nước/cháy Flame/DHT nhiệt-ẩm/PIR/mưa/độ ẩm đất/
// rung SW-420). KHÔNG có bài nào dùng WiFi/MQTT/HTTP/cloud/camera AI/drone/robot physics thật.
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
];
