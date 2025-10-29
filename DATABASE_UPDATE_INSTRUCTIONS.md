# Hướng dẫn cập nhật Database để Filter Labels hoạt động

## ⚠️ Quan trọng: Phải chạy migration SQL này!

Để chức năng **filter và phân loại labels** hoạt động, bạn cần cập nhật database function `get_friends()`.

## 📋 Các bước thực hiện:

### Bước 1: Mở Supabase Dashboard
1. Truy cập: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor**

### Bước 2: Chạy Migration SQL

Copy và paste toàn bộ nội dung file sau vào SQL Editor:

**File:** `database/migrations/update_get_friends_with_labels.sql`

```sql
-- Update get_friends function to include label_id
-- This migration adds label_id array to the get_friends function return

-- Drop existing function
DROP FUNCTION IF EXISTS get_friends();

-- Create updated function
CREATE OR REPLACE FUNCTION get_friends()
RETURNS TABLE (
  id uuid,
  display_name text,
  username text,
  avatar_url text,
  status text,
  last_seen_at timestamp with time zone,
  label_id text[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.username,
    p.avatar_url,
    p.status,
    p.last_seen_at,
    -- Get array of label IDs for this friend
    COALESCE(
      ARRAY_AGG(clm.label_id) FILTER (WHERE clm.label_id IS NOT NULL),
      ARRAY[]::text[]
    ) as label_id
  FROM friends f
  INNER JOIN profiles p ON p.id = f.friend_id
  LEFT JOIN contact_label_map clm ON clm.friend_id = f.friend_id
  WHERE f.user_id = auth.uid()
  GROUP BY p.id, p.display_name, p.username, p.avatar_url, p.status, p.last_seen_at
  ORDER BY p.display_name;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_friends() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_friends() IS 'Returns list of friends for the current user with their assigned labels';
```

### Bước 3: Click "RUN" để thực thi

✅ Nếu thành công, bạn sẽ thấy thông báo "Success. No rows returned"

### Bước 4: Verify (Kiểm tra)

Chạy query test để kiểm tra:

```sql
SELECT * FROM get_friends();
```

Kết quả phải có cột `label_id` (array of text).

## 🎯 Sau khi cập nhật Database

Bạn có thể sử dụng đầy đủ tính năng:

### 1️⃣ Tạo Labels
- Vào trang Friends
- Click nút **Filter** (nút thứ 3 bên phải)
- Hover vào **"Phân loại"**
- Click **"Quản lý nhãn"**
- Tạo labels với tên và màu sắc tùy ý

### 2️⃣ Gán Labels cho Bạn bè
- Click vào nút **menu (⋮)** bên cạnh tên bạn bè
- Hover vào **"Phân loại"**
- Chọn labels muốn gán (có thể chọn nhiều)
- Labels sẽ hiển thị ngay dưới username

### 3️⃣ Filter theo Labels
- Click nút **Filter**
- Hover vào **"Phân loại"**
- Chọn label muốn lọc
- Danh sách bạn bè sẽ được lọc theo label đó

## 🔍 Troubleshooting

### Vấn đề: Filter không hoạt động
**Nguyên nhân:** Chưa chạy migration SQL
**Giải pháp:** Làm theo các bước trên

### Vấn đề: Không thấy labels đã tạo
**Nguyên nhân:** Chưa gán labels cho bạn bè
**Giải pháp:** Vào menu của từng bạn bè → Phân loại → Chọn labels

### Vấn đề: Lỗi khi gán labels
**Nguyên nhân:** Tables `contact_labels` hoặc `contact_label_map` chưa được tạo
**Giải pháp:** Kiểm tra xem các tables này có tồn tại trong database không

## 📊 Database Schema

Sau khi migration, schema sẽ như sau:

```
get_friends() function returns:
  - id: uuid
  - display_name: text
  - username: text
  - avatar_url: text
  - status: text
  - last_seen_at: timestamptz
  - label_id: text[] ← MỚI THÊM
```

## ✅ Checklist

- [ ] Đã chạy migration SQL trong Supabase Dashboard
- [ ] Verify function `get_friends()` có trả về cột `label_id`
- [ ] Refresh lại trang web
- [ ] Test tạo labels mới
- [ ] Test gán labels cho bạn bè
- [ ] Test filter theo labels
- [ ] Labels hiển thị đúng dưới username của bạn bè

## 🎨 UI/UX Flow hoàn chỉnh

```
1. Tạo Labels
   └─> Vào Filter → Phân loại → Quản lý nhãn
       └─> Nhập tên, chọn màu, click (+)

2. Gán Labels cho Bạn bè  
   └─> Click menu (⋮) bên cạnh bạn bè
       └─> Phân loại → Chọn labels
           └─> Labels hiển thị dưới username

3. Filter theo Labels
   └─> Click Filter → Phân loại → Chọn label
       └─> Danh sách bạn bè được lọc
```

Sau khi hoàn thành, tính năng filter và phân loại sẽ hoạt động hoàn hảo! 🚀

