# 📍 Location Sharing - 2 Display Modes

## ✅ Tính năng mới: Chọn cách hiển thị vị trí

Người dùng có thể chọn 1 trong 2 cách hiển thị vị trí khi chia sẻ:

### 1. 🗺️ **Bản đồ tương tác** (Interactive Map) - Khuyên dùng
**Giống Zalo/Messenger:**
- Click vào message → Mở bản đồ fullscreen trong app
- Sử dụng Leaflet.js + OpenStreetMap
- Có thể zoom, pan, xem chi tiết
- Không cần rời app
- Link "Mở trong Google Maps" vẫn có

### 2. 🔗 **Link Google Maps** (Static)
**Như trước:**
- Hiển thị preview tĩnh
- Click button → Mở Google Maps ở tab mới
- Đơn giản hơn

---

## 🛠️ Implementation:

### 1. Database Migration

**File:** `database/migrations/location_display_mode.sql`

```sql
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS location_display_mode TEXT DEFAULT 'interactive'
CHECK (location_display_mode IN ('interactive', 'static'));
```

**Run this:**
```
Supabase Dashboard → SQL Editor → Paste → Run
```

### 2. Components

#### LocationPicker - Chọn mode
```tsx
<LocationPicker
  onLocationSelect={(location) => {
    // location.displayMode = 'interactive' | 'static'
  }}
  onClose={() => {}}
/>
```

**UI:**
```
┌─────────────────────────────────────┐
│ 📍 Chia sẻ vị trí                  │
├─────────────────────────────────────┤
│ Chọn cách hiển thị vị trí của bạn: │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🗺️ Bản đồ tương tác            │ │ ← Khuyên dùng (blue)
│ │ Giống Zalo/Messenger            │ │
│ │ Xem trực tiếp trong app         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔗 Link Google Maps             │ │ ← Option 2 (gray)
│ │ Preview + link tab mới          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### LocationMessage - Display theo mode

**Interactive Mode:**
```tsx
<LocationMessage
  latitude={21.028511}
  longitude={105.804817}
  address="Hà Nội"
  displayMode="interactive"
/>
```

→ Click vào → **InteractiveMapModal** mở

**Static Mode:**
```tsx
<LocationMessage
  displayMode="static"
/>
```

→ Preview + Google Maps button

#### InteractiveMapModal - Fullscreen map

**Features:**
- Leaflet.js map integration
- OpenStreetMap tiles (free)
- Marker with popup
- Zoom/pan controls
- Close button
- Coordinates display
- "Mở trong Google Maps" button

**Tech:**
```typescript
// Load Leaflet dynamically
const script = document.createElement('script');
script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

// Initialize map
const map = L.map(mapRef.current).setView([lat, lon], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
L.marker([lat, lon]).addTo(map).bindPopup(address).openPopup();
```

### 3. Flow

```
User clicks 📍 MapPin button
  ↓
LocationPicker modal opens
  ↓
User chooses mode:
  - Click "🗺️ Bản đồ tương tác" → mode = 'interactive'
  - Click "🔗 Link Google Maps" → mode = 'static'
  ↓
Get geolocation
  ↓
Reverse geocode
  ↓
Send with displayMode
  ↓
Save to DB (location_display_mode column)
  ↓
Display in chat:
  - Interactive: Click → Open modal map
  - Static: Preview + Google Maps link
```

---

## 🎨 UI Comparison:

### Interactive Mode (trong chat):
```
┌──────────────────────┐
│   [Map Icon]         │ ← Gradient background
│   Click để xem       │   + Map icon + text
│                      │
├──────────────────────┤
│ 📍 Hà Nội, VN       │
│ 21.028511, 105...   │
└──────────────────────┘
     ↓ Click
┌────────────────────────────────────┐
│ Vị trí được chia sẻ           ×   │
│ Hà Nội, Việt Nam                  │
├────────────────────────────────────┤
│                                    │
│     [INTERACTIVE MAP]              │ ← Fullscreen Leaflet
│     - Zoom controls               │
│     - Marker                      │
│     - Pan/drag                    │
│                                    │
├────────────────────────────────────┤
│ 21.028511, 105.804817             │
│           [Mở Google Maps]    →   │
└────────────────────────────────────┘
```

### Static Mode (trong chat):
```
┌──────────────────────┐
│   [MapPin Icon]      │ ← Gradient + pin icon
│                      │
├──────────────────────┤
│ 📍 Hà Nội, VN       │
│ 21.028511, 105...   │
│                      │
│ [Mở Google Maps] →  │ ← Click → new tab
└──────────────────────┘
```

---

## 📊 Database Schema:

```sql
messages table:
├─ location_latitude: DOUBLE PRECISION
├─ location_longitude: DOUBLE PRECISION
├─ location_address: TEXT
└─ location_display_mode: TEXT ← NEW
   ├─ 'interactive' (default)
   └─ 'static'
```

---

## 🔧 Service & Hooks:

### Service
```typescript
export const sendLocationMessage = async (
  conversationId: string,
  senderId: string,
  latitude: number,
  longitude: number,
  address?: string,
  displayMode: 'interactive' | 'static' = 'interactive'
): Promise<Message>
```

### Hook
```typescript
const sendLocationMutation = useSendLocationMessage();

await sendLocationMutation.mutateAsync({
  conversationId,
  senderId,
  latitude,
  longitude,
  address,
  displayMode // ← NEW
});
```

---

## 📁 Files Changed:

1. ✅ `database/migrations/location_display_mode.sql` - **RUN THIS**
2. ✅ `src/types/supabase.type.ts` - Add `location_display_mode`
3. ✅ `src/components/conversation/LocationPicker.tsx` - 2 options UI
4. ✅ `src/components/conversation/LocationMessage.tsx` - Conditional rendering
5. ✅ `src/components/conversation/InteractiveMapModal.tsx` - **NEW** - Fullscreen map
6. ✅ `src/services/chatService.ts` - Add `displayMode` param
7. ✅ `src/hooks/useChat.ts` - Add `displayMode` to mutation
8. ✅ `src/components/conversation/ChatWindow.tsx` - Pass displayMode
9. ✅ `src/components/conversation/MessageBubble.tsx` - Pass to LocationMessage

---

## 🧪 Testing:

### Test Interactive Mode:
1. Click 📍 button
2. Click "🗺️ Bản đồ tương tác"
3. Allow location permission
4. Message appears in chat
5. **Click vào message**
6. → Should open fullscreen modal with interactive map
7. Test zoom/pan
8. Click "Mở Google Maps" → Opens in new tab
9. Close modal (X button)

### Test Static Mode:
1. Click 📍 button
2. Click "🔗 Link Google Maps"
3. Allow location permission
4. Message appears
5. **Click "Mở trong Google Maps"**
6. → Should open Google Maps in new tab

### Test Display:
- Interactive: Blue border, Map icon, "Click để xem"
- Static: Gray gradient, MapPin icon, Google Maps button
- Both: Show address + coordinates

---

## ⚠️ Important Notes:

### Leaflet.js
- **Loaded dynamically** - Only when opening interactive map
- CDN: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`
- No npm package needed
- Automatically cleaned up on unmount

### OpenStreetMap
- **Free** - No API key required
- Tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Attribution required (included)

### Performance
- Interactive map only loads when clicked
- Static mode has no extra dependencies
- Modal closes on background click or X button

### Browser Compatibility
- Leaflet works in all modern browsers
- Fallback to static if map fails to load
- Google Maps link always available

---

## 🎯 User Experience:

### When to use Interactive:
✅ **Recommended for most cases**
- Người nhận muốn xem chi tiết
- Trong app, không rời khỏi chat
- UX tốt hơn (giống Zalo/Messenger)
- Có thể zoom/explore

### When to use Static:
- Người gửi muốn đơn giản
- Người nhận quen với Google Maps
- Slower devices (ít resource hơn)

---

## 📝 Migration Steps:

### 1. Run SQL:
```sql
-- In Supabase Dashboard → SQL Editor
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS location_display_mode TEXT DEFAULT 'interactive'
CHECK (location_display_mode IN ('interactive', 'static'));
```

### 2. Restart app:
```bash
npm run dev
```

### 3. Test:
- Send location with both modes
- Verify display differences
- Check modal interaction
- Test Google Maps links

---

## ✅ Checklist:

- [x] Database migration
- [x] TypeScript types
- [x] LocationPicker UI (2 options)
- [x] InteractiveMapModal component
- [x] LocationMessage conditional rendering
- [x] Service layer updated
- [x] React Query hooks
- [x] Optimistic updates
- [x] Dark mode support
- [x] Error handling
- [x] No linter errors
- [x] Documentation

---

## 🎉 Result:

**2 cách hiển thị vị trí hoàn chỉnh!**

✅ **Interactive** - Bản đồ fullscreen trong app (Zalo/Messenger style)  
✅ **Static** - Preview + Google Maps link

- User có thể chọn theo preference
- Default: Interactive (UX tốt hơn)
- Backward compatible (old messages work)
- No breaking changes

---

Perfect implementation! 🚀

