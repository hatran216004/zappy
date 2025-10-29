import FriendHeading from '@/components/friends/FriendHeading';
import { useGroupConversations } from '@/hooks/useChat';
import useUser from '@/hooks/useUser';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router';
import { supabaseUrl } from '@/lib/supabase';
import type { ConversationWithDetails } from '@/services/chatService';

export default function FriendGroupsPage() {
  const { user } = useUser();
  const userId = user?.id as string;
  const { data: groups, isLoading, error } = useGroupConversations(userId);
  const navigate = useNavigate();

  const handleGroupClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  if (isLoading) {
    return (
      <>
        <FriendHeading>
          <Users className="size-5" />
          <span>Nhóm của bạn</span>
        </FriendHeading>
        <div className="text-center py-8 text-muted-foreground">
          Đang tải danh sách nhóm...
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <FriendHeading>
          <Users className="size-5" />
          <span>Nhóm của bạn</span>
        </FriendHeading>
        <div className="text-center py-8 text-destructive">
          Có lỗi xảy ra khi tải danh sách nhóm
        </div>
      </>
    );
  }

  return (
    <>
      <FriendHeading>
        <Users className="size-5" />
        <span>Nhóm của bạn</span>
      </FriendHeading>

      <div className="my-2 select-none font-medium text-gray-700 dark:text-gray-200">
        Tất cả nhóm ({groups?.length || 0})
      </div>

      {!groups || groups.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Users className="w-20 h-20 mx-auto" />
          </div>
          <p className="text-foreground/80 text-lg">Bạn chưa tham gia nhóm nào</p>
          <p className="text-muted-foreground text-sm mt-2">
            Hãy tạo nhóm mới hoặc tham gia nhóm từ lời mời
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group: ConversationWithDetails) => {
            const memberCount = group.participants?.length || 0;
            const lastMessageText = group.last_message
              ? group.last_message.type === 'text'
                ? group.last_message.content_text
                : `[${group.last_message.type}]`
              : 'Chưa có tin nhắn';

            return (
              <div
                key={group.id}
                onClick={() => handleGroupClick(group.id)}
                className="p-4 bg-card rounded-xl border border-border hover:bg-accent/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-4">
                  {/* Group Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={`${supabaseUrl}/storage/v1/object/public/chat-attachments/${group.photo_url}`}
                      alt={group.title || 'Group'}
                      className="w-14 h-14 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/default-image.png';
                      }}
                    />
                    {!!group.unread_count && group.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {group.unread_count > 9 ? '9+' : group.unread_count}
                        Tin nhắn mới
                      </span>
                    )}
                  </div>

                  {/* Group Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {group.title || 'Nhóm không tên'}
                      </h3>
                      {group.last_message && (
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          {new Date(group.last_message.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="size-4" />
                      <span>{memberCount} thành viên</span>
                    </div>

                    {group.last_message && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        Tin nhắn mới: {lastMessageText}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
