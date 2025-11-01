# Realtime Reactions Update Implementation

## Overview
Implemented realtime updates for message reactions in both 1-on-1 and group chats. When User A reacts to a message, User B will see the reaction immediately without any flickering or page refresh.

## Changes Made

### 1. Updated `subscribeReactions` in `src/services/chatService.ts`
- Changed from simple `invalidateQueries` callback to proper INSERT/DELETE handlers
- Added conversation filtering logic (fetch message to verify it belongs to the conversation)
- Added user profile fetching for reaction display
- Now handles both adding and removing reactions with proper realtime events

**Before:**
```typescript
export const subscribeReactions = (
  conversationId: string,
  onUpdate: () => void  // Just invalidated queries
) => { ... }
```

**After:**
```typescript
export const subscribeReactions = (
  conversationId: string,
  onInsert: (reaction: { message_id: string; reaction: MessageReaction & { user: any } }) => void,
  onDelete: (reaction: { message_id: string; user_id: string; emoji: string }) => void
) => { 
  // Proper INSERT/DELETE handling with conversation filtering
}
```

### 2. Updated `useReactionsRealtime` in `src/hooks/useChat.ts`
- Changed from `invalidateQueries` to optimistic cache updates
- Directly updates the message reactions array in cache
- No flickering or full refetch - only the reaction data is updated
- Works seamlessly with infinite query pagination

**Before:**
```typescript
export const useReactionsRealtime = (conversationId: string) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const unsubscribe = subscribeReactions(conversationId, () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(conversationId)
      });
    });
    return () => unsubscribe();
  }, [conversationId, queryClient]);
};
```

**After:**
```typescript
export const useReactionsRealtime = (conversationId: string) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const unsubscribe = subscribeReactions(
      conversationId,
      // On Insert - add reaction to message
      ({ message_id, reaction }) => {
        queryClient.setQueryData(
          chatKeys.messages(conversationId),
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page: any[]) =>
                page.map((msg: any) =>
                  msg.id === message_id
                    ? { ...msg, reactions: [...(msg.reactions || []), reaction] }
                    : msg
                )
              )
            };
          }
        );
      },
      // On Delete - remove reaction from message
      ({ message_id, user_id, emoji }) => {
        queryClient.setQueryData(
          chatKeys.messages(conversationId),
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page: any[]) =>
                page.map((msg: any) =>
                  msg.id === message_id
                    ? {
                        ...msg,
                        reactions: (msg.reactions || []).filter(
                          (r: any) => !(r.user_id === user_id && r.emoji === emoji)
                        )
                      }
                    : msg
                )
              )
            };
          }
        );
      }
    );
    return () => unsubscribe();
  }, [conversationId, queryClient]);
};
```

### 3. Added `useReactionsRealtime` to ChatWindow
- Imported the hook in `src/components/conversation/ChatWindow.tsx`
- Added `useReactionsRealtime(conversationId)` to the component
- Now all conversations automatically subscribe to reaction updates

**Location:** Line 14 import, Line 75 usage

## How It Works

### Realtime Flow
1. **User A reacts to a message**
   - `addReaction` mutation is called
   - Database inserts row into `message_reactions` table
   - Supabase Postgres triggers INSERT event

2. **Subscription receives event**
   - `subscribeReactions` receives INSERT payload
   - Verifies message belongs to conversation (fetches message to check `conversation_id`)
   - Fetches user profile for the reaction
   - Calls `onInsert` callback

3. **Cache update**
   - `useReactionsRealtime` updates query cache directly
   - Finds the message in all pages
   - Appends new reaction to message's reactions array
   - React Query re-renders only affected message bubble

4. **User B sees reaction**
   - No flicker, no page refresh
   - Reaction appears instantly
   - Same for removing reactions (DELETE event)

### Conversation Filtering
Since `message_reactions` table doesn't have `conversation_id`, we filter by:
1. Receiving ALL reaction events
2. Fetching the related message
3. Checking if message's `conversation_id` matches current conversation
4. Only processing if it matches

This ensures User A in conversation 1 doesn't see reactions from conversation 2.

## Testing

### Test Scenarios
1. **1-on-1 Chat**
   - Open chat between User A and User B
   - User A reacts to a message
   - User B should see reaction immediately
   - User B reacts to same message
   - User A sees updated reaction count

2. **Group Chat**
   - Open group chat with 3+ members
   - User A reacts to a message
   - All other members see reaction instantly
   - Multiple users react with different emojis
   - All see all reactions in realtime

3. **Remove Reaction**
   - User A reacts to message
   - User B sees reaction
   - User A removes reaction
   - User B sees reaction removed instantly

4. **Multiple Conversations**
   - User A has 2 conversations open in different tabs
   - User reacts to message in conversation 1
   - Reaction should NOT appear in conversation 2

## Benefits

✅ **No Flickering** - Direct cache updates instead of invalidation  
✅ **Instant Updates** - Realtime via Supabase Postgres changes  
✅ **Works for All Chat Types** - 1-on-1 and group chats  
✅ **Efficient** - Only updates affected messages  
✅ **Consistent** - Same pattern as `useMessagesRealtime`  

## Related Files

- `src/services/chatService.ts` - subscribeReactions implementation
- `src/hooks/useChat.ts` - useReactionsRealtime hook
- `src/components/conversation/ChatWindow.tsx` - Hook usage
- `src/components/conversation/MessageBubble.tsx` - Reaction display (already had this)

## Database Requirements

✅ `message_reactions` table exists  
✅ RLS policies configured correctly  
✅ Realtime enabled for `message_reactions` table  

## Migration Required

None! Uses existing `message_reactions` table and infrastructure.

