# Sửa lỗi hiển thị Avatar

## 🐛 Vấn đề
Các thành viên trong nhóm chat và nhiều nơi khác trong ứng dụng không hiển thị avatar đúng cách. Vấn đề xuất phát từ việc sử dụng thẻ `<img>` thô với URL không đúng định dạng thay vì sử dụng component `UserAvatar` đã được chuẩn hóa.

## ✅ Giải pháp

### Thay đổi chính
Thay thế tất cả các thẻ `<img>` hiển thị avatar bằng component `UserAvatar`:

**Trước:**
```tsx
<img
  src={`${supabaseUrl}/${message.sender.avatar_url}`}
  alt={message.sender.display_name}
  className="w-8 h-8 rounded-full object-cover"
/>
```

**Sau:**
```tsx
<UserAvatar
  avatarUrl={message.sender.avatar_url}
  displayName={message.sender.display_name}
  status={message.sender.status}
  size="sm"
  showStatus={false}
/>
```

### Files đã được sửa

1. **`src/components/conversation/MessageBubble.tsx`**
   - Thêm import: `import { UserAvatar } from '../UserAvatar';`
   - Thay thế avatar của người gửi tin nhắn trong chat nhóm
   - Avatar hiện được hiển thị đúng với fallback (chữ cái đầu tiên của tên) nếu không có ảnh

2. **`src/components/modal/GroupInfoModal.tsx`**
   - Thêm import: `import { UserAvatar } from '../UserAvatar';`
   - Sửa hiển thị avatar trong danh sách thành viên nhóm
   - Sửa hiển thị avatar khi chọn bạn bè để thêm vào nhóm

3. **`src/components/modal/CreateGroupModal.tsx`**
   - Thêm import: `import { UserAvatar } from '../UserAvatar';`
   - Sửa hiển thị avatar trong danh sách bạn bè khi tạo nhóm mới

4. **`src/components/conversation/ConversationsList.tsx`**
   - Thêm import: `import { UserAvatar } from '../UserAvatar';`
   - Sửa hiển thị avatar của bạn bè trong danh sách Direct Messages
   - Giữ status indicator (online/offline)

5. **`src/components/friends/FriendsListForChat.tsx`**
   - Thêm import: `import { UserAvatar } from '../UserAvatar';`
   - Sửa hiển thị avatar trong danh sách bạn bè
   - Giữ status indicator

6. **`src/components/FriendStatusDemo.tsx`**
   - Thêm import: `import { UserAvatar } from './UserAvatar';`
   - Sửa hiển thị avatar trong demo component

## 🎯 Lợi ích

1. **Nhất quán (Consistency):** Tất cả avatar trong ứng dụng giờ đây sử dụng cùng một component
2. **Fallback tốt hơn:** Component `UserAvatar` tự động hiển thị chữ cái đầu tiên của tên nếu không có ảnh
3. **URL format đúng:** Component `UserAvatar` xử lý đúng cách avatar URL từ Supabase
4. **Dễ bảo trì:** Chỉ cần sửa một component nếu muốn thay đổi cách hiển thị avatar toàn bộ app

## 🔍 Component UserAvatar

Component này đã có sẵn trong `src/components/UserAvatar.tsx` với các tính năng:

- **Props:**
  - `avatarUrl`: Đường dẫn đến ảnh avatar
  - `displayName`: Tên hiển thị (dùng cho fallback)
  - `status`: Trạng thái online/offline
  - `size`: Kích thước (sm, md, lg, xl)
  - `showStatus`: Hiển thị status indicator hay không
  - `className`: Custom className

- **Fallback:** Hiển thị chữ cái đầu tiên của `displayName` nếu không có `avatarUrl`
- **Status Indicator:** Hiển thị dấu chấm xanh (online) hoặc xám (offline)

## ✅ Kiểm tra

- ✅ Không có lỗi linter
- ✅ Tất cả avatar trong chat nhóm hiển thị đúng
- ✅ Avatar trong modal thông tin nhóm hiển thị đúng
- ✅ Avatar khi tạo nhóm mới hiển thị đúng
- ✅ Avatar trong danh sách conversation hiển thị đúng
- ✅ Avatar trong danh sách bạn bè hiển thị đúng

## 📝 Ghi chú

Một số component khác trong ứng dụng đã sử dụng `UserAvatar` từ trước:
- `ConversationItem.tsx` (đã sử dụng đúng)
- `FriendItem.tsx` (đã sử dụng đúng)
- `FriendRequestItem.tsx` (đã sử dụng đúng)
- `FriendSearch.tsx` (đã sử dụng đúng)
- `Navbar.tsx` (sử dụng trực tiếp `Avatar` component của shadcn/ui)

Tất cả các file trên giờ đây đã nhất quán trong cách hiển thị avatar.

