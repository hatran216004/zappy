// components/ConversationItem.tsx
// 🎨 Discord-like styling (UI only, no logic changes)

import { BellOff, MoreVertical } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

import { ConversationWithDetails } from '@/services/chatService';
import { Link, useParams } from 'react-router';
import { UserAvatar } from '../UserAvatar';
import { getGroupPhotoUrl } from '@/lib/supabase';
import { useUserStatus, useUserStatusRealtime } from '@/hooks/usePresence';
import { ConversationOptionsMenu } from './ConversationOptionsMenu';
import { isConversationMuted } from '@/services/muteService';

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  userId: string;
  isSelected: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  userId,
  isSelected
}) => {
  const params = useParams();
  const conversationId = params.conversationId as string;

  const otherParticipant = conversation.participants.find(
    (p) => p.user_id !== userId
  );
  const isGroupChat = conversation.type === 'group';
  const displayName = isGroupChat
    ? conversation.title
    : otherParticipant?.profile.display_name;

  // Realtime status cho đối phương (chỉ relevant với direct chat)
  const otherId = !isGroupChat ? otherParticipant?.user_id || '' : '';
  const { data: otherStatus } = useUserStatus(otherId);
  useUserStatusRealtime(otherId);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 48) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  const getLastMessagePreview = () => {
    if (!conversation.last_message) return 'Chưa có tin nhắn';

    const msg = conversation.last_message;
    const senderProfile = conversation.participants.find(
      (p) => p.user_id === msg.sender_id
    )?.profile;
    const senderName =
      msg.sender_id === userId
        ? 'Bạn'
        : senderProfile?.display_name || otherParticipant?.profile.display_name;

    if (msg.recalled_at) return `${senderName}: Tin nhắn đã thu hồi`;

    switch (msg.type) {
      case 'text': {
        const content = msg.content_text || '';
        return `${senderName}: ${content}`;
      }
      case 'image':
        return `${senderName}: Đã gửi ảnh`;
      case 'video':
        return `${senderName}: Đã gửi video`;
      case 'file':
        return `${senderName}: Đã gửi file`;
      case 'audio':
        return `${senderName}: Đã gửi tin nhắn thoại`;
      default:
        return 'Tin nhắn mới';
    }
  };

  const isActive = isSelected || conversationId === conversation.id;

  // Get current user's participant data
  const currentUserParticipant = conversation.participants.find(
    (p) => p.user_id === userId
  );
  const isMuted = isConversationMuted(
    currentUserParticipant?.mute_until || null
  );

  // Don't show unread badge if conversation is muted
  const unread = isMuted ? 0 : conversation.unread_count ?? 0;
  const unreadBadge =
    unread > 0 ? (unread > 99 ? '99+' : String(unread)) : null;

  return (
    <div
      className={twMerge(
        'flex items-center gap-3 p-4 transition-colors relative group rounded-2xl',
        isActive
          ? 'bg-gray-200 dark:bg-[#404249]'
          : 'hover:bg-gray-100 dark:hover:bg-white/5'
      )}
    >
      <Link
        to={`/chat/${conversation.id}`}
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
      >
        {isGroupChat ? (
          <div className="relative inline-block">
            <img
              src={
                getGroupPhotoUrl(conversation.photo_url) || '/default-image.png'
              }
              alt={conversation.title || 'Group'}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/default-image.png';
              }}
            />
          </div>
        ) : (
          <UserAvatar
            avatarUrl={otherParticipant?.profile?.avatar_url}
            displayName={otherParticipant?.profile?.display_name}
            status={otherStatus?.status || otherParticipant?.profile?.status}
            showStatus={true}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center gap-2">
            <p
              className={twMerge(
                'truncate text-gray-900 dark:text-[#F2F3F5]',
                unread > 0 && !isMuted ? 'font-semibold' : 'font-medium'
              )}
            >
              {displayName}
            </p>
            {conversation.last_message && (
              <span className="text-xs text-gray-500 dark:text-[#B5BAC1] text-right">
                {formatTime(conversation.last_message.created_at)}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <p className="text-xs truncate text-gray-600 dark:text-[#B5BAC1]">
              {getLastMessagePreview()}
            </p>
            <div className="flex items-center gap-1">
              {isMuted && (
                <BellOff className="size-3 text-gray-400 dark:text-[#B5BAC1]" />
              )}
              {unreadBadge && (
                <span className="bg-[#ED4245] text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">
                  {unreadBadge}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Conversation Options Menu */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <ConversationOptionsMenu
          conversationId={conversation.id}
          userId={userId}
          muteUntil={currentUserParticipant?.mute_until || null}
          conversationType={conversation.type}
          otherUserId={!isGroupChat ? otherParticipant?.user_id : undefined}
          otherUserName={
            !isGroupChat ? otherParticipant?.profile.display_name : undefined
          }
          conversation={conversation}
        >
          <button
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </ConversationOptionsMenu>
      </div>
    </div>
  );
};

export default ConversationItem;
