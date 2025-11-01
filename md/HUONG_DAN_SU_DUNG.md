# Hướng Dẫn Sử Dụng - Tính Năng Mới

## 🎉 Đã Hoàn Thành 2 Tính Năng

### 1. ❤️ Thả React (Reaction) cho Tin nhắn

**Cách sử dụng:**
1. Di chuột qua tin nhắn bất kỳ
2. Nhấn vào biểu tượng mặt cười 😊 
3. Chọn emoji bạn muốn thả
4. Reaction sẽ hiện ngay bên dưới tin nhắn
5. Nhấn lại vào reaction để bỏ

**Tính năng:**
- 12 emoji phổ biến để thả nhanh
- Hơn 100 emoji được phân loại theo chủ đề
- Hiển thị số lượng người đã thả cùng emoji
- Cập nhật realtime cho tất cả người dùng

---

### 2. 🗑️ Xóa Tin nhắn (2 cách)

**Cách 1: Xóa ở phía tôi**
- Nhấn vào menu 3 chấm ở tin nhắn
- Chọn "Xóa ở phía tôi" (màu cam)
- Tin nhắn chỉ biến mất ở bạn
- Người khác vẫn thấy bình thường
- ✅ Áp dụng cho: TẤT CẢ tin nhắn

**Cách 2: Thu hồi với mọi người**
- Nhấn vào menu 3 chấm ở tin nhắn
- Chọn "Thu hồi với mọi người" (màu đỏ)
- Tin nhắn biến mất cho TẤT CẢ mọi người
- Hiển thị "Tin nhắn đã được thu hồi"
- ⚠️ Chỉ áp dụng cho: Tin nhắn của CHÍNH BẠN

---

## 📋 Cần Làm Trước Khi Test

### Bước 1: Chạy Migration Database

Mở Supabase SQL Editor và chạy file:
```
database/migrations/deleted_messages.sql
```

### Bước 2: Khởi động lại ứng dụng
```bash
npm run dev
```

---

## ✅ Checklist Kiểm Tra

### Reaction:
- [ ] Hover vào tin nhắn → xuất hiện nút emoji
- [ ] Click nút emoji → mở popup emoji picker  
- [ ] Chọn emoji → hiện reaction dưới tin nhắn
- [ ] Click lại reaction → xóa reaction
- [ ] Nhiều người react → hiện đúng số lượng

### Xóa ở phía tôi:
- [ ] Menu có option "Xóa ở phía tôi"
- [ ] Click → confirm → tin nhắn biến mất
- [ ] Người khác vẫn thấy tin nhắn
- [ ] Refresh trang → tin nhắn vẫn bị ẩn

### Thu hồi với mọi người:
- [ ] Menu có option "Thu hồi với mọi người" (chỉ tin nhắn của bạn)
- [ ] Click → confirm → hiện "Tin nhắn đã được thu hồi"
- [ ] Tất cả người dùng thấy tin đã thu hồi

---

## 📁 File Đã Tạo/Sửa

### File Mới:
1. `database/migrations/deleted_messages.sql` - Database migration
2. `src/components/conversation/EmojiPicker.tsx` - Component emoji picker
3. `MESSAGE_FEATURES_IMPLEMENTATION.md` - Tài liệu chi tiết (English)
4. `HUONG_DAN_SU_DUNG.md` - File này

### File Đã Sửa:
1. `src/services/chatService.ts` - Thêm function xóa tin nhắn
2. `src/hooks/useChat.ts` - Thêm hook mới
3. `src/components/conversation/MessageBubble.tsx` - UI reaction & delete options
4. `src/components/conversation/ChatWindow.tsx` - Pass userId parameter
5. `src/types/supabase.type.ts` - Type definitions mới

---

## 🎨 Demo UI

### Reaction Picker:
```
┌─────────────────────────────┐
│   Quick Reactions           │
│  👍 ❤️ 😂 😮 😢 😡       │
│  🔥 👏 🎉 ✨ 💯 🙏       │
│                             │
│  Smileys | Gestures | ...   │
│  😀 😃 😄 😁 😆 😅       │
│  🤣 😂 🙂 🙃 😉 😊       │
└─────────────────────────────┘
```

### Menu Xóa:
```
┌──────────────────────────┐
│ Trả lời                  │
│ Chỉnh sửa (nếu là của bạn) │
│ ─────────────────────    │
│ 🟠 Xóa ở phía tôi        │
│ 🔴 Thu hồi với mọi người  │
└──────────────────────────┘
```

---

## 🐛 Gặp Lỗi?

### Lỗi: Không thấy emoji picker
- Kiểm tra file `EmojiPicker.tsx` đã được import đúng chưa
- Xem Console có lỗi JavaScript không

### Lỗi: Tin đã xóa vẫn hiện
- Đảm bảo đã chạy migration SQL
- Kiểm tra `deleted_messages` table đã tồn tại
- Clear cache trình duyệt (Ctrl+Shift+R)

### Lỗi: Không xóa được
- Kiểm tra RLS policies trong Supabase
- Xem Console log có lỗi API không
- Verify userId được pass đúng

---

## 💡 Tips

1. **Reaction nhanh**: Dùng Quick Reactions cho tiện
2. **Xóa cẩn thận**: "Thu hồi với mọi người" không thể hoàn tác
3. **Privacy**: Dùng "Xóa ở phía tôi" để ẩn tin nhạy cảm
4. **Performance**: Emoji picker load lazy, không ảnh hưởng tốc độ

---

## 📞 Hỗ Trợ

Nếu cần hỗ trợ thêm, xem file:
- `MESSAGE_FEATURES_IMPLEMENTATION.md` - Chi tiết kỹ thuật
- `database/migrations/deleted_messages.sql` - Database schema

---

Chúc bạn test thành công! 🎉

