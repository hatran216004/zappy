# Quick Fix: COALESCE Type Error

## 🐛 Lỗi:
```
ERROR: 42846: COALESCE could not convert type text[] to uuid[]
```

## ✅ Giải pháp:

Thay đổi dòng 33 từ:
```sql
ARRAY_AGG(clm.label_id) FILTER (WHERE clm.label_id IS NOT NULL)
```

Thành:
```sql
ARRAY_AGG(clm.label_id::text) FILTER (WHERE clm.label_id IS NOT NULL)
```

Thêm `::text` để convert UUID sang TEXT.

## 📋 SQL đầy đủ đã sửa:

```sql
DROP FUNCTION IF EXISTS public.get_friends();

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
LANGUAGE sql
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
      ARRAY_AGG(clm.label_id::text) FILTER (WHERE clm.label_id IS NOT NULL),
      ARRAY[]::text[]
    ) as label_id
  FROM friends f
  INNER JOIN profiles p ON p.id = f.friend_id
  LEFT JOIN contact_label_map clm ON clm.friend_id = f.friend_id
  WHERE f.user_id = auth.uid()
  GROUP BY p.id, p.display_name, p.username, p.avatar_url, p.status, p.last_seen_at
  ORDER BY p.display_name;
$$;

GRANT EXECUTE ON FUNCTION get_friends() TO authenticated;
```

## 🚀 Chạy lại ngay:

1. Copy toàn bộ SQL trên
2. Paste vào Supabase SQL Editor
3. Click RUN
4. ✅ Success!

File đã được update: `database/migrations/update_get_friends_with_labels.sql`

