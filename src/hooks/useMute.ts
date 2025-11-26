// hooks/useMute.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { muteConversation, unmuteConversation, type MuteDuration } from '@/services/muteService';
import toast from 'react-hot-toast';

// Global notification restart function
let globalNotificationRestart: (() => void) | null = null;

export const setGlobalNotificationRestart = (restartFn: () => void) => {
  globalNotificationRestart = restartFn;
};

export const useMuteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      userId,
      duration
    }: {
      conversationId: string;
      userId: string;
      duration: MuteDuration;
    }) => muteConversation(conversationId, userId, duration),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
      
      // Force refetch notifications immediately
      queryClient.refetchQueries({ queryKey: ['notifications'] });
      queryClient.refetchQueries({ queryKey: ['unreadNotificationsCount'] });
      
      toast.success('Đã tắt thông báo');
    },
    onError: (error) => {
      console.error('Error muting conversation:', error);
      toast.error('Không thể tắt thông báo');
    }
  });
};

export const useUnmuteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      userId
    }: {
      conversationId: string;
      userId: string;
    }) => unmuteConversation(conversationId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
      
      // Force refetch notifications immediately
      queryClient.refetchQueries({ queryKey: ['notifications'] });
      queryClient.refetchQueries({ queryKey: ['unreadNotificationsCount'] });
      
      // Restart notification subscription to receive new notifications
      if (globalNotificationRestart) {
        setTimeout(() => {
          globalNotificationRestart?.();
        }, 100);
      }
      
      toast.success('Đã bật thông báo');
    },
    onError: (error) => {
      console.error('Error unmuting conversation:', error);
      toast.error('Không thể bật thông báo');
    }
  });
};

