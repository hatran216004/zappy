# Posts Feature - Database Migration

## Mô tả
Migration này tạo các bảng cần thiết cho tính năng Posts (bài viết) với reactions và comments.

## Các bảng được tạo

### 1. `posts`
- Lưu trữ bài viết của users
- Các cột:
  - `id`: UUID primary key
  - `author_id`: User tạo bài viết (FK to profiles)
  - `content`: Nội dung bài viết
  - `image_url`: URL ảnh (optional)
  - `created_at`: Thời gian tạo
  - `updated_at`: Thời gian cập nhật

### 2. `post_reactions`
- Lưu trữ reactions (like, love, haha, etc.) trên posts
- Các cột:
  - `id`: UUID primary key
  - `post_id`: Post được reaction (FK to posts)
  - `user_id`: User thực hiện reaction (FK to profiles)
  - `reaction_type`: Loại reaction (enum: like, love, haha, wow, sad, angry)
  - `created_at`: Thời gian tạo
  - Unique constraint: Một user chỉ có thể có 1 reaction trên 1 post

### 3. `post_comments`
- Lưu trữ comments trên posts
- Các cột:
  - `id`: UUID primary key
  - `post_id`: Post được comment (FK to posts)
  - `user_id`: User comment (FK to profiles)
  - `content`: Nội dung comment
  - `created_at`: Thời gian tạo
  - `updated_at`: Thời gian cập nhật

## Cách chạy migration

### Option 1: Supabase Dashboard (Khuyến nghị)
1. Mở Supabase Dashboard
2. Vào SQL Editor
3. Copy toàn bộ nội dung file `create_posts_tables.sql`
4. Paste và chạy

### Option 2: Supabase CLI
```bash
supabase db push
```

### Option 3: psql
```bash
psql -h <your-db-host> -U postgres -d postgres -f database/migrations/create_posts_tables.sql
```

## Row Level Security (RLS)

Tất cả các bảng đều có RLS enabled với các policies:
- **Posts**: Chỉ xem posts của bạn bè hoặc chính mình
- **Post Reactions**: Chỉ xem reactions trên posts có thể xem, chỉ thao tác reactions của chính mình
- **Post Comments**: Chỉ xem comments trên posts có thể xem, chỉ thao tác comments của chính mình

## Storage Bucket

Cần tạo storage bucket `post-images` để lưu ảnh posts.

### Cách 1: Qua Supabase Dashboard (Khuyến nghị)
1. Vào Supabase Dashboard > Storage
2. Tạo bucket mới tên `post-images`
3. Cấu hình:
   - **Public**: false (chỉ authenticated users)
   - **File size limit**: 5MB (5242880 bytes)
   - **Allowed MIME types**: image/jpeg, image/png, image/gif, image/webp
4. Thiết lập policies (RLS):
   - **Upload**: Authenticated users
   - **View**: Authenticated users
   - **Delete**: Owner only

### Cách 2: Qua SQL Editor
Chạy các SQL sau trong Supabase SQL Editor:

```sql
-- 1. Tạo storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' AND
  auth.role() = 'authenticated'
);

-- 3. Policy: Authenticated users can view post images
CREATE POLICY "Authenticated users can view post images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'post-images' AND
  auth.role() = 'authenticated'
);

-- 4. Policy: Users can delete their own post images
CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images' AND
  owner = auth.uid()
);
```

## Kiểm tra sau khi chạy

1. Kiểm tra tables đã được tạo:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('posts', 'post_reactions', 'post_comments');
```

2. Kiểm tra enum type:
```sql
SELECT typname FROM pg_type WHERE typname = 'post_reaction_type';
```

3. Kiểm tra indexes:
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('posts', 'post_reactions', 'post_comments');
```

4. Kiểm tra RLS policies:
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('posts', 'post_reactions', 'post_comments');
```

## Lưu ý

- Migration sử dụng `IF NOT EXISTS` nên có thể chạy an toàn nhiều lần
- Các indexes được tạo để tối ưu query performance
- RLS policies đảm bảo users chỉ xem posts của bạn bè hoặc chính mình

