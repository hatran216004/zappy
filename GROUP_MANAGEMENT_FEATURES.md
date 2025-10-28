# Tính năng Quản lý Thành viên Nhóm

## Tổng quan

Đã triển khai đầy đủ tính năng quản lý nhóm với:

### 1. ✅ Quản lý Thành viên
- **Xem danh sách thành viên** với avatar, tên, role (Admin/Member)
- **Thêm thành viên** từ danh sách bạn bè
- **Xóa thành viên** (chỉ Admin)
- **Phân quyền Admin** cho thành viên (chỉ Admin)
- **Rời nhóm** (tất cả thành viên)

### 2. ✅ Quản lý Thông tin Nhóm
- **Cập nhật tên nhóm** (chỉ Admin)
- **Đổi ảnh đại diện nhóm** (chỉ Admin)
- **Xem thông tin nhóm** (số thành viên, ngày tạo)

### 3. ✅ Phân quyền
- **Admin**: Toàn quyền quản lý
  - Thêm/xóa thành viên
  - Cấp quyền admin
  - Đổi tên, ảnh nhóm
  - Tạo link mời
- **Member**: Quyền cơ bản
  - Xem thông tin
  - Rời nhóm
  - Chat

## Components

### GroupInfoModal
📄 `src/components/modal/GroupInfoModal.tsx`

Modal quản lý toàn diện với 3 tabs:

#### Tab 1: Thông tin
- Upload/đổi ảnh nhóm (drag & drop area)
- Chỉnh sửa tên nhóm inline
- Hiển thị stats (số thành viên, ngày tạo)
- Nút "Rời nhóm"

#### Tab 2: Thành viên
- Danh sách tất cả thành viên
- Icon crown cho Admin
- Các actions:
  - Cấp quyền Admin (nút Shield)
  - Xóa khỏi nhóm (nút UserMinus)

#### Tab 3: Thêm thành viên (chỉ Admin)
- Search và select bạn bè chưa trong nhóm
- Multi-select với custom checkbox
- Preview số lượng đã chọn

## Tính năng chi tiết

### 1. Upload Ảnh Nhóm
```typescript
// Upload to Supabase Storage
const filePath = `group-photos/group-${conversationId}-${timestamp}.ext`;
await supabase.storage.from('attachments').upload(filePath, file);
await updateGroupInfo(conversationId, { photo_url: filePath });
```

**Supported formats**: JPG, PNG, GIF, WebP
**Storage location**: `attachments/group-photos/`

### 2. Thêm Thành viên
```typescript
await addGroupMembers(conversationId, userIds, addedBy);
// ✅ Tự động tạo system message: "X đã được thêm vào nhóm"
```

### 3. Xóa Thành viên
```typescript
await removeGroupMember(conversationId, userId);
// ✅ Confirm dialog trước khi xóa
// ✅ Update left_at timestamp
```

### 4. Cấp quyền Admin
```typescript
await promoteToAdmin(conversationId, userId);
// ✅ Confirm dialog
// ✅ Update role từ 'member' → 'admin'
```

### 5. Rời Nhóm
```typescript
await leaveGroup(conversationId, userId);
// ✅ Confirm dialog
// ✅ System message: "X đã rời khỏi nhóm"
// ✅ Auto redirect về /chat
```

### 6. Cập nhật Tên Nhóm
```typescript
await updateGroupInfo(conversationId, { title: newName });
// ✅ Inline editing
// ✅ Real-time update
```

## UI/UX Features

### Confirmations
Tất cả actions nguy hiểm đều có confirm dialog:
- ✅ Xóa thành viên
- ✅ Rời nhóm  
- ✅ Cấp quyền admin

### Real-time Updates
Sử dụng React Query để invalidate cache sau mỗi action:
```typescript
queryClient.invalidateQueries({ queryKey: ['conversations'] });
queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
```

### Loading States
- ✅ Button disabled khi đang xử lý
- ✅ Loading text: "Đang tải...", "Đang thêm..."
- ✅ Upload progress indicator

### Visual Feedback
- ✅ Highlight selected members (border + background)
- ✅ Crown icon cho Admin
- ✅ Shield icon cho promote button
- ✅ Hover effects
- ✅ Success/error alerts

## Permissions Matrix

| Action | Admin | Member |
|--------|-------|--------|
| Xem thông tin | ✅ | ✅ |
| Xem thành viên | ✅ | ✅ |
| Thêm thành viên | ✅ | ❌ |
| Xóa thành viên | ✅ | ❌ |
| Cấp quyền Admin | ✅ | ❌ |
| Đổi tên nhóm | ✅ | ❌ |
| Đổi ảnh nhóm | ✅ | ❌ |
| Tạo link mời | ✅ | ❌ |
| Rời nhóm | ✅ | ✅ |

## Integration

### ChatHeader
```typescript
// Click vào icon Info (khi ở group chat)
<Button onClick={() => setShowGroupInfoModal(true)}>
  <Info className="size-5" />
</Button>

// Modal hiển thị
<GroupInfoModal
  open={showGroupInfoModal}
  onOpenChange={setShowGroupInfoModal}
  conversation={conversation}
  currentUserId={currentUserId}
/>
```

## System Messages

Các actions tự động tạo system message:

1. **Nhóm được tạo**
   > "Nhóm "{name}" đã được tạo"

2. **Thành viên join qua invite**
   > "{User} đã tham gia nhóm"

3. **Thành viên được thêm**
   > "{User} đã được thêm vào nhóm"

4. **Thành viên rời nhóm**
   > "{User} đã rời khỏi nhóm"

## Storage Structure

```
attachments/
  └── group-photos/
      ├── group-{id}-{timestamp}.jpg
      ├── group-{id}-{timestamp}.png
      └── ...
```

## Error Handling

Tất cả errors được catch và hiển thị alert:
```typescript
try {
  await action();
  // Success - invalidate queries
} catch (error) {
  console.error('Error:', error);
  alert('Lỗi khi thực hiện hành động');
}
```

## Testing Checklist

### Admin Tests
- [ ] Upload ảnh nhóm thành công
- [ ] Đổi tên nhóm thành công
- [ ] Thêm thành viên mới
- [ ] Xóa thành viên
- [ ] Cấp quyền admin cho member
- [ ] Rời nhóm (với confirm)

### Member Tests
- [ ] Xem thông tin nhóm
- [ ] Xem danh sách thành viên
- [ ] KHÔNG thể thêm thành viên
- [ ] KHÔNG thể xóa thành viên
- [ ] KHÔNG thể đổi tên/ảnh
- [ ] Rời nhóm thành công

### UI Tests
- [ ] Tabs hoạt động đúng
- [ ] Scroll area hiển thị tốt
- [ ] Confirm dialogs xuất hiện
- [ ] Loading states hiển thị
- [ ] Error messages hiển thị

## Performance

### Optimizations
- ✅ React Query caching
- ✅ Lazy load modals
- ✅ Optimistic updates (có thể thêm)
- ✅ Image compression (có thể thêm)

### Limits
- Upload size: Theo Supabase config
- Số thành viên: Unlimited (có thể set limit)
- Photo dimensions: Auto-resize recommended

## Future Enhancements

1. **Advanced Member Management**
   - Demote admin → member
   - Transfer ownership
   - Kick vs Ban distinction
   - Member roles (moderator)

2. **Group Settings**
   - Group description
   - Privacy settings (public/private)
   - Join approval required
   - Message permissions

3. **Photo Features**
   - Crop/resize before upload
   - Multiple photos (gallery)
   - Cover photo vs icon
   - Photo compression

4. **Audit Log**
   - History of all changes
   - Who added/removed whom
   - Role changes log

5. **Notifications**
   - Notify when added to group
   - Notify when promoted
   - Notify when kicked

## Notes

- Người tạo nhóm tự động là Admin
- Nhóm phải có ít nhất 1 Admin
- Khi Admin cuối cùng rời nhóm → random member → admin (TODO)
- Left members (left_at != null) không hiển thị trong danh sách
- System messages có type = 'system'

## Related Files

- Service: `src/services/chatService.ts`
- Component: `src/components/modal/GroupInfoModal.tsx`
- Header: `src/components/conversation/ChatHeader.tsx`
- Types: `src/types/supabase.type.ts`

## Support

Nếu gặp lỗi:
1. Check console logs
2. Verify permissions (isAdmin)
3. Check Supabase RLS policies
4. Verify storage bucket permissions
5. Check file size limits

