// services/callService.ts
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase.type';
import { PostgresChangeEvent } from '@supabase/supabase-js';

export type CallParticipant = Database['public']['Tables']['call_participants']['Row'];
export type CallInfo = Database['public']['Functions']['get_call_info']['Returns'][number];

// Lấy thông tin cuộc gọi
export const getCallInfo = async (callId: string): Promise<CallInfo | null> => {
  const { data, error } = await supabase.rpc('get_call_info', {
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
export const createDirectCall = async (
  userId: string,
  isVideoEnabled: boolean
): Promise<void> => {
  const { error } = await supabase.rpc('initiate_direct_call', {
    _user_id: userId,
    _is_video_enabled: isVideoEnabled,
  });

  if (error) {
    console.error('Error creating direct call:', error);
    throw error;
  }
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
    // UPDATE: nếu left_at != null thì rời cuộc gọi
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

