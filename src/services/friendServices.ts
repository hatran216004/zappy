// services/friendService.ts
import { supabase } from '@/lib/supabase';
import { type Database } from '@/types/supabase.type';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type FriendRequest =
  Database['public']['Tables']['friend_requests']['Row'];
export type FriendStatus = Database['public']['Enums']['friend_status'];
export type Friend =
  Database['public']['Functions']['get_friends']['Returns'][number];

export interface SearchUserResult extends Profile {
  friendRequestStatus?: FriendStatus | null;
  friendRequestId?: string | null;
  isFriend?: boolean;
}

// Tìm kiếm user theo email/username
export const searchUsersByUsername = async (
  searchTerm: string,
  currentUserId: string
): Promise<SearchUserResult[]> => {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
    .neq('id', currentUserId)
    .eq('is_disabled', false)
    .limit(20);

  if (error) throw error;

  // Check friend status và friend request status
  const userIds = users?.map((u) => u.id) || [];

  const [friendsData, requestsData, blocksData] = await Promise.all([
    supabase
      .from('friends')
      .select('friend_id')
      .eq('user_id', currentUserId)
      .in('friend_id', userIds),
    supabase
      .from('friend_requests')
      .select('*')
      .or(
        `and(from_user_id.eq.${currentUserId},to_user_id.in.(${userIds.join(
          ','
        )})),and(to_user_id.eq.${currentUserId},from_user_id.in.(${userIds.join(
          ','
        )}))`
      )
      .in('status', ['pending']),
    supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', currentUserId)
      .in('blocked_id', userIds)
  ]);

  const friendIds = new Set(friendsData.data?.map((f) => f.friend_id) || []);
  const blockedIds = new Set(blocksData.data?.map((b) => b.blocked_id) || []);

  const requestsMap = new Map(
    requestsData.data?.map((req) => [
      req.from_user_id === currentUserId ? req.to_user_id : req.from_user_id,
      req
    ]) || []
  );

  return (users || [])
    .filter((user) => !blockedIds.has(user.id))
    .map((user) => {
      const request = requestsMap.get(user.id);
      return {
        ...user,
        isFriend: friendIds.has(user.id),
        friendRequestStatus: request?.status || null,
        friendRequestId: request?.id || null
      };
    });
};

// Gửi lời mời kết bạn
export const sendFriendRequest = async (
  toUserId: string,
  message: string = ''
): Promise<void> => {
  const { error } = await supabase.rpc('send_friend_request', {
    _user_id: toUserId,
    _message: message
  });

  if (error) throw error;
};

// Đồng ý lời mời kết bạn
export const acceptFriendRequest = async (
  fromUserId: string
): Promise<void> => {
  const { error } = await supabase.rpc('accept_friend_request', {
    _user_id: fromUserId
  });

  if (error) throw error;
};

// Từ chối lời mời kết bạn
export const rejectFriendRequest = async (
  fromUserId: string
): Promise<void> => {
  const { error } = await supabase.rpc('reject_friend_request', {
    _user_id: fromUserId
  });

  if (error) throw error;
};

// Hủy lời mời đã gửi
export const cancelFriendRequest = async (toUserId: string): Promise<void> => {
  const { error } = await supabase.rpc('cancel_friend_request', {
    _user_id: toUserId
  });

  if (error) throw error;
};

// Lấy danh sách lời mời kết bạn đang chờ
export const getPendingFriendRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(
      `
      *,
      from_user:profiles!friend_requests_from_user_id_fkey(*)
    `
    )
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Lấy danh sách lời mời đã gửi
export const getSentFriendRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(
      `
      *,
      to_user:profiles!friend_requests_to_user_id_fkey(*)
    `
    )
    .eq('from_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Lấy danh sách bạn bè
export const getFriends = async (): Promise<Friend[]> => {
  const { data, error } = await supabase.rpc('get_friends'); // KHÔNG truyền param vì RPC không có Args

  if (error) {
    // có thể log thêm Sentry ở đây nếu cần
    throw error;
  }

  // luôn trả mảng để phía UI dễ xử lý
  return data ?? [];
};

// Xóa bạn bè
export const removeFriend = async (friendId: string): Promise<void> => {
  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('friend_id', friendId);

  if (error) throw error;

  // Delete reverse relationship
  const { error: error2 } = await supabase
    .from('friends')
    .delete()
    .eq('user_id', friendId)
    .eq('friend_id', (await supabase.auth.getUser()).data.user?.id as string);

  if (error2) throw error2;
};

// Subscribe to friend requests realtime
export const subscribeFriendRequests = (
  userId: string,
  onInsert: (payload: FriendRequest) => void,
  onUpdate: (payload: FriendRequest) => void,
  onDelete: (payload: FriendRequest) => void
) => {
  const channel = supabase
    .channel('friend_requests_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'friend_requests',
        filter: `to_user_id=eq.${userId}`
      },
      (payload) => onInsert(payload.new as FriendRequest)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'friend_requests',
        filter: `to_user_id=eq.${userId}`
      },
      (payload) => onUpdate(payload.new as FriendRequest)
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'friend_requests',
        filter: `to_user_id=eq.${userId}`
      },
      (payload) => onDelete(payload.old as FriendRequest)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Subscribe to friends realtime
export const subscribeFriends = (
  userId: string,
  onInsert: () => void,
  onDelete: () => void
) => {
  const channel = supabase
    .channel('friends_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'friends',
        filter: `user_id=eq.${userId}`
      },
      () => onInsert()
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'friends',
        filter: `user_id=eq.${userId}`
      },
      () => onDelete()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export { supabase };
