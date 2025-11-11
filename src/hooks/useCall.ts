// hooks/useCall.ts
import { useEffect, useState, useRef } from 'react';
import { subscribeCallParticipants, CallInfo, CallParticipant, acceptCall as acceptCallService } from '@/services/callService';
import { useLivekitRoom } from './useLivekit';

interface ActiveCall {
  callInfo: CallInfo;
  participant: CallParticipant;
  status: 'incoming' | 'connected';
}

const CALL_TIMEOUT_MS = 30000; // 30 seconds timeout if no participants join

export const useCall = (userId: string | undefined) => {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasJoinedRef = useRef(false);
  
  const {
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    micEnabled,
    cameraEnabled,
    remoteParticipants,
    localParticipant,
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
        console.log('🔑 LiveKit credentials:', {
          hasUrl: !!participant.url,
          hasToken: !!participant.token,
          url: participant.url,
          tokenPreview: participant.token?.substring(0, 20) + '...'
        });
        
        setActiveCall({ callInfo, participant, status: 'connected' });
        
        // Connect to LiveKit when we (this user) are joined
        // Backend must supply valid url/token in call_participants
        const hasValidUrl = participant.url && participant.url.trim() !== '';
        const hasValidToken = participant.token && participant.token.trim() !== '';
        
        if (hasValidUrl && hasValidToken) {
          console.log('🎬 Connecting to LiveKit room...');
          connect(participant.url as unknown as string, participant.token as unknown as string, {
            mic: true,
            camera: !!callInfo.is_video_enabled,
          }).then(() => {
            console.log('✅ LiveKit connection established!');
          }).catch((e) => {
            console.error('❌ LiveKit connect error:', e);
            console.error('Error details:', {
              message: e.message,
              stack: e.stack,
              url: participant.url,
            });
          });
        } else {
          console.warn('⚠️ Missing or invalid LiveKit credentials!');
          console.warn('URL valid:', hasValidUrl, '→', participant.url);
          console.warn('Token valid:', hasValidToken, '→', participant.token?.substring(0, 30));
          console.warn('');
          console.warn('📌 This is EXPECTED if using the OLD function (initiate_direct_call).');
          console.warn('📌 Video/audio will NOT work with placeholder tokens.');
          console.warn('📌 To enable real video calls:');
          console.warn('   1. Setup LiveKit server');
          console.warn('   2. Run migration: fix_livekit_tokens.sql');
          console.warn('   3. Set USE_NEW_CALL_FUNCTION = true in callService.ts');
          console.warn('');
          console.warn('💡 For now, you can test the UI flow without real video/audio.');
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [userId]);

  // Auto-disconnect on timeout if no participants join
  useEffect(() => {
    if (!activeCall || activeCall.status !== 'connected') {
      return;
    }

    // If we have remote participants, mark as joined and clear timeout
    if (remoteParticipants.length > 0) {
      hasJoinedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // If nobody has joined yet, start timeout
    if (!hasJoinedRef.current && !timeoutRef.current) {
      console.log('⏰ Starting call timeout timer');
      timeoutRef.current = setTimeout(() => {
        console.log('⏰ Call timeout - no participants joined');
        endCall();
      }, CALL_TIMEOUT_MS);
    }

    // If everyone left after joining, start a shorter timeout
    if (hasJoinedRef.current && remoteParticipants.length === 0 && !timeoutRef.current) {
      console.log('⏰ All participants left, starting disconnect timer');
      timeoutRef.current = setTimeout(() => {
        console.log('⏰ Call ended - all participants left');
        endCall();
      }, 10000); // 10 seconds if everyone leaves
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [activeCall, remoteParticipants]);

  const endCall = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    hasJoinedRef.current = false;
    setActiveCall(null);
    disconnect();
  };

  const acceptCall = async () => {
    if (!activeCall) return;
    
    try {
      // Update joined_at in database first
      await acceptCallService(activeCall.participant.call_id);
      console.log('📞 Call accepted in database, waiting for UPDATE event...');
      
      // The UPDATE event will trigger onJoined handler, which will connect to LiveKit
      // So we just need to update the UI status here
      setActiveCall((prev) => {
        if (!prev) return prev;
        return { ...prev, status: 'connected' } as ActiveCall;
      });
    } catch (error) {
      console.error('❌ Error accepting call:', error);
    }
  };

  return {
    activeCall,
    endCall,
    acceptCall,
    toggleMic,
    toggleCamera,
    micEnabled,
    cameraEnabled,
    remoteParticipants,
    localParticipant,
    isInCall: activeCall !== null
  };
};

