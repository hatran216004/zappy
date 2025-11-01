# Navbar Status Indicator Implementation

## ✅ Hoàn Thành

Đã thêm hiển thị trạng thái online/offline cho avatar user trong component Navbar.

---

## 🎯 Tính Năng

### 1. **Status Badge trên Avatar**
- ✅ Dot tròn ở góc phải-dưới của avatar
- ✅ Màu xanh lá (green-500) khi **online**
- ✅ Màu xám (gray-400) khi **offline**
- ✅ Border màu #5865F2 (Discord Blurple) để nổi bật
- ✅ Kích thước: 3.5 × 3.5 (14px)
- ✅ Tooltip khi hover: "Đang hoạt động" / "Ngoại tuyến"

### 2. **Status Text trong Dropdown**
- ✅ Hiển thị text dạng: "Đang hoạt động" / "Ngoại tuyến"
- ✅ Có dot màu tương ứng bên cạnh
- ✅ Nằm dưới email trong dropdown menu
- ✅ Style: text-xs với màu #B5BAC1

---

## 📸 Visual Design

### Avatar với Status Badge:
```
┌─────────────┐
│             │
│   AVATAR    │
│             │
│          ●  │  ← Status dot (green/gray)
└─────────────┘
```

### Dropdown Menu:
```
┌────────────────────────────┐
│ Nguyễn Văn A               │
│ email@example.com          │
│ ● Đang hoạt động           │ ← Status indicator
├────────────────────────────┤
│ 👤 Thông tin cá nhân       │
│ ⚙️  Cài đặt                │
├────────────────────────────┤
│ 🚪 Đăng xuất               │
└────────────────────────────┘
```

---

## 🔧 Implementation Details

### Code Changes in `Navbar.tsx`:

#### 1. Avatar Button (Lines 87-105)
```tsx
<button className="... relative">
  <Avatar className={...}>
    <AvatarImage src={profile?.avatar_url} />
    <AvatarFallback>...</AvatarFallback>
  </Avatar>
  
  {/* Status indicator */}
  {profile?.status && (
    <span
      className={twMerge(
        "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#5865F2]",
        profile.status === "online" ? "bg-green-500" : "bg-gray-400"
      )}
      title={profile.status === "online" ? "Đang hoạt động" : "Ngoại tuyến"}
    />
  )}
</button>
```

**Key Points:**
- Thêm `relative` vào button để position status badge
- Status badge dùng `absolute` positioning
- Border màu `#5865F2` để match với background Navbar
- Conditional className: green cho online, gray cho offline
- Title attribute cho tooltip

#### 2. Dropdown Menu Label (Lines 116-137)
```tsx
<DropdownMenuLabel className="text-white">
  <div className="flex flex-col space-y-1">
    <p className="text-sm font-medium">
      {profile?.display_name || "Chưa có tên"}
    </p>
    <p className="text-xs text-[#B5BAC1]">
      {user?.email}
    </p>
    
    {/* Status text */}
    <div className="flex items-center gap-2 pt-1">
      <span
        className={twMerge(
          "w-2 h-2 rounded-full",
          profile?.status === "online" ? "bg-green-500" : "bg-gray-400"
        )}
      />
      <span className="text-xs text-[#B5BAC1]">
        {profile?.status === "online" ? "Đang hoạt động" : "Ngoại tuyến"}
      </span>
    </div>
  </div>
</DropdownMenuLabel>
```

**Key Points:**
- Thêm div với flex layout
- Dot nhỏ hơn (2×2) cho text
- Gap 2 (8px) giữa dot và text
- Padding top 1 (4px) để spacing từ email
- Same color logic như badge

---

## 🎨 Color Scheme

| Status  | Color    | Hex/Tailwind |
|---------|----------|--------------|
| Online  | Green    | `bg-green-500` |
| Offline | Gray     | `bg-gray-400` |
| Border  | Blurple  | `border-[#5865F2]` |

---

## 📊 Data Source

**Profile Status:**
```typescript
const { data: profile } = useProfile(userId as string);

// profile object contains:
{
  id: string,
  display_name: string,
  avatar_url: string,
  status: "online" | "offline",  // ← This field
  ...
}
```

Trạng thái được lấy từ:
- Table: `profiles`
- Column: `status`
- Type: `user_status` enum ("online" | "offline")

---

## ✅ Testing Checklist

### Visual Tests:
- [x] Avatar có status dot ở góc phải-dưới
- [x] Dot màu xanh khi online
- [x] Dot màu xám khi offline
- [x] Border dot màu #5865F2
- [x] Dropdown có text status
- [x] Dot trong dropdown match với badge

### Functional Tests:
- [x] Status update real-time (thông qua useProfile)
- [x] Hover tooltip hiển thị đúng
- [x] Không có linter errors
- [x] Responsive và không bị lỗi layout

### Edge Cases:
- [x] Profile chưa load (status badge ẩn)
- [x] User không có status field
- [x] Dark/Light theme compatibility

---

## 🚀 Real-time Updates

Status sẽ tự động cập nhật khi:
1. User thay đổi status (online ↔ offline)
2. Presence system update status
3. `useProfile` hook refetch data

Nhờ React Query, status được cache và sync tự động.

---

## 🔜 Future Enhancements (Optional)

1. **Custom Status Options:**
   - 🟢 Online
   - 🟡 Away (đi vắng)
   - 🔴 Do Not Disturb (không làm phiền)
   - ⚫ Invisible (ẩn)

2. **Status Message:**
   - Cho phép user set custom message
   - VD: "Đang họp", "Đi ăn trưa", etc.

3. **Status Dropdown:**
   - Menu để thay đổi status
   - Quick actions từ Navbar

4. **Animation:**
   - Pulse effect cho online status
   - Fade transition khi change status

---

## 📝 Files Modified

- ✅ `src/layouts/Navbar.tsx` - Added status badge & dropdown text

**Total Lines Changed:** ~20 lines

**Lint Errors:** 0 ✅

---

## 🎉 Summary

Navbar giờ hiển thị trạng thái online/offline của user với:
- Visual badge trên avatar
- Text status trong dropdown menu
- Real-time updates
- Consistent Discord-like design
- No linting errors

Người dùng giờ có thể dễ dàng biết mình đang ở trạng thái nào! 🟢

