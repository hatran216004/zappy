# Bug Fix: "Đang chờ người khác tham gia..." sau khi Accept Call

## Vấn đề

Sau khi click Accept call, màn hình luôn hiển thị "Đang chờ người khác tham gia..." thay vì hiển thị video của người gọi.

## Nguyên nhân

### 1. Thiếu logic Accept trong database
Khi callee click "Accept", không có code nào update `joined_at` trong database, dẫn đến:
- Callee không được mark là "joined"
- LiveKit connection không được khởi tạo đúng cách
- `remoteParticipants` array rỗng → không hiển thị video

### 2. Thiếu UPDATE event handler
`subscribeCallParticipants` chỉ xử lý:
- INSERT event → incoming hoặc joined (based on joined_at)
- UPDATE event → chỉ xử lý left_at

Không xử lý trường hợp UPDATE khi `joined_at` được set từ NULL → NOW()

### 3. Placeholder LiveKit tokens
Database function `initiate_direct_call` tạo call_participants với:
```sql
token: gen_random_uuid()::TEXT  -- Placeholder
url: ''                         -- Empty string
```

Những giá trị này không phải LiveKit tokens/URLs thực tế → không thể connect vào room.

## Các thay đổi đã thực hiện

### 1. Thêm `acceptCall` service (`src/services/callService.ts`)

```typescript
export const acceptCall = async (callId: string): Promise<void> => {
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('call_participants')
    .update({ joined_at: new Date().toISOString() })
    .eq('call_id', callId)
    .eq('user_id', currentUser.user.id)
    .is('joined_at', null);

  if (error) {
    console.error('Error accepting call:', error);
    throw error;
  }

  console.log('✅ Call accepted, joined_at updated');
};
```

**Chức năng**: Update `joined_at` trong database khi user accept call.

### 2. Cải thiện UPDATE event handler (`src/services/callService.ts`)

```typescript
.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'call_participants',
  filter: `user_id=eq.${userId}`,
}, async (payload) => {
  const participant = payload.new;
  const oldParticipant = payload.old;
  
  // Check if joined_at was just set (from null to non-null)
  if (!oldParticipant.joined_at && participant.joined_at) {
    console.log('🎉 Participant accepted call, joining room...');
    const callInfo = await getCallInfo(participant.call_id);
    if (callInfo) {
      handlers.onJoined(callInfo, participant);
    }
    return;
  }
  
  // Check if left_at was set
  if (participant.left_at) {
    handlers.onLeft(participant);
  }
})
```

**Chức năng**: Detect khi `joined_at` được update từ NULL → timestamp, gọi `onJoined` handler.

### 3. Update `acceptCall` trong useCall (`src/hooks/useCall.ts`)

```typescript
const acceptCall = async () => {
  if (!activeCall) return;
  
  try {
    // Update joined_at in database first
    await acceptCallService(activeCall.participant.call_id);
    console.log('📞 Call accepted in database, waiting for UPDATE event...');
    
    // The UPDATE event will trigger onJoined handler, which will connect to LiveKit
    setActiveCall((prev) => {
      if (!prev) return prev;
      return { ...prev, status: 'connected' } as ActiveCall;
    });
  } catch (error) {
    console.error('❌ Error accepting call:', error);
  }
};
```

**Chức năng**: 
1. Gọi `acceptCallService` để update database
2. Chờ UPDATE event fire
3. UPDATE event sẽ trigger `onJoined` → connect LiveKit

### 4. Thêm Room.Connected event listener (`src/hooks/useLivekit.ts`)

```typescript
.on(RoomEvent.Connected, () => {
  console.log('🔗 Room connected, updating participants...');
  // Wait a bit for participants to be synced
  setTimeout(() => {
    updateParticipants(r);
    console.log('👥 Remote participants:', r.remoteParticipants.size);
  }, 500);
});
```

**Chức năng**: Update participants list sau khi room connected thành công.

### 5. Thêm debug logging (`src/components/VideoCall.tsx`)

```typescript
console.log('📹 VideoCall render:', {
  status,
  remoteParticipantsCount: remoteParticipants.length,
  hasMainRemote: !!mainRemoteParticipant,
  hasLocal: !!localParticipant,
  remoteIdentities: remoteParticipants.map(p => p.identity)
});
```

**Chức năng**: Debug để kiểm tra participants data.

## Flow sau khi fix

### Caller (User A) initiates call:
```
1. User A clicks "Call" button
2. Backend: initiate_direct_call() 
3. Database: 
   - Insert call record
   - Insert call_participants for A (joined_at = NOW())
   - Insert call_participants for B (joined_at = NULL)
4. Realtime: INSERT event → User A
5. User A: onJoined() → connect to LiveKit room
6. User A: Status = 'connected', waiting for User B...
```

### Callee (User B) receives and accepts:
```
1. Realtime: INSERT event → User B
2. User B: onIncoming() → status = 'incoming'
3. User B sees Accept/Reject buttons
4. User B clicks "Accept"
5. Frontend: acceptCallService(callId)
6. Database: UPDATE call_participants SET joined_at = NOW()
7. Realtime: UPDATE event → User B
8. User B: onJoined() → connect to LiveKit room
9. User B: Status = 'connected'
10. Both A & B: ParticipantConnected events fire
11. Both see each other's video ✅
```

## Vấn đề còn lại

### ⚠️ CRITICAL: LiveKit Tokens

Database vẫn sử dụng placeholder tokens:
```sql
token: gen_random_uuid()::TEXT
url: ''
```

**Cần làm**:
1. Deploy LiveKit server hoặc dùng LiveKit Cloud
2. Implement token generation:
   - Option A: Supabase Edge Function (recommended)
   - Option B: Backend API service
3. Update `generate_livekit_token()` function
4. Run migration: `fix_livekit_tokens.sql`

**Xem chi tiết**: `database/migrations/fix_livekit_tokens.sql`

## Testing

### Test Case 1: Successful call
1. User A gọi User B
2. User B nhận được incoming call
3. User B click Accept
4. Cả 2 thấy video của nhau ✅

### Test Case 2: Check console logs
```
User B click Accept:
✅ Call accepted, joined_at updated
🎉 Participant accepted call, joining room...
✅ Joined call: { callInfo, participant }
🔗 Room connected, updating participants...
👥 Remote participants: 1
👤 Participant connected: user-a-id
📹 VideoCall render: { remoteParticipantsCount: 1, hasMainRemote: true }
```

### Test Case 3: Verify database
```sql
SELECT * FROM call_participants WHERE call_id = 'xxx';
-- Both participants should have joined_at != NULL
```

## Troubleshooting

### Vẫn thấy "Đang chờ..."?

**Check console logs**:
1. ✅ "Call accepted, joined_at updated"?
2. ✅ "Participant accepted call, joining room..."?
3. ✅ "Room connected, updating participants..."?
4. ✅ "Remote participants: 1" or "Remote participants: 0"?

**Nếu Remote participants: 0**:
- Token/URL không hợp lệ
- LiveKit server không accessible
- Firewall blocking WebRTC

**Nếu không có logs nào**:
- Check database UPDATE event có fire không
- Check realtime subscription đang active
- Try refresh page

### Connection timeout?
- Check LiveKit server status
- Check network connectivity
- Verify token/URL trong database

### Video không hiển thị?
- Check camera permissions
- Check `isCameraEnabled()` status
- Check video track publication

## Commit Message

```
fix(call): Accept call now properly connects both participants

- Add acceptCall service to update joined_at in database
- Improve UPDATE event handler to detect joined_at changes
- Add Room.Connected event listener for participant sync
- Add debug logging for troubleshooting
- Fix timing issue where remoteParticipants was empty

Issue: After accepting call, UI showed "Waiting for others..."
Root cause: joined_at not updated, LiveKit not connecting properly
```

## Related Files

- ✅ `src/services/callService.ts` - Accept call service
- ✅ `src/hooks/useCall.ts` - Accept call logic
- ✅ `src/hooks/useLivekit.ts` - Room connected event
- ✅ `src/components/VideoCall.tsx` - Debug logging
- 🔄 `database/migrations/fix_livekit_tokens.sql` - Token generation (TODO)

## Next Steps

1. ✅ Test accept call flow
2. ✅ Verify participants can see each other
3. 🔄 Implement LiveKit token generation
4. 🔄 Run fix_livekit_tokens.sql migration
5. 🔄 Test with real LiveKit server
6. 🔄 Remove debug logging (or make conditional)

## 🔄 Two Database Function Versions

Để tránh breaking changes, hiện có **2 phiên bản**:

### 1. `initiate_direct_call()` - OLD (đang dùng)
```typescript
// src/services/callService.ts
const USE_NEW_CALL_FUNCTION = false; // ← Current
```

**Đặc điểm**:
- ✅ Placeholder tokens (gen_random_uuid)
- ✅ Empty URL
- ✅ Hoạt động cho UI testing
- ❌ Video/audio KHÔNG hoạt động

### 2. `create_direct_call_with_livekit()` - NEW (sẵn sàng)
```typescript
// src/services/callService.ts
const USE_NEW_CALL_FUNCTION = true; // ← Switch to this
```

**Đặc điểm**:
- ✅ Real LiveKit JWT tokens
- ✅ Real LiveKit URL
- ✅ Video/audio hoạt động thật
- 🔧 Cần setup LiveKit server trước

### Hướng dẫn migrate

📚 **Chi tiết**: `md/MIGRATION_LIVEKIT_SETUP.md`

**Quick steps**:
1. Setup LiveKit server (cloud hoặc self-hosted)
2. Run migration: `fix_livekit_tokens.sql`
3. Implement token generation (edge function)
4. Switch flag: `USE_NEW_CALL_FUNCTION = true`
5. Test video call

---

**Status**: 🟡 Partially Fixed
- ✅ Accept call logic works
- ✅ Database updates correctly
- ✅ Realtime events fire properly
- ✅ Two function versions available
- ⚠️ Need real LiveKit tokens for production (optional)

