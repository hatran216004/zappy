# Hệ Thống Quản Lý Trạng Thái Người Dùng (Presence System)

## Tổng Quan

Hệ thống presence cho phép theo dõi và hiển thị trạng thái hoạt động của người dùng (Online/Offline) theo thời gian thực sử dụng Supabase Realtime.

## Kiến Trúc

### 1. Database Schema

Bảng `profiles` đã có sẵn các trường cần thiết:

```sql
profiles {
  id: string (UUID, Primary Key)
  status: user_status ('online' | 'offline')
  last_seen_at: string | null (ISO timestamp)
  status_updated_at: string (ISO timestamp)
  display_name: string
  avatar_url: string | null
  username: string
  -- các trường khác...
}
```

### 2. Hooks Chính

#### `useUserStatusTracker`

- **Mục đích**: Quản lý trạng thái của người dùng hiện tại
- **Tính năng**:
  - Tự động set online khi component mount
  - Heartbeat định kỳ để duy trì trạng thái online
  - Set offline đáng tin cậy khi đóng tab/cửa sổ
  - Cleanup khi component unmount

```typescript
const { setOnline, setOffline, isOnline } = useUserStatusTracker({
  userId: "user-id",
  onStatusChange: (status) => console.log(`Status: ${status}`),
  heartbeatInterval: 30000, // 30 seconds
});
```

#### `useRealtimeFriendStatus`

- **Mục đích**: Lắng nghe và hiển thị trạng thái bạn bè theo thời gian thực
- **Tính năng**:
  - Subscribe realtime changes cho danh sách bạn bè
  - Tự động cập nhật trạng thái khi có thay đổi
  - Quản lý connection lifecycle
  - Xử lý lỗi và reconnection

```typescript
const {
  friendStatuses,
  isConnected,
  isFriendOnline,
  formatLastSeen,
  getStatusColor,
} = useRealtimeFriendStatus({
  friendIds: ["friend1", "friend2"],
  onStatusUpdate: (friendStatus) => console.log(friendStatus),
  onError: (error) => console.error(error),
});
```

### 3. Services

#### `presenceServices`

Các hàm tiện ích để tương tác với database:

- `updateStatus(status)`: Cập nhật trạng thái người dùng
- `getStatus(userId)`: Lấy trạng thái một người dùng
- `getMultipleStatus(userIds)`: Lấy trạng thái nhiều người dùng
- `subscribeStatus(userIds, callback)`: Subscribe realtime changes
- `setOnline()` / `setOffline()`: Set trạng thái online/offline
- `heartbeat()`: Gửi heartbeat để duy trì online
- `isUserOnline(lastSeenAt, status)`: Kiểm tra user có online không
- `formatLastSeen(lastSeenAt, status)`: Format thời gian last seen

## Cách Sử Dụng

### 1. Tích Hợp Vào App.tsx

```typescript
import useUserStatusTracker from "./hooks/useUserStatusTracker";

function PresenceProvider({ children }) {
  const { user, isAuthenticated } = useUser();

  useUserStatusTracker({
    userId: isAuthenticated && user?.id ? user.id : "",
    onStatusChange: (status) => {
      console.log(`User status changed to: ${status}`);
    },
    heartbeatInterval: 30000,
  });

  return <>{children}</>;
}
```

### 2. Hiển Thị Trạng Thái Bạn Bè

```typescript
import useRealtimeFriendStatus from "./hooks/useRealtimeFriendStatus";

function FriendsList({ friendIds }) {
  const { friendStatuses, isFriendOnline, formatLastSeen, getStatusColor } =
    useRealtimeFriendStatus({
      friendIds,
      onStatusUpdate: (friendStatus) => {
        console.log("Friend status updated:", friendStatus);
      },
    });

  return (
    <div>
      {friendStatuses.map((friend) => (
        <div key={friend.id}>
          <div className={`status-dot ${getStatusColor(friend.id)}`} />
          <span>{friend.display_name}</span>
          <span>{formatLastSeen(friend.id)}</span>
        </div>
      ))}
    </div>
  );
}
```

### 3. Component Demo

Sử dụng `FriendStatusDemo` component để test và minh họa:

```typescript
import FriendStatusDemo from "./components/FriendStatusDemo";

function App() {
  const friendIds = ["user1", "user2", "user3"];

  return <FriendStatusDemo friendIds={friendIds} />;
}
```

## Tính Năng Đáng Tin Cậy

### 1. Set Offline Khi Đóng Tab

Hệ thống sử dụng nhiều phương pháp để đảm bảo set offline đáng tin cậy:

1. **fetch với keepalive**: Phương pháp hiện đại, ưu tiên
2. **Synchronous XHR**: Fallback đáng tin cậy
3. **beforeunload event**: Chỉ lắng nghe khi đóng tab, không phải chuyển tab

### 2. Heartbeat System

- Gửi heartbeat mỗi 30 giây để duy trì trạng thái online
- Tự động dừng khi component unmount
- Xử lý lỗi và retry logic

### 3. Realtime Updates

- Sử dụng Supabase Realtime để lắng nghe thay đổi
- Tự động reconnect khi mất kết nối
- Xử lý lỗi và fallback gracefully

## Cấu Hình Supabase

### 1. Realtime Policy

Đảm bảo bảng `profiles` đã được enable Realtime:

```sql
-- Enable realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

### 2. RLS Policies

```sql
-- Cho phép user đọc trạng thái của bạn bè
CREATE POLICY "Users can view friend status" ON profiles
FOR SELECT USING (
  id IN (
    SELECT friend_id FROM friends WHERE user_id = auth.uid()
    UNION
    SELECT user_id FROM friends WHERE friend_id = auth.uid()
  )
);

-- Cho phép user cập nhật trạng thái của chính mình
CREATE POLICY "Users can update own status" ON profiles
FOR UPDATE USING (auth.uid() = id);
```

## Troubleshooting

### 1. Lỗi Kết Nối Realtime

- Kiểm tra Supabase project settings
- Đảm bảo Realtime đã được enable cho bảng profiles
- Kiểm tra RLS policies

### 2. Trạng Thái Không Cập Nhật

- Kiểm tra console logs
- Đảm bảo user đã đăng nhập
- Kiểm tra network connection

### 3. Performance Issues

- Giảm heartbeat interval nếu cần
- Limit số lượng friends được subscribe
- Sử dụng pagination cho danh sách bạn bè lớn

## Best Practices

1. **Chỉ subscribe khi cần thiết**: Unsubscribe khi component unmount
2. **Sử dụng debounce**: Tránh cập nhật quá thường xuyên
3. **Error handling**: Luôn xử lý lỗi gracefully
4. **Testing**: Test với nhiều tab và network conditions
5. **Monitoring**: Log và monitor trạng thái connection

## Tương Lai

- [ ] Thêm trạng thái "away" và "busy"
- [ ] Typing indicators
- [ ] Last seen privacy settings
- [ ] Mobile app support
- [ ] Offline message queuing
