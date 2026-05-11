# Tài liệu Hệ thống Thiết kế (Design System)

## 1. Tầm nhìn Sáng tạo: "Phòng Thí Nghiệm Tư Duy" (The Intellectual Atelier)
Hệ thống thiết kế này không chỉ đơn thuần là một công cụ quản lý học tập; nó là một không gian học thuật cao cấp, nơi sự chính xác của khoa học (STEM) gặp gỡ sự tinh tế của thiết kế biên tập (Editorial Design). 

**Ngôi sao phương Bắc (Creative North Star):** "Sự Minh Bạch Có Cấu Trúc". 
Chúng ta loại bỏ các yếu tố trang trí dư thừa, tập trung vào việc phân lớp thông tin thông qua độ sâu tông màu (tonal depth) thay vì các đường kẻ cứng nhắc. Mục tiêu là tạo ra một cảm giác chuyên nghiệp, tĩnh lặng nhưng đầy năng lượng thúc đẩy sự khám phá.

---

## 2. Bảng màu & Quy tắc Phân lớp (Color & Layering)

Hệ thống sử dụng các mã màu Material Design để tạo ra sự phân tầng thị giác mà không cần dùng đến đường kẻ (border).

### Quy tắc "Không Đường Kẻ" (The No-Line Rule)
Nghiêm cấm sử dụng các đường kẻ 1px để ngăn cách các khu vực chức năng. Ranh giới giữa các phần phải được xác định bằng:
- **Chênh lệch sắc thái (Tonal shifts):** Ví dụ, một thẻ nội dung `surface-container-lowest` đặt trên nền `surface-container-low`.
- **Khoảng trắng (Whitespace):** Sử dụng các khoảng đệm rộng rãi để tạo nhịp điệu.

### Hệ thống Surface & Nesting
Hãy coi giao diện là các lớp vật liệu xếp chồng lên nhau:
- **Nền chính (Background):** `#f8f9fa` - Tạo cảm giác sạch sẽ, thoáng đãng.
- **Lớp lót (Surface Container Low):** `#f3f4f5` - Dùng cho các khu vực điều hướng như Sidebar hoặc Top Header.
- **Thẻ nội dung (Surface Container Lowest):** `#ffffff` - Luôn đặt nội dung quan trọng nhất lên lớp cao nhất để tạo sự nổi bật tự nhiên.

### Điểm nhấn & Texture
- **Gradient Chữ ký:** Sử dụng gradient tinh tế từ `primary` (#003b43) sang `primary_container` (#1a535c) cho các nút hành động chính hoặc trạng thái "Đang hoạt động" để tạo chiều sâu mà màu phẳng không làm được.
- **Hiệu ứng Kính (Glassmorphism):** Đối với các panel trong Virtual Lab, sử dụng màu `surface` với độ trong suốt 80% và `backdrop-blur` (20px-30px) để tạo cảm giác hiện đại, cao cấp.

---

## 3. Hệ thống Tipography (Typography)

Sự kết hợp giữa **Manrope** (Hiển thị) và **Inter** (Nội dung) tạo nên sự cân bằng giữa tính thẩm mỹ biên tập và hiệu năng đọc hiểu.

- **Display & Headline (Manrope):** Dùng cho tiêu đề chương học, con số thống kê hoặc tên bài lab. Font Manrope mang lại cảm giác hình học, hiện đại và uy quyền.
- **Body & Label (Inter):** Dùng cho nội dung bài học, hướng dẫn giải bài và giao diện code. Inter được tối ưu hóa cho việc đọc văn bản dài trên màn hình, đặc biệt là các ký tự toán học và kỹ thuật.

**Lưu ý Tiếng Việt:** Luôn đảm bảo `line-height` cho Body text tối thiểu là 1.5 để tránh các dấu thanh (sắc, huyền, hỏi...) bị dính vào dòng trên.

---

## 4. Độ sâu & Phân tầng (Elevation & Depth)

Thay vì đổ bóng (shadow) đen mặc định, chúng ta sử dụng **Tonal Layering**.

- **Đổ bóng môi trường (Ambient Shadows):** Chỉ sử dụng khi thực sự cần hiệu ứng "nổi". Shadow phải có độ mờ lớn (blur > 20px) và độ đục cực thấp (4-8%). Màu của shadow phải là màu `on-surface` pha loãng, không bao giờ dùng màu đen thuần túy.
- **Ghost Border Fallback:** Trong trường hợp bắt buộc phải có đường kẻ (ví dụ: bảng dữ liệu phức tạp), hãy sử dụng mã màu `outline_variant` với độ trong suốt 15-20%. Nó phải "vô hình" ở cái nhìn đầu tiên và chỉ xuất hiện khi người dùng tập trung nhìn sâu.

---

## 5. Thành phần Giao diện (Components)

### Sidebar Điều hướng (250px)
- **Style:** Sử dụng `surface_container_low`. Không có đường kẻ ngăn cách với nội dung chính.
- **Active State:** Sử dụng một dải màu `secondary` (Amber) mảnh ở cạnh trái và nền `primary_fixed_dim` với độ đục thấp.

### Thẻ (Cards)
- **Bo góc:** Sử dụng `rounded-lg` (1rem) cho các thẻ bài học chính để tạo cảm giác thân thiện.
- **Nền:** Luôn là `surface_container_lowest`.

### Virtual Lab (Giao diện đặc thù)
- **Trình soạn thảo code:** Sử dụng nền tối (`tertiary` - #233841) để tách biệt hoàn toàn với môi trường học lý thuyết, giúp học sinh tập trung tối đa.
- **Library Sidebar:** Sử dụng các icon outline mảnh, màu `primary` để biểu thị các linh kiện/thành phần STEM.

### Nút bấm (Buttons)
- **Primary:** Nền `primary`, chữ `on_primary`. Bo góc `full` (pill-shaped) để tạo sự khác biệt với các thẻ hình chữ nhật.
- **Secondary (CTA):** Sử dụng màu `secondary` (#964900) - màu Amber/Cam chỉ dành cho các hành động quan trọng nhất như "Nộp bài" hoặc "Bắt đầu thí nghiệm".

---

## 6. Nguyên tắc Nên & Không nên (Do's & Don'ts)

| Nên làm (Do) | Không nên làm (Don't) |
| :--- | :--- |
| Sử dụng khoảng trắng để phân cấp nội dung. | Sử dụng quá nhiều đường kẻ để chia khung. |
| Kết hợp Glassmorphism cho các cửa sổ pop-up. | Sử dụng shadow mặc định, đậm và thô. |
| Giữ các bảng dữ liệu (Data tables) tối giản nhất. | Dùng màu sắc quá rực rỡ cho các biểu đồ lab. |
| Sử dụng `secondary` làm điểm nhấn cho các tương tác quan trọng. | Lạm dụng màu Amber ở khắp nơi gây nhiễu thị giác. |
| Tận dụng `surface_container` để tạo chiều sâu. | Thiết kế mọi thứ trên một mặt phẳng trắng duy nhất. |

---

## 7. Lời kết từ Giám đốc Sáng tạo
Hệ thống này hướng tới một trải nghiệm **"Chậm và Chắc"**. Mỗi khoảng trống, mỗi lựa chọn màu sắc đều phải có mục đích. Đừng cố gắng lấp đầy màn hình; hãy để kiến thức và dữ liệu được "thở" trong một không gian thiết kế đẳng cấp. Chúng ta không xây dựng một ứng dụng, chúng ta đang xây dựng một môi trường nuôi dưỡng những nhà khoa học tương lai.