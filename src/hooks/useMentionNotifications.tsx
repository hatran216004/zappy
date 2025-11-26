/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase.type';
import toast from 'react-hot-toast';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

export function useMentionNotifications(currentUserId?: string | null) {
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`notifications:mentions:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        async (payload) => {
          const row = payload.new as NotificationRow;
          // Only handle 'message_mention' type (from chatService), ignore 'mention' (from trigger)
          if (row.type !== 'message_mention') return;

          // Parse notification data
          const data = (
            typeof row.data === 'string' ? safeParseJson(row.data) : row.data
          ) as any;

          // Get conversation_id from message_id if not in data
          let conversationId = data?.conversation_id;
          if (!conversationId && data?.message_id) {
            const { data: message } = await supabase
              .from('messages')
              .select('conversation_id')
              .eq('id', data.message_id)
              .single();
            conversationId = message?.conversation_id;
          }

          // Check if user has disabled notifications for this conversation
          if (conversationId) {
            const { data: participant } = await supabase
              .from('conversation_participants')
              .select('notif_level, mute_until')
              .eq('conversation_id', conversationId)
              .eq('user_id', currentUserId)
              .single();

            // If notif_level is 'none', don't show toast
            if (participant?.notif_level === 'none') {
              return;
            }

            // If conversation is muted, don't show toast
            if (participant?.mute_until) {
              const muteDate = new Date(participant.mute_until);
              if (muteDate > new Date()) {
                return;
              }
            }
          }

          const displayName =
            data?.sender_name ?? data?.author_display_name ?? data?.author_username ?? 'Ai đó';

          const conversationName = data?.conversation_name ?? '';

          const message =
            conversationName && conversationName.length > 0
              ? `${displayName} đã nhắc đến bạn trong ${conversationName}`
              : `${displayName} đã nhắc đến bạn`;

          // Fix avatar URL - use proper URL construction
          let avatarUrl = data?.sender_avatar;
          if (avatarUrl && !avatarUrl.startsWith('http')) {
            // If it's a path, construct full URL
            avatarUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`;
          }
          if (!avatarUrl) {
            avatarUrl = 'https://ui-avatars.com/api/?background=random&name=' + encodeURIComponent(displayName);
          }

          // Show toast notification
          toast.custom(
            (t) => (
              <div
                role="status"
                aria-live="polite"
                className={
                  'pointer-events-auto w-[320px] rounded-xl border border-gray-200 bg-white p-4 shadow-lg ring-1 ring-black/5 transition-all ' +
                  (t.visible
                    ? 'animate-in fade-in slide-in-from-bottom-2'
                    : 'animate-out fade-out slide-out-to-bottom-2')
                }
              >
                {/* Close */}
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="float-right -mt-1 -mr-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Đóng thông báo"
                >
                  ×
                </button>

                {/* Title */}
                <div className="mb-2 text-sm font-medium text-gray-900">
                  New notification
                </div>

                {/* Body */}
                <div className="flex items-start gap-3">
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-9 w-9 flex-none rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900">
                      {displayName}
                    </div>
                    <div className="truncate text-sm text-gray-600">
                      {message}
                    </div>
                    <div className="mt-1 text-xs text-blue-600">
                      a few seconds ago
                    </div>
                  </div>
                </div>
              </div>
            ),
            {
              position: 'bottom-left',
              duration: 5000
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);
}

function safeParseJson(input: string): Record<string, unknown> | null {
  try {
    return JSON.parse(input) as Record<string, unknown>;
  } catch {
    return null;
  }
}
