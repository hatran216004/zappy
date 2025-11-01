# Hướng dẫn sửa lỗi Filter & Labels

## 🐛 Lỗi đã gặp:

```
POST .../rpc/get_friends 400 (Bad Request)
GET .../contact_labels?owner_id=eq.undefined 400 (Bad Request)
```

## ✅ Đã sửa:

### 1. **Fixed undefined userId**

Thêm `enabled: !!userId` vào các hooks để chỉ chạy khi user đã load:

```typescript
// src/hooks/useFriends.ts

export const useFriends = (userId: string) => {
  return useQuery({
    queryKey: friendKeys.list(userId),
    queryFn: () => getFriends(),
    enabled: !!userId, // ✅ Chỉ chạy khi có userId
    staleTime: 60000
  });
};

export const useContactLabels = (userId: string) => {
  return useQuery({
    queryKey: friendKeys.labels(userId),
    queryFn: () => getContactLabels(userId),
    enabled: !!userId, // ✅ Chỉ chạy khi có userId
    staleTime: 60000
  });
};
```

### 2. **Fixed SQL Function**

Cập nhật SQL function sử dụng `LANGUAGE sql` thay vì `plpgsql`:

```sql
-- database/migrations/update_get_friends_with_labels.sql

CREATE OR REPLACE FUNCTION public.get_friends()
RETURNS TABLE (
  id uuid,
  display_name text,
  username text,
  avatar_url text,
  status text,
  last_seen_at timestamp with time zone,
  label_id text[]
) 
LANGUAGE sql  -- ✅ Đổi từ plpgsql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.username,
    p.avatar_url,
    p.status,
    p.last_seen_at,
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
$$;
```

### 3. **Files đã cập nhật:**
- ✅ `src/hooks/useFriends.ts`
- ✅ `src/components/friends/FriendTopbarAction.tsx`
- ✅ `src/components/friends/FriendItem.tsx`
- ✅ `src/components/modal/ManageLabelsModal.tsx`
- ✅ `database/migrations/update_get_friends_with_labels.sql`

## 🔧 Bước thực hiện:

### Bước 1: Chạy lại Migration SQL

1. Vào **Supabase Dashboard** → **SQL Editor**
2. Copy **toàn bộ** nội dung file `database/migrations/update_get_friends_with_labels.sql` (đã update)
3. Paste và click **RUN**
4. Kiểm tra kết quả - phải thành công

### Bước 2: Verify Function

Chạy query test:

```sql
SELECT * FROM get_friends();
```

Kết quả phải có cột `label_id` (array).

### Bước 3: Refresh trang web

- Refresh lại trang `/friends`
- Kiểm tra Console - không còn lỗi 400

### Bước 4: Test chức năng

1. **Tạo Labels:**
   - Filter → Phân loại → Quản lý nhãn
   - Tạo 1-2 labels test

2. **Gán Labels:**
   - Click menu (⋮) bên cạnh bạn bè
   - Phân loại → Chọn labels
   - Labels hiển thị dưới username

3. **Filter:**
   - Filter → Phân loại → Chọn label
   - Danh sách bạn bè được lọc

## 📊 Troubleshooting

### Nếu vẫn lỗi 400:

**Kiểm tra:**
```sql
-- Xem function có tồn tại không
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_friends';

-- Xem chi tiết function
\df+ get_friends
```

**Xóa và tạo lại:**
```sql
DROP FUNCTION IF EXISTS public.get_friends() CASCADE;
-- Rồi chạy lại CREATE FUNCTION...
```

### Nếu labels không load:

**Kiểm tra tables:**
```sql
-- Xem có table contact_labels không
SELECT * FROM contact_labels WHERE owner_id = auth.uid();

-- Xem có table contact_label_map không  
SELECT * FROM contact_label_map;
```

Nếu không có tables → Cần tạo tables trước:

```sql
-- Tạo contact_labels table
CREATE TABLE IF NOT EXISTS public.contact_labels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Tạo contact_label_map table
CREATE TABLE IF NOT EXISTS public.contact_label_map (
  friend_id uuid NOT NULL,
  label_id uuid REFERENCES public.contact_labels(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (friend_id, label_id)
);

-- Enable RLS
ALTER TABLE public.contact_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_label_map ENABLE ROW LEVEL SECURITY;

-- Policies cho contact_labels
CREATE POLICY "Users can view their own labels"
  ON public.contact_labels FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own labels"
  ON public.contact_labels FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own labels"
  ON public.contact_labels FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own labels"
  ON public.contact_labels FOR DELETE
  USING (auth.uid() = owner_id);

-- Policies cho contact_label_map
CREATE POLICY "Users can view their own label mappings"
  ON public.contact_label_map FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contact_labels
      WHERE contact_labels.id = contact_label_map.label_id
      AND contact_labels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own label mappings"
  ON public.contact_label_map FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contact_labels
      WHERE contact_labels.id = contact_label_map.label_id
      AND contact_labels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own label mappings"
  ON public.contact_label_map FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contact_labels
      WHERE contact_labels.id = contact_label_map.label_id
      AND contact_labels.owner_id = auth.uid()
    )
  );
```

## ✅ Checklist

- [ ] Chạy migration SQL (đã update)
- [ ] Verify function `get_friends()` có cột `label_id`
- [ ] Refresh trang web
- [ ] Console không còn lỗi 400
- [ ] Tạo được labels
- [ ] Gán được labels cho bạn bè
- [ ] Filter theo labels hoạt động
- [ ] Labels hiển thị dưới username

## 📝 Lưu ý

- **Luôn refresh** sau khi chạy migration
- **Clear cache** browser nếu cần (Ctrl + Shift + R)
- Kiểm tra **Network tab** trong DevTools để debug
- Nếu vẫn lỗi → Check Console logs chi tiết

Sau khi hoàn thành checklist, tính năng filter sẽ hoạt động hoàn hảo! 🚀

