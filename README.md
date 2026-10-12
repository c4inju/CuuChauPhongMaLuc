# 🐉 CỬU CHÂU PHONG MA LỤC (ASIAN DARK FANTASY D&D 5E PIXEL RPG)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![D&D 5E](https://img.shields.io/badge/D%26D-5E%20Ruleset-red.svg)](https://dnd.wizards.com/)
[![9router](https://img.shields.io/badge/LLM%20Gateway-9router%20%2F%20OpenAI--compatible-blue.svg)](https://github.com/decolua/9router)
[![Pixel Art](https://img.shields.io/badge/Graphics-Retro%20Pixel%20Art-green.svg)](#)
[![Zero Dependency](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Vanilla)-brightgreen.svg)](#)

Ứng dụng Web Game nhập vai **Dungeons & Dragons 5E (TTRPG)** lấy bối cảnh **Thần Thoại / Tiên Hiệp / Võ Hiệp Phương Đông** với giao diện **Retro Pixel Art**, tích hợp **Dungeon Master (DM) Agent** và **AI Party Companions** qua cổng **9router (OpenAI-compatible Endpoint)**.

---

## 🌟 ĐẶC ĐIỂM NỔI BẬT

### 1. Hệ Thống 4 Chiến Dịch Độc Lập (Multi-Campaigns)
Mỗi lần chơi mới, bạn có thể chọn hoặc ngẫu nhiên khám phá một chiến dịch hoàn toàn khác biệt:
- 🏮 **Vạn Yêu Cô Sơn: Oán Khí Quán Trọ**: Trinh thám quỷ dị tại trạm dịch biên giới người - yêu, tiếng tỳ bà ai oán và yêu hồ ẩn thân.
- 🎋 **Rừng Trúc U Tăm: Huyết Kiếm Ma Môn**: Võ hiệp kiếm ảnh, phá vỡ Thập Diện Mai Phục của thích khách U Minh Các để hộ tống bí đồ Ma Môn.
- 🏛️ **Cổ Trận Di Tích: Thần Binh Viễn Cổ**: Thám hiểm điện thờ cổ vạn năm dưới lòng đất, giải mã cơ quan phù văn và đánh bại thạch thú canh cổng.
- ⛰️ **Phong Ma Nhai: Huyết Nguyệt Thiên Kiếp**: Tiên hiệp cao võ, gia cố 4 Trụ Phong Ma đỉnh núi tuyết trong bão sấm trước khi Huyết Nguyệt giải phong Ma Tổ.

### 2. Ký Ức Dài Hạn & Giang Hồ Biên Niên Sử (Long-Term AI Memory Architecture)
Giải quyết triệt để bài toán *"LLM bị quên cốt truyện sau thời gian dài"*:
- **Biên Niên Sử Mốc Sự Kiện (Milestones Timeline)**: Tự động ghi chép các bước ngoặt lớn sau mỗi chương/cảnh, đúc kết thành dòng thời gian cô đọng.
- **Sổ Tay Thế Giới (World Lorebook)**: Nhận diện và theo dõi NPC, Môn phái, Địa danh, Bảo vật đã tương tác.
- **Lời Thề & Nhiệm Vụ (Quests & Oaths)**: Quản lý mục tiêu chính và nhiệm vụ phụ.
- **Dynamic Memory Injection**: Tự động cô đặc ký ức và nạp vào đầu Prompt của Quản Trò (DM), đảm bảo **dù chơi 1 tuần, 1 tháng hay 1 năm, DM luôn nhớ rõ mọi ân oán và hành trình quá khứ**.

### 3. Khởi Tạo Nhân Vật Chuẩn D&D 5E
- Không tự động tạo nhân vật mặc định, người chơi tự tay tạo dựng hiệp khách:
  - **5 Môn Phái**: Kiếm Khách (Hit Die d10), Tu Sĩ Khí Công (d12), Âm Dương Sư (d6), Hàn Sĩ Đan Đạo (d8), Ám Dạ Thích Khách (d8).
  - **5 Xuất Thân**: Tán Tu Tự Do, Đệ Tử Danh Môn, Thế Gia Vọng Tộc, Thợ Săn Yêu Ma, Hỏa Đầu Quân.
  - **3 Phương Thức Phân Bổ Chỉ Số D&D 5E**:
    1. **Point Buy (27 Điểm Mua Chuẩn D&D 5E)** với bảng giá điểm chính xác.
    2. **Dãy Số Tiêu Chuẩn (Standard Array)**: 15, 14, 13, 12, 10, 8.
    3. **Tung 4d6 (Bỏ số thấp nhất)** cho 6 chỉ số STR, AGI, CON, INT, WIS, CHA.

### 4. Bàn Đổ Xúc Xắc 2D/3D (Interactive Dice Roller Tray)
- Đầy đủ bộ xúc xắc D&D: **d4, d6, d8, d10, d12, d20, d100**.
- Hiệu ứng lắc xúc xắc vật lý trên Canvas kèm âm thanh giả lập 8-bit.
- Tự động cộng Modifier chỉ số và phân tích công thức: `18 (d20) + 2 (STR) = 20`.
- Tự động nhận diện **Natural 20 (Đại thành công!)** và **Natural 1 (Đại thất bại!)**.
- Tích hợp kiểm tra thử thách độ khó **DC Check** do DM đưa ra.

### 5. 3 Đồng Đội AI (Party Companions)
- 🗡️ **Lãnh Hàn**: Kiếm khách lạnh lùng, phong thái chính đạo, tuyệt kỹ *Vạn Kiếm Quy Tông*.
- ☯️ **Thanh Vân**: Đạo sĩ Mao Sơn trầm tĩnh, tuyệt kỹ *Ngũ Lôi Chính Pháp*.
- 🗡️ **Dạ Nguyệt**: Thuật sĩ ám kích bí ẩn, tuyệt kỹ *Ám Dạ Tuyệt Sát*.
- Có nút xuất chiêu phối hợp và nút đàm đạo lắng nghe đồng đội bàn luận tình huống.

### 6. Đồ Họa & Âm Thanh Retro Hoài Cổ
- Phong cách Pixel Art bảng màu NES/SNES/GameBoy.
- Tùy chọn bật/tắt quét màn hình CRT Scanlines (`📺`).
- Bộ tổng hợp âm thanh Web Audio API (không phụ thuộc file ngoài).
- Khung vẽ cảnh trí Pixel Canvas chuyển đổi theo địa danh: Quán Trọ, Rừng Trúc, Cổ Trận, Vách Núi.

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────────────────────┐
│                       TRÌNH DUYỆT (CLIENT)                  │
│                                                             │
│   [Cột Trái: Nhân Vật]   [Cột Giữa: Story & DC]   [Cột Phải]│
│   • 6 Chỉ số D&D 5e      • Pixel Scene Canvas    • 3 AI Party│
│   • Máu/Khí/Kỹ năng      • Thử Thách DC Card     • Dice Tray│
│   • Túi đồ & Trang bị    • Hộp Chat & Quick Chips• (d4-d100)│
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / Same-Origin
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           LOCAL SERVER & PROXY (http://localhost:8088)       │
│                                                             │
│  • Serves static assets (HTML, CSS, JS)                     │
│  • Proxy route: /proxy/v1/* ──> http://127.0.0.1:20128/v1/* │
│    (Loại bỏ hoàn toàn lỗi CORS preflight & socket abort)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Loopback Proxy
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 9ROUTER / OPENAI-COMPATIBLE                 │
│                 (http://localhost:20128/v1)                 │
│                                                             │
│  • Models: owner, ag/gemini-3.8-flash, ag/claude-sonnet...  │
│  • Dungeon Master System Prompt + Chronicle Memory          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY

Dự án sử dụng **Zero External Dependencies** (chỉ dùng Node.js thuần):

### 1. Clone repository:
```bash
git clone https://github.com/your-username/cuu-chau-dnd-rpg.git
cd cuu-chau-dnd-rpg
```

### 2. Khởi chạy máy chủ Web & Proxy:
```bash
node server.js
```
Máy chủ sẽ khởi chạy tại:
- 🎮 **Web Game:** `http://localhost:8088/`
- 🔀 **Proxy 9Router:** `http://localhost:8088/proxy/v1/`

### 3. Kết nối với 9router:
1. Mở trình duyệt tại `http://localhost:8088/`.
2. Bấm nút **`⚙️ 9ROUTER API`** ở góc trên bên phải.
3. Chế độ khuyến nghị: **`🚀 Qua Local Proxy /proxy/v1`** (đã chọn mặc định).
4. Nhập **API Key** của 9router (nếu có yêu cầu xác thực).
5. Nhập **Model Name** (vd: `owner`, `ag/gemini-3.8-flash`, `gpt-4o`).
6. Bấm **`⚡ TEST KẾT NỐI`** ➔ Khi hiện xanh lá, bấm **`💾 LƯU CẤU HÌNH`**.

> **Mẹo:** Nếu chưa bật 9router, trò chơi tích hợp sẵn **Engine DM Nội Bộ (Offline Fallback)** phong phú giúp bạn chơi ngay lập tức mà không gặp bất kỳ lỗi nào!

---

## 🔒 BẢO MẬT & PUBLIC LÊN GITHUB

Dự án tuân thủ nghiêm ngặt các tiêu chuẩn an toàn mã nguồn:
- **Không hardcode Secrets:** Mọi API Key được lưu trong `LocalStorage` của trình duyệt người dùng, không bao giờ được commit lên repository.
- **File `.gitignore`** đã được cấu hình loại trừ file nhạy cảm, log và file save cục bộ.
- **Giấy phép mã nguồn mở:** Phát hành dưới giấy phép [MIT License](LICENSE).

---

## 📜 GIẤY PHÉP

Dự án được phân phối dưới giấy phép **MIT License**. Bạn được tự do sử dụng, chỉnh sửa và phân phối lại.
