// hooks/useFriends.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  searchUsersByUsername,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getPendingFriendRequests,
  getSentFriendRequests,
  subscribeFriendRequests,
  getFriends,
  subscribeFriends,
  removeFriend,
  getContactLabels,
  createContactLabel,
  updateContactLabel,
  deleteContactLabel,
  assignLabelToFriend,
  removeLabelFromFriend,
  blockUser,
  unblockUser,
  isBlockedByMe,
  isBlockedByUser,
  isMutuallyBlocked,
  getBlockedUsers,
  reportUser,
  getUserReports,
  type UserReportReason
} from '@/services/friendServices';
import toast from 'react-hot-toast';

// Keys cho query cache
export const friendKeys = {
  all: ['friends'] as const,
  search: (term: string, userId: string) =>
    [...friendKeys.all, 'search', term, userId] as const,
  pendingRequests: (userId: string) =>
    [...friendKeys.all, 'pending', userId] as const,
  sentRequests: (userId: string) =>
    [...friendKeys.all, 'sent', userId] as const,
  list: (userId: string) => [...friendKeys.all, 'list', userId] as const,
  labels: (userId: string) => [...friendKeys.all, 'labels', userId] as const
};

// Hook tìm kiếm user
export const useSearchUsers = (
  searchTerm: string,
  currentUserId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: friendKeys.search(searchTerm, currentUserId),
    queryFn: () => searchUsersByUsername(searchTerm, currentUserId),
    enabled: enabled && searchTerm.length >= 2,
    staleTime: 30000 // 30 seconds
  });
};

// Hook gửi lời mời kết bạn
export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, message }: { userId: string; message?: string }) =>
      sendFriendRequest(userId, message),
    onSuccess: () => {
      // Invalidate search queries để update UI
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    }
  });
};

// Hook đồng ý lời mời kết bạn
export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fromUserId: string) => acceptFriendRequest(fromUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    }
  });
};

// Hook từ chối lời mời kết bạn
export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fromUserId: string) => rejectFriendRequest(fromUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    }
  });
};

// Hook hủy lời mời đã gửi
export const useCancelFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (toUserId: string) => cancelFriendRequest(toUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    }
  });
};

// Hook lấy danh sách lời mời đến
export const usePendingFriendRequests = (userId: string) => {
  return useQuery({
    queryKey: friendKeys.pendingRequests(userId),
    queryFn: () => getPendingFriendRequests(userId),
    staleTime: 60000 // 1 minute
  });
};

// Hook lấy danh sách lời mời đã gửi
export const useSentFriendRequests = (userId: string) => {
  return useQuery({
    queryKey: friendKeys.sentRequests(userId),
    queryFn: () => getSentFriendRequests(userId),
    staleTime: 60000
  });
};

// Hook lấy danh sách bạn bè
export const useFriends = (userId: string) => {
  return useQuery({
    queryKey: friendKeys.list(userId),
    queryFn: () => getFriends(),
    enabled: !!userId, // Chỉ chạy khi có userId
    staleTime: 60000 // 1 minute
  });
};

// Hook xóa bạn bè
export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendId: string) => removeFriend(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    }
  });
};

// Hook realtime subscription cho friends
export const useFriendsRealtime = (userId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeFriends(
      userId,
      // On Insert
      () => {
        queryClient.invalidateQueries({
          queryKey: friendKeys.list(userId)
        });
      },
      // On Delete
      () => {
        queryClient.invalidateQueries({
          queryKey: friendKeys.list(userId)
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, queryClient]);
};

// Hook realtime subscription
export const useFriendRequestsRealtime = (userId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeFriendRequests(
      userId,
      // On Insert
      (newRequest) => {
        console.log(newRequest);

        queryClient.invalidateQueries({
          queryKey: friendKeys.pendingRequests(userId)
        });
      },
      // On Update
      (updatedRequest) => {
        console.log(updatedRequest);

        queryClient.invalidateQueries({
          queryKey: friendKeys.pendingRequests(userId)
        });
        queryClient.invalidateQueries({
          queryKey: friendKeys.sentRequests(userId)
        });
      },
      // On Delete
      (deletedRequest) => {
        console.log(deletedRequest);

        queryClient.invalidateQueries({
          queryKey: friendKeys.pendingRequests(userId)
        });
        queryClient.invalidateQueries({
          queryKey: friendKeys.sentRequests(userId)
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, queryClient]);
};

// ============================================
// CONTACT LABELS HOOKS
// ============================================

// Hook lấy danh sách labels
export const useContactLabels = (userId: string) => {
  return useQuery({
    queryKey: friendKeys.labels(userId),
    queryFn: () => getContactLabels(userId),
    enabled: !!userId, // Chỉ chạy khi có userId
    staleTime: 60000
  });
};

// Hook tạo label mới
export const useCreateContactLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, name, color }: { userId: string; name: string; color: number }) =>
      createContactLabel(userId, name, color),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: friendKeys.labels(variables.userId) });
    }
  });
};

// Hook cập nhật label
export const useUpdateContactLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ labelId, name, color, userId }: { labelId: string; name: string; color: number; userId: string }) =>
      updateContactLabel(labelId, name, color),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: friendKeys.labels(variables.userId) });
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    }
  });
};

// Hook xóa label
export const useDeleteContactLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ labelId, userId }: { labelId: string; userId: string }) =>
      deleteContactLabel(labelId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: friendKeys.labels(variables.userId) });
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    }
  });
};

// Hook gán label cho bạn bè
export const useAssignLabelToFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ friendId, labelId }: { friendId: string; labelId: string }) =>
      assignLabelToFriend(friendId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    }
  });
};

// Hook bỏ gán label
export const useRemoveLabelFromFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ friendId, labelId }: { friendId: string; labelId: string }) =>
      removeLabelFromFriend(friendId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    }
  });
};

// ============================================
// BLOCK/UNBLOCK HOOKS
// ============================================

// Hook block user
export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => blockUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      
      // Invalidate specific block status queries
      queryClient.invalidateQueries({ queryKey: ['blocks', 'by-me', userId] });
      queryClient.invalidateQueries({ queryKey: ['blocks', 'by-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['blocks', 'mutual', userId] });
    }
  });
};

// Hook unblock user
export const useUnblockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onSuccess: (_, userId) => {
      // Invalidate tất cả queries liên quan
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      
      // Invalidate specific block status queries
      queryClient.invalidateQueries({ queryKey: ['blocks', 'by-me', userId] });
      queryClient.invalidateQueries({ queryKey: ['blocks', 'by-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['blocks', 'mutual', userId] });
      
      // Force refetch friends list
      queryClient.refetchQueries({ queryKey: friendKeys.all });
    }
  });
};

// Hook check if user is blocked by me
export const useIsBlockedByMe = (userId: string) => {
  return useQuery({
    queryKey: ['blocks', 'by-me', userId],
    queryFn: () => isBlockedByMe(userId),
    enabled: !!userId,
    staleTime: 30000
  });
};

// Hook check if user has blocked me
export const useIsBlockedByUser = (userId: string) => {
  return useQuery({
    queryKey: ['blocks', 'by-user', userId],
    queryFn: () => isBlockedByUser(userId),
    enabled: !!userId,
    staleTime: 30000
  });
};

// Hook check if mutually blocked
export const useIsMutuallyBlocked = (userId: string) => {
  return useQuery({
    queryKey: ['blocks', 'mutual', userId],
    queryFn: () => isMutuallyBlocked(userId),
    enabled: !!userId,
    staleTime: 30000
  });
};

// Hook get blocked users list
export const useBlockedUsers = () => {
  return useQuery({
    queryKey: ['blocks', 'list'],
    queryFn: () => getBlockedUsers(),
    staleTime: 60000
  });
};

// Hook subscribe to block status changes realtime
export const useBlockStatusRealtime = (currentUserId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUserId) return;

    const channelName = `blocks:${currentUserId}`;
    
    // Remove existing channel if any
    const existingChannel = supabase.getChannels().find(ch => ch.topic === channelName);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'blocks',
          filter: `blocker_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('🔒 Block status changed (I blocked someone):', payload);
          const blockedUserId = payload.new?.blocked_id || payload.old?.blocked_id;
          if (blockedUserId) {
            queryClient.invalidateQueries({ queryKey: ['blocks', 'by-me', blockedUserId] });
            queryClient.invalidateQueries({ queryKey: ['blocks', 'mutual', blockedUserId] });
            queryClient.invalidateQueries({ queryKey: ['blocks'] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'blocks',
          filter: `blocked_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('🔒 Block status changed (Someone blocked me):', payload);
          const blockerUserId = payload.new?.blocker_id || payload.old?.blocker_id;
          if (blockerUserId) {
            queryClient.invalidateQueries({ queryKey: ['blocks', 'by-user', blockerUserId] });
            queryClient.invalidateQueries({ queryKey: ['blocks', 'mutual', blockerUserId] });
            queryClient.invalidateQueries({ queryKey: ['blocks'] });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔒 Block subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to block status changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to block status changes');
        }
      });

    return () => {
      console.log('🔕 Unsubscribing from block status changes');
      supabase.removeChannel(channel);
    };
  }, [currentUserId, queryClient]);
};

// ============================================
// USER REPORTS
// ============================================

// Hook to report a user
export const useReportUser = () => {
  return useMutation({
    mutationFn: ({
      reportedUserId,
      reportedBy,
      reason,
      description
    }: {
      reportedUserId: string;
      reportedBy: string;
      reason: UserReportReason;
      description?: string;
    }) => reportUser(reportedUserId, reportedBy, reason, description),
    onSuccess: () => {
      toast.success('Đã gửi báo cáo thành công. Cảm ơn bạn đã giúp cải thiện cộng đồng!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể gửi báo cáo');
    }
  });
};

// Hook to get user's reports
export const useUserReports = (userId: string) => {
  return useQuery({
    queryKey: ['userReports', userId],
    queryFn: () => getUserReports(userId),
    enabled: !!userId
  });
};
