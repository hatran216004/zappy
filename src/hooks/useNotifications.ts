// hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
  type NotificationWithDetails
} from '@/services/notificationService';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

// Hook để lấy danh sách notifications
export const useNotifications = (userId: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['notifications', userId, limit],
    queryFn: () => getNotifications(userId, limit),
    enabled: !!userId,
    staleTime: 30000 // 30 seconds
  });
};

// Hook để đếm số notifications chưa đọc
export const useUnreadNotificationsCount = (userId: string) => {
  return useQuery({
    queryKey: ['unreadNotificationsCount', userId],
    queryFn: () => getUnreadNotificationsCount(userId),
    enabled: !!userId,
    refetchInterval: 60000 // Refetch mỗi 60 giây
  });
};

// Hook để đánh dấu notification đã đọc
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: (_, notificationId) => {
      // Invalidate queries để refresh data
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
    },
    onError: (error) => {
      console.error('Error marking notification as read:', error);
      toast.error('Không thể đánh dấu đã đọc');
    }
  });
};

// Hook để đánh dấu tất cả notifications đã đọc
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => markAllNotificationsAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
      toast.success('Đã đánh dấu tất cả là đã đọc');
    },
    onError: (error) => {
      console.error('Error marking all notifications as read:', error);
      toast.error('Không thể đánh dấu tất cả đã đọc');
    }
  });
};

// Hook để subscribe realtime notifications
export const useNotificationsRealtime = (userId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToNotifications(userId, (notification) => {
      console.log('🔔 New notification received:', notification);

      // Invalidate all notification queries for this user (including different limits)
      queryClient.invalidateQueries({ 
        queryKey: ['notifications', userId],
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['unreadNotificationsCount', userId] 
      });
    });

    return () => {
      unsubscribe();
    };
  }, [userId, queryClient]);
};

