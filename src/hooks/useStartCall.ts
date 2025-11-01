// hooks/useStartCall.ts
import { useMutation } from '@tanstack/react-query';
import { createDirectCall } from '@/services/callService';
import toast from 'react-hot-toast';

export const useStartCall = () => {
  return useMutation({
    mutationFn: ({ userId, isVideoEnabled }: { userId: string; isVideoEnabled: boolean }) =>
      createDirectCall(userId, isVideoEnabled),
    onSuccess: () => {
      // Cuộc gọi sẽ tự động hiển thị khi call_participants được insert với joined_at != null
      console.log('📞 Call initiated');
    },
    onError: (error: Error) => {
      console.error('Error starting call:', error);
      toast.error('Không thể bắt đầu cuộc gọi. Vui lòng thử lại.');
    }
  });
};

