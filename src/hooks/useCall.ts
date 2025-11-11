// hooks/useCall.ts
import { useEffect, useState } from 'react';
import { subscribeCallParticipants, CallInfo, CallParticipant } from '@/services/callService';
import { useLivekitRoom } from './useLivekit';

interface ActiveCall {
  callInfo: CallInfo;
  participant: CallParticipant;
  status: 'incoming' | 'connected';
}

export const useCall = (userId: string | undefined) => {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const {
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    micEnabled,
    cameraEnabled,
  } = useLivekitRoom({ autoMic: true, autoCamera: false });

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeCallParticipants(userId, {
      onIncoming: (callInfo: CallInfo, participant: CallParticipant) => {
        console.log('📥 Incoming call:', { callInfo, participant });
        setActiveCall({ callInfo, participant, status: 'incoming' });
      },
      onJoined: (callInfo: CallInfo, participant: CallParticipant) => {
        console.log('✅ Joined call:', { callInfo, participant });
        setActiveCall({ callInfo, participant, status: 'connected' });
        // Connect to LiveKit when we (this user) are joined
        // Backend must supply valid url/token in call_participants
        if (participant.url && participant.token) {
          connect(participant.url as unknown as string, participant.token as unknown as string, {
            mic: true,
            camera: !!callInfo.is_video_enabled,
          }).catch((e) => {
            console.error('LiveKit connect error:', e);
          });
        } else {
          console.warn('Missing LiveKit credentials (url/token).');
        }
      },
      onLeft: (_participant: CallParticipant) => {
        console.log('👋 Left call');
        setActiveCall(null);
        disconnect();
      },
    });

    return () => {
      unsubscribe();
      disconnect();
    };
  }, [userId]);

  const endCall = () => {
    setActiveCall(null);
    disconnect();
  };

  const acceptCall = () => {
    setActiveCall((prev) => {
      if (!prev) return prev;
      // Connect immediately using incoming participant url/token
      const { participant, callInfo } = prev;
      if (participant?.url && participant?.token) {
        connect(participant.url as unknown as string, participant.token as unknown as string, {
          mic: true,
          camera: !!callInfo.is_video_enabled,
        }).catch((e) => console.error('LiveKit connect error (accept):', e));
      } else {
        console.warn('Missing LiveKit credentials (url/token) on accept.');
      }
      return { ...prev, status: 'connected' } as ActiveCall;
    });
  };

  return {
    activeCall,
    endCall,
    acceptCall,
    toggleMic,
    toggleCamera,
    micEnabled,
    cameraEnabled,
    isInCall: activeCall !== null
  };
};

