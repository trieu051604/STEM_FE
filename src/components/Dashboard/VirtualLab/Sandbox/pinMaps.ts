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
  // "5V" có trong SupportedPins (BE) nhưng chưa từng có toạ độ FE — dùng
  // chung vị trí VIN (board thật không có header 5V riêng, VIN là chân nhận
  // 5V khi cấp qua nguồn ngoài). Phát hiện lúc test wiring L298N VIN->5V,
  // console báo "Unknown pin 5V on arduino — wire not rendered".
  '5V':     { x: 5, y: 158.5, label: 'esp32:5V (=VIN)' },

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

// ===== Robot giao hàng mini =====

// Lấy từ: node_modules/@wokwi/elements/dist/esm/hc-sr04-element.js -> pinInfo
// (element thật — render qua createWokwiElement('wokwi-hc-sr04', ...) trong
// CircuitCanvas.tsx, không phải fallback card).
export const HC_SR04_PINS: Record<string, PinCoord> = {
  'VCC':  { x: 71.3,  y: 94.5, label: 'VCC' },
  'TRIG': { x: 81.3,  y: 94.5, label: 'TRIG' },
  'ECHO': { x: 91.3,  y: 94.5, label: 'ECHO' },
  'GND':  { x: 101.3, y: 94.5, label: 'GND' },
};

// L298N/DC Motor/Battery Pack/Power Switch KHÔNG có element thật trong
// @wokwi/elements (đã kiểm tra không tồn tại) — render qua fallback card tự
// vẽ trong CircuitCanvas.tsx (FALLBACK_CARD_SIZES). Toạ độ pin dưới đây PHẢI
// khớp đúng width/height khai báo ở đó, vì card đó chính là bounding box thật
// sẽ được đo qua offsetWidth/offsetHeight.

// Card 180x100 — layout theo đúng thứ tự user yêu cầu: OUT1-4/VIN/GND hàng
// trên (khối cực động cơ + nguồn), ENA/IN1-4/ENB/5V hàng dưới (khối logic
// hướng về phía ESP32), mô phỏng cách chia 2 khối trên module L298N thật.
export const L298N_PINS: Record<string, PinCoord> = {
  'OUT1': { x: 15,  y: 8,  label: 'OUT1 (Motor A)' },
  'OUT2': { x: 40,  y: 8,  label: 'OUT2 (Motor A)' },
  'VIN':  { x: 90,  y: 8,  label: 'VIN' },
  'GND':  { x: 115, y: 8,  label: 'GND' },
  'OUT3': { x: 140, y: 8,  label: 'OUT3 (Motor B)' },
  'OUT4': { x: 165, y: 8,  label: 'OUT4 (Motor B)' },
  'ENA':  { x: 15,  y: 92, label: 'ENA' },
  'IN1':  { x: 40,  y: 92, label: 'IN1' },
  'IN2':  { x: 65,  y: 92, label: 'IN2' },
  'IN3':  { x: 90,  y: 92, label: 'IN3' },
  'IN4':  { x: 115, y: 92, label: 'IN4' },
  'ENB':  { x: 140, y: 92, label: 'ENB' },
  '5V':   { x: 165, y: 92, label: '5V' },
};

// Card 60x50
export const DC_MOTOR_PINS: Record<string, PinCoord> = {
  'terminal1': { x: 6,  y: 25, label: 'Terminal 1' },
  'terminal2': { x: 54, y: 25, label: 'Terminal 2' },
};

// Card 90x50
export const BATTERY_PACK_PINS: Record<string, PinCoord> = {
  '+': { x: 10, y: 25, label: '+ (7.4V)' },
  '-': { x: 80, y: 25, label: '-' },
};

// Card 70x36
export const POWER_SWITCH_PINS: Record<string, PinCoord> = {
  'IN':  { x: 6,  y: 18, label: 'IN' },
  'OUT': { x: 64, y: 18, label: 'OUT' },
};

// ===== Ngoài Robot giao hàng mini — nhóm "output-easy" mở rộng thêm =====

// Lấy từ: node_modules/@wokwi/elements/dist/esm/rgb-led-element.js -> pinInfo
// (element thật — chỉ mô phỏng bật/tắt từng kênh qua digitalWrite, KHÔNG có
// độ sáng trung gian vì QEMU không instrument PWM).
export const RGB_LED_PINS: Record<string, PinCoord> = {
  'R':   { x: 8.5,  y: 44, label: 'R' },
  'COM': { x: 18,   y: 54, label: 'COM' },
  'G':   { x: 26.4, y: 44, label: 'G' },
  'B':   { x: 35.7, y: 44, label: 'B' },
};

// Robot Wheel/Caster Wheel/Robot Chassis/Breadboard/Mini Delivery Box: CỐ TÌNH
// không có entry ở đây — getPinCoords() trả về {} cho các type này, khiến
// renderPinDots() trong CircuitCanvas.tsx không vẽ pin-dot nào (đúng yêu cầu
// "linh kiện cơ khí/hiển thị thuần không có pin thì không render pin-dot").

// ===== Thư viện linh kiện mở rộng (Component Library, ngoài Robot Delivery
// Kit) — mọi toạ độ dưới đây lấy TRỰC TIẾP từ pinInfo thật trong
// @wokwi/elements (không suy đoán). Với pinInfo là getter tính toán (không
// phải mảng literal cố định — 7-segment/led-bar-graph/stepper-motor), đã tự
// tính tay theo đúng công thức trong source (mmToPix = 3.78, xem
// node_modules/@wokwi/elements/dist/esm/utils/units.js) ứng với giá trị
// thuộc tính MẶC ĐỊNH của element (digits=1/pins='top' cho 7-segment, size=23
// cho stepper-motor, rows=2 cho lcd1602) — nếu giáo viên đổi các thuộc tính
// này qua defaultProps khác mặc định, toạ độ pin-dot sẽ lệch (chưa xử lý,
// xem VIRTUAL_LAB_PLAN.md backlog).

// flame-sensor-element.js -> pinInfo (literal)
export const FLAME_SENSOR_PINS: Record<string, PinCoord> = {
  'VCC':  { x: 199, y: 14.6, label: 'VCC' },
  'GND':  { x: 199, y: 24.3, label: 'GND' },
  'DOUT': { x: 199, y: 34,   label: 'DOUT' },
  'AOUT': { x: 199, y: 43.7, label: 'AOUT' },
};

// gas-sensor-element.js -> pinInfo (MQ Gas Sensor)
export const GAS_SENSOR_PINS: Record<string, PinCoord> = {
  'AOUT': { x: 137, y: 16.5, label: 'AOUT' },
  'DOUT': { x: 137, y: 26.4, label: 'DOUT' },
  'GND':  { x: 137, y: 36.5, label: 'GND' },
  'VCC':  { x: 137, y: 46.2, label: 'VCC' },
};

// pir-motion-sensor-element.js -> pinInfo
export const PIR_MOTION_SENSOR_PINS: Record<string, PinCoord> = {
  'VCC': { x: 36.178, y: 92, label: 'VCC' },
  'OUT': { x: 45.9175, y: 92, label: 'OUT' },
  'GND': { x: 55.6415, y: 92, label: 'GND' },
};

// photoresistor-sensor-element.js -> pinInfo (Light Sensor / LDR module)
export const PHOTORESISTOR_SENSOR_PINS: Record<string, PinCoord> = {
  'VCC': { x: 172, y: 16,   label: 'VCC' },
  'GND': { x: 172, y: 26,   label: 'GND' },
  'DO':  { x: 172, y: 35.8, label: 'DO' },
  'AO':  { x: 172, y: 45.5, label: 'AO' },
};

// ntc-temperature-sensor-element.js -> pinInfo
export const NTC_TEMPERATURE_SENSOR_PINS: Record<string, PinCoord> = {
  'GND': { x: 135, y: 26.2, label: 'GND' },
  'VCC': { x: 135, y: 35.8, label: 'VCC' },
  'OUT': { x: 135, y: 45.5, label: 'OUT' },
};

// hx711-element.js -> pinInfo (Load Cell HX711)
export const HX711_PINS: Record<string, PinCoord> = {
  'VCC': { x: 7, y: 55,   label: 'VCC' },
  'DT':  { x: 7, y: 36.3, label: 'DT' },
  'SCK': { x: 7, y: 46.2, label: 'SCK' },
  'GND': { x: 7, y: 26.5, label: 'GND' },
};

// ir-receiver-element.js -> pinInfo
export const IR_RECEIVER_PINS: Record<string, PinCoord> = {
  'GND': { x: 20.977, y: 87.75, label: 'GND' },
  'VCC': { x: 30.578, y: 87.75, label: 'VCC' },
  'DAT': { x: 40.18,  y: 87.75, label: 'DAT' },
};

// membrane-keypad-element.js -> pinInfo (mặc định columns='4', 4x4)
export const MEMBRANE_KEYPAD_PINS: Record<string, PinCoord> = {
  'R1': { x: 100,    y: 338, label: 'R1' },
  'R2': { x: 110,    y: 338, label: 'R2' },
  'R3': { x: 119.5,  y: 338, label: 'R3' },
  'R4': { x: 129,    y: 338, label: 'R4' },
  'C1': { x: 138.5,  y: 338, label: 'C1' },
  'C2': { x: 148,    y: 338, label: 'C2' },
  'C3': { x: 157.75, y: 338, label: 'C3' },
  'C4': { x: 167.5,  y: 338, label: 'C4' },
};

// ssd1306-element.js -> pinInfo (OLED, I2C)
export const SSD1306_PINS: Record<string, PinCoord> = {
  'DATA': { x: 36.5, y: 12.5, label: 'DATA (SDA)' },
  'CLK':  { x: 45.5, y: 12.5, label: 'CLK (SCL)' },
  'DC':   { x: 54.5, y: 12.5, label: 'DC' },
  'RST':  { x: 64.5, y: 12.5, label: 'RST' },
  'CS':   { x: 74.5, y: 12.5, label: 'CS' },
  '3V3':  { x: 83.5, y: 12.5, label: '3V3' },
  'VIN':  { x: 93.5, y: 12.5, label: 'VIN' },
  'GND':  { x: 103.5, y: 12,  label: 'GND' },
};

// ili9341-element.js -> pinInfo (TFT — supportLevel visual-only, giữ lại đây
// chỉ để tham chiếu nếu sau này nâng cấp lên wiring-validation; getPinCoords()
// KHÔNG dispatch tới bảng này vì component đăng ký visual-only).
export const ILI9341_PINS: Record<string, PinCoord> = {
  'VCC':  { x: 48.3,  y: 287.2, label: 'VCC' },
  'GND':  { x: 57.9,  y: 287.2, label: 'GND' },
  'CS':   { x: 67.5,  y: 287.2, label: 'CS' },
  'RST':  { x: 77.1,  y: 287.2, label: 'RST' },
  'D/C':  { x: 86.7,  y: 287.2, label: 'D/C' },
  'MOSI': { x: 96.3,  y: 287.2, label: 'MOSI' },
  'SCK':  { x: 105.9, y: 287.2, label: 'SCK' },
  'LED':  { x: 115.5, y: 287.2, label: 'LED' },
  'MISO': { x: 125.1, y: 287.2, label: 'MISO' },
};

// lcd1602-element.js -> pinInfo, pins='full' (mặc định), rows=2 ->
// panelHeight=11.5mm -> y = 87.5 + 11.5*3.78 = 130.97 (đã tính tay đúng công
// thức getter thật, xem `get pinInfo()`/`get panelHeight()` trong source).
export const LCD1602_PINS: Record<string, PinCoord> = {
  'VSS': { x: 32,    y: 130.97, label: 'VSS (GND)' },
  'VDD': { x: 41.5,  y: 130.97, label: 'VDD (VCC)' },
  'V0':  { x: 51.5,  y: 130.97, label: 'V0' },
  'RS':  { x: 60.5,  y: 130.97, label: 'RS' },
  'RW':  { x: 70.5,  y: 130.97, label: 'RW' },
  'E':   { x: 80,    y: 130.97, label: 'E' },
  'D0':  { x: 89.5,  y: 130.97, label: 'D0' },
  'D1':  { x: 99.5,  y: 130.97, label: 'D1' },
  'D2':  { x: 109,   y: 130.97, label: 'D2' },
  'D3':  { x: 118.5, y: 130.97, label: 'D3' },
  'D4':  { x: 128,   y: 130.97, label: 'D4' },
  'D5':  { x: 137.5, y: 130.97, label: 'D5' },
  'D6':  { x: 147,   y: 130.97, label: 'D6' },
  'D7':  { x: 156.5, y: 130.97, label: 'D7' },
  'A':   { x: 166.5, y: 130.97, label: 'A (backlight+)' },
  'K':   { x: 176,   y: 130.97, label: 'K (backlight-)' },
};

// lcd1602-element.js -> pinInfo, pins='i2c' (LCD 16x2 I2C — cùng element
// thật `wokwi-lcd1602`, chỉ đổi componentType để khai báo bộ pin khác).
export const LCD1602_I2C_PINS: Record<string, PinCoord> = {
  'GND': { x: 4, y: 32,   label: 'GND' },
  'VCC': { x: 4, y: 41.5, label: 'VCC' },
  'SDA': { x: 4, y: 51,   label: 'SDA' },
  'SCL': { x: 4, y: 60.5, label: 'SCL' },
};

// neopixel-element.js -> pinInfo
export const NEOPIXEL_PINS: Record<string, PinCoord> = {
  'VDD':  { x: 1,  y: 3.5, label: 'VDD' },
  'DOUT': { x: 1,  y: 14,  label: 'DOUT' },
  'VSS':  { x: 21, y: 14,  label: 'VSS (GND)' },
  'DIN':  { x: 21, y: 3.5, label: 'DIN' },
};

// led-bar-graph-element.js -> pinInfo — anodeX=1.27*mm, cathodeX=8.83*mm,
// mm=mmToPix=3.78 (đã tính tay đúng công thức trong source).
export const LED_BAR_GRAPH_PINS: Record<string, PinCoord> = {
  'A1':  { x: 4.8,  y: 4.8,  label: 'Anode 1' },
  'A2':  { x: 4.8,  y: 14.4, label: 'Anode 2' },
  'A3':  { x: 4.8,  y: 24,   label: 'Anode 3' },
  'A4':  { x: 4.8,  y: 33.6, label: 'Anode 4' },
  'A5':  { x: 4.8,  y: 43.2, label: 'Anode 5' },
  'A6':  { x: 4.8,  y: 52.8, label: 'Anode 6' },
  'A7':  { x: 4.8,  y: 62.4, label: 'Anode 7' },
  'A8':  { x: 4.8,  y: 72,   label: 'Anode 8' },
  'A9':  { x: 4.8,  y: 81.6, label: 'Anode 9' },
  'A10': { x: 4.8,  y: 91.2, label: 'Anode 10' },
  'C1':  { x: 33.4, y: 4.8,  label: 'Cathode 1' },
  'C2':  { x: 33.4, y: 14.4, label: 'Cathode 2' },
  'C3':  { x: 33.4, y: 24,   label: 'Cathode 3' },
  'C4':  { x: 33.4, y: 33.6, label: 'Cathode 4' },
  'C5':  { x: 33.4, y: 43.2, label: 'Cathode 5' },
  'C6':  { x: 33.4, y: 52.8, label: 'Cathode 6' },
  'C7':  { x: 33.4, y: 62.4, label: 'Cathode 7' },
  'C8':  { x: 33.4, y: 72,   label: 'Cathode 8' },
  'C9':  { x: 33.4, y: 81.6, label: 'Cathode 9' },
  'C10': { x: 33.4, y: 91.2, label: 'Cathode 10' },
};

// 7segment-element.js -> pinInfo, digits=1/pins='top' (mặc định) — đã tính
// tay theo đúng công thức pinXY()/pinPositions() trong source (startX=-0.075,
// cols=5, bottomY=18, mmToPix=3.78).
export const SEVEN_SEGMENT_PINS: Record<string, PinCoord> = {
  'COM.1': { x: 23.7, y: 71.8, label: 'COM.1' },
  'COM.2': { x: 23.7, y: 3.8,  label: 'COM.2' },
  'A':     { x: 33.3, y: 3.8,  label: 'A' },
  'B':     { x: 42.9, y: 3.8,  label: 'B' },
  'C':     { x: 33.3, y: 71.8, label: 'C' },
  'D':     { x: 14.1, y: 71.8, label: 'D' },
  'E':     { x: 4.5,  y: 71.8, label: 'E' },
  'F':     { x: 14.1, y: 3.8,  label: 'F' },
  'G':     { x: 4.5,  y: 3.8,  label: 'G' },
  'DP':    { x: 42.9, y: 71.8, label: 'DP' },
};

// stepper-motor-element.js -> pinInfo, size=23 (mặc định, NEMA23) ->
// frameSize=57.3mm — đã tính tay xOff/yOff đúng công thức getter thật.
export const STEPPER_MOTOR_PINS: Record<string, PinCoord> = {
  'A-': { x: 95.1,  y: 235.5, label: 'A-' },
  'A+': { x: 104.7, y: 235.5, label: 'A+' },
  'B+': { x: 114.3, y: 235.5, label: 'B+' },
  'B-': { x: 123.9, y: 235.5, label: 'B-' },
};

// ===== Fallback-card mới (không có element @wokwi/elements thật) — toạ độ
// tự chọn cho vừa khung card khai báo trong CircuitCanvas.tsx
// (ROBOT_KIT_FALLBACK_CARDS), theo đúng pattern L298N/DC Motor/Battery
// Pack/Power Switch đã có. Chỉ những component wiring-validation (có pin
// thật) mới có entry — component visual-only thuần cơ khí/trang trí KHÔNG có
// entry (đúng quy ước "visual-only không render pin-dot").

// Card 90x50 — 6 chân: 3 chân điều khiển (VCC/GND/IN) + 3 chân chuyển mạch
// (COM/NO/NC) giống module relay 1-kênh thật.
export const RELAY_MODULE_PINS: Record<string, PinCoord> = {
  'VCC': { x: 10, y: 8,  label: 'VCC' },
  'IN':  { x: 45, y: 8,  label: 'IN' },
  'GND': { x: 80, y: 8,  label: 'GND' },
  'NO':  { x: 10, y: 42, label: 'NO' },
  'COM': { x: 45, y: 42, label: 'COM' },
  'NC':  { x: 80, y: 42, label: 'NC' },
};

// Card 60x50 — 2 cực, giống DC Motor.
export const FAN_PINS: Record<string, PinCoord> = {
  '+': { x: 6,  y: 25, label: '+ (VCC)' },
  '-': { x: 54, y: 25, label: '- (GND)' },
};

// Card 60x50 — 2 cực.
export const WATER_PUMP_PINS: Record<string, PinCoord> = {
  '+': { x: 6,  y: 25, label: '+ (VCC)' },
  '-': { x: 54, y: 25, label: '- (GND)' },
};

// Card 90x50 — 3 chân kiểu module cảm biến rời rạc (VCC/GND/OUT hoặc AO/DO).
export const WATER_LEAK_SENSOR_PINS: Record<string, PinCoord> = {
  'VCC': { x: 10, y: 25, label: 'VCC' },
  'GND': { x: 45, y: 25, label: 'GND' },
  'S':   { x: 80, y: 25, label: 'S (signal)' },
};

export const RAIN_SENSOR_PINS: Record<string, PinCoord> = {
  'VCC': { x: 8,  y: 25, label: 'VCC' },
  'GND': { x: 30, y: 25, label: 'GND' },
  'DO':  { x: 52, y: 25, label: 'DO' },
  'AO':  { x: 74, y: 25, label: 'AO' },
};

export const SOIL_MOISTURE_SENSOR_PINS: Record<string, PinCoord> = {
  'VCC': { x: 8,  y: 25, label: 'VCC' },
  'GND': { x: 30, y: 25, label: 'GND' },
  'DO':  { x: 52, y: 25, label: 'DO' },
  'AO':  { x: 74, y: 25, label: 'AO' },
};

export const IR_OBSTACLE_SENSOR_PINS: Record<string, PinCoord> = {
  'VCC': { x: 10, y: 25, label: 'VCC' },
  'GND': { x: 45, y: 25, label: 'GND' },
  'OUT': { x: 80, y: 25, label: 'OUT' },
};

export const LINE_TRACKING_SENSOR_PINS: Record<string, PinCoord> = {
  'VCC': { x: 10, y: 25, label: 'VCC' },
  'GND': { x: 45, y: 25, label: 'GND' },
  'OUT': { x: 80, y: 25, label: 'OUT' },
};

// Đơn giản hoá theo cảm biến màu I2C (kiểu TCS34725) — không phải TCS3200
// (S0-S3 nhiều chân hơn), chọn bản I2C cho gọn theo đúng tinh thần "wiring
// validation" (không cần độ chính xác phần cứng tuyệt đối).
export const COLOR_SENSOR_PINS: Record<string, PinCoord> = {
  'VCC': { x: 8,  y: 25, label: 'VCC' },
  'GND': { x: 30, y: 25, label: 'GND' },
  'SDA': { x: 52, y: 25, label: 'SDA' },
  'SCL': { x: 74, y: 25, label: 'SCL' },
};

// Vibration Sensor / SW-420 — dùng fallback card riêng (KHÔNG tái dùng
// tilt-switch-element thật của @wokwi vì hình dáng ống-bi-nghiêng khác hẳn
// module SW-420 PCB xanh thật — tự vẽ card thay vì mượn nhầm hình).
export const VIBRATION_SENSOR_PINS: Record<string, PinCoord> = {
  'VCC': { x: 10, y: 25, label: 'VCC' },
  'GND': { x: 45, y: 25, label: 'GND' },
  'OUT': { x: 80, y: 25, label: 'OUT' },
};

// ===== Component mới (2026-07-28, task "pin/visual chuẩn theo thực tế") =====

// mpu6050-element.js -> pinInfo (literal, KHÔNG cần quy đổi mm — giống
// LED_PINS/HC_SR04_PINS, toạ độ trong pinInfo đã là px trong hệ viewBox thật).
export const MPU6050_PINS: Record<string, PinCoord> = {
  'INT': { x: 7.28, y: 5.78, label: 'INT' },
  'AD0': { x: 16.9, y: 5.78, label: 'AD0' },
  'XCL': { x: 26.4, y: 5.78, label: 'XCL' },
  'XDA': { x: 36.0, y: 5.78, label: 'XDA' },
  'SDA': { x: 45.6, y: 5.78, label: 'SDA' },
  'SCL': { x: 55.2, y: 5.78, label: 'SCL' },
  'GND': { x: 64.8, y: 5.78, label: 'GND' },
  'VCC': { x: 74.4, y: 5.78, label: 'VCC' },
};

// Card 90x50 (fallback-card, không có element @wokwi/elements cho ESC) — 2
// hàng x 3 cột giống layout Relay Module: hàng trên = tín hiệu (SIG/GND),
// hàng dưới = nguồn pin + đầu ra động cơ.
export const ESC_PINS: Record<string, PinCoord> = {
  'SIG':   { x: 10, y: 8,  label: 'SIG (từ ESP32)' },
  'GND':   { x: 45, y: 8,  label: 'GND (tín hiệu)' },
  'BATT+': { x: 80, y: 8,  label: 'BATT+ (pin)' },
  'BATT-': { x: 10, y: 42, label: 'BATT- (pin)' },
  'OUT+':  { x: 45, y: 42, label: 'OUT+ (Motor)' },
  'OUT-':  { x: 80, y: 42, label: 'OUT- (Motor)' },
};

// Card 60x50 — 2 cực, giống Fan/Water Pump (tải điện trở thuần).
export const HEATING_ELEMENT_PINS: Record<string, PinCoord> = {
  '+': { x: 6,  y: 25, label: '+ (VCC)' },
  '-': { x: 54, y: 25, label: '- (GND)' },
};

// Card 90x50 — 3 chân kiểu module pH meter phổ biến (VCC/GND/PO analog).
export const PH_SENSOR_PINS: Record<string, PinCoord> = {
  'VCC': { x: 10, y: 25, label: 'VCC' },
  'GND': { x: 45, y: 25, label: 'GND' },
  'PO':  { x: 80, y: 25, label: 'PO (analog)' },
};

// Line Tracking đa kênh (module TCRT5000 3/5 mắt dò line) — card 100x50 (3
// kênh) / 150x50 (5 kênh), BỔ SUNG bên cạnh LINE_TRACKING_SENSOR_PINS (1
// kênh) cũ, không thay thế.
export const LINE_TRACKING_3CH_PINS: Record<string, PinCoord> = {
  'VCC':  { x: 8,  y: 42, label: 'VCC' },
  'GND':  { x: 24, y: 42, label: 'GND' },
  'OUT1': { x: 44, y: 42, label: 'OUT1 (trái)' },
  'OUT2': { x: 60, y: 42, label: 'OUT2 (giữa)' },
  'OUT3': { x: 76, y: 42, label: 'OUT3 (phải)' },
};

// lcd2004-element.js -> LCD2004Element extends LCD1602Element (numCols=20,
// numRows=4) — pinInfo cho pins='i2c' là toạ độ LITERAL cố định trong source
// (KHÔNG phụ thuộc panelHeight/rows, khác nhánh pins='full'), nên trùng
// NGUYÊN với LCD1602_I2C_PINS — đã verify trực tiếp trong
// node_modules/@wokwi/elements/dist/esm/lcd1602-element.js get pinInfo().
export const LCD2004_PINS: Record<string, PinCoord> = {
  'GND': { x: 4, y: 32,   label: 'GND' },
  'VCC': { x: 4, y: 41.5, label: 'VCC' },
  'SDA': { x: 4, y: 51,   label: 'SDA' },
  'SCL': { x: 4, y: 60.5, label: 'SCL' },
};

export const LINE_TRACKING_5CH_PINS: Record<string, PinCoord> = {
  'VCC':  { x: 8,   y: 42, label: 'VCC' },
  'GND':  { x: 24,  y: 42, label: 'GND' },
  'OUT1': { x: 44,  y: 42, label: 'OUT1' },
  'OUT2': { x: 64,  y: 42, label: 'OUT2' },
  'OUT3': { x: 84,  y: 42, label: 'OUT3 (giữa)' },
  'OUT4': { x: 104, y: 42, label: 'OUT4' },
  'OUT5': { x: 124, y: 42, label: 'OUT5' },
};

// getPinKind() — phân loại pin theo rule tên chân + ngữ cảnh component (2026-
// 07-28), hiển thị trong hover tooltip trên canvas (CircuitCanvas.tsx). Nhận
// `type` đã normalize (hyphen-style, giống key dùng trong getPinCoords) —
// KHÔNG phải nguồn dữ liệu mới, chỉ suy luận từ tên pin đã có sẵn, không cần
// sửa từng PinCoord map. Rule ưu tiên: override theo (type, pinName) cụ thể
// trước (phân biệt "power nguồn" vs "power output tải" — vd Battery Pack +
// là nguồn, DC Motor terminal1 là tải), sau đó mới tới rule theo TÊN chung.
export function getPinKind(type: string, pinName: string): string {
  const name = pinName.toUpperCase();

  // ----- Override theo ngữ cảnh component cụ thể -----
  if (type === 'relay-module' && (name === 'COM' || name === 'NO' || name === 'NC')) return 'terminal (tiếp điểm)';
  if (type === 'l298n' && name.startsWith('OUT')) return 'power output (ra động cơ)';
  if ((type === 'dc-motor' || type === 'fan' || type === 'water-pump' || type === 'heating-element') && (name === 'TERMINAL1' || name === 'TERMINAL2' || name === '+' || name === '-')) {
    return name === '-' || name === 'TERMINAL2' ? 'power output (tải, -)' : 'power output (tải, +)';
  }
  if (type === 'esc' && (name === 'OUT+' || name === 'OUT-')) return 'power output (ra động cơ)';
  if (type === 'esc' && (name === 'BATT+' || name === 'BATT-')) return name === 'BATT-' ? 'ground (pin)' : 'power (pin)';
  if ((type === 'lcd1602' || type === 'lcd1602-i2c' || type === 'lcd2004') && name === 'A') return 'power (backlight+)';
  if ((type === 'lcd1602' || type === 'lcd1602-i2c' || type === 'lcd2004') && name === 'K') return 'ground (backlight-)';

  // ----- Rule theo tên chung -----
  if (['VCC', '5V', '3V3', 'VDD', 'VIN', 'V+', '+'].includes(name)) return 'power';
  if (['GND', 'VSS', '-'].includes(name) || name.startsWith('GND')) return 'ground';
  if (['SDA', 'SCL', 'XDA', 'XCL'].includes(name)) return 'i2c';
  if (name.includes('PWM')) return 'pwm';
  if (name === 'AO' || name === 'AOUT' || name === 'ANALOG' || /^A\d+$/.test(name)) return 'analog';
  if (name === 'DO' || name === 'DOUT') return 'digital';
  return 'signal';
}

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
  if (normalized === 'hc-sr04' || normalized === 'hc_sr04') return HC_SR04_PINS;
  if (normalized === 'l298n') return L298N_PINS;
  if (normalized === 'dc-motor' || normalized === 'dc_motor') return DC_MOTOR_PINS;
  if (normalized === 'battery-pack' || normalized === 'battery_pack') return BATTERY_PACK_PINS;
  if (normalized === 'power-switch' || normalized === 'power_switch') return POWER_SWITCH_PINS;
  if (normalized === 'rgb-led' || normalized === 'rgb_led') return RGB_LED_PINS;
  if (normalized === 'flame-sensor' || normalized === 'flame_sensor') return FLAME_SENSOR_PINS;
  if (normalized === 'gas-sensor' || normalized === 'gas_sensor' || normalized === 'mq-gas-sensor') return GAS_SENSOR_PINS;
  if (normalized === 'pir-motion-sensor' || normalized === 'pir_motion_sensor') return PIR_MOTION_SENSOR_PINS;
  if (normalized === 'photoresistor-sensor' || normalized === 'light-sensor' || normalized === 'ldr') return PHOTORESISTOR_SENSOR_PINS;
  if (normalized === 'ntc-temperature-sensor' || normalized === 'temperature-sensor') return NTC_TEMPERATURE_SENSOR_PINS;
  if (normalized === 'hx711' || normalized === 'load-cell-hx711') return HX711_PINS;
  if (normalized === 'ir-receiver' || normalized === 'ir_receiver') return IR_RECEIVER_PINS;
  if (normalized === 'membrane-keypad' || normalized === 'keypad') return MEMBRANE_KEYPAD_PINS;
  if (normalized === 'ssd1306' || normalized === 'oled-ssd1306') return SSD1306_PINS;
  if (normalized === 'lcd1602') return LCD1602_PINS;
  if (normalized === 'lcd1602-i2c' || normalized === 'lcd1602_i2c') return LCD1602_I2C_PINS;
  if (normalized === 'neopixel' || normalized === 'led-strip') return NEOPIXEL_PINS;
  if (normalized === 'led-bar-graph' || normalized === 'led_bar_graph') return LED_BAR_GRAPH_PINS;
  if (normalized === '7segment' || normalized === 'seven-segment') return SEVEN_SEGMENT_PINS;
  // stepper-motor: user yêu cầu giữ visual-only trước (chưa runtime) — CỐ
  // TÌNH không dispatch STEPPER_MOTOR_PINS (đã tính sẵn ở trên để dành khi
  // nâng cấp lên wiring-validation sau), giống cách xử lý ILI9341_PINS.
  if (normalized === 'relay-module' || normalized === 'relay') return RELAY_MODULE_PINS;
  if (normalized === 'fan' || normalized === 'dc-fan') return FAN_PINS;
  if (normalized === 'water-pump' || normalized === 'mini-pump') return WATER_PUMP_PINS;
  if (normalized === 'water-leak-sensor' || normalized === 'water_leak_sensor') return WATER_LEAK_SENSOR_PINS;
  if (normalized === 'rain-sensor' || normalized === 'rain_sensor') return RAIN_SENSOR_PINS;
  if (normalized === 'soil-moisture-sensor' || normalized === 'soil_moisture_sensor') return SOIL_MOISTURE_SENSOR_PINS;
  if (normalized === 'ir-obstacle-sensor' || normalized === 'ir_obstacle_sensor') return IR_OBSTACLE_SENSOR_PINS;
  if (normalized === 'line-tracking-sensor' || normalized === 'line_tracking_sensor') return LINE_TRACKING_SENSOR_PINS;
  if (normalized === 'color-sensor' || normalized === 'color_sensor') return COLOR_SENSOR_PINS;
  if (normalized === 'vibration-sensor' || normalized === 'sw-420' || normalized === 'sw420') return VIBRATION_SENSOR_PINS;
  // dht11 dùng chung hình dáng render với dht22 (không có element riêng
  // trong @wokwi/elements) nhưng vẫn khai báo đúng 4 pin vật lý qua alias.
  if (normalized === 'dht11') return DHT22_PINS;
  if (normalized === 'mpu6050' || normalized === 'imu-mpu6050') return MPU6050_PINS;
  if (normalized === 'esc') return ESC_PINS;
  if (normalized === 'heating-element' || normalized === 'heating_element') return HEATING_ELEMENT_PINS;
  if (normalized === 'ph-sensor' || normalized === 'ph_sensor') return PH_SENSOR_PINS;
  if (normalized === 'line-tracking-3ch' || normalized === 'line_tracking_3ch') return LINE_TRACKING_3CH_PINS;
  if (normalized === 'line-tracking-5ch' || normalized === 'line_tracking_5ch') return LINE_TRACKING_5CH_PINS;
  if (normalized === 'lcd2004') return LCD2004_PINS;
  return {};
}
