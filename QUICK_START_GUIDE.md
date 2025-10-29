# 🚀 Quick Start Guide - New Features

## ✅ Đã hoàn thành 2 tính năng:

### 1. 🔍 **Global User Search**
### 2. 📍 **Location Sharing**

---

## 🛠️ Bước tiếp theo:

### 1. Run Database Migration 📊

**Cách 1: Supabase Dashboard (Recommended)**
```
1. Mở https://supabase.com/dashboard
2. Chọn project
3. Vào SQL Editor
4. Copy paste nội dung file: database/migrations/location_messages.sql
5. Click Run (hoặc Ctrl + Enter)
```

**Cách 2: Supabase CLI**
```bash
supabase db push
```

### 2. Test Features 🧪

#### Test Global Search:
```
1. Mở app (npm run dev)
2. Click vào SearchBar ở top
3. Nhập tên user (tối thiểu 2 ký tự)
4. Chờ 300ms → Kết quả hiện ra
5. Test các action buttons:
   - "Nhắn tin" (cho bạn bè)
   - "Kết bạn" (cho người lạ)
   - "Đã gửi lời mời" (pending requests)
```

#### Test Location Sharing:
```
1. Mở cuộc trò chuyện
2. Click nút 📍 MapPin ở ChatFooter
3. Click "Chia sẻ vị trí hiện tại"
4. Allow permission khi browser yêu cầu
5. Vị trí được gửi và hiển thị
6. Click "Mở trong Google Maps" để verify
```

---

## 📁 Files đã thay đổi:

### Global Search:
- ✅ `src/components/SearchBar.tsx`

### Location Sharing:
- ✅ `database/migrations/location_messages.sql` ← **RUN THIS**
- ✅ `src/types/supabase.type.ts`
- ✅ `src/services/chatService.ts`
- ✅ `src/hooks/useChat.ts`
- ✅ `src/components/conversation/LocationPicker.tsx` (NEW)
- ✅ `src/components/conversation/LocationMessage.tsx` (NEW)
- ✅ `src/components/conversation/ChatWindow.tsx`
- ✅ `src/components/ChatWindow/ChatFooter.tsx`
- ✅ `src/components/conversation/MessageBubble.tsx`

---

## 📚 Documentation:

### Chi tiết implementation:
👉 `SEARCH_AND_LOCATION_FEATURES.md`

### Database migration guide:
👉 `DATABASE_UPDATE_LOCATION.md`

---

## ⚠️ Lưu ý quan trọng:

### Location Sharing:
1. **Permission required** - Browser sẽ xin phép truy cập vị trí
2. **Geocoding** - Dùng OpenStreetMap Nominatim (free)
3. **Google Maps** - Link mở external, không cần API key
4. **Static Map** - Hiện dùng gradient, có thể thêm API key sau

### Privacy:
- Vị trí được lưu trong database
- Người khác có thể xem tọa độ chính xác
- Không có tự động xóa
- Cân nhắc thêm TTL nếu cần

---

## 🎯 Testing Checklist:

### Global Search:
- [ ] Search hoạt động (debounce 300ms)
- [ ] Hiển thị loading spinner
- [ ] Kết quả hiển thị đúng
- [ ] Action buttons hoạt động
- [ ] Click outside đóng dropdown
- [ ] Dark mode OK

### Location Sharing:
- [ ] Database migration chạy thành công
- [ ] Click MapPin button mở modal
- [ ] Geolocation permission request
- [ ] Coordinates được lấy đúng
- [ ] Reverse geocoding hoạt động
- [ ] Message hiển thị trong chat
- [ ] Google Maps link hoạt động
- [ ] Realtime sync với người khác
- [ ] Optimistic update
- [ ] Dark mode OK

---

## 🐛 Troubleshooting:

### "Permission denied" for location:
```
1. Check browser settings
2. Make sure HTTPS (localhost OK)
3. Try different browser
```

### Geocoding fails:
```
1. Check internet connection
2. Nominatim có rate limit (1 req/sec)
3. Fallback: Hiển thị coordinates
```

### Search không hoạt động:
```
1. Check console for errors
2. Verify userId exists
3. Test API trực tiếp trong Supabase
```

---

## ✅ Tất cả đã sẵn sàng!

Chỉ cần:
1. **Run database migration** ✨
2. **Test features** 🧪
3. **Enjoy!** 🎉

Đọc `SEARCH_AND_LOCATION_FEATURES.md` để biết chi tiết implementation.

