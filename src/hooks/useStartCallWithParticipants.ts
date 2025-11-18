// hooks/useStartCallWithParticipants.ts
import { useMutation } from '@tanstack/react-query';
import { createCall } from '@/services/callService';
import toast from 'react-hot-toast';

export const useStartCallWithParticipants = () => {
  return useMutation({
    mutationFn: ({ 
      conversationId, 
      isVideoEnabled, 
      participants 
    }: { 
      conversationId: string; 
      isVideoEnabled: boolean;
      participants: string[];
    }) =>
      createCall(conversationId, isVideoEnabled, participants),
    onSuccess: (_, variables) => {
      console.log('📞 Call initiated with participants:', variables.participants);
      toast.success('Đã bắt đầu cuộc gọi');
    },
    onError: (error: Error) => {
      console.error('Error starting call:', error);
      toast.error('Không thể bắt đầu cuộc gọi. Vui lòng thử lại.');
    }
  });
};

