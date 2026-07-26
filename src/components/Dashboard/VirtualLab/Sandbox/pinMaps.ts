// Tọa độ chính xác từ @wokwi/elements pinInfo API
// Mỗi linh kiện có tọa độ x, y tính từ góc trên-trái bounding box

export interface PinCoord {
  x: number;
  y: number;
  label: string;
}

// Lấy từ: new ArduinoUnoElement().pinInfo
export const ARDUINO_UNO_PINS: Record<string, PinCoord> = {
  // --- Top header (Digital) ---
  'A5.2':  { x: 87,    y: 9, label: 'uno:SCL' },
  'A4.2':  { x: 97,    y: 9, label: 'uno:SDA' },
  'AREF':  { x: 106,   y: 9, label: 'uno:AREF' },
  'GND.1': { x: 115.5, y: 9, label: 'uno:GND' },
  '13':    { x: 125,   y: 9, label: 'uno:13' },
  '12':    { x: 134.5, y: 9, label: 'uno:12' },
  '11':    { x: 144,   y: 9, label: 'uno:~11' },
  '10':    { x: 153.5, y: 9, label: 'uno:~10' },
  '9':     { x: 163,   y: 9, label: 'uno:~9' },
  '8':     { x: 173,   y: 9, label: 'uno:8' },
  '7':     { x: 189,   y: 9, label: 'uno:7' },
  '6':     { x: 198.5, y: 9, label: 'uno:~6' },
  '5':     { x: 208,   y: 9, label: 'uno:~5' },
  '4':     { x: 217.5, y: 9, label: 'uno:4' },
  '3':     { x: 227,   y: 9, label: 'uno:~3' },
  '2':     { x: 236.5, y: 9, label: 'uno:2' },
  '1':     { x: 246,   y: 9, label: 'uno:TX->1' },
  '0':     { x: 255.5, y: 9, label: 'uno:RX<-0' },

  // --- Bottom header (Power + Analog) ---
  'IOREF':  { x: 131,   y: 191.5, label: 'uno:IOREF' },
  'RESET':  { x: 140.5, y: 191.5, label: 'uno:RESET' },
  '3.3V':   { x: 150,   y: 191.5, label: 'uno:3.3V' },
  '5V':     { x: 160,   y: 191.5, label: 'uno:5V' },
  'GND.2':  { x: 169.5, y: 191.5, label: 'uno:GND' },
  'GND.3':  { x: 179,   y: 191.5, label: 'uno:GND' },
  'VIN':    { x: 188.5, y: 191.5, label: 'uno:VIN' },
  'A0':     { x: 208,   y: 191.5, label: 'uno:A0' },
  'A1':     { x: 217.5, y: 191.5, label: 'uno:A1' },
  'A2':     { x: 227,   y: 191.5, label: 'uno:A2' },
  'A3':     { x: 236.5, y: 191.5, label: 'uno:A3' },
  'A4':     { x: 246,   y: 191.5, label: 'uno:A4' },
  'A5':     { x: 255.5, y: 191.5, label: 'uno:A5' },
};

// Tọa độ lấy từ: node_modules/@wokwi/elements/dist/esm/esp32-devkit-v1-element.js
// -> pinInfo. Lưu ý: đây là part cộng đồng `wokwi-esp32-devkit-v1`. Part
// chính thức `board-esp32-devkit-c-v4` là closed-source, không có trong
// package này -> tọa độ x/y dưới đây CHƯA được xác minh khớp với board v4
// (cần tự kiểm tra trong wokwi.com bằng cách hover từng chân trước khi coi
// là nguồn tin cậy cho board v4).
//
// Key KHÔNG dùng nguyên tên silkscreen "D13"/"D2"/... của thư viện —
// VirtualLabDiagramService.SupportedPins (BE) tự đặt ra quy ước "GPIOxx"
// riêng, không khớp tên silkscreen. Vì renderPinDots() dùng thẳng key này
// làm chuỗi pin gửi lên BE (connections: "arduino:<key>"), key ở đây phải
// đổi sang đúng "GPIOxx" để khớp SupportedPins — nếu không mọi dây nối tới
// các chân này sẽ bị BE báo "pin '<key>' does not exist on
// board-esp32-devkit-c-v4." RX2/TX2 không đổi theo quy tắc số (không có
// "GPIOTX2") mà map sang GPIO16/GPIO17 — đúng UART2 vật lý của ESP32 DevKit.
// Các chân không có "D"/"RX2"/"TX2" (EN/VP/VN/VIN/3V3/GND.*/RX0/TX0) đã khớp
// sẵn với SupportedPins, giữ nguyên.
export const ESP32_DEVKIT_PINS: Record<string, PinCoord> = {
  // --- Cột trái (từ trên xuống) ---
  'EN':     { x: 5, y: 24,   label: 'esp32:EN' },
  'VP':     { x: 5, y: 34,   label: 'esp32:VP' },
  'VN':     { x: 5, y: 44,   label: 'esp32:VN' },
  'GPIO34': { x: 5, y: 53.1, label: 'esp32:GPIO34' },
  'GPIO35': { x: 5, y: 62.9, label: 'esp32:GPIO35' },
  'GPIO32': { x: 5, y: 72.2, label: 'esp32:GPIO32' },
  'GPIO33': { x: 5, y: 81.7, label: 'esp32:GPIO33' },
  'GPIO25': { x: 5, y: 91.3, label: 'esp32:GPIO25' },
  'GPIO26': { x: 5, y: 101,  label: 'esp32:GPIO26' },
  'GPIO27': { x: 5, y: 110.8, label: 'esp32:GPIO27' },
  'GPIO14': { x: 5, y: 120,  label: 'esp32:GPIO14' },
  'GPIO12': { x: 5, y: 130.4, label: 'esp32:GPIO12' },
  'GPIO13': { x: 5, y: 139.5, label: 'esp32:GPIO13' },
  'GND.2':  { x: 5, y: 149,  label: 'esp32:GND' },
  'VIN':    { x: 5, y: 158.5, label: 'esp32:VIN' },

  // --- Cột phải (từ trên xuống) ---
  'GPIO23': { x: 101.3, y: 24,   label: 'esp32:GPIO23' },
  'GPIO22': { x: 101.3, y: 34,   label: 'esp32:GPIO22' },
  'TX0':    { x: 101.3, y: 44,   label: 'esp32:TX0' },
  'RX0':    { x: 101.3, y: 53.1, label: 'esp32:RX0' },
  'GPIO21': { x: 101.3, y: 62.9, label: 'esp32:GPIO21' },
  'GPIO19': { x: 101.3, y: 72.2, label: 'esp32:GPIO19' },
  'GPIO18': { x: 101.3, y: 81.7, label: 'esp32:GPIO18' },
  'GPIO5':  { x: 101.3, y: 91.3, label: 'esp32:GPIO5' },
  'GPIO17': { x: 101.3, y: 101,  label: 'esp32:GPIO17 (TX2)' },
  'GPIO16': { x: 101.3, y: 110.8, label: 'esp32:GPIO16 (RX2)' },
  'GPIO4':  { x: 101.3, y: 120,  label: 'esp32:GPIO4' },
  'GPIO2':  { x: 101.3, y: 130.4, label: 'esp32:GPIO2' },
  'GPIO15': { x: 101.3, y: 139.5, label: 'esp32:GPIO15' },
  'GND.1':  { x: 101.3, y: 149,  label: 'esp32:GND' },
  '3V3':    { x: 101.3, y: 158.5, label: 'esp32:3V3' },
};

// GPIO an toàn để gợi ý mặc định cho giáo viên khi soạn bài (tránh strapping
// pins, UART0, chân input-only không pull-up, và chân nối flash SPI nội bộ).
export const ESP32_SAFE_GPIOS: number[] = [13, 14, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33];

// Strapping pins + UART0 — không cấm dùng nhưng nên cảnh báo trên UI vì dễ
// gây lỗi khó hiểu (board không boot lại được, mất Serial Monitor, ...).
export const ESP32_RISKY_GPIOS: number[] = [0, 1, 2, 3, 4, 5, 12, 15];

// Lấy từ: new LEDElement().pinInfo
export const LED_PINS: Record<string, PinCoord> = {
  'A': { x: 25, y: 42, label: 'A (Anode)' },
  'C': { x: 15, y: 42, label: 'C (Cathode)' },
};

// Lấy từ: new PushbuttonElement().pinInfo
export const PUSHBUTTON_PINS: Record<string, PinCoord> = {
  '1.l': { x: 0,  y: 13, label: '1.l' },
  '2.r': { x: 67, y: 32, label: '2.r' },
};

// Lấy từ: new ResistorElement().pinInfo (tạm thời)
export const RESISTOR_PINS: Record<string, PinCoord> = {
  '1': { x: 0,  y: 14, label: '1' },
  '2': { x: 43, y: 14, label: '2' },
};

// Lấy từ: new BuzzerElement().pinInfo
export const BUZZER_PINS: Record<string, PinCoord> = {
  '1': { x: 27, y: 84, label: '+ (VCC)' },
  '2': { x: 37, y: 84, label: '- (GND)' },
};

// Lấy từ: new ServoElement().pinInfo
export const SERVO_PINS: Record<string, PinCoord> = {
  'GND': { x: 0, y: 50,   label: 'GND' },
  'V+':  { x: 0, y: 59.5, label: 'V+' },
  'PWM': { x: 0, y: 69,   label: 'PWM' },
};

// Lấy từ: new PotentiometerElement().pinInfo
export const POTENTIOMETER_PINS: Record<string, PinCoord> = {
  'GND': { x: 29, y: 68.5, label: 'GND' },
  'SIG': { x: 39, y: 68.5, label: 'SIG' },
  'VCC': { x: 49, y: 68.5, label: 'VCC' },
};

// Lấy từ: node_modules/@wokwi/elements/dist/esm/dht22-element.js -> pinInfo
export const DHT22_PINS: Record<string, PinCoord> = {
  'VCC': { x: 15,   y: 114.9, label: 'VCC' },
  'SDA': { x: 24.5, y: 114.9, label: 'SDA' },
  'NC':  { x: 34.1, y: 114.9, label: 'NC' },
  'GND': { x: 43.8, y: 114.9, label: 'GND' },
};

export function getPinCoords(componentType: string): Record<string, PinCoord> {
  const normalized = componentType.toLowerCase().replace('wokwi-', '');
  if (normalized === 'arduino_uno' || normalized === 'arduino-uno') return ARDUINO_UNO_PINS;
  if (
    normalized === 'esp32_devkit_v1' ||
    normalized === 'esp32-devkit-v1' ||
    normalized === 'esp32-devkit-c-v4' ||
    normalized === 'board-esp32-devkit-c-v4'
  ) return ESP32_DEVKIT_PINS;
  if (normalized === 'led') return LED_PINS;
  if (normalized === 'push_button' || normalized === 'pushbutton' || normalized === 'button') return PUSHBUTTON_PINS;
  if (normalized === 'resistor') return RESISTOR_PINS;
  if (normalized === 'buzzer') return BUZZER_PINS;
  if (normalized === 'servo') return SERVO_PINS;
  if (normalized === 'potentiometer') return POTENTIOMETER_PINS;
  if (normalized === 'dht22') return DHT22_PINS;
  return {};
}
