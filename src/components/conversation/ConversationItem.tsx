// import { Pin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { twMerge } from 'tailwind-merge';

import { ConversationWithDetails } from '@/services/chatService';

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  userId: string;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  userId,
  isSelected,
  onClick
}) => {
  const otherParticipant = conversation.participants.find(
    (p) => p.user_id !== userId
  );
  const displayName =
    conversation.type === 'direct'
      ? otherParticipant?.profile.display_name
      : conversation.title;
  const avatarUrl =
    conversation.type === 'direct'
      ? otherParticipant?.profile.avatar_url
      : conversation.photo_url;

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
    const senderName =
      msg.sender_id === userId ? 'Bạn' : otherParticipant?.profile.display_name;

    if (msg.recalled_at) return `${senderName}: Tin nhắn đã thu hồi`;

    switch (msg.type) {
      case 'text':
        return `${senderName}: ${msg.content_text}`;
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

  // Dùng UI theo comment: Avatar + 2 dòng (name/time + preview/unread/pin)
  // isSelected tương đương isActive trong mẫu comment
  const isActive = isSelected;

  // Unread badge theo mẫu comment (đếm 99+)
  const unread = conversation.unread_count ?? 0;
  const unreadBadge =
    unread > 0 ? (unread > 99 ? '99+' : String(unread)) : null;

  return (
    <div
      onClick={onClick}
      className={twMerge(
        'flex items-center gap-3 p-4 cursor-pointer',
        isActive ? 'bg-blue-600/20' : 'hover:bg-gray-200 dark:hover:bg-gray-800'
      )}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatarUrl || ''} alt={displayName || ''} />
        <AvatarFallback className="bg-zinc-300">
          {(displayName || '?').charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className="font-medium truncate text-gray-900 dark:text-gray-100">
            {displayName}
          </p>
          {conversation.last_message && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(conversation.last_message.created_at)}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center">
          <p className="text-xs truncate text-gray-500 dark:text-gray-400">
            {getLastMessagePreview()}
          </p>
          <div className="flex items-center gap-1">
            {unreadBadge && (
              <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5">
                {unreadBadge}
              </span>
            )}
            {/* {conversation.pinned && (
              <Pin className="size-3 text-gray-400 dark:text-gray-500" />
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
