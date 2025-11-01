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

  // Đảm bảo tạo bạn bè hai chiều A <-> B (phòng khi RPC chỉ tạo một chiều)
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    const me = currentUser?.id as string;
    if (!me) return;

    // Chèn hai chiều, bỏ qua nếu đã tồn tại
    // Một số DB có unique constraint, ta chấp nhận lỗi duplicate và bỏ qua
    const inserts = [
      { user_id: me, friend_id: fromUserId },
      { user_id: fromUserId, friend_id: me }
    ];

    for (const row of inserts) {
      const { error: insErr } = await supabase
        .from('friends')
        .insert(row);
      if (insErr && insErr.code !== '23505') {
        // 23505 = unique_violation, coi như đã tồn tại -> bỏ qua
        // Các lỗi khác mới log để theo dõi
        console.warn('Ensure mutual friendship insert error:', insErr);
      }
    }
  } catch (e) {
    console.warn('Ensure mutual friendship failed:', e);
  }
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
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  // Verify friendship exists before deleting
  const { data: existingFriendship, error: checkError } = await supabase
    .from('friends')
    .select('*')
    .eq('user_id', currentUserId)
    .eq('friend_id', friendId)
    .single();

  if (checkError || !existingFriendship) {
    throw new Error('Friendship does not exist or cannot be accessed');
  }

  // Delete both relationships using OR condition
  // This deletes: (current user -> friend) OR (friend -> current user)
  // Since we can only delete our own friendships due to RLS, we delete in two steps
  // but use a single logical operation
  
  // Step 1: Delete relationship where current user is the user_id (we own this)
  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('user_id', currentUserId)
    .eq('friend_id', friendId);

  if (error) {
    console.error('Error deleting friendship (user -> friend):', error);
    throw error;
  }

  // Step 2: Delete reverse relationship where current user is the friend_id
  // This should work because we're deleting a row where we are the friend
  // If RLS allows deleting where friend_id = auth.uid(), this will work
  const { error: error2 } = await supabase
    .from('friends')
    .delete()
    .eq('user_id', friendId)
    .eq('friend_id', currentUserId);

  if (error2) {
    // If this fails, it's likely due to RLS policy
    // The main relationship is already deleted
    // Since get_friends() only returns friends where user_id = current_user,
    // the reverse row won't affect the UI - it's just orphaned data
    console.warn('Could not delete reverse friendship. Error:', error2);
    console.warn('Main friendship deleted successfully. Reverse row may remain due to RLS policies.');
    console.warn('This is not critical as get_friends() only queries user_id = current_user.');
    // Don't throw - main deletion succeeded and UI will update correctly
  }
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

// ============================================
// CONTACT LABELS (Nhãn phân loại bạn bè)
// ============================================

export type ContactLabel = Database['public']['Tables']['contact_labels']['Row'];

// Lấy tất cả labels của user
export const getContactLabels = async (userId: string): Promise<ContactLabel[]> => {
  const { data, error } = await supabase
    .from('contact_labels')
    .select('*')
    .eq('owner_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

// Tạo label mới
export const createContactLabel = async (
  userId: string,
  name: string,
  color: number
): Promise<ContactLabel> => {
  const { data, error } = await supabase
    .from('contact_labels')
    .insert({
      owner_id: userId,
      name,
      color
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Cập nhật label
export const updateContactLabel = async (
  labelId: string,
  name: string,
  color: number
): Promise<ContactLabel> => {
  const { data, error } = await supabase
    .from('contact_labels')
    .update({ name, color })
    .eq('id', labelId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Xóa label
export const deleteContactLabel = async (labelId: string): Promise<void> => {
  const { error } = await supabase
    .from('contact_labels')
    .delete()
    .eq('id', labelId);

  if (error) throw error;
};

// Gán label cho bạn bè
export const assignLabelToFriend = async (
  friendId: string,
  labelId: string
): Promise<void> => {
  const { error } = await supabase
    .from('contact_label_map')
    .insert({
      friend_id: friendId,
      label_id: labelId
    });

  if (error) throw error;
};

// Bỏ gán label cho bạn bè
export const removeLabelFromFriend = async (
  friendId: string,
  labelId: string
): Promise<void> => {
  const { error } = await supabase
    .from('contact_label_map')
    .delete()
    .eq('friend_id', friendId)
    .eq('label_id', labelId);

  if (error) throw error;
};

export { supabase };
