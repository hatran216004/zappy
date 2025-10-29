# 📋 Conversation Label Filter Feature

## ✅ Tính năng đã hoàn thành

Đã implement chức năng **lọc conversations theo nhãn** trong ChatSidebar, hoạt động tương tự như filter ở FriendPage.

## 🔧 Các thay đổi

### 1. **ClassifyDropdown Component**
**File:** `src/components/ContactBar/ClassifyDropdown.tsx`

#### Trước đây:
```typescript
// Nhận hardcoded tags
type ClassifyDropdownProps = {
  classifyTags: classificationList[];
};
```

#### Bây giờ:
```typescript
// Load labels từ database và quản lý filter state
type ClassifyDropdownProps = {
  selectedFilter: string | null;
  onFilterChange: (filterId: string | null) => void;
};

// Features:
- useContactLabels(userId) - Load labels từ database
- ManageLabelsModal - Quản lý nhãn
- Dynamic rendering - Hiển thị labels theo user đã tạo
- Checkmark - Hiển thị label đang chọn
```

#### Tính năng:
✅ **Tất cả** - Hiển thị tất cả conversations  
✅ **Danh sách labels** - Load từ database với màu sắc  
✅ **Checkmark** - Hiển thị label đang được chọn  
✅ **Quản lý thẻ phân loại** - Mở modal ManageLabelsModal  
✅ **Button text** - Hiển thị tên label đang filter  

---

### 2. **ChatSidebar Component**
**File:** `src/layouts/sidebar/ChatSidebar.tsx`

#### State Management:
```typescript
const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
```

#### Props Passing:
```typescript
// ClassifyDropdown
<ClassifyDropdown
  selectedFilter={selectedFilter}
  onFilterChange={setSelectedFilter}
/>

// ConversationsList
<ConversationsList
  userId={userId as string}
  selectedFilter={selectedFilter}
/>
```

#### Cleanup:
```typescript
// Removed hardcoded classifyTags array
// Removed unused 'Plus' import
```

---

### 3. **ConversationsList Component**
**File:** `src/components/conversation/ConversationsList.tsx`

#### Props Interface:
```typescript
interface ConversationsListProps {
  userId: string;
  selectedConversationId?: string;
  selectedFilter?: string | null; // ← NEW
}
```

#### Filter Logic:

##### a) Filter Friends:
```typescript
const filteredFriends = selectedFilter
  ? friends?.filter((friend) => friend.label_id?.includes(selectedFilter))
  : friends;
```

##### b) Filter Conversations:
```typescript
const filteredConversations = selectedFilter
  ? conversations?.filter((conv) => {
      // Only filter direct conversations (2 participants)
      if (conv.participants.length !== 2) return true; // Keep groups
      
      // Find the other participant
      const otherParticipant = conv.participants.find((p) => p.user_id !== userId);
      
      // Check if that participant is a friend with the selected label
      const friend = filteredFriends?.find((f) => f.id === otherParticipant.user_id);
      return friend !== undefined;
    })
  : conversations;
```

##### c) Empty State:
```typescript
// Dynamic message based on filter state
<p className="font-medium mb-2">
  {selectedFilter 
    ? 'Không có tin nhắn nào với nhãn này' 
    : 'Chưa có tin nhắn nào'
  }
</p>
```

---

## 🎯 Flow hoạt động

```
User clicks ClassifyDropdown
  ↓
Select a label (or "Tất cả")
  ↓
onFilterChange(labelId) called
  ↓
ChatSidebar.selectedFilter updated
  ↓
ConversationsList receives selectedFilter
  ↓
Filter friends by label_id
  ↓
Filter conversations by friend's label
  ↓
Render filtered results
```

---

## 📊 Filter Logic

### Khi selectedFilter = null (Tất cả):
```
✅ Hiển thị TẤT CẢ conversations
✅ Hiển thị TẤT CẢ friends
```

### Khi selectedFilter = "label-id-123":
```
✅ Chỉ hiển thị conversations với friends có label "label-id-123"
✅ Chỉ hiển thị friends có label "label-id-123"
✅ Group conversations KHÔNG bị filter (giữ nguyên)
```

---

## 🎨 UI/UX Features

### ClassifyDropdown Button:
```typescript
// Default state
"Phân loại"

// When filtering
"Tên nhãn đang chọn"
```

### Dropdown Menu:
```
📋 Theo thẻ phân loại
  ✅ Tất cả                    ← Checkmark nếu không filter
  ─────────────────────────
  🔴 Gia đình                  ← Với màu sắc
  🔵 Công việc                 ✅ Checkmark nếu đang chọn
  🟢 Bạn thân
  ─────────────────────────
  ⚙️  Quản lý thẻ phân loại
```

### Empty States:

#### No filter:
```
💬 Icon
Chưa có tin nhắn nào
Hãy kết bạn để bắt đầu trò chuyện
```

#### With filter:
```
💬 Icon
Không có tin nhắn nào với nhãn này
Hãy thử chọn nhãn khác
```

---

## ✅ Testing Checklist

- [x] Load labels từ database
- [x] Click "Tất cả" → Hiển thị tất cả conversations
- [x] Click label cụ thể → Chỉ hiển thị conversations với friends có label đó
- [x] Checkmark hiển thị đúng
- [x] Button text cập nhật theo filter
- [x] Group conversations không bị ẩn khi filter
- [x] Empty state hiển thị đúng message
- [x] "Quản lý thẻ phân loại" mở modal
- [x] Dark mode hoạt động
- [x] Không có lỗi linter
- [x] TypeScript types đúng

---

## 🎨 Color Palette

```typescript
const LABEL_COLORS = [
  { value: 0, color: 'bg-gray-500' },   // Gray
  { value: 1, color: 'bg-red-500' },    // Red
  { value: 2, color: 'bg-orange-500' }, // Orange
  { value: 3, color: 'bg-yellow-500' }, // Yellow
  { value: 4, color: 'bg-green-500' },  // Green
  { value: 5, color: 'bg-blue-500' },   // Blue
  { value: 6, color: 'bg-purple-500' }, // Purple
  { value: 7, color: 'bg-pink-500' },   // Pink
];
```

---

## 📝 Files Changed

1. ✅ `src/components/ContactBar/ClassifyDropdown.tsx` - Complete rewrite
2. ✅ `src/layouts/sidebar/ChatSidebar.tsx` - State management & props
3. ✅ `src/components/conversation/ConversationsList.tsx` - Filter logic

---

## 🔄 Consistency với FriendPage

| Feature | FriendPage | ChatSidebar |
|---------|-----------|-------------|
| Load labels từ DB | ✅ | ✅ |
| Filter dropdown | ✅ | ✅ |
| Checkmark | ✅ | ✅ |
| Button text update | ✅ | ✅ |
| Manage labels modal | ✅ | ✅ |
| Color palette | ✅ | ✅ |
| Empty states | ✅ | ✅ |

---

## 🎉 Kết quả

**Hoàn toàn tương đồng với FriendPage!**

- ✅ Load labels động từ database
- ✅ Filter theo nhãn user đã tạo
- ✅ UI/UX giống nhau
- ✅ Code clean, không có lỗi
- ✅ Type-safe với TypeScript
- ✅ Dark mode support
- ✅ Responsive

---

## 🚀 Cách sử dụng

### 1. Tạo nhãn mới:
```
ChatSidebar → Click "Phân loại" → "Quản lý thẻ phân loại"
→ Tạo nhãn mới với tên và màu sắc
```

### 2. Gán nhãn cho friend:
```
FriendPage → Click menu bạn bè → "Phân loại" → Chọn nhãn
```

### 3. Filter conversations:
```
ChatSidebar → Click "Phân loại" → Chọn nhãn
→ Chỉ hiển thị conversations với friends có nhãn đó
```

### 4. Xóa filter:
```
ChatSidebar → Click "Tên nhãn" → "Tất cả"
```

---

Perfect implementation! 🎯

