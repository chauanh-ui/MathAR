# MathAR Kids 🎓

Ứng dụng học toán vui với AR (Thực tế ảo tăng cường) dành cho trẻ em từ 5-8 tuổi.

## 🌟 Tính năng

- **3 Bài tập tương tác:**
  - Bài 1: Ghép số lượng (đếm và chọn số đúng)
  - Bài 2: So sánh số lượng (lớn hơn/nhỏu hơn/bằng)
  - Bài 3: Tách - Gộp số (hiểu cấu tạo số)

- **Hệ thống AR:** Xem các con số và động vật 3D trong không gian thực

- **Gamification:**
  - ⭐ Hệ thống sao và level
  - 🔥 Chuỗi ngày học (streak)
  - 🏅 Huy hiệu thành tựu
  - 🎁 Shop avatar và theme

- **Khu vực phụ huynh:**
  - 🔐 Bảo vệ bằng mã PIN
  - 📊 Báo cáo tiến độ học tập
  - 📋 Xuất báo cáo văn bản

## 🚀 Cách chạy

### Cách 1: Mở trực tiếp (Đơn giản nhất)

1. Mở file `index.html` trong trình duyệt (Chrome Android recommend cho AR)
2. Hoặc chạy local server:
   ```bash
   # Python
   python -m http.server 8000

   # Node.js
   npx serve .
   ```
3. Truy cập `http://localhost:8000`

### Yêu cầu

- **HTTPS hoặc localhost** là BẮT BUỘC để sử dụng AR/camera
- Trình duyệt hỗ trợ WebXR (Chrome Android, Safari iOS)
- Kết nối internet cho model-viewer CDN

## 📁 Cấu trúc file

```
MathAR/
├── index.html          # App chính (tất cả trong 1 file)
├── state.js            # Quản lý state centralized
├── ar-engine.js        # WebXR/AR engine
└── README.md           # File này
```

## 🧪 Test AR không cần HTTPS

1. Mở Chrome
2. Truy cập `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
3. Bật flag này và thêm origin của bạn (vd: `http://192.168.1.100:8000`)
4. Restart Chrome

## 🎮 Screens

| Screen | Mô tả |
|--------|-------|
| **Splash** | Màn hình chào加载 |
| **Login** | Tạo profile (tên, tuổi, avatar) |
| **Home** | Dashboard chính với stats |
| **Exercise Menu** | Chọn bài tập (1-3) |
| **Exercise 1-3** | Màn hình làm bài |
| **Progress** | Xem tiến độ chi tiết |
| **Rewards** | Huy hiệu & shop |
| **Settings** | Cài đặt app |

## ⚙️ Cài đặt

- **Độ khó:** Dễ 🐣 / Trung bình 🐤 / Tự động 🤖
- **Âm thanh:** Bật/tắt sound effect
- **AR:** Bật/tắt AR (fallback 2D khi tắt)
- **Dark mode:** (sắp tới)

## 🎨 Easter Egg

Tap logo app 5 lần trong Settings → +5 sao 🌟 + confetti!

## 📊 Dữ liệu

Tất cả dữ liệu lưu trong `localStorage`:
- `mathAR_user` - Profile user
- `mathAR_progress_*` - Tiến độ từng bài
- `mathAR_rewards` - Huy hiệu
- `mathAR_parentalPin` - PIN phụ huynh
- `mathAR_difficulty` - Độ khó
- `mathAR_soundEnabled` - Âm thanh
- `mathAR_arEnabled` - AR mode

## 🔧 Development

### Offline Support (Service Worker)

App có basic SW cache cho app shell. Xem `sw.js` (sắp tới).

### Browser Support

| Browser | AR Support | Notes |
|---------|------------|-------|
| Chrome Android | ✅ Full | Recommend |
| Safari iOS | ✅ Full | Good |
| Chrome Desktop | ❌ No AR | Fallback 2D |
| Firefox | ❌ No AR | Fallback 2D |

## 📝 License

Dự án học tập cá nhân.

---

Made with ❤️ for kids learning math
