// services/callService.ts
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase.type';
import { PostgresChangeEvent } from '@supabase/supabase-js';

export type CallParticipant = Database['public']['Tables']['call_participants']['Row'];
export type CallInfo = Database['public']['Functions']['get_call_info']['Returns'][number];

// Lấy thông tin cuộc gọi
// Dùng get_call_info_web (riêng cho React) thay vì get_call_info (Flutter dùng)
export const getCallInfo = async (callId: string): Promise<CallInfo | null> => {
  const { data, error } = await supabase.rpc('get_call_info_web', {
    _call_id: callId,
  });

  if (error) {
    console.error('Error getting call info:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data[0];
};

// Tạo cuộc gọi 1:1
// Zappy-main (Flutter) dùng function: create_direct_call
// Function này đã có trên database production (từ Zappy-main)
export const createDirectCall = async (
  userId: string,
  isVideoEnabled: boolean
): Promise<void> => {
  // Try create_direct_call first (from Zappy-main, with real tokens)
  const { error } = await supabase.rpc('create_direct_call', {
    _user_id: userId,
    _is_video_enabled: isVideoEnabled,
  });

  if (error) {
    console.error('Error creating direct call:', error);
    console.error('Function: create_direct_call not found. Make sure database is synced with Zappy-main.');
    throw error;
  }
  
  console.log('✅ Call created using create_direct_call (Zappy-main function)');
};

// Tạo cuộc gọi nhóm
export const createGroupCall = async (
  conversationId: string,
  isVideoEnabled: boolean
): Promise<void> => {
  const { error } = await supabase.rpc('create_group_call', {
    _conversation_id: conversationId,
    _is_video_enabled: isVideoEnabled,
  });

  if (error) {
    console.error('Error creating group call:', error);
    throw error;
  }
  
  console.log('✅ Group call created');
};

// Accept incoming call - update joined_at
export const acceptCall = async (callId: string): Promise<void> => {
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('call_participants')
    .update({ joined_at: new Date().toISOString() })
    .eq('call_id', callId)
    .eq('user_id', currentUser.user.id)
    .is('joined_at', null);

  if (error) {
    console.error('Error accepting call:', error);
    throw error;
  }

  console.log('✅ Call accepted, joined_at updated');
};

// Subscribe to call_participants changes cho user hiện tại
export const subscribeCallParticipants = (
  userId: string,
  handlers: {
    onIncoming: (callInfo: CallInfo, participant: CallParticipant) => void;
    onJoined: (callInfo: CallInfo, participant: CallParticipant) => void;
    onLeft: (participant: CallParticipant) => void;
  }
) => {
  const channel = supabase
    .channel(`call_participants:${userId}`)
    // INSERT: có thể là incoming (joined_at null) hoặc đã join (joined_at != null)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'call_participants',
        filter: `user_id=eq.${userId}`,
      },
      async (payload: PostgresChangeEvent<CallParticipant>) => {
        const participant = payload.new;
        const callInfo = await getCallInfo(participant.call_id);
        if (!callInfo) return;

        // Lấy lại participant mới nhất để có đủ joined_at/url/token
        const { data: updatedParticipant, error } = await supabase
          .from('call_participants')
          .select('*')
          .eq('call_id', participant.call_id)
          .eq('user_id', userId)
          .single();

        if (error || !updatedParticipant) return;

        if (updatedParticipant.joined_at) {
          handlers.onJoined(callInfo, updatedParticipant);
        } else {
          handlers.onIncoming(callInfo, updatedParticipant);
        }
      }
    )
    // UPDATE: nếu left_at != null thì rời cuộc gọi, nếu joined_at được set thì join
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'call_participants',
        filter: `user_id=eq.${userId}`,
      },
      async (payload: PostgresChangeEvent<CallParticipant>) => {
        const participant = payload.new;
        const oldParticipant = payload.old;
        
        // Check if joined_at was just set (from null to non-null)
        if (!oldParticipant.joined_at && participant.joined_at) {
          console.log('🎉 Participant accepted call, joining room...');
          const callInfo = await getCallInfo(participant.call_id);
          if (callInfo) {
            handlers.onJoined(callInfo, participant);
          }
          return;
        }
        
        // Check if left_at was set
        if (participant.left_at) {
          handlers.onLeft(participant);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

