# User Onboarding / Product Tour Feature

## Tổng quan

Tính năng User Onboarding / Product Tour giúp người dùng mới hiểu nhanh cách sử dụng hệ thống thông qua một tour hướng dẫn trực quan.

## Các thành phần

### 1. Hook: `useOnboarding`
**File:** `src/hooks/useOnboarding.ts`

Hook quản lý toàn bộ logic của onboarding tour:
- Kiểm tra trạng thái onboarding từ database (`is_onboarded` trong bảng `profiles`)
- Quản lý các bước tour
- Lưu trạng thái khi hoàn thành hoặc bỏ qua tour

**Các bước tour được định nghĩa:**
1. **Welcome** - Chào mừng và giới thiệu
2. **Navbar** - Thanh điều hướng chính
3. **Searchbar** - Thanh tìm kiếm
4. **Conversations** - Danh sách cuộc trò chuyện
5. **Chat Window** - Cửa sổ chat

### 2. Component: `OnboardingTour`
**File:** `src/components/OnboardingTour.tsx`

Component hiển thị tour với các tính năng:
- **Overlay với dimming**: Làm mờ giao diện, chỉ highlight vùng được hướng dẫn
- **Highlight border**: Viền sáng quanh element được highlight
- **Tooltip**: Hiển thị thông tin hướng dẫn với nút điều hướng
- **Welcome modal**: Pop-up chào mừng ở bước đầu tiên
- **Completion banner**: Banner hoàn thành khi kết thúc tour

### 3. Database Migration
**File:** `database/migrations/add_is_onboarded_to_profiles.sql`

Thêm cột `is_onboarded` vào bảng `profiles` để lưu trạng thái onboarding.

## Cách sử dụng

### Chạy Migration

Trước tiên, cần chạy migration để thêm cột `is_onboarded`:

```sql
-- Chạy file migration
\i database/migrations/add_is_onboarded_to_profiles.sql
```

Hoặc chạy trực tiếp trong Supabase SQL Editor:

```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT false;
```

### Tích hợp vào Layout

Tour đã được tích hợp vào `MainLayout.tsx` và sẽ tự động hiển thị khi:
- User đăng nhập lần đầu
- `is_onboarded = false` trong database

### Thêm data-tour-id vào Elements

Để highlight một element trong tour, thêm attribute `data-tour-id`:

```tsx
<div data-tour-id="my-element">
  {/* Content */}
</div>
```

Sau đó thêm step tương ứng vào `onboardingSteps` trong `useOnboarding.ts`:

```typescript
{
  id: 'my-step',
  target: '[data-tour-id="my-element"]',
  title: 'Tiêu đề',
  content: 'Nội dung hướng dẫn',
  position: 'bottom' // top | bottom | left | right | center
}
```

## Hành vi

### Khi user đăng nhập lần đầu:
1. Hệ thống tự động hiển thị onboarding overlay sau 1 giây
2. Pop-up chào mừng xuất hiện ở giữa màn hình
3. User có thể:
   - Bắt đầu tour (Next)
   - Bỏ qua tour (Skip)

### Trong quá trình tour:
- Giao diện bị mờ, chỉ nổi bật vùng được hướng dẫn
- Tooltip hiển thị thông tin và nút điều hướng:
  - **Trước** (nếu không phải bước đầu)
  - **Tiếp theo** / **Hoàn thành** (bước cuối)
  - **X** để bỏ qua
- Progress indicators hiển thị vị trí hiện tại trong tour

### Khi hoàn thành tour:
- Banner hoàn thành xuất hiện với thông điệp:
  > "Bạn đã sẵn sàng sử dụng hệ thống! Chúc bạn trải nghiệm tốt."
- Banner tự động ẩn sau 5 giây hoặc khi user click "Bắt đầu sử dụng"
- `is_onboarded` được cập nhật thành `true` trong database

### Từ lần login sau:
- Tour không tự động hiển thị nữa
- User có thể restart tour thủ công (nếu cần)

## Tùy chỉnh

### Thay đổi các bước tour

Chỉnh sửa mảng `onboardingSteps` trong `src/hooks/useOnboarding.ts`:

```typescript
export const onboardingSteps: OnboardingStep[] = [
  // Thêm hoặc sửa các bước ở đây
];
```

### Thay đổi thông điệp

Cập nhật nội dung trong `onboardingSteps` hoặc trong component `OnboardingTour`.

### Thêm tính năng restart tour

Để cho phép user restart tour từ Settings/Help page:

```typescript
const { restartTour } = useOnboarding(userId);

// Trong Settings/Help component
<button onClick={() => restartTour()}>
  Xem lại hướng dẫn
</button>
```

## Lưu trữ

Trạng thái onboarding được lưu ở 2 nơi:
1. **Database**: Cột `is_onboarded` trong bảng `profiles` (chính)
2. **Local Storage**: Key `zappy_onboarded` (backup)

Nếu database update thất bại, hệ thống sẽ fallback về local storage.

## Lưu ý kỹ thuật

1. **Z-index**: Tour sử dụng `z-[9999]` để đảm bảo hiển thị trên tất cả elements
2. **Portal**: Tour được render vào `document.body` thông qua React Portal
3. **Responsive**: Tooltip tự động điều chỉnh vị trí dựa trên viewport
4. **Performance**: Tour chỉ render khi `isActive = true`

## Troubleshooting

### Tour không hiển thị
- Kiểm tra `is_onboarded` trong database
- Kiểm tra console để xem có lỗi không
- Đảm bảo các elements có `data-tour-id` đúng

### Element không được highlight
- Kiểm tra selector trong `target` của step
- Đảm bảo element đã render trước khi tour bắt đầu
- Kiểm tra CSS có ảnh hưởng đến positioning không

### Tour hiển thị lại mỗi lần login
- Kiểm tra migration đã chạy chưa
- Kiểm tra `is_onboarded` có được update đúng không
- Xóa local storage và thử lại

