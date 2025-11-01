# Friend Requests Badge Implementation

## Overview
Implemented a red badge notification on the "Lời mời kết bạn" (Friend Requests) button in the FriendSidebar to show the count of pending friend requests. The badge updates in real-time when new requests arrive or are accepted/rejected.

## Problem
Users had no visual indicator in the navigation sidebar to know if they had pending friend requests. They would only discover this when manually navigating to the friend requests page.

## Changes Made

### 1. Updated `SelectableButton.tsx`
Added a `badgeCount` prop to display a red notification badge with count.

**Before:**
```typescript
type SelectableButtonProps = {
  label: string;
  url: string;
  icon: React.ElementType;
};
```

**After:**
```typescript
type SelectableButtonProps = {
  label: string;
  url: string;
  icon: React.ElementType;
  badgeCount?: number;
};
```

**Badge UI:**
- Red background (`bg-red-500`)
- White text
- Rounded pill shape
- Shows count up to 99, then displays "99+"
- Minimum width for consistent sizing
- Positioned on the right side of the button

### 2. Updated `FriendSidebar.tsx`

#### Added imports
```typescript
import { usePendingFriendRequests, useFriendRequestsRealtime } from '@/hooks/useFriends';
```

#### Fetched friend requests data
```typescript
const { user } = useAuth();
const userId = user?.id;
const { data: friendRequests } = usePendingFriendRequests(userId as string);

// Subscribe to realtime updates for friend requests
useFriendRequestsRealtime(userId as string);

// Count friend requests for badge
const friendRequestCount = friendRequests?.length || 0;
```

#### Added `showBadge` flag to button config
```typescript
{ label: 'Lời mời kết bạn', icon: IoMdPersonAdd, url: '/friends/requests', showBadge: true }
```

#### Passed badge count to button
```typescript
badgeCount={link.showBadge ? friendRequestCount : undefined}
```

## How It Works

### Data Flow
1. **Component mounts** → `usePendingFriendRequests` fetches pending friend requests
2. **Realtime subscription** → `useFriendRequestsRealtime` subscribes to database changes
3. **Calculate count** → `friendRequestCount = friendRequests?.length || 0`
4. **Display badge** → Red badge shows count if > 0

### Realtime Updates
When friend request changes occur:
- **New request arrives** → INSERT event → Query invalidation → Badge count increases
- **Request accepted/rejected** → DELETE event → Query invalidation → Badge count decreases
- **Update happens automatically** via React Query cache invalidation

### Badge Display Logic
- **Count = 0** → No badge shown
- **Count 1-99** → Shows exact count (e.g., "5")
- **Count ≥ 100** → Shows "99+"
- **Badge only shows** on "Lời mời kết bạn" button

## Visual Design

### Badge Styling
- **Background**: Red-500 (`bg-red-500`)
- **Text**: White (`text-white`)
- **Shape**: Rounded pill (`rounded-full`)
- **Size**: Small text (`text-xs`), bold font
- **Padding**: `px-2 py-0.5` for comfortable spacing
- **Min width**: 20px for consistency
- **Position**: Right side of button (flex layout)

### Responsive Behavior
- Badge scales with button size
- Text truncates if count is very large
- Maintains readability in dark/light mode

## Testing

### Test Scenarios

1. **No Friend Requests**
   - Badge should not appear
   - Button displays normally

2. **Has Friend Requests**
   - Badge shows count (e.g., "3")
   - Red color is clearly visible
   - Count is accurate

3. **Realtime - New Request Arrives**
   - User receives friend request
   - Badge count increases immediately
   - No page refresh needed

4. **Realtime - Request Accepted**
   - User accepts friend request from sidebar
   - Badge count decreases immediately
   - Badge disappears when count reaches 0

5. **Realtime - Request Rejected**
   - User rejects friend request
   - Badge count decreases immediately
   - Badge disappears when count reaches 0

6. **Count ≥ 100**
   - Badge shows "99+" instead of actual count
   - Styling remains consistent

7. **Multiple Users**
   - Each user sees their own friend request count
   - No cross-user interference

## Benefits

✅ **Better UX** - Users see at-a-glance if they have pending requests  
✅ **Realtime updates** - Badge updates instantly without refresh  
✅ **Non-intrusive** - Only shows when there are actual requests  
✅ **Scalable design** - Handles large counts gracefully (99+)  
✅ **Consistent styling** - Matches common notification patterns  
✅ **Efficient** - Uses existing data and subscriptions  

## Related Files

- `src/layouts/sidebar/FriendSidebar.tsx` - Main implementation
- `src/components/ContactBar/SelectableButton.tsx` - Badge display component
- `src/hooks/useFriends.ts` - Data fetching and realtime subscription hooks
- `src/services/friendServices.ts` - Backend service functions

## Future Enhancements

Potential improvements for the future:
- Add animation when badge count changes
- Add tooltip showing request details
- Add badge to other notification areas (navbar, etc.)
- Support different badge types (info, warning, etc.)
- Add sound notification option

## Database Integration

✅ Uses existing `friend_requests` table  
✅ Leverages existing `usePendingFriendRequests` hook  
✅ Uses existing `useFriendRequestsRealtime` subscription  
✅ No new database queries needed  
✅ Efficient - counts from cached data  

