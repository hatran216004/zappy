// hooks/useCall.ts
import { useEffect, useState } from 'react';
import { subscribeCallParticipants, CallInfo, CallParticipant } from '@/services/callService';

interface ActiveCall {
  callInfo: CallInfo;
  participant: CallParticipant;
}

export const useCall = (userId: string | undefined) => {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeCallParticipants(
      userId,
      (callInfo, participant) => {
        console.log('📞 Call received:', { callInfo, participant });
        setActiveCall({ callInfo, participant });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const endCall = () => {
    setActiveCall(null);
  };

  return {
    activeCall,
    endCall,
    isInCall: activeCall !== null
  };
};

