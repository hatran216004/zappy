# Hướng Dẫn Khắc Phục Sự Cố Presence System

## Vấn Đề: Trạng Thái Không Cập Nhật Trên UI

### 🔍 **Nguyên Nhân Thường Gặp**

1. **Component không sử dụng hook presence mới**
2. **Cache không được invalidate**
3. **Realtime subscription không hoạt động**
4. **Component không re-render**

### ✅ **Giải Pháp**

#### 1. **Kiểm Tra Component Sử Dụng Hook Đúng**

**❌ Sai:**

```typescript
// Sử dụng useProfile thay vì hook presence
const { data: profile } = useProfile(userId);
const isOnline = profile?.status === "online";
```

**✅ Đúng:**

```typescript
// Sử dụng hook presence mới
import { useUserStatus } from "@/hooks/usePresence";

const { isOnline, color, text } = useUserStatus(userId);
```

#### 2. **Cập Nhật UserAvatar Component**

```typescript
// src/components/UserAvatar.tsx
import { useUserStatus } from "@/hooks/usePresence";

export function UserAvatar({ userId, showStatus = true }) {
  const { data: profile } = useProfile(userId);
  const { isOnline, color: statusColor } = useUserStatus(userId);

  // ... rest of component
}
```

#### 3. **Cập Nhật ChatHeader Component**

```typescript
// src/components/conversation/ChatHeader.tsx
import { useUserStatus } from "@/hooks/usePresence";

const ChatHeader = ({ otherParticipant, typingUsers }) => {
  const { isOnline, text: statusText } = useUserStatus(
    otherParticipant?.profile?.id || ""
  );

  const finalStatusText = typingUsers.length > 0 ? "Đang nhập..." : statusText;

  // ... rest of component
};
```

#### 4. **Sử Dụng PresenceProvider**

```typescript
// Wrap component với PresenceProvider để tự động subscribe
import PresenceProvider from "@/components/PresenceProvider";

function FriendsList({ friendIds }) {
  return (
    <PresenceProvider friendIds={friendIds}>
      {/* Your component content */}
    </PresenceProvider>
  );
}
```

### 🧪 **Test Component**

Sử dụng `PresenceTestComponent` để kiểm tra:

```typescript
import PresenceTestComponent from "@/components/PresenceTestComponent";

// Thêm vào route hoặc component để test
<PresenceTestComponent />;
```

### 🔧 **Debug Steps**

#### 1. **Kiểm Tra Console Logs**

```typescript
// Thêm vào useUserStatusTracker
onStatusChange: (status) => {
  console.log(`User status changed to: ${status}`);
};
```

#### 2. **Kiểm Tra Realtime Connection**

```typescript
// Trong useRealtimeFriendStatus
console.log("Realtime connected:", isConnected);
console.log("Friend statuses:", friendStatuses);
```

#### 3. **Kiểm Tra Database**

```sql
-- Kiểm tra trạng thái trong database
SELECT id, status, last_seen_at, status_updated_at
FROM profiles
WHERE id IN ('user1', 'user2', 'user3');
```

### 🚨 **Lỗi Thường Gặp**

#### 1. **"Cannot read property 'status' of undefined"**

- **Nguyên nhân**: Component đang sử dụng `profile.status` thay vì hook presence
- **Giải pháp**: Chuyển sang sử dụng `useUserStatus` hook

#### 2. **"Realtime not connected"**

- **Nguyên nhân**: Supabase Realtime chưa được enable
- **Giải pháp**: Kiểm tra Supabase dashboard > Realtime settings

#### 3. **"Status not updating"**

- **Nguyên nhân**: Cache không được invalidate
- **Giải pháp**: Sử dụng `queryClient.invalidateQueries()`

### 📋 **Checklist**

- [ ] Component sử dụng `useUserStatus` thay vì `useProfile`
- [ ] `PresenceProvider` được wrap đúng cách
- [ ] Realtime connection đã được thiết lập
- [ ] Database có dữ liệu đúng
- [ ] Console logs hiển thị updates
- [ ] Component re-render khi có thay đổi

### 🔄 **Flow Hoạt Động**

1. **User đăng nhập** → `useUserStatusTracker` set online
2. **Database update** → Supabase Realtime trigger
3. **Realtime subscription** → `useRealtimeFriendStatus` nhận update
4. **Cache invalidation** → Component re-render
5. **UI update** → Hiển thị trạng thái mới

### 📞 **Hỗ Trợ**

Nếu vẫn gặp vấn đề, hãy:

1. Kiểm tra console logs
2. Test với `PresenceTestComponent`
3. Kiểm tra Supabase dashboard
4. Xem network tab trong DevTools
