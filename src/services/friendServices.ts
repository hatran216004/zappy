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
  const term = searchTerm.trim();

  // 1) Profile search by username/display_name
  const { data: byProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
    .neq('id', currentUserId)
    .eq('is_disabled', false)
    .limit(20);

  if (profileErr) throw profileErr;

  // 2) Email search via SQL function (auth.users), if term likely email or contains '@'
  let byEmail: Profile[] = [];
  if (term.includes('@')) {
    const rpcClient = supabase as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message?: string } | null }>;
    };
    const { data: emailData, error: emailErr } = await rpcClient.rpc(
      'search_users_by_email',
      {
        _term: term,
        _current_user_id: currentUserId
      }
    );
    if (!emailErr && emailData) {
      byEmail = emailData as Profile[];
    } else if (emailErr) {
      console.warn('Email search RPC error:', emailErr.message);
    }
  }

  // Combine unique by id, prioritize profile search order
  const map = new Map<string, Profile>();
  (byProfile || []).forEach((p) => map.set(p.id, p));
  byEmail.forEach((p) => {
    if (!map.has(p.id)) map.set(p.id, p);
  });
  const users = Array.from(map.values());

  // Check friend status và friend request status
  const userIds = users.map((u) => u.id);

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
  const currentUser = (await supabase.auth.getUser()).data.user;
  const me = currentUser?.id;

  // STEP 0: Check if target user has privacy mode enabled
  const { data: targetProfile, error: profileError } = await supabase
    .from('profiles')
    .select('is_private')
    .eq('id', toUserId)
    .single();

  if (profileError) {
    console.error('Error checking privacy mode:', profileError);
    // Continue anyway, let RPC handle it
  } else if (targetProfile?.is_private) {
    throw new Error('Người dùng này đã bật chế độ riêng tư và không nhận lời mời kết bạn');
  }

  // STEP 1: Clean up any orphaned friendships BEFORE calling RPC
  // This prevents RPC from failing due to existing orphaned rows
  if (me) {
    try {
      // Delete any orphaned rows in both directions
      const deleteOps = [
        supabase
          .from('friends')
          .delete()
          .eq('user_id', me)
          .eq('friend_id', toUserId),
        supabase
          .from('friends')
          .delete()
          .eq('user_id', toUserId)
          .eq('friend_id', me)
      ];

      await Promise.all(deleteOps);
      console.log('Cleaned up any orphaned friendships before sending request');
    } catch (cleanupError) {
      // Don't throw - continue with RPC even if cleanup fails
      console.warn('Cleanup warning (continuing anyway):', cleanupError);
    }
  }

  // STEP 2: Call database RPC to send the request
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
  const currentUser = (await supabase.auth.getUser()).data.user;
  const me = currentUser?.id;

  // STEP 1: Clean up any orphaned friendships BEFORE calling RPC
  // This prevents RPC from failing due to existing orphaned rows
  if (me) {
    try {
      // Delete any orphaned rows in both directions
      const deleteOps = [
        supabase
          .from('friends')
          .delete()
          .eq('user_id', me)
          .eq('friend_id', fromUserId),
        supabase
          .from('friends')
          .delete()
          .eq('user_id', fromUserId)
          .eq('friend_id', me)
      ];

      await Promise.all(deleteOps);
      console.log('Cleaned up any orphaned friendships before acceptance');
    } catch (cleanupError) {
      // Don't throw - continue with RPC even if cleanup fails
      console.warn('Cleanup warning (continuing anyway):', cleanupError);
    }
  }

  // STEP 2: Call database RPC to accept the request
  const { error } = await supabase.rpc('accept_friend_request', {
    _user_id: fromUserId
  });

  if (error) throw error;

  // STEP 3: Ensure both directions exist (insurance in case RPC only created one)
  if (me) {
    try {
      // Check if each direction exists
      const [meToFriend, friendToMe] = await Promise.all([
        supabase
          .from('friends')
          .select('*')
          .eq('user_id', me)
          .eq('friend_id', fromUserId)
          .maybeSingle(),
        supabase
          .from('friends')
          .select('*')
          .eq('user_id', fromUserId)
          .eq('friend_id', me)
          .maybeSingle()
      ]);

      // Insert me -> friend if doesn't exist
      if (!meToFriend.data) {
        const { error: insertError1 } = await supabase
          .from('friends')
          .insert({ user_id: me, friend_id: fromUserId });

        if (insertError1 && insertError1.code !== '23505') {
          console.warn('Error inserting me -> friend:', insertError1);
        }
      }

      // Insert friend -> me if doesn't exist
      if (!friendToMe.data) {
        const { error: insertError2 } = await supabase
          .from('friends')
          .insert({ user_id: fromUserId, friend_id: me });

        if (insertError2 && insertError2.code !== '23505') {
          console.warn('Error inserting friend -> me:', insertError2);
        }
      }
    } catch (e) {
      console.warn('Ensure mutual friendship failed:', e);
    }
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

// Lấy danh sách bạn bè (bao gồm cả những người bị block)
export const getFriends = async (): Promise<Friend[]> => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  if (!currentUserId) return [];

  // Query trực tiếp từ table friends để lấy tất cả bạn bè (kể cả bị block)
  // Thay vì dùng RPC get_friends vì RPC có thể filter ra blocked users
  const { data: friendsData, error: friendsError } = await supabase
    .from('friends')
    .select('friend_id')
    .eq('user_id', currentUserId);

  if (friendsError) {
    console.error('Error fetching friends:', friendsError);
    throw friendsError;
  }

  console.log(
    '📋 Friends from database:',
    friendsData?.length || 0,
    friendsData
  );

  if (!friendsData || friendsData.length === 0) return [];

  const friendIds = friendsData.map((f) => f.friend_id);
  console.log('👥 Friend IDs:', friendIds);

  // Lấy thông tin profiles
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, status, last_seen_at')
    .in('id', friendIds)
    .eq('is_disabled', false);

  if (profilesError) throw profilesError;

  // Lấy labels cho mỗi friend
  const { data: labelsData } = await supabase
    .from('contact_label_map')
    .select('friend_id, label_id')
    .in('friend_id', friendIds);

  // Group labels by friend_id
  const labelsMap = new Map<string, string[]>();
  labelsData?.forEach((item) => {
    if (!labelsMap.has(item.friend_id)) {
      labelsMap.set(item.friend_id, []);
    }
    labelsMap.get(item.friend_id)!.push(item.label_id);
  });

  // Map to Friend format
  const friends: Friend[] = (profilesData || []).map((profile) => ({
    id: profile.id,
    display_name: profile.display_name,
    username: profile.username,
    avatar_url: profile.avatar_url || '',
    status: profile.status || 'offline',
    last_seen_at: profile.last_seen_at || '',
    label_id: labelsMap.get(profile.id) || []
  }));

  return friends;
};

// Xóa bạn bè
export const removeFriend = async (friendId: string): Promise<void> => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
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
    console.warn(
      'Main friendship deleted successfully. Reverse row may remain due to RLS policies.'
    );
    console.warn(
      'This is not critical as get_friends() only queries user_id = current_user.'
    );
    // Don't throw - main deletion succeeded and UI will update correctly
  }

  // Step 3: Delete any pending friend requests between the two users
  // This prevents orphaned friend requests from remaining after friendship removal
  try {
    const { error: deleteRequestError } = await supabase
      .from('friend_requests')
      .delete()
      .or(
        `and(from_user_id.eq.${currentUserId},to_user_id.eq.${friendId}),and(from_user_id.eq.${friendId},to_user_id.eq.${currentUserId})`
      );

    if (deleteRequestError) {
      console.warn('Could not delete friend requests:', deleteRequestError);
      // Don't throw - friendship deletion succeeded
    } else {
      console.log('Cleaned up friend requests after friendship removal');
    }
  } catch (e) {
    console.warn('Friend request cleanup failed:', e);
    // Don't throw - main operation succeeded
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

export type ContactLabel =
  Database['public']['Tables']['contact_labels']['Row'];

// Lấy tất cả labels của user
export const getContactLabels = async (
  userId: string
): Promise<ContactLabel[]> => {
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
  const { error } = await supabase.from('contact_label_map').insert({
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

// ============================================
// BLOCK/UNBLOCK USERS
// ============================================

// Block a user (không xóa friendship để vẫn hiển thị trong danh sách bạn bè)
export const blockUser = async (userId: string): Promise<void> => {
  console.log('🚫 Starting blockUser for userId:', userId);

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  console.log('👤 Current user ID:', currentUserId);

  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  if (currentUserId === userId) {
    throw new Error('Cannot block yourself');
  }

  // Check if already blocked
  console.log('🔍 Checking if already blocked...');
  const { data: existing, error: checkError } = await supabase
    .from('blocks')
    .select('blocker_id, blocked_id')
    .eq('blocker_id', currentUserId)
    .eq('blocked_id', userId)
    .maybeSingle();

  if (checkError) {
    console.error('❌ Error checking existing block:', checkError);
    throw checkError;
  }

  if (existing) {
    console.log('⚠️ User already blocked');
    throw new Error('User is already blocked');
  }

  console.log('📝 Inserting block record...');
  console.log('   blocker_id:', currentUserId);
  console.log('   blocked_id:', userId);

  // Insert block (KHÔNG xóa friendship để vẫn hiển thị trong danh sách bạn bè)
  const { data: insertData, error: insertError } = await supabase
    .from('blocks')
    .insert({
      blocker_id: currentUserId,
      blocked_id: userId
    })
    .select();

  if (insertError) {
    console.error('❌ Error inserting block:', insertError);
    console.error('   Error code:', insertError.code);
    console.error('   Error message:', insertError.message);
    console.error('   Error details:', insertError.details);
    console.error('   Error hint:', insertError.hint);
    throw insertError;
  }

  console.log('✅ Block inserted successfully:', insertData);

  // Kiểm tra xem friendship có còn tồn tại không
  const { data: friendshipCheck } = await supabase
    .from('friends')
    .select('id')
    .eq('user_id', currentUserId)
    .eq('friend_id', userId)
    .maybeSingle();

  console.log(
    '🔍 Friendship after block:',
    friendshipCheck ? 'EXISTS' : 'DELETED'
  );

  // Cancel any pending friend requests (nhưng giữ friendship)
  await supabase
    .from('friend_requests')
    .delete()
    .or(
      `and(from_user_id.eq.${currentUserId},to_user_id.eq.${userId}),and(from_user_id.eq.${userId},to_user_id.eq.${currentUserId})`
    );
};

// Unblock a user
export const unblockUser = async (userId: string): Promise<void> => {
  console.log('🔓 Starting unblockUser for userId:', userId);

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  console.log('👤 Current user ID:', currentUserId);

  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  if (currentUserId === userId) {
    throw new Error('Cannot unblock yourself');
  }

  // Check if block exists
  console.log('🔍 Checking if block exists...');
  const { data: existing, error: checkError } = await supabase
    .from('blocks')
    .select('blocker_id, blocked_id')
    .eq('blocker_id', currentUserId)
    .eq('blocked_id', userId)
    .maybeSingle();

  if (checkError) {
    console.error('❌ Error checking existing block:', checkError);
    throw checkError;
  }

  if (!existing) {
    console.log('⚠️ Block does not exist');
    throw new Error('User is not blocked');
  }

  console.log('🗑️ Deleting block record...');
  console.log('   blocker_id:', currentUserId);
  console.log('   blocked_id:', userId);

  // Delete block directly from table (KHÔNG dùng RPC để tránh xóa friendship)
  const { error: deleteError } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', currentUserId)
    .eq('blocked_id', userId);

  if (deleteError) {
    console.error('❌ Error deleting block:', deleteError);
    console.error('   Error code:', deleteError.code);
    console.error('   Error message:', deleteError.message);
    console.error('   Error details:', deleteError.details);
    console.error('   Error hint:', deleteError.hint);
    throw deleteError;
  }

  console.log('✅ Block deleted successfully');

  // Kiểm tra xem friendship có còn tồn tại không
  // Nếu không có, có thể đã bị xóa khi block (do RPC block_user)
  // Cần tạo lại friendship
  console.log('🔍 Checking if friendship exists...');
  const { data: friendshipCheck } = await supabase
    .from('friends')
    .select('id')
    .eq('user_id', currentUserId)
    .eq('friend_id', userId)
    .maybeSingle();

  if (!friendshipCheck) {
    console.log('⚠️ Friendship does not exist, recreating...');

    // Tạo lại friendship
    const { error: friendError } = await supabase.from('friends').insert({
      user_id: currentUserId,
      friend_id: userId
    });

    if (friendError) {
      console.error('❌ Error recreating friendship:', friendError);
      // Không throw error vì có thể friendship đã bị xóa trước đó
      // User có thể cần kết bạn lại
    } else {
      console.log('✅ Friendship recreated successfully');
    }
  } else {
    console.log('✅ Friendship still exists');
  }
};

// Check if current user has blocked a user
export const isBlockedByMe = async (userId: string): Promise<boolean> => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  if (!currentUserId) return false;

  const { data } = await supabase
    .from('blocks')
    .select('blocker_id, blocked_id')
    .eq('blocker_id', currentUserId)
    .eq('blocked_id', userId)
    .maybeSingle();

  return !!data;
};

// Check if current user is blocked by a user
export const isBlockedByUser = async (userId: string): Promise<boolean> => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  if (!currentUserId) return false;

  const { data } = await supabase
    .from('blocks')
    .select('blocker_id, blocked_id')
    .eq('blocker_id', userId)
    .eq('blocked_id', currentUserId)
    .maybeSingle();

  return !!data;
};

// Check if two users have blocked each other (mutual block)
export const isMutuallyBlocked = async (userId: string): Promise<boolean> => {
  const [blockedByMe, blockedByUser] = await Promise.all([
    isBlockedByMe(userId),
    isBlockedByUser(userId)
  ]);

  return blockedByMe || blockedByUser;
};

// Get list of blocked users
export const getBlockedUsers = async (): Promise<Profile[]> => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  if (!currentUserId) return [];

  // Use RPC function
  const { data, error } = await supabase.rpc('get_blocks');

  if (error) throw error;

  // RPC returns array of profiles directly (id, display_name, username, avatar_url, created_at)
  return (data || []) as Profile[];
};

// ============================================
// USER REPORTS
// ============================================

export type UserReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate_content'
  | 'violence'
  | 'hate_speech'
  | 'fake_news'
  | 'other';

export interface UserReport {
  id: string;
  reported_user_id: string;
  reported_by: string;
  reason: UserReportReason;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// Report a user
export const reportUser = async (
  reportedUserId: string,
  reportedBy: string,
  reason: UserReportReason,
  description?: string
): Promise<UserReport> => {
  // Prevent self-reporting
  if (reportedUserId === reportedBy) {
    throw new Error('Bạn không thể báo cáo chính mình');
  }

  // Check if user already reported this user
  const { data: existingReport } = await supabase
    .from('user_reports')
    .select('id')
    .eq('reported_user_id', reportedUserId)
    .eq('reported_by', reportedBy)
    .single();

  if (existingReport) {
    throw new Error('Bạn đã báo cáo người dùng này rồi');
  }

  const { data, error } = await supabase
    .from('user_reports')
    .insert({
      reported_user_id: reportedUserId,
      reported_by: reportedBy,
      reason,
      description: description || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get reports by user
export const getUserReports = async (
  userId: string
): Promise<UserReport[]> => {
  const { data, error } = await supabase
    .from('user_reports')
    .select('*')
    .eq('reported_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export { supabase };
