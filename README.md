# ❄️ CoolBox

Ứng dụng di động (Expo / React Native) để **điều khiển và theo dõi tủ lạnh mini CoolBox** dùng module làm lạnh Peltier. Giao diện tập trung vào chuyển động mượt, mang tính vật lý: cánh cửa tủ mở theo bản lề, đèn bên trong sáng theo góc mở cửa, quạt quay có quán tính.

> Hiện tại ứng dụng chạy bằng **dữ liệu giả lập (mock)**. Kiến trúc đã sẵn sàng để nối với thiết bị thật (ví dụ ESP32), xem phần [Kết nối thiết bị thật](#kết-nối-thiết-bị-thật).

## ✨ Tính năng

- **Màn hình chính**: hiển thị tủ lạnh dạng đồ họa động, nhiệt độ hiện tại, nhiệt độ mục tiêu, trạng thái làm lạnh (đang làm lạnh / đã đạt / tắt), Wi-Fi và thông báo.
- **Điều chỉnh nhiệt độ**: núm xoay đặt nhiệt độ mục tiêu trong khoảng 2 °C – 20 °C.
- **Chế độ vận hành**: Auto, Fast, Eco.
- **Điều khiển phần cứng**: bật/tắt Peltier, bật/tắt quạt, chỉnh tốc độ quạt.
- **Thống kê**: biểu đồ nhiệt độ theo thời gian với đường vẽ động.
- **Thông báo**: cảnh báo (tủ ấm lên, đạt nhiệt độ mục tiêu) và thông báo hệ thống.
- **Cài đặt**: bảo mật, thông tin thiết bị, hồ sơ, giới thiệu.
- **Hệ thống chuyển động riêng** (xem [MOTION.md](./MOTION.md)).

## 🧰 Công nghệ sử dụng

| Thành phần | Thư viện |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 57, React Native 0.86, React 19 |
| Ngôn ngữ | TypeScript |
| Animation | `react-native-reanimated` 4, `react-native-worklets` |
| Đồ họa vector | `react-native-svg` |
| Icon | `lucide-react-native` |
| Web | `react-native-web` |

## 🚀 Bắt đầu

### Yêu cầu

- [Node.js](https://nodejs.org) (khuyến nghị bản LTS mới nhất)
- Ứng dụng **Expo Go** trên điện thoại, hoặc Android Studio / Xcode nếu muốn chạy giả lập

### Cài đặt và chạy

```bash
# 1. Clone repo
git clone https://github.com/TEN-CUA-BAN/coolbox.git
cd coolbox

# 2. Cài thư viện
npm install

# 3. Chạy dev server
npm start
```

Sau đó quét mã QR bằng Expo Go, hoặc dùng các lệnh bên dưới.

### Các lệnh có sẵn

| Lệnh | Mô tả |
|---|---|
| `npm start` | Khởi động Expo dev server |
| `npm run android` | Chạy trên Android |
| `npm run ios` | Chạy trên iOS (cần macOS) |
| `npm run web` | Chạy trên trình duyệt |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |

> Khi thêm thư viện mới, hãy dùng `npx expo install <tên-thư-viện>` thay vì `npm install` để Expo tự chọn phiên bản tương thích với SDK.

## 📁 Cấu trúc thư mục

```
coolbox/
├── App.tsx                  # Điểm vào của ứng dụng
├── index.ts                 # Đăng ký root component
├── app.json                 # Cấu hình Expo
├── assets/                  # Icon, splash
└── src/
    ├── components/
    │   ├── fridge/          # Đồ họa tủ lạnh (thân, cửa, tay nắm, bóng đổ, nội thất)
    │   ├── ui/              # Thành phần UI dùng chung (Slider, Toggle, RollingNumber...)
    │   ├── BottomNavigation.tsx
    │   └── MiniFridge.tsx
    ├── screens/             # Các màn hình (Home, Temperature, Statistics, Settings...)
    ├── navigation/          # Điều hướng tùy chỉnh (tab + stack có animation)
    ├── motion/              # Token chuyển động, chuỗi mở cửa, trạng thái "mood"
    ├── services/            # Lớp giao tiếp với tủ lạnh (mock + interface)
    ├── state/               # Hook quản lý state (useCoolBox, usePrefs)
    ├── hooks/               # Hook tiện ích (useLayout)
    └── theme.ts             # Màu sắc, kiểu chữ
```

## 🔌 Kết nối thiết bị thật

Giao diện **chỉ giao tiếp qua interface `CoolBoxService`** (định nghĩa trong `src/services/types.ts`), không phụ thuộc vào cách truyền dữ liệu. Hiện đang dùng `mockCoolBoxService.ts` để giả lập.

Để nối với tủ lạnh thật (ví dụ ESP32 qua REST, WebSocket hoặc MQTT), bạn chỉ cần:

1. Tạo một service mới implement `CoolBoxService`:
   - đẩy trạng thái mới về cho các listener (`subscribe`)
   - chuyển các hàm như `setTargetTemperature`, `setPeltier`, `setFan`... thành lệnh gửi xuống thiết bị
2. Đổi service được export trong `src/services/index.ts`.

Không cần sửa bất kỳ màn hình nào.

## 🎞️ Hệ thống chuyển động

Nguyên tắc: **animation dùng để giải thích trạng thái vật lý**. Các token (thời lượng, easing, spring, physics...) nằm ở `src/motion/index.ts`. Chi tiết từng animation và phân loại xem tại [MOTION.md](./MOTION.md).

Khi chạy trên web, có thể dùng tham số URL để test nhanh: `?skip=1&tab=stats&push=temperature`.

## ⚠️ Lỗi đã biết / Cần sửa

- **Animation bị lỗi render trên bản web** (`npm run web`). Trên ứng dụng di động (Android / iOS), phần render đã ổn định.
- **Hướng xử lý:** cần rà soát và chỉnh lại phần thư viện, nhất là các thư viện liên quan đến animation và đồ họa trên web:
  - `react-native-reanimated` và `react-native-worklets`
  - `react-native-svg`
  - `react-native-web`
- Cần kiểm tra các phiên bản có tương thích với Expo SDK 57 không (`npx expo-doctor`, `npx expo install --fix`).

Trong lúc chưa sửa xong, nên test animation trên điện thoại thật hoặc giả lập thay vì trình duyệt.

## 🛠️ Phát triển

- Kiểm tra kiểu trước khi commit: `npm run typecheck`
- Kiểm tra cấu hình và phụ thuộc: `npx expo-doctor`
- Sửa phiên bản thư viện không tương thích: `npx expo install --fix`

## 📄 Giấy phép

Phát hành theo giấy phép MIT, xem file [LICENSE](./LICENSE).
