# Conversation Tab Filter Implementation

## Overview
Implemented the "Tất cả" (All) and "Chưa đọc" (Unread) tab filtering for conversations in the ChatSidebar, matching the UI tabs with actual filtering logic.

## Problem
The ChatSidebar had UI tabs for "Tất cả" (All) and "Chưa đọc" (Unread) that controlled the URL query parameter, but the ConversationsList component wasn't filtering based on this tab selection. Users could click the tabs but would see all conversations regardless of the selected tab.

## Changes Made

### 1. Updated `ChatSidebar.tsx`
- Pass `tab` prop from `currentValue` (URL query state) to `ConversationsList`
- This connects the UI tabs to the filter logic

**Before:**
```typescript
<ConversationsList
  userId={userId as string}
  selectedFilter={selectedFilter}
/>
```

**After:**
```typescript
<ConversationsList
  userId={userId as string}
  selectedFilter={selectedFilter}
  tab={currentValue}
/>
```

### 2. Updated `ConversationsList.tsx`

#### Added `tab` prop
```typescript
interface ConversationsListProps {
  userId: string;
  selectedConversationId?: string;
  selectedFilter?: string | null;
  tab?: string; // New prop
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  userId,
  selectedConversationId,
  selectedFilter = null,
  tab = 'all', // Default to 'all'
}) => {
```

#### Implemented unread filter logic
```typescript
// Apply tab filter (all/unread)
if (tab === 'unread') {
  filteredConversations = filteredConversations?.filter((conv) => {
    // Show conversations with unread messages
    return (conv.unread_count ?? 0) > 0;
  });
}
```

## How It Works

### Filter Flow
1. **User clicks tab** → Updates URL query param via `useUrl` hook
2. **ChatSidebar reads `currentValue`** → Gets 'all' or 'unread' from URL
3. **Passes to ConversationsList** → Via `tab` prop
4. **ConversationsList filters** → Based on `unread_count` when tab='unread'
5. **UI updates** → Shows only conversations matching the filter

### Filter Logic
- **Tab = 'all'** → Shows all conversations (no additional filtering)
- **Tab = 'unread'** → Shows only conversations where `unread_count > 0`
- **Works with existing label filter** → Tab filter applies after label filter

### Unread Count
The `unread_count` field is already populated in `getConversations()` function in `chatService.ts`:
- Counts messages created after user's `last_read_at`
- Only counts messages from other users (not sent by current user)
- Efficiently computed for all conversations in batch queries

## Testing

### Test Scenarios

1. **All Tab (Default)**
   - Should show all conversations
   - Both read and unread conversations visible
   - Group chats and direct messages shown

2. **Unread Tab**
   - Should show only conversations with unread messages
   - Conversations with `unread_count = 0` are hidden
   - Empty state shown if no unread conversations

3. **Tab Switching**
   - Switch from "All" to "Unread" → List filters down
   - Switch from "Unread" to "All" → All conversations reappear
   - URL updates correctly with query param `?tab=all` or `?tab=unread`

4. **Combined Filters**
   - Tab filter + Label filter work together
   - First filter by label, then filter by unread status
   - Empty state message adapts to active filters

5. **Real-time Updates**
   - New unread message arrives → Conversation appears in "Unread" tab
   - Mark conversation as read → Disappears from "Unread" tab
   - All updates happen via realtime subscriptions

## Benefits

✅ **Consistent UX** - UI tabs now control actual filtering  
✅ **Intuitive** - Matches user expectations from Discord/WhatsApp  
✅ **Efficient** - Uses existing `unread_count` field  
✅ **Real-time** - Updates automatically via subscriptions  
✅ **Composable** - Works with existing label filter  

## Related Files

- `src/layouts/sidebar/ChatSidebar.tsx` - Tab UI and prop passing
- `src/components/conversation/ConversationsList.tsx` - Filter logic implementation
- `src/hooks/useUrl.ts` - URL query param management
- `src/services/chatService.ts` - `unread_count` calculation

## Database Integration

✅ Uses existing `unread_count` field from `getConversations()`  
✅ No new database queries needed  
✅ Efficient batch counting in service layer  

## Future Enhancements

Potential improvements for the future:
- Add keyboard shortcuts (e.g., `Ctrl+U` for unread tab)
- Add badge count on "Unread" tab showing total unread conversations
- Add "Mark all as read" action
- Add filters for group vs direct messages

