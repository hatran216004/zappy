# Chức năng tìm kiếm, filter bạn bè và hiển thị nhóm

## 📋 Tổng quan

Đã implement 2 tính năng chính:
1. **Tìm kiếm và lọc bạn bè** theo tên, username và phân loại nhãn
2. **Hiển thị danh sách nhóm** mà user đang tham gia

## ✨ Tính năng 1: Tìm kiếm & Filter Bạn bè

### 1.1. Service Functions (friendServices.ts)

Thêm các functions để quản lý contact labels:

```typescript
// Lấy danh sách labels của user
export const getContactLabels = async (userId: string): Promise<ContactLabel[]>

// Tạo label mới
export const createContactLabel = async (userId: string, name: string, color: number): Promise<ContactLabel>

// Cập nhật label
export const updateContactLabel = async (labelId: string, name: string, color: number): Promise<ContactLabel>

// Xóa label
export const deleteContactLabel = async (labelId: string): Promise<void>

// Gán label cho bạn bè
export const assignLabelToFriend = async (friendId: string, labelId: string): Promise<void>

// Bỏ gán label
export const removeLabelFromFriend = async (friendId: string, labelId: string): Promise<void>
```

### 1.2. React Query Hooks (useFriends.ts)

Thêm hooks để sử dụng các service functions:

```typescript
export const useContactLabels = (userId: string)
export const useCreateContactLabel = ()
export const useUpdateContactLabel = ()
export const useDeleteContactLabel = ()
export const useAssignLabelToFriend = ()
export const useRemoveLabelFromFriend = ()
```

### 1.3. Quản lý Labels - ManageLabelsModal.tsx

Modal component để quản lý labels với các tính năng:

- ✅ **Tạo label mới** với tên và màu sắc (8 màu preset)
- ✅ **Sửa label** (tên và màu)
- ✅ **Xóa label** (có confirm)
- ✅ **UI/UX đẹp** với ScrollArea, color picker
- ✅ **Realtime update** khi thay đổi labels

**Màu sắc có sẵn:**
- Xám, Đỏ, Cam, Vàng, Xanh lá, Xanh dương, Tím, Hồng

### 1.4. FriendTopbarAction Component

Component thanh công cụ với 3 chức năng chính:

#### a) Tìm kiếm
- Input field để tìm theo tên hoặc username
- Realtime search khi gõ

#### b) Sắp xếp
- **Tên (A-Z)**: Sắp xếp theo alphabet tăng dần
- **Tên (Z-A)**: Sắp xếp theo alphabet giảm dần

#### c) Filter (Lọc)
- **Tất cả**: Hiển thị tất cả bạn bè
- **Phân loại**: Filter theo labels
  - Hiển thị danh sách labels với màu sắc tương ứng
  - Click "Quản lý nhãn" để mở ManageLabelsModal

**Code:**
```typescript
<FriendTopbarAction
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
  selectedFilter={selectedFilter}
  onFilterChange={setSelectedFilter}
  sortBy={sortBy}
  onSortChange={setSortBy}
/>
```

### 1.5. FriendsList Component - Updated

Cập nhật FriendsList để hỗ trợ search, filter, và sort:

**Props:**
```typescript
interface FriendsListProps {
  searchTerm?: string;         // Từ khóa tìm kiếm
  selectedFilter?: string | null; // Label ID được chọn
  sortBy?: string;             // Cách sắp xếp
}
```

**Logic:**
1. **Search**: Lọc theo `display_name` hoặc `username`
2. **Filter**: Lọc theo `label_id`
3. **Sort**: Sắp xếp theo alphabet (vi locale)
4. **Group**: Nhóm theo labels với màu sắc và tên labels

**Hiển thị:**
- Bạn bè không có label → Hiển thị riêng
- Bạn bè có label → Nhóm theo từng label với header có màu

### 1.6. FriendPage - Updated

Page chính quản lý state và kết nối các components:

```typescript
const [searchTerm, setSearchTerm] = useState('');
const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
const [sortBy, setSortBy] = useState('Tên (A-Z)');
```

## ✨ Tính năng 2: Hiển thị danh sách nhóm

### 2.1. Service Functions (chatService.ts)

```typescript
// Lấy danh sách group conversations (chỉ nhóm, không bao gồm direct chats)
export const getGroupConversations = async (
  userId: string
): Promise<ConversationWithDetails[]>
```

### 2.2. React Query Hook (useChat.ts)

```typescript
// Hook lấy danh sách group conversations
export const useGroupConversations = (userId: string)
```

### 2.3. FriendGroupsPage Component

Page hiển thị danh sách nhóm với đầy đủ thông tin:

**Thông tin hiển thị:**
- ✅ **Group Avatar** (với fallback default-image.png)
- ✅ **Group Title**
- ✅ **Member Count** (số thành viên)
- ✅ **Last Message** (tin nhắn cuối cùng)
- ✅ **Last Message Time** (ngày tháng)
- ✅ **Unread Count** (số tin nhắn chưa đọc - badge đỏ)
- ✅ **Click vào nhóm** → Navigate đến `/chat/{conversationId}`

**UI/UX:**
- Card-based layout với hover effect
- Empty state đẹp khi chưa có nhóm
- Loading state
- Error handling

## 🗂️ Cấu trúc Database

### Contact Labels Table
```sql
contact_labels:
  - id: uuid
  - owner_id: uuid (user ID)
  - name: text
  - color: number (0-7)
```

### Contact Label Map Table
```sql
contact_label_map:
  - friend_id: uuid
  - label_id: uuid
```

## 📁 Files đã tạo/sửa

### Tạo mới:
1. `src/components/modal/ManageLabelsModal.tsx` - Modal quản lý labels
2. `FRIENDS_FEATURES_IMPLEMENTATION.md` - Documentation này

### Cập nhật:
1. `src/services/friendServices.ts` - Thêm label functions
2. `src/hooks/useFriends.ts` - Thêm label hooks
3. `src/services/chatService.ts` - Thêm getGroupConversations
4. `src/hooks/useChat.ts` - Thêm useGroupConversations hook
5. `src/components/friends/FriendTopbarAction.tsx` - Hoàn thiện với labels từ DB
6. `src/components/friends/FriendsList.tsx` - Thêm search, filter, sort logic
7. `src/pages/friends/FriendPage.tsx` - State management cho filter/search
8. `src/pages/friends/FriendGroupsPage.tsx` - Hiển thị danh sách nhóm

## 🎯 Hướng dẫn sử dụng

### Quản lý Labels:

1. **Tạo label:**
   - Vào trang Friends
   - Click vào dropdown "Filter"
   - Chọn "Phân loại" → "Quản lý nhãn"
   - Nhập tên label, chọn màu, click "+"

2. **Sửa label:**
   - Mở modal "Quản lý nhãn"
   - Click icon Edit (✏️) bên cạnh label
   - Sửa tên hoặc màu, click ✓

3. **Xóa label:**
   - Mở modal "Quản lý nhãn"
   - Click icon Trash (🗑️)
   - Confirm xóa

4. **Gán label cho bạn bè:**
   - _(Chức năng này cần được implement thêm trong FriendItem)_

### Tìm kiếm & Lọc bạn bè:

1. **Tìm kiếm:**
   - Gõ vào ô "Tìm bạn..." để tìm theo tên hoặc username

2. **Sắp xếp:**
   - Click dropdown "Sắp xếp"
   - Chọn A-Z hoặc Z-A

3. **Lọc theo label:**
   - Click dropdown "Filter"
   - Chọn "Phân loại" → Chọn label cần lọc
   - Chọn "Tất cả" để hiển thị lại tất cả

### Xem danh sách nhóm:

1. Vào trang Friends
2. Click vào tab "Nhóm" hoặc navigate đến `/friends/group`
3. Click vào nhóm để mở chat

## 🔄 Flow hoạt động

### Search & Filter Flow:
```
User input search/filter
  ↓
FriendPage state updates
  ↓
Props pass to FriendsList
  ↓
useMemo computes filtered & sorted friends
  ↓
Group by labels
  ↓
Render grouped lists
```

### Label Management Flow:
```
User opens ManageLabelsModal
  ↓
useContactLabels loads labels from DB
  ↓
User creates/updates/deletes label
  ↓
Mutation executes
  ↓
React Query invalidates cache
  ↓
UI updates automatically
```

### Group List Flow:
```
Navigate to /friends/group
  ↓
useGroupConversations fetches groups
  ↓
Filter type === 'group' from all conversations
  ↓
Render group list with details
  ↓
Click group → Navigate to /chat/{id}
```

## ✅ Checklist

- ✅ Service functions cho labels (CRUD)
- ✅ Hooks cho labels
- ✅ ManageLabelsModal UI
- ✅ FriendTopbarAction với labels từ DB
- ✅ FriendsList với search, filter, sort
- ✅ FriendPage state management
- ✅ Service function cho group conversations
- ✅ Hook cho group conversations
- ✅ FriendGroupsPage hiển thị nhóm
- ✅ No linter errors

## 🚀 Tiếp theo (Optional)

1. **Gán label cho bạn bè:**
   - Thêm UI trong FriendItem để gán/bỏ gán labels
   - Sử dụng `useAssignLabelToFriend` và `useRemoveLabelFromFriend`

2. **Bulk actions:**
   - Chọn nhiều bạn bè cùng lúc
   - Gán label cho nhiều người

3. **Label statistics:**
   - Hiển thị số lượng bạn bè trong mỗi label

4. **Export/Import labels:**
   - Xuất/Nhập cấu hình labels

## 📊 Performance

- ✅ **useMemo** cho filtered & sorted friends (tránh re-compute không cần thiết)
- ✅ **React Query** caching (staleTime: 60s)
- ✅ **Optimistic updates** cho mutations
- ✅ **Lazy loading** modal (chỉ load khi mở)

## 🎨 UI/UX Features

- ✅ **Realtime updates** khi thay đổi labels
- ✅ **Empty states** đẹp mắt
- ✅ **Loading states** rõ ràng
- ✅ **Error handling** graceful
- ✅ **Color-coded labels** dễ phân biệt
- ✅ **Responsive design** cho mobile
- ✅ **Dark mode support**
- ✅ **Smooth transitions** & hover effects

