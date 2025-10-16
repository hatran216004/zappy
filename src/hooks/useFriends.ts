// hooks/useFriends.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
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
  removeFriend
} from '@/services/friendServices';

// Keys cho query cache
export const friendKeys = {
  all: ['friends'] as const,
  search: (term: string, userId: string) =>
    [...friendKeys.all, 'search', term, userId] as const,
  pendingRequests: (userId: string) =>
    [...friendKeys.all, 'pending', userId] as const,
  sentRequests: (userId: string) =>
    [...friendKeys.all, 'sent', userId] as const,
  list: (userId: string) => [...friendKeys.all, 'list', userId] as const
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
