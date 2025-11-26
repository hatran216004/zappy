// services/muteService.ts
import { supabase } from '@/lib/supabase';

export type MuteDuration = '15m' | '1h' | '8h' | '24h' | 'forever' | 'unmute';

// Tính thời gian mute
const getMuteUntilDate = (duration: MuteDuration): string | null => {
  if (duration === 'unmute') return null;
  if (duration === 'forever') {
    // Set to a very far future date (100 years)
    return new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
  }

  const now = Date.now();
  let milliseconds = 0;

  switch (duration) {
    case '15m':
      milliseconds = 15 * 60 * 1000;
      break;
    case '1h':
      milliseconds = 60 * 60 * 1000;
      break;
    case '8h':
      milliseconds = 8 * 60 * 60 * 1000;
      break;
    case '24h':
      milliseconds = 24 * 60 * 60 * 1000;
      break;
  }

  return new Date(now + milliseconds).toISOString();
};

// Mute conversation
export const muteConversation = async (
  conversationId: string,
  userId: string,
  duration: MuteDuration
): Promise<void> => {
  const muteUntil = getMuteUntilDate(duration);

  const { error } = await supabase
    .from('conversation_participants')
    .update({ 
      mute_until: muteUntil,
      notif_level: 'none' // Set notif_level to 'none' when muting
    })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error muting conversation:', error);
    throw error;
  }
};

// Unmute conversation
export const unmuteConversation = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ 
      mute_until: null,
      notif_level: 'all' // Set notif_level back to 'all' when unmuting
    })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error unmuting conversation:', error);
    throw error;
  }
};

// Check if conversation is muted
export const isConversationMuted = (muteUntil: string | null): boolean => {
  if (!muteUntil) return false;
  return new Date(muteUntil) > new Date();
};

// Get mute status text
export const getMuteStatusText = (muteUntil: string | null): string | null => {
  if (!muteUntil) return null;
  
  const muteDate = new Date(muteUntil);
  const now = new Date();
  
  if (muteDate <= now) return null;
  
  const diffMs = muteDate.getTime() - now.getTime();
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365);
  
  // If more than 10 years, consider it "forever"
  if (diffYears > 10) return 'Đã tắt thông báo';
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 60) {
    return `Tắt thông báo ${diffMinutes} phút`;
  } else if (diffHours < 24) {
    return `Tắt thông báo ${diffHours} giờ`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `Tắt thông báo ${diffDays} ngày`;
  }
};

