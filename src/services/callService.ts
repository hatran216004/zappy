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

// Tạo cuộc gọi với danh sách participants tùy chỉnh (giống Zappy-main)
// Dùng cho cả direct và group calls
export const createCall = async (
  conversationId: string,
  isVideoEnabled: boolean,
  participants: string[]
): Promise<void> => {
  const { error } = await supabase.rpc('create_call', {
    _conversation_id: conversationId,
    _is_video_enabled: isVideoEnabled,
    _participants: participants,
  });

  if (error) {
    console.error('Error creating call:', error);
    throw error;
  }
  
  console.log('✅ Call created with participants:', participants);
};

// Tạo cuộc gọi nhóm (backward compatibility - gọi tất cả members)
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

// Create a call message in chat after call ends
export const createCallMessage = async (
  callId: string,
  conversationId: string
): Promise<void> => {
  try {
    console.log('📞 Creating call message for call:', callId, 'conversation:', conversationId);
    
    // Get call details from database
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('id, started_at, ended_at, type, started_by')
      .eq('id', callId)
      .single();

    if (callError) {
      console.error('❌ Error getting call details:', callError);
      return;
    }

    if (!call) {
      console.error('❌ Call not found:', callId);
      return;
    }

    if (!call.ended_at) {
      console.log('⚠️ Call not ended yet, will be handled by subscription');
      // Don't retry here - subscription will handle it when ended_at is set
      return;
    }

    // Calculate duration
    const startedAt = new Date(call.started_at);
    const endedAt = new Date(call.ended_at);
    const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
    
    if (durationSeconds < 0) {
      console.error('❌ Invalid duration:', durationSeconds);
      return;
    }

    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const durationText = minutes > 0 
      ? `${minutes} phút ${seconds} giây`
      : `${seconds} giây`;

    // Get call participants who actually joined
    const { data: participants } = await supabase
      .from('call_participants')
      .select('user_id, joined_at')
      .eq('call_id', callId)
      .not('joined_at', 'is', null);

    const participantCount = participants?.length || 0;
    const callType = call.type === 'video' ? 'video' : 'audio';
    const callTypeText = callType === 'video' ? 'Cuộc gọi video' : 'Cuộc gọi thoại';

    // Create message content
    const messageContent = `${callTypeText} • ${durationText}${participantCount > 0 ? ` • ${participantCount} người tham gia` : ''}`;

    console.log('📝 Creating message with content:', messageContent);

    // Check if message already exists (avoid duplicates)
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('type', 'system')
      .eq('content_text', messageContent)
      .gte('created_at', new Date(Date.now() - 5000).toISOString()) // Within last 5 seconds
      .limit(1);

    if (existingMessages && existingMessages.length > 0) {
      console.log('⚠️ Call message already exists, skipping');
      return;
    }

    // Create system message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: call.started_by,
        type: 'system',
        content_text: messageContent,
      })
      .select()
      .single();

    if (messageError) {
      console.error('❌ Error creating call message:', messageError);
      return;
    }

    console.log('✅ Call message created successfully:', message.id);

    // Update conversation's updated_at and last_message_id
    await supabase
      .from('conversations')
      .update({
        last_message_id: message.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    console.log('✅ Conversation updated with call message');
  } catch (error) {
    console.error('❌ Error creating call message:', error);
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
        
        // Check if call has ended by querying calls table directly
        const { data: callData } = await supabase
          .from('calls')
          .select('ended_at')
          .eq('id', participant.call_id)
          .single();
        
        if (callData?.ended_at) {
          console.log('🚫 Ignoring INSERT event - call already ended:', participant.call_id);
          return;
        }
        
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

        // Ignore if participant has left
        if (updatedParticipant.left_at) {
          console.log('🚫 Ignoring INSERT event - participant already left:', participant.call_id);
          return;
        }

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
        
        // Check if left_at was just set (from null to non-null)
        if (!oldParticipant.left_at && participant.left_at) {
          console.log('👋 Participant left call');
          handlers.onLeft(participant);
          return;
        }
        
        // Check if joined_at was just set (from null to non-null)
        if (!oldParticipant.joined_at && participant.joined_at) {
          // Ignore if participant has left
          if (participant.left_at) {
            console.log('🚫 Ignoring UPDATE event - participant already left:', participant.call_id);
            return;
          }
          
          // Check if call has ended by querying calls table directly
          const { data: callData } = await supabase
            .from('calls')
            .select('ended_at')
            .eq('id', participant.call_id)
            .single();
          
          if (callData?.ended_at) {
            console.log('🚫 Ignoring UPDATE event - call already ended:', participant.call_id);
            return;
          }
          
          console.log('🎉 Participant accepted call, joining room...');
          const callInfo = await getCallInfo(participant.call_id);
          if (callInfo) {
            handlers.onJoined(callInfo, participant);
          }
          return;
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Subscribe to calls table to detect when call ends
export const subscribeCallEnd = (
  conversationId: string,
  onCallEnd: (callId: string) => void
) => {
  const channel = supabase
    .channel(`calls:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'calls',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload: any) => {
        const call = payload.new;
        const oldCall = payload.old;
        
        // Check if ended_at was just set (from null to non-null)
        if (!oldCall.ended_at && call.ended_at) {
          console.log('📞 Call ended detected via subscription:', call.id);
          onCallEnd(call.id);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Lấy lịch sử cuộc gọi của user
export type CallHistoryItem = {
  id: string;
  conversation_id: string;
  started_by: string;
  started_at: string;
  ended_at: string | null;
  type: 'audio' | 'video';
  participants: string[];
  duration: number | null; // seconds
  conversation_type: 'direct' | 'group';
  conversation_title: string | null;
  conversation_photo_url: string | null;
  other_user_id?: string;
  other_user_name?: string;
  other_user_avatar?: string;
  started_by_name?: string;
  started_by_avatar?: string;
};

export const getCallHistory = async (
  userId: string,
  limit: number = 50
): Promise<CallHistoryItem[]> => {
  // Get all calls where user is a participant
  const { data: callParticipants, error: participantsError } = await supabase
    .from('call_participants')
    .select('call_id')
    .eq('user_id', userId);

  if (participantsError) {
    console.error('Error fetching call participants:', participantsError);
    throw participantsError;
  }

  if (!callParticipants || callParticipants.length === 0) {
    return [];
  }

  const callIds = [...new Set(callParticipants.map((cp) => cp.call_id))];

  // Get calls with conversation info
  const { data: calls, error: callsError } = await supabase
    .from('calls')
    .select(
      `
      id,
      conversation_id,
      started_by,
      started_at,
      ended_at,
      type,
      participants,
      conversation:conversations(
        type,
        title,
        photo_url
      ),
      starter:profiles!calls_started_by_fkey(
        display_name,
        avatar_url
      )
    `
    )
    .in('id', callIds)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (callsError) {
    console.error('Error fetching calls:', callsError);
    throw callsError;
  }

  if (!calls || calls.length === 0) {
    return [];
  }

  // Get direct pairs for direct conversations
  const directConversationIds = calls
    .filter((c) => (c.conversation as any)?.type === 'direct')
    .map((c) => c.conversation_id);

  let directPairsMap = new Map<string, { user_a: string; user_b: string }>();
  if (directConversationIds.length > 0) {
    const { data: directPairs } = await supabase
      .from('direct_pairs')
      .select('conversation_id, user_a, user_b')
      .in('conversation_id', directConversationIds);

    directPairsMap = new Map(
      directPairs?.map((dp) => [dp.conversation_id, dp]) || []
    );
  }

  // Get other user profiles for direct calls
  const otherUserIds = new Set<string>();
  directPairsMap.forEach((pair) => {
    if (pair.user_a === userId) {
      otherUserIds.add(pair.user_b);
    } else if (pair.user_b === userId) {
      otherUserIds.add(pair.user_a);
    }
  });

  let otherUsersMap = new Map<string, { display_name: string; avatar_url: string | null }>();
  if (otherUserIds.size > 0) {
    const { data: otherUsers } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', Array.from(otherUserIds));

    otherUsersMap = new Map(
      otherUsers?.map((u) => [u.id, u]) || []
    );
  }

  // Transform to CallHistoryItem
  return calls.map((call) => {
    const conversation = call.conversation as any;
    const starter = call.starter as any;
    const directPair = directPairsMap.get(call.conversation_id);
    
    let otherUserId: string | undefined;
    let otherUser: { display_name: string; avatar_url: string | null } | undefined;
    
    if (conversation?.type === 'direct' && directPair) {
      otherUserId = directPair.user_a === userId ? directPair.user_b : directPair.user_a;
      otherUser = otherUsersMap.get(otherUserId);
    }

    const startedAt = new Date(call.started_at);
    const endedAt = call.ended_at ? new Date(call.ended_at) : null;
    const duration = endedAt
      ? Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
      : null;

    return {
      id: call.id,
      conversation_id: call.conversation_id,
      started_by: call.started_by,
      started_at: call.started_at,
      ended_at: call.ended_at,
      type: call.type as 'audio' | 'video',
      participants: call.participants || [],
      duration,
      conversation_type: conversation?.type || 'direct',
      conversation_title: conversation?.title || null,
      conversation_photo_url: conversation?.photo_url || null,
      other_user_id: otherUserId,
      other_user_name: otherUser?.display_name,
      other_user_avatar: otherUser?.avatar_url || null,
      started_by_name: starter?.display_name,
      started_by_avatar: starter?.avatar_url || null
    };
  });
};

