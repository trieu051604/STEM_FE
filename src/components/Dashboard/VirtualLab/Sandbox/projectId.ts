// Lab (catalog) và VirtualLabProject (Guid, nơi lưu diagram/code thật) không
// có liên kết nào ở BE (đã audit: không FK, không endpoint resolve). Quyết
// định: tự suy ra 1 Guid tất định cho mỗi cặp (labId, studentId) bằng
// UUIDv5, dùng thẳng làm VirtualLabProject.Id — PUT api/diagrams/{id} và
// POST .../start đều tự tạo project nếu Guid chưa tồn tại, nên không cần
// đổi gì ở BE. Cùng input luôn ra cùng Guid, không cần lưu ánh xạ ở đâu cả.
//
// SANDBOX_PROJECT_NAMESPACE là hằng số RFC 4122 bắt buộc, phải giữ NGUYÊN
// VĨNH VIỄN — đổi giá trị này sẽ khiến mọi project cũ (đã tạo bằng namespace
// cũ) không còn tính ra được cùng Guid nữa, coi như "mất" quyền truy cập lại
// (dữ liệu vẫn còn trong DB, chỉ là không có Guid nào trỏ tới nó qua UI).
const SANDBOX_PROJECT_NAMESPACE = 'a1f3c8e2-4b7d-4e6a-9c1f-2d8b6a4e7f10';

async function uuidV5(name: string, namespace: string): Promise<string> {
  const namespaceBytes = namespace.replace(/-/g, '').match(/.{2}/g)!.map((b) => parseInt(b, 16));
  const nameBytes = new TextEncoder().encode(name);
  const data = new Uint8Array(namespaceBytes.length + nameBytes.length);
  data.set(namespaceBytes, 0);
  data.set(nameBytes, namespaceBytes.length);

  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hash = new Uint8Array(hashBuffer);

  // RFC 4122 §4.3: 16 byte đầu của digest, ép version=5 và variant=RFC4122.
  const bytes = hash.slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Guid VirtualLabProject dùng cho sandbox của 1 học sinh trên 1 Lab cụ thể.
// Tất định: gọi lại nhiều lần với cùng labId+studentId luôn ra cùng 1 Guid.
export function getSandboxProjectId(labId: string, studentId: number): Promise<string> {
  return uuidV5(`${labId}:${studentId}`, SANDBOX_PROJECT_NAMESPACE);
}
