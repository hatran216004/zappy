import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase.type';
import toast from 'react-hot-toast';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

function safeParseJson(jsonString: string) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return {};
  }
}

export function usePostMentionNotifications(currentUserId?: string | null) {
  useEffect(() => {
    if (!currentUserId) return;
    
    console.log('🔔 Setting up post mention notifications for user:', currentUserId);

    const channel = supabase
      .channel(`notifications:post_mentions:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        async (payload) => {
          console.log('🔔 Post mention notification received:', payload);
          const row = payload.new as NotificationRow;
          console.log('📋 Notification type:', row.type);
          
          // Only handle 'post_mention' type
          if (row.type !== 'post_mention') {
            console.log('⏭️ Skipping non-post-mention notification');
            return;
          }
          
          console.log('✅ Processing post mention notification');

          // Parse notification data
          const data = (
            typeof row.data === 'string' ? safeParseJson(row.data) : row.data
          ) as any;

          const authorName = data?.author_name ?? 'Ai đó';
          const postContent = data?.post_content ?? '';
          const message = `${authorName} đã nhắc đến bạn trong bài viết`;
          
          // Fix avatar URL
          let avatarUrl = data?.author_avatar;
          if (avatarUrl && !avatarUrl.startsWith('http')) {
            avatarUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`;
          }
          if (!avatarUrl) {
            avatarUrl = 'https://ui-avatars.com/api/?background=random&name=' + encodeURIComponent(authorName);
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
                  Bài viết mới
                </div>

                {/* Body */}
                <div className="flex items-start gap-3">
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-9 w-9 flex-none rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {authorName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {message}
                    </div>
                    {postContent && (
                      <div className="mt-1 text-xs text-gray-500 truncate">
                        "{postContent}"
                      </div>
                    )}
                    <div className="text-xs text-blue-600 mt-1">
                      a few seconds ago
                    </div>
                  </div>
                </div>
              </div>
            ),
            {
              duration: 5000,
              position: 'top-right'
            }
          );
        }
      )
      .subscribe((status) => {
        console.log('🔔 Post mention subscription status:', status);
      });

    return () => {
      console.log('🔕 Unsubscribing from post mention notifications');
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);
}
