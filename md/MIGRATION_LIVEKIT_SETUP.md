# Hướng dẫn Migration LiveKit Setup

## Tổng quan

Document này hướng dẫn cách migrate từ phiên bản call với placeholder tokens sang phiên bản với LiveKit tokens thực tế.

## Cấu trúc hiện tại

### 2 phiên bản database functions:

#### 1. `initiate_direct_call()` - Phiên bản cũ (hiện tại đang dùng)
```sql
-- File: database/migrations/create_direct_call_function.sql
-- Tạo call với placeholder tokens:
token: gen_random_uuid()::TEXT
url: ''  -- Empty string
```

**Ưu điểm**:
- ✅ Đơn giản, không cần setup gì thêm
- ✅ Đang hoạt động ổn định
- ✅ Phù hợp để test UI/UX

**Nhược điểm**:
- ❌ Không thể kết nối LiveKit thực tế
- ❌ Video/audio call không hoạt động

#### 2. `create_direct_call_with_livekit()` - Phiên bản mới (chưa dùng)
```sql
-- File: database/migrations/fix_livekit_tokens.sql
-- Tạo call với LiveKit tokens thực tế
token: <generated JWT from LiveKit>
url: 'wss://your-livekit-server.com'
```

**Ưu điểm**:
- ✅ Video/audio call hoạt động thực tế
- ✅ LiveKit connection thành công
- ✅ Production-ready

**Nhược điểm**:
- ❌ Cần setup LiveKit server
- ❌ Cần implement token generation
- ❌ Phức tạp hơn

## Migration Steps

### Step 1: Setup LiveKit Server

#### Option A: LiveKit Cloud (Recommended - Dễ nhất)

1. Đăng ký tài khoản: https://cloud.livekit.io/
2. Tạo project mới
3. Lấy credentials:
   - **URL**: `wss://your-project.livekit.cloud`
   - **API Key**: `APIxxxxx`
   - **API Secret**: `xxxxxxxxxxxxx`

#### Option B: Self-hosted LiveKit Server

```bash
# Using Docker
docker run -d \
  --name livekit \
  -p 7880:7880 \
  -p 7881:7881 \
  -p 7882:7882/udp \
  -v $PWD/livekit.yaml:/livekit.yaml \
  livekit/livekit-server \
  --config /livekit.yaml
```

### Step 2: Configure Environment Variables

Thêm vào Supabase Project Settings → Edge Functions → Secrets:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxx
```

### Step 3: Implement Token Generation

#### Option A: Supabase Edge Function (Recommended)

**Tạo file**: `supabase/functions/generate-livekit-token/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { AccessToken } from 'npm:livekit-server-sdk'

serve(async (req) => {
  try {
    const { roomName, participantIdentity } = await req.json()
    
    // Validate request
    if (!roomName || !participantIdentity) {
      return new Response(
        JSON.stringify({ error: 'Missing roomName or participantIdentity' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Get credentials from environment
    const apiKey = Deno.env.get('LIVEKIT_API_KEY')
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET')
    const livekitUrl = Deno.env.get('LIVEKIT_URL')
    
    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new Error('Missing LiveKit configuration')
    }
    
    // Generate token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      ttl: '10h', // Token valid for 10 hours
    })
    
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })
    
    const token = await at.toJwt()
    
    return new Response(
      JSON.stringify({ token, url: livekitUrl }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating token:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

**Deploy Edge Function**:

```bash
supabase functions deploy generate-livekit-token
```

**Update database function** `generate_livekit_token()`:

```sql
CREATE OR REPLACE FUNCTION generate_livekit_token(
  room_name TEXT,
  participant_identity TEXT
)
RETURNS TABLE(token TEXT, url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  edge_function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get Supabase URL and service role key
  edge_function_url := current_setting('app.supabase_url', true) || '/functions/v1/generate-livekit-token';
  service_role_key := current_setting('app.service_role_key', true);
  
  -- Call edge function (requires pg_net extension)
  SELECT content::json INTO result
  FROM http((
    'POST',
    edge_function_url,
    ARRAY[
      http_header('Authorization', 'Bearer ' || service_role_key),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    jsonb_build_object(
      'roomName', room_name,
      'participantIdentity', participant_identity
    )::text
  )::http_request);
  
  RETURN QUERY SELECT 
    (result->>'token')::TEXT as token,
    (result->>'url')::TEXT as url;
END;
$$;
```

**Enable pg_net extension**:

```sql
-- Run in SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_net;
```

#### Option B: Backend API (Alternative)

Nếu không muốn dùng Edge Function, có thể tạo backend API riêng:

```typescript
// Backend API endpoint: POST /api/generate-livekit-token
import { AccessToken } from 'livekit-server-sdk';

export async function POST(request: Request) {
  const { roomName, participantIdentity } = await request.json();
  
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: participantIdentity,
      ttl: '10h',
    }
  );
  
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });
  
  const token = await at.toJwt();
  
  return Response.json({
    token,
    url: process.env.LIVEKIT_URL
  });
}
```

### Step 4: Run Migration

```bash
# Connect to Supabase
psql -h db.your-project.supabase.co -U postgres

# Run migration
\i database/migrations/fix_livekit_tokens.sql
```

Hoặc dùng Supabase Dashboard → SQL Editor → paste nội dung file migration.

### Step 5: Update Frontend Config

**File**: `src/services/callService.ts`

```typescript
// Đổi từ false → true
const USE_NEW_CALL_FUNCTION = true; // ✅ Enable new function
```

### Step 6: Test

1. **Test token generation**:
```sql
-- In SQL Editor
SELECT * FROM generate_livekit_token('test-room', 'user-123');
-- Should return real token and URL
```

2. **Test call creation**:
```typescript
// In browser console
await createDirectCall('other-user-id', true);
// Check database:
// SELECT * FROM call_participants ORDER BY created_at DESC LIMIT 2;
// Both should have real token and URL
```

3. **Test video call**:
- User A gọi User B
- User B accept
- Cả 2 thấy video của nhau ✅

## Troubleshooting

### Error: "Missing LiveKit configuration"

**Nguyên nhân**: Environment variables chưa được set

**Giải pháp**:
1. Check Supabase Project Settings → Edge Functions → Secrets
2. Đảm bảo có đủ 3 biến: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
3. Redeploy edge function

### Error: "Token generation failed"

**Nguyên nhân**: Edge function không hoạt động hoặc pg_net chưa được enable

**Giải pháp**:
```sql
-- Check pg_net extension
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- Enable if not exists
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Error: "Invalid token"

**Nguyên nhân**: API Key/Secret không đúng

**Giải pháp**:
1. Double-check credentials từ LiveKit dashboard
2. Verify không có space/newline thừa
3. Test token generation trực tiếp

### Video vẫn không hiển thị

**Nguyên nhân**: Token đúng nhưng network/firewall block

**Giải pháp**:
1. Check browser console → Network tab
2. Verify WebSocket connection thành công
3. Check firewall settings
4. Try từ network khác

## Rollback

Nếu gặp vấn đề và muốn rollback:

```typescript
// src/services/callService.ts
const USE_NEW_CALL_FUNCTION = false; // ❌ Back to old function
```

Database function cũ vẫn còn nguyên, không bị ảnh hưởng.

## Feature Comparison

| Feature | Old Function | New Function |
|---------|-------------|--------------|
| UI Testing | ✅ OK | ✅ OK |
| Database Flow | ✅ OK | ✅ OK |
| Realtime Events | ✅ OK | ✅ OK |
| LiveKit Connection | ❌ Failed | ✅ Success |
| Video/Audio | ❌ Not working | ✅ Working |
| Production Ready | ❌ No | ✅ Yes |

## Best Practices

1. **Development**:
   - Dùng old function cho UI testing
   - Không cần setup LiveKit

2. **Staging**:
   - Dùng new function với LiveKit Cloud free tier
   - Test đầy đủ trước khi production

3. **Production**:
   - Dùng new function với LiveKit Cloud paid hoặc self-hosted
   - Monitor token generation performance
   - Set up proper logging

## Next Steps

- [ ] Setup LiveKit server/cloud
- [ ] Implement token generation edge function
- [ ] Run migration
- [ ] Test với 2 users
- [ ] Update USE_NEW_CALL_FUNCTION = true
- [ ] Monitor production calls

## Support

Tham khảo thêm:
- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit Cloud Setup](https://cloud.livekit.io/projects)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Status**: 🟡 Migration Optional
- ✅ Old function works for UI testing
- ✅ New function ready when LiveKit is configured
- 🔄 Switch when ready (no pressure!)

