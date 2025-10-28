# Tính năng Tạo Nhóm và Link Mời

## Tổng quan

Đã triển khai đầy đủ chức năng tạo nhóm chat và quản lý link mời với các tính năng sau:

### 1. Tạo Nhóm (Group Chat)
- ✅ Tạo nhóm với tên tùy chỉnh
- ✅ Chọn bạn bè để thêm vào nhóm
- ✅ Người tạo tự động trở thành admin
- ✅ Hiển thị số thành viên trong header
- ✅ Icon riêng cho nhóm chat

### 2. Quản lý Link Mời (Invite Links)
- ✅ Tạo link mời với mã ngẫu nhiên
- ✅ Tùy chọn thời gian hết hạn (1h, 24h, 7 ngày, 30 ngày, không giới hạn)
- ✅ Tùy chọn số lần sử dụng tối đa (1, 5, 10, 25, 50, không giới hạn)
- ✅ Xem danh sách link mời hiện có
- ✅ Thu hồi link mời
- ✅ Copy link mời dễ dàng
- ✅ Tracking số lần đã sử dụng

### 3. Tham Gia Nhóm qua Link
- ✅ Route public `/invite/:code`
- ✅ Tự động join khi click link
- ✅ UI thông báo thành công/thất bại
- ✅ Redirect về chat sau khi join
- ✅ Tạo system message khi có người join

## Cấu trúc Files

### 1. Database Migration
📄 `supabase_migration_group_invites.sql`
- Tạo bảng `group_invites`
- RLS policies
- Database function `join_group_via_invite()`

**Lưu ý**: Cần chạy migration này trên Supabase trước khi sử dụng!

### 2. Service Layer
📄 `src/services/chatService.ts` (đã cập nhật)

Các functions mới:
```typescript
// Tạo nhóm
createGroupConversation(title, memberIds, creatorId, photoUrl?)

// Quản lý invite
generateGroupInvite(conversationId, createdBy, expiresInHours?, maxUses?)
getGroupInvites(conversationId)
revokeGroupInvite(inviteId)
joinGroupViaInvite(inviteCode)

// Quản lý nhóm
updateGroupInfo(conversationId, {title, photo_url})
addGroupMembers(conversationId, userIds, addedBy)
removeGroupMember(conversationId, userId)
leaveGroup(conversationId, userId)
promoteToAdmin(conversationId, userId)
```

### 3. UI Components

#### CreateGroupModal
📄 `src/components/modal/CreateGroupModal.tsx`
- Modal tạo nhóm mới
- Search và select bạn bè
- Custom checkbox component

#### InviteLinkModal  
📄 `src/components/modal/InviteLinkModal.tsx`
- Tạo link mời mới
- Quản lý link hiện có
- Copy link
- Thu hồi link
- Hiển thị thông tin hết hạn/số lần dùng

#### JoinGroupPage
📄 `src/pages/JoinGroupPage.tsx`
- Page xử lý `/invite/:code`
- Loading state
- Success/Error UI
- Auto redirect

### 4. Layout Updates

📄 `src/layouts/sidebar/ChatSidebar.tsx`
- Thêm nút "Tạo nhóm" (Users icon)
- Tích hợp CreateGroupModal

📄 `src/components/conversation/ChatHeader.tsx`
- Hiển thị thông tin nhóm (tên, số thành viên)
- Nút "Link mời" cho admin
- Ẩn nút gọi video/audio trong group chat

📄 `src/components/AppRoutes.tsx`
- Thêm route `/invite/:inviteCode`

## Cách sử dụng

### Tạo nhóm mới:
1. Vào trang Chat
2. Click icon "Users" ở sidebar (bên cạnh nút +)
3. Nhập tên nhóm
4. Chọn bạn bè muốn thêm
5. Click "Tạo nhóm"

### Tạo link mời:
1. Vào nhóm chat (phải là admin)
2. Click icon "Link" ở header
3. Chọn thời gian hết hạn và số lần sử dụng
4. Click "Tạo link mời"
5. Copy link và chia sẻ

### Tham gia qua link:
1. Click vào link mời (dạng: `/invite/ABC12345`)
2. Tự động join và redirect vào chat

## Dependencies mới

```json
{
  "date-fns": "^latest" // Đã cài đặt
}
```

## Database Schema

### Bảng `group_invites`
```sql
- id (UUID, PK)
- conversation_id (UUID, FK -> conversations)
- invite_code (TEXT, UNIQUE)
- created_by (UUID, FK -> profiles)
- created_at (TIMESTAMPTZ)
- expires_at (TIMESTAMPTZ, nullable)
- max_uses (INT, nullable)
- used_count (INT, default 0)
- is_active (BOOLEAN, default true)
```

### Function `join_group_via_invite(_invite_code)`
- Validate invite
- Check expiry và max uses
- Add user vào group
- Increment used_count
- Tạo system message

## Permissions (RLS)

- ✅ Anyone can read active invites
- ✅ Only group admins can create invites
- ✅ Only group admins can update/delete invites
- ✅ Authenticated users can join via invite

## Tính năng nâng cao có thể thêm

1. Upload ảnh nhóm tùy chỉnh
2. Quản lý quyền thành viên (mute, kick)
3. Nhật ký hoạt động nhóm
4. Pin messages
5. Notifications settings per group
6. Group description
7. Group rules

## Testing

### Kiểm tra trước khi deploy:

1. ✅ Chạy migration SQL trên Supabase
2. ✅ Test tạo nhóm với nhiều thành viên
3. ✅ Test tạo invite với các options khác nhau
4. ✅ Test join qua invite link
5. ✅ Test thu hồi invite
6. ✅ Test permissions (admin vs member)
7. ✅ Test invite hết hạn
8. ✅ Test invite đạt max uses

## Notes

- System messages được tạo tự động khi:
  - Nhóm được tạo
  - Thành viên join
  - Thành viên rời nhóm
  
- Direct messages không hiển thị nút invite
- Chỉ admin mới thấy nút tạo invite
- Invite codes là random, 8 ký tự uppercase

## Migration Guide

1. Chạy SQL migration:
```bash
# Copy nội dung từ supabase_migration_group_invites.sql
# Paste vào Supabase SQL Editor và execute
```

2. Restart dev server:
```bash
npm run dev
```

3. Test các tính năng

## Support

Nếu có lỗi, kiểm tra:
- ✅ Migration đã chạy thành công
- ✅ RLS policies đã được tạo
- ✅ Function `join_group_via_invite` exists
- ✅ date-fns package đã được cài đặt

