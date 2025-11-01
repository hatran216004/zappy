// services/callService.ts
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase.type';
import { PostgresChangeEvent } from '@supabase/supabase-js';

export type CallParticipant = Database['public']['Tables']['call_participants']['Row'];
export type CallInfo = Database['public']['Functions']['get_call_info']['Returns'][number];

// Lấy thông tin cuộc gọi
export const getCallInfo = async (callId: string): Promise<CallInfo | null> => {
  const { data, error } = await supabase.rpc('get_call_info', {
    _call_id: callId
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
    _is_video_enabled: isVideoEnabled
  });

  if (error) {
    console.error('Error creating direct call:', error);
    throw error;
  }
};

// Subscribe to call_participants changes for current user
export const subscribeCallParticipants = (
  userId: string,
  onCallReceived: (callInfo: CallInfo, participant: CallParticipant) => void
) => {
  const channel = supabase
    .channel(`call_participants:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'call_participants',
        filter: `user_id=eq.${userId}`
      },
      async (payload: PostgresChangeEvent<CallParticipant>) => {
        const participant = payload.new;
        
        // Lấy thông tin cuộc gọi
        const callInfo = await getCallInfo(participant.call_id);
        
        if (!callInfo) {
          console.error('Could not get call info for call:', participant.call_id);
          return;
        }

        // Query lại call_participants để lấy thông tin mới nhất (bao gồm joined_at)
        const { data: updatedParticipant, error } = await supabase
          .from('call_participants')
          .select('*')
          .eq('call_id', participant.call_id)
          .eq('user_id', userId)
          .single();

        if (error || !updatedParticipant) {
          console.error('Error fetching participant:', error);
          return;
        }

        // Nếu joined_at != null thì đó là mình (đã join) - vào luôn
        if (updatedParticipant.joined_at !== null) {
          console.log('📞 User joined call, opening video call UI');
          onCallReceived(callInfo, updatedParticipant);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

