# 📍 Database Migration: Location Messages

## 🎯 Mục đích:
Thêm hỗ trợ chia sẻ vị trí (GPS coordinates) vào messages table.

## 📝 File Migration:
`database/migrations/location_messages.sql`

## 🔧 SQL Script:

```sql
-- Migration: Add location sharing support to messages table
-- Description: Add columns for storing location data (latitude, longitude, address)

-- Add location columns to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS location_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Create index for location queries (if needed for future features like nearby messages)
CREATE INDEX IF NOT EXISTS idx_messages_location 
ON messages (location_latitude, location_longitude) 
WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN messages.location_latitude IS 'Latitude of shared location (-90 to 90)';
COMMENT ON COLUMN messages.location_longitude IS 'Longitude of shared location (-180 to 180)';
COMMENT ON COLUMN messages.location_address IS 'Human-readable address or place name for the location';
```

## 🚀 Cách chạy migration:

### Option 1: Supabase Dashboard
1. Mở Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Paste nội dung file `location_messages.sql`
5. Click **Run** hoặc nhấn `Ctrl + Enter`
6. Kiểm tra kết quả (should see "Success. No rows returned")

### Option 2: Supabase CLI
```bash
# Từ project root
supabase db push

# Hoặc chạy file cụ thể
supabase db execute --file database/migrations/location_messages.sql
```

### Option 3: psql (PostgreSQL CLI)
```bash
psql -h db.YOUR_PROJECT_REF.supabase.co -U postgres -d postgres -f database/migrations/location_messages.sql
```

## ✅ Verify Migration:

### Check if columns exist:
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'messages' 
  AND column_name IN ('location_latitude', 'location_longitude', 'location_address');
```

**Expected result:**
```
column_name         | data_type         | is_nullable
--------------------|-------------------|-------------
location_latitude   | double precision  | YES
location_longitude  | double precision  | YES
location_address    | text              | YES
```

### Check if index exists:
```sql
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'messages' 
  AND indexname = 'idx_messages_location';
```

**Expected result:**
```
indexname              | indexdef
-----------------------|--------------------------------------------------
idx_messages_location  | CREATE INDEX idx_messages_location ON public...
```

### Test insert:
```sql
-- Insert a test location message
INSERT INTO messages (
  conversation_id,
  sender_id,
  type,
  content_text,
  location_latitude,
  location_longitude,
  location_address
) VALUES (
  'YOUR_CONVERSATION_ID',
  'YOUR_USER_ID',
  'text',
  '📍 Hà Nội, Việt Nam',
  21.028511,
  105.804817,
  'Hà Nội, Việt Nam'
);

-- Query location messages
SELECT 
  id,
  content_text,
  location_latitude,
  location_longitude,
  location_address,
  created_at
FROM messages
WHERE location_latitude IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

## 📊 Database Schema:

### messages table (updated):
```
┌─────────────────────┬──────────────────┬──────────────┐
│ Column              │ Type             │ Nullable     │
├─────────────────────┼──────────────────┼──────────────┤
│ id                  │ uuid             │ NOT NULL (PK)│
│ conversation_id     │ uuid             │ NOT NULL (FK)│
│ sender_id           │ uuid             │ NOT NULL (FK)│
│ type                │ msg_type         │ NOT NULL     │
│ content_text        │ text             │ NULL         │
│ created_at          │ timestamp        │ NOT NULL     │
│ edited_at           │ timestamp        │ NULL         │
│ recalled_at         │ timestamp        │ NULL         │
│ reply_to_id         │ uuid             │ NULL (FK)    │
│ location_latitude   │ double precision │ NULL         │ ← NEW
│ location_longitude  │ double precision │ NULL         │ ← NEW
│ location_address    │ text             │ NULL         │ ← NEW
│ fts                 │ tsvector         │              │
│ location            │ geography        │              │
└─────────────────────┴──────────────────┴──────────────┘
```

### Indexes:
```
┌────────────────────────┬──────────────────────────────────────┐
│ Index Name             │ Definition                           │
├────────────────────────┼──────────────────────────────────────┤
│ messages_pkey          │ PRIMARY KEY (id)                     │
│ idx_messages_convo     │ INDEX (conversation_id, created_at)  │
│ idx_messages_fts       │ GIN INDEX (fts)                      │
│ idx_messages_location  │ INDEX (latitude, longitude)          │ ← NEW
└────────────────────────┴──────────────────────────────────────┘
```

## 🔒 RLS Policies:

**No changes needed** - Location messages use existing RLS policies:

```sql
-- Users can read messages in their conversations
CREATE POLICY "Users can read messages in their conversations"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- Users can insert messages in their conversations
CREATE POLICY "Users can insert messages in their conversations"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
  )
);
```

## 📐 Validation:

### Latitude constraints:
- **Range:** -90 to 90 degrees
- **North:** Positive values
- **South:** Negative values

### Longitude constraints:
- **Range:** -180 to 180 degrees
- **East:** Positive values
- **West:** Negative values

### Example coordinates:
```
Hà Nội, Vietnam:      21.028511, 105.804817
Ho Chi Minh, Vietnam:  10.823099, 106.629664
New York, USA:         40.712776, -74.005974
London, UK:            51.507351, -0.127758
Tokyo, Japan:          35.689487, 139.691711
```

## 🎯 Usage in Application:

### Insert location message:
```typescript
const { data, error } = await supabase
  .from('messages')
  .insert({
    conversation_id: 'conv-id',
    sender_id: 'user-id',
    type: 'text',
    content_text: 'Hà Nội, Việt Nam',
    location_latitude: 21.028511,
    location_longitude: 105.804817,
    location_address: 'Hà Nội, Việt Nam'
  })
  .select()
  .single();
```

### Query location messages:
```typescript
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .not('location_latitude', 'is', null)
  .order('created_at', { ascending: false });
```

### Filter by proximity (future feature):
```sql
-- Find messages within 10km of a location
SELECT *
FROM messages
WHERE location_latitude IS NOT NULL
  AND location_longitude IS NOT NULL
  AND ST_DWithin(
    ST_MakePoint(location_longitude, location_latitude)::geography,
    ST_MakePoint(105.804817, 21.028511)::geography,
    10000  -- 10km in meters
  );
```

## ⚠️ Important Notes:

1. **Nullable columns** - All location fields are optional
   - Regular text messages: `location_* = NULL`
   - Location messages: `location_* = NOT NULL`

2. **Index efficiency** - Partial index only on non-null values
   - Saves space
   - Faster queries for location messages

3. **No constraint validation** - Application-level validation
   - Frontend checks valid ranges
   - Backend accepts any double precision

4. **Backward compatible** - Existing messages unaffected
   - All new columns are nullable
   - No data migration needed

## 🔄 Rollback (if needed):

```sql
-- Remove location columns
ALTER TABLE messages
DROP COLUMN IF EXISTS location_latitude,
DROP COLUMN IF EXISTS location_longitude,
DROP COLUMN IF EXISTS location_address;

-- Remove index
DROP INDEX IF EXISTS idx_messages_location;
```

## ✅ Checklist:

- [x] Migration file created
- [x] SQL tested locally/staging
- [x] Index added for performance
- [x] Comments added for documentation
- [x] TypeScript types updated
- [x] Service functions implemented
- [x] React hooks created
- [x] UI components built
- [x] Testing completed
- [x] Ready for production

---

**Migration Status:** ✅ Ready to deploy

