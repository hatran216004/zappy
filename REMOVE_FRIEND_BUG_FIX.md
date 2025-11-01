# Remove Friend Bug Fix

## Problem
The `removeFriend` function had a critical bug that could delete ALL friendships where someone was a friend, not just the specific friendship being removed.

## Root Cause
The original code was missing the `user_id` filter in the first DELETE query:

```typescript
// ❌ BUGGY CODE
export const removeFriend = async (friendId: string): Promise<void> => {
  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('friend_id', friendId);  // ⚠️ Missing .eq('user_id', currentUserId)!
  
  // This would delete ALL friendships involving friendId
  // Even if they were friends with other people!
}
```

### Example of the Bug
If:
- User A has friendId = B (they are friends)
- User C also has friendId = B (they are friends)

When User A tries to remove friend B, the old code would delete:
- A → B ✅ (correct)
- C → B ❌ (WRONG! should not delete this)

## Solution

### Fixed Code
```typescript
export const removeFriend = async (friendId: string): Promise<void> => {
  // Get current authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  // Delete relationship: current user -> friend
  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('user_id', currentUserId)  // ✅ Now filters by current user
    .eq('friend_id', friendId);

  if (error) throw error;

  // Delete reverse relationship: friend -> current user
  const { error: error2 } = await supabase
    .from('friends')
    .delete()
    .eq('user_id', friendId)
    .eq('friend_id', currentUserId);

  if (error2) throw error2;
};
```

### Changes Made
1. **Explicitly get current user ID** before queries
2. **Add auth check** to ensure user is authenticated
3. **Fix first DELETE** to filter by both `user_id` AND `friend_id`
4. **Improve comments** to clarify what each query does

## Database Schema

The `friends` table structure:
```typescript
friends {
  user_id: string    // The user who has this friend
  friend_id: string  // The friend's user ID
  created_at: string
}
```

Friendships are **bidirectional**, so we store two rows:
- `{ user_id: 'A', friend_id: 'B' }` → A has B as friend
- `{ user_id: 'B', friend_id: 'A' }` → B has A as friend

## Why Bidirectional?

### Benefits
- Fast queries (no complex JOINs)
- Independent removal (can delete one side independently if needed)
- Clear data model
- Works with RLS policies easily

### Trade-offs
- Need to delete 2 rows when removing a friendship
- Need to insert 2 rows when adding a friendship
- Slight data duplication

## Testing

### Test Cases

1. **Normal removal**
   - User A removes friend B
   - Both A→B and B→A should be deleted
   - No other friendships affected

2. **Multiple friends**
   - User A has friends B, C, D
   - Removing B should NOT affect C or D
   - Verify all friendships still intact

3. **Reciprocal removal**
   - Both users are friends
   - Either user can remove the friendship
   - Both sides should be cleaned up

4. **Unauthenticated user**
   - Should throw error if not logged in
   - Should not execute any DELETE queries

5. **Network errors**
   - If first DELETE succeeds but second fails
   - Check if partial deletion occurs
   - (Consider adding transaction/rollback)

## Related Functions

### `acceptFriendRequest` (in friendServices.ts)
This function already handles both sides correctly:
```typescript
export const acceptFriendRequest = async (fromUserId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  // Insert both directions
  await supabase.from('friends').insert([
    { user_id: currentUserId, friend_id: fromUserId },
    { user_id: fromUserId, friend_id: currentUserId }
  ]);
};
```

### `getFriends` (RPC function)
Uses a database function that returns friends properly:
```typescript
export const getFriends = async (): Promise<Friend[]> => {
  const { data, error } = await supabase.rpc('get_friends');
  // This likely uses UNION or proper JOIN to return friends correctly
  return data ?? [];
};
```

## Security Considerations

✅ **Auth check** - Verifies user is authenticated  
✅ **Isolation** - Only removes current user's friendships  
✅ **RLS** - Database-level policies prevent unauthorized access  
✅ **Explicit filters** - Clear what rows are being deleted  

## Future Improvements

Potential enhancements:
1. **Use database transaction** to ensure atomicity
2. **Add cascade deletion** at database level
3. **Optimistic updates** in UI before server confirms
4. **Undo functionality** (soft delete + restore)
5. **Audit log** of friendship changes

## Impact

### Before Fix
- 🐛 Critical data loss bug
- Could remove unintended friendships
- Silent failures
- Data inconsistency

### After Fix
- ✅ Safe friendship removal
- Only removes specific relationship
- Proper error handling
- Maintains data integrity

## Files Changed

- `src/services/friendServices.ts` - Fixed removeFriend function

## Testing Checklist

- [x] Code compiles without errors
- [x] TypeScript types are correct
- [x] No linter errors
- [ ] Manual test: Remove a friend
- [ ] Verify other friendships not affected
- [ ] Test with unauthenticated user
- [ ] Test with network errors

