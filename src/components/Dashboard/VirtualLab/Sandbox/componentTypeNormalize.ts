// Tách ra từ CircuitCanvas.tsx (2026-07-27, task "hoàn thiện thumbnail palette")
// — normalizeComponentType() (hyphen-style, ví dụ 'wokwi-l298n' -> 'l298n',
// 'wokwi-dc-motor' -> 'dc-motor') là nguồn chuẩn hoá type DUY NHẤT dùng cho
// mọi thứ liên quan canvas render (renderFallbackCard/pinMaps/glue attach) —
// giữ NGUYÊN 100% logic cũ, chỉ đổi vị trí file để componentIllustrations.tsx
// (dùng chung giữa CircuitCanvas và ComponentPalettePopup) có thể import mà
// không tạo circular import với CircuitCanvas.tsx.
//
// LƯU Ý: đây KHÔNG phải cùng hàm với normalizeComponentType() trong
// componentReferenceCatalog.ts (hàm đó dùng style underscore, phục vụ badge/
// category lookup) — 2 hàm trùng tên nhưng khác chuẩn hoá, không được gộp.
export function normalizeComponentType(type: string) {
  const normalized = type.toLowerCase();
  if (normalized === 'push_button' || normalized === 'button' || normalized === 'pushbutton') return 'push_button';
  if (normalized === 'wokwi-led') return 'led';
  if (normalized === 'wokwi-pushbutton') return 'push_button';
  if (normalized === 'wokwi-buzzer') return 'buzzer';
  if (normalized === 'wokwi-servo') return 'servo';
  if (normalized === 'wokwi-potentiometer') return 'potentiometer';
  if (normalized === 'wokwi-resistor') return 'resistor';
  if (normalized === 'wokwi-dht22') return 'dht22';
  if (normalized === 'wokwi-hc-sr04') return 'hc-sr04';
  if (normalized === 'wokwi-l298n') return 'l298n';
  if (normalized === 'wokwi-dc-motor') return 'dc-motor';
  if (normalized === 'wokwi-robot-wheel') return 'robot-wheel';
  if (normalized === 'wokwi-caster-wheel') return 'caster-wheel';
  if (normalized === 'wokwi-robot-chassis') return 'robot-chassis';
  if (normalized === 'wokwi-battery-pack') return 'battery-pack';
  if (normalized === 'wokwi-power-switch') return 'power-switch';
  if (normalized === 'wokwi-breadboard') return 'breadboard';
  if (normalized === 'wokwi-delivery-box') return 'delivery-box';
  if (normalized === 'wokwi-rgb-led') return 'rgb-led';

  // ===== Thư viện linh kiện mở rộng (Component Library) =====
  // Real @wokwi/elements — render qua WOKWI_REAL_ELEMENT_TAGS.
  if (normalized === 'wokwi-flame-sensor') return 'flame-sensor';
  if (normalized === 'wokwi-gas-sensor') return 'gas-sensor';
  if (normalized === 'wokwi-pir-motion-sensor') return 'pir-motion-sensor';
  if (normalized === 'wokwi-photoresistor-sensor') return 'photoresistor-sensor';
  if (normalized === 'wokwi-ntc-temperature-sensor') return 'ntc-temperature-sensor';
  if (normalized === 'wokwi-hx711') return 'hx711';
  if (normalized === 'wokwi-ir-receiver') return 'ir-receiver';
  if (normalized === 'wokwi-membrane-keypad') return 'membrane-keypad';
  if (normalized === 'wokwi-ssd1306') return 'ssd1306';
  if (normalized === 'wokwi-lcd1602') return 'lcd1602';
  if (normalized === 'wokwi-lcd1602-i2c') return 'lcd1602-i2c';
  if (normalized === 'wokwi-neopixel') return 'neopixel';
  if (normalized === 'wokwi-led-bar-graph') return 'led-bar-graph';
  if (normalized === 'wokwi-7segment') return '7segment';
  if (normalized === 'wokwi-stepper-motor') return 'stepper-motor';
  if (normalized === 'wokwi-ili9341') return 'ili9341';
  // dht11: không có element riêng trong @wokwi/elements — dùng chung hình
  // dáng render với dht22 (xem nhánh render 'dht11' trong CircuitCanvas.tsx),
  // nhưng vẫn giữ componentType/pins riêng để khớp đúng BOM/registry/BE.
  if (normalized === 'wokwi-dht11') return 'dht11';

  // Fallback-card mới (không có element thật) — render qua renderFallbackCard().
  if (normalized === 'wokwi-relay-module') return 'relay-module';
  if (normalized === 'wokwi-fan') return 'fan';
  if (normalized === 'wokwi-water-pump') return 'water-pump';
  if (normalized === 'wokwi-solenoid-valve') return 'solenoid-valve';
  if (normalized === 'wokwi-water-leak-sensor') return 'water-leak-sensor';
  if (normalized === 'wokwi-rain-sensor') return 'rain-sensor';
  if (normalized === 'wokwi-soil-moisture-sensor') return 'soil-moisture-sensor';
  if (normalized === 'wokwi-ir-obstacle-sensor') return 'ir-obstacle-sensor';
  if (normalized === 'wokwi-line-tracking-sensor') return 'line-tracking-sensor';
  if (normalized === 'wokwi-color-sensor') return 'color-sensor';
  if (normalized === 'wokwi-vibration-sensor') return 'vibration-sensor';
  if (normalized === 'wokwi-esp32-cam') return 'esp32-cam';
  if (normalized === 'wokwi-wifi-cloud-node') return 'wifi-cloud-node';
  if (normalized === 'wokwi-dashboard-cloud') return 'dashboard-cloud';
  if (normalized === 'wokwi-robot-arm-base') return 'robot-arm-base';
  if (normalized === 'wokwi-gripper') return 'gripper';
  if (normalized === 'wokwi-conveyor-belt') return 'conveyor-belt';
  if (normalized === 'wokwi-sorting-box') return 'sorting-box';
  if (normalized === 'wokwi-ball') return 'ball';
  if (normalized === 'wokwi-fire-extinguisher') return 'fire-extinguisher';
  if (normalized === 'wokwi-water-tank') return 'water-tank';
  if (normalized === 'wokwi-drone-frame') return 'drone-frame';
  if (normalized === 'wokwi-propeller') return 'propeller';
  if (normalized === 'wokwi-drone-motor') return 'drone-motor';
  if (normalized === 'wokwi-stair-obstacle') return 'stair-obstacle';
  if (normalized === 'wokwi-trash-object') return 'trash-object';
  if (normalized === 'wokwi-delivery-item') return 'delivery-item';

  // ===== Component mới (2026-07-28, task "pin/visual chuẩn theo thực tế") =====
  if (normalized === 'wokwi-mpu6050') return 'mpu6050';
  if (normalized === 'wokwi-esc') return 'esc';
  if (normalized === 'wokwi-heating-element') return 'heating-element';
  if (normalized === 'wokwi-ph-sensor') return 'ph-sensor';
  // Line Tracking đa kênh (module TCRT5000 3/5 mắt) — BỔ SUNG bên cạnh
  // wokwi-line-tracking-sensor (1 kênh) cũ, KHÔNG thay thế, để không phá
  // diagram cũ đang dùng bản 1 kênh.
  if (normalized === 'wokwi-line-tracking-3ch') return 'line-tracking-3ch';
  if (normalized === 'wokwi-line-tracking-5ch') return 'line-tracking-5ch';
  // wokwi-lcd2004: element thật (LCD2004Element extends LCD1602Element,
  // numCols=20/numRows=4) — dọn orphan (BE SupportedPins có tên này từ
  // trước nhưng FE/DB chưa từng nối tới, xem VIRTUAL_LAB_PLAN.md).
  if (normalized === 'wokwi-lcd2004') return 'lcd2004';

  return normalized;
}
