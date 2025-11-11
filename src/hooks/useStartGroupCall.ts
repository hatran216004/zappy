// hooks/useStartGroupCall.ts
import { useMutation } from '@tanstack/react-query';
import { createGroupCall } from '@/services/callService';
import toast from 'react-hot-toast';

export const useStartGroupCall = () => {
  return useMutation({
    mutationFn: ({ conversationId, isVideoEnabled }: { conversationId: string; isVideoEnabled: boolean }) =>
      createGroupCall(conversationId, isVideoEnabled),
    onSuccess: () => {
      console.log('📞 Group call initiated');
      toast.success('Đã bắt đầu cuộc gọi nhóm');
    },
    onError: (error: Error) => {
      console.error('Error starting group call:', error);
      toast.error('Không thể bắt đầu cuộc gọi nhóm. Vui lòng thử lại.');
    }
  });
};

