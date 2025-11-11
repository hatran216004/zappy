# Tài liệu triển khai chức năng Call

## Tổng quan

Tài liệu này mô tả cách triển khai chức năng video/audio call trong project Zappy, dựa trên cách triển khai từ project Zappy-main (Flutter).

## So sánh kiến trúc

### Zappy-main (Flutter)
- **State Management**: BLoC pattern với CallCubit
- **Video SDK**: LiveKit Client
- **States**: CallEmptyState, CallInitialState, CallLoadedState, CallIncomingState
- **Components**: CallScreen, ParticipantWidget, ParticipantInfoWidget

### Zappy (React/TypeScript)
- **State Management**: React Hooks với useState, useEffect
- **Video SDK**: LiveKit Client (JavaScript)
- **Hooks**: useCall, useLivekitRoom, useStartCall
- **Components**: VideoCall, ParticipantView

## Các thành phần chính

### 1. ParticipantView Component
**File**: `src/components/call/ParticipantView.tsx`

Component hiển thị video/audio của một participant trong cuộc gọi.

**Tính năng**:
- Tự động attach/detach video tracks
- Tự động attach/detach audio tracks (chỉ cho remote participants)
- Hiển thị avatar khi không có video
- Hiển thị trạng thái mic (muted/unmuted)
- Hiển thị indicator khi participant đang nói
- Hiển thị connection quality
- Highlight border khi participant đang speaking

**Props**:
```typescript
interface ParticipantViewProps {
  participant: Participant;        // LiveKit Participant
  displayName?: string;            // Tên hiển thị
  avatarUrl?: string;              // URL avatar
  className?: string;              // Custom CSS classes
  isLocal?: boolean;               // Có phải local participant không
  showStats?: boolean;             // Hiển thị connection quality
}
```

### 2. useLivekitRoom Hook
**File**: `src/hooks/useLivekit.ts`

Hook quản lý kết nối và tương tác với LiveKit room.

**Cải tiến**:
- ✅ Track danh sách remote participants
- ✅ Track local participant
- ✅ Tự động sắp xếp participants theo speaking status
- ✅ Auto-update khi có thay đổi tracks
- ✅ Handle audio playback cho remote participants
- ✅ Listen các events: ParticipantConnected, ParticipantDisconnected, TrackMuted/Unmuted, ActiveSpeakersChanged

**API**:
```typescript
const {
  room,                    // LiveKit Room instance
  isConnected,            // Trạng thái kết nối
  micEnabled,             // Trạng thái microphone
  cameraEnabled,          // Trạng thái camera
  remoteParticipants,     // Danh sách remote participants
  localParticipant,       // Local participant
  connect,                // Function kết nối room
  disconnect,             // Function ngắt kết nối
  toggleMic,              // Toggle microphone
  toggleCamera,           // Toggle camera
} = useLivekitRoom(options);
```

### 3. useCall Hook
**File**: `src/hooks/useCall.ts`

Hook quản lý logic cuộc gọi ở tầng cao hơn (incoming, connected, timeout, etc.).

**Tính năng mới**:
- ✅ Tự động ngắt cuộc gọi sau 30 giây nếu không có participant nào join
- ✅ Tự động ngắt cuộc gọi sau 10 giây nếu tất cả participants đều leave
- ✅ Track trạng thái hasJoined để phân biệt giữa "chờ join" và "đã join rồi leave"
- ✅ Cleanup timeout khi component unmount

**States**:
```typescript
interface ActiveCall {
  callInfo: CallInfo;           // Thông tin cuộc gọi
  participant: CallParticipant; // Thông tin participant
  status: 'incoming' | 'connected'; // Trạng thái cuộc gọi
}
```

**Timeout Logic**:
1. **Initial Timeout** (30s): Khi connected nhưng chưa có participant nào join
2. **Leave Timeout** (10s): Khi đã có người join nhưng sau đó tất cả đều leave

### 4. VideoCall Component
**File**: `src/components/VideoCall.tsx`

Component giao diện cuộc gọi video/audio.

**Cải tiến**:
- ✅ Hiển thị remote participant video thực tế (thay vì placeholder)
- ✅ Hiển thị local participant video trong tile nhỏ
- ✅ Show message "Đang chờ người khác tham gia..." khi chưa có remote participant
- ✅ Camera toggle với icon phản ánh trạng thái (VideoIcon/VideoOff)
- ✅ Mic toggle với icon phản ánh trạng thái (Mic/MicOff)

**Layout**:
- Main view: Remote participant đầu tiên (full screen)
- Bottom-right: Local participant (180x135px tile)
- Bottom center: Control buttons (accept, mic, camera, hangup)

### 5. MainLayout Integration
**File**: `src/layouts/MainLayout.tsx`

Tích hợp cuộc gọi vào layout chính.

**Cách hoạt động**:
1. useCall hook lắng nghe call_participants changes
2. Khi có cuộc gọi mới → hiển thị VideoCall overlay
3. VideoCall nhận participants từ useLivekitRoom
4. User có thể accept/reject/end call
5. Khi end call → VideoCall overlay biến mất

## Flow cuộc gọi

### 1. Khởi tạo cuộc gọi (Caller)

```
User A click "Call" button
  ↓
ChatWindow.handleCall() → useStartCall()
  ↓
Backend: initiate_direct_call()
  ↓
Database: Insert vào calls & call_participants
  - User A: joined_at = NOW() (auto-joined)
  - User B: joined_at = NULL (waiting)
  ↓
Realtime: call_participants INSERT event → User A & B
  ↓
User A: useCall → status = 'connected'
User B: useCall → status = 'incoming'
```

### 2. Nhận cuộc gọi (Callee)

```
User B nhận INSERT event (joined_at = NULL)
  ↓
useCall → setActiveCall({ status: 'incoming' })
  ↓
VideoCall hiển thị với Accept/Reject buttons
  ↓
User B click Accept
  ↓
useLivekitRoom.connect(url, token)
  ↓
Backend: Update call_participants set joined_at = NOW()
  ↓
Realtime: UPDATE event
  ↓
useCall → setActiveCall({ status: 'connected' })
```

### 3. Kết nối LiveKit

```
useCall.acceptCall() / onJoined()
  ↓
useLivekitRoom.connect(url, token, { mic, camera })
  ↓
Room.connect()
  ↓
Enable local tracks (mic, camera)
  ↓
Listen room events:
  - ParticipantConnected → update remoteParticipants
  - ParticipantDisconnected → update remoteParticipants
  - TrackSubscribed → attach audio element
  - ActiveSpeakersChanged → re-sort participants
```

### 4. Auto Timeout

```
Status = 'connected' && remoteParticipants.length = 0
  ↓
hasJoinedRef.current = false?
  ↓ YES
  Start 30s timeout
    ↓
    Still no participants after 30s?
      ↓ YES
      Auto endCall()
  ↓ NO (already joined)
  Start 10s timeout
    ↓
    Still no participants after 10s?
      ↓ YES
      Auto endCall()
```

### 5. Kết thúc cuộc gọi

```
User click "Hang up" / Auto timeout
  ↓
useCall.endCall()
  ↓
useLivekitRoom.disconnect()
  ↓
Room.disconnect()
  ↓
setActiveCall(null)
  ↓
VideoCall overlay biến mất
  ↓
Backend: Update call_participants set left_at = NOW()
```

## Các tính năng chính

### ✅ Đã triển khai
1. **Video/Audio calling** với LiveKit
2. **Incoming call UI** với accept/reject buttons
3. **Connected call UI** với video tracks thực tế
4. **Participant management** (track joins/leaves)
5. **Auto timeout** nếu không có participant
6. **Mic/Camera controls** với toggle
7. **Speaking indicator** với border highlight
8. **Connection quality indicator**
9. **Avatar fallback** khi không có video
10. **Local video preview** trong tile nhỏ

### 🔄 Có thể cải thiện
1. **Screen sharing** (chưa implement)
2. **Group calls** (đã có model nhưng UI chưa hoàn thiện)
3. **Call history** (hiển thị lịch sử cuộc gọi)
4. **Ringtone** cho incoming calls
5. **Call notifications** khi app không focus
6. **Network quality warning** khi connection kém
7. **Recording** (ghi âm/hình cuộc gọi)
8. **Picture-in-picture** mode

## Database Schema

### Tables

**calls**:
```sql
- id: uuid
- conversation_id: uuid (FK)
- started_by: uuid (FK users)
- started_at: timestamp
- ended_at: timestamp
- type: call_type (audio/video)
- participants: uuid[]
```

**call_participants**:
```sql
- id: uuid
- call_id: uuid (FK)
- user_id: uuid (FK)
- joined_at: timestamp (NULL = incoming, NOT NULL = joined)
- left_at: timestamp
- token: text (LiveKit token)
- url: text (LiveKit server URL)
```

### Functions

**initiate_direct_call(_user_id, _is_video_enabled)**:
- Tạo conversation nếu chưa có
- Tạo call record
- Tạo 2 call_participants:
  - Caller: joined_at = NOW() (auto-joined)
  - Callee: joined_at = NULL (incoming)
- Return void

**get_call_info(_call_id)**:
- Lấy thông tin cuộc gọi với conversation details
- Return call info với avatar, display name, conversation type

## Testing

### Test Cases

1. **Start call from chat window**
   - Click call button → incoming call hiển thị ở callee
   - Accept → video connection established

2. **Reject incoming call**
   - Incoming call → click reject → call ended

3. **Timeout no answer**
   - Incoming call → không answer → auto end sau 30s

4. **Timeout all leave**
   - Connected call → tất cả leave → auto end sau 10s

5. **Toggle mic/camera**
   - Click mic button → remote participant thấy mic muted
   - Click camera button → remote participant không thấy video

6. **Multiple participants** (Group call)
   - 3+ người trong call → UI hiển thị grid layout

## Configuration

### LiveKit Setup

Cần configure LiveKit server credentials trong environment:

```env
VITE_LIVEKIT_URL=wss://your-livekit-server.com
VITE_LIVEKIT_API_KEY=your-api-key
VITE_LIVEKIT_API_SECRET=your-api-secret
```

### Room Options

```typescript
const roomOptions: RoomOptions = {
  adaptiveStream: true,        // Tự động điều chỉnh quality
  dynacast: true,              // Chỉ gửi stream cần thiết
  stopLocalTrackOnUnpublish: true,
};
```

## Troubleshooting

### Video không hiển thị
- Check browser permissions (camera/mic)
- Check LiveKit credentials
- Check network/firewall
- Xem console logs để debug

### Audio không nghe thấy
- Check browser autoplay policy
- User interaction cần thiết để play audio
- Check volume settings

### Connection timeout
- Check LiveKit server URL
- Check network connectivity
- Verify token validity

## Best Practices

1. **Always cleanup** khi component unmount
2. **Handle errors** gracefully với try/catch
3. **Show loading states** khi connecting
4. **Provide feedback** cho user actions
5. **Test on multiple browsers** (Chrome, Firefox, Safari)
6. **Handle edge cases** (network loss, permission denied)

## Tài liệu tham khảo

- [LiveKit JavaScript SDK](https://docs.livekit.io/client-sdk-js/)
- [React Hooks Guide](https://react.dev/reference/react)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

## Changelog

### 2025-11-11
- ✅ Tạo ParticipantView component
- ✅ Cải thiện useLivekitRoom với participant tracking
- ✅ Thêm auto-timeout logic vào useCall
- ✅ Cập nhật VideoCall với real video tracks
- ✅ Tích hợp hoàn chỉnh vào MainLayout

