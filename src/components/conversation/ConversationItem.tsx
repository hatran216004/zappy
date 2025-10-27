// components/ConversationItem.tsx
// 🎨 Discord-like styling (UI only, no logic changes)

// import { Pin } from 'lucide-react';
import { twMerge } from "tailwind-merge";

import { ConversationWithDetails } from "@/services/chatService";
import { Link, useParams } from "react-router";
import { UserAvatar } from "../UserAvatar";

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  userId: string;
  isSelected: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  userId,
  isSelected,
}) => {
  const params = useParams();
  const conversationId = params.conversationId as string;

  const otherParticipant = conversation.participants.find(
    (p) => p.user_id !== userId
  );
  const displayName =
    conversation.type === "direct"
      ? otherParticipant?.profile.display_name
      : conversation.title;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Hôm qua";
    } else {
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  const getLastMessagePreview = () => {
    if (!conversation.last_message) return "Chưa có tin nhắn";

    const msg = conversation.last_message;
    const senderName =
      msg.sender_id === userId ? "Bạn" : otherParticipant?.profile.display_name;

    if (msg.recalled_at) return `${senderName}: Tin nhắn đã thu hồi`;

    switch (msg.type) {
      case "text":
        return `${senderName}: ${msg.content_text}`;
      case "image":
        return `${senderName}: Đã gửi ảnh`;
      case "video":
        return `${senderName}: Đã gửi video`;
      case "file":
        return `${senderName}: Đã gửi file`;
      case "audio":
        return `${senderName}: Đã gửi tin nhắn thoại`;
      default:
        return "Tin nhắn mới";
    }
  };

  const isActive = isSelected || conversationId === conversation.id;

  const unread = conversation.unread_count ?? 0;
  const unreadBadge =
    unread > 0 ? (unread > 99 ? "99+" : String(unread)) : null;

  return (
    <Link
      to={`/chat/${conversation.id}`}
      className={twMerge(
        "flex items-center gap-3 p-4 cursor-pointer transition-colors",
        // Hover & active nền theo Discord (light/dark)
        isActive
          ? "bg-gray-200 dark:bg-[#404249]"
          : "hover:bg-gray-100 dark:hover:bg-white/5"
      )}
    >
      <UserAvatar
        avatarUrl={otherParticipant?.profile?.avatar_url}
        displayName={otherParticipant?.profile?.display_name}
        status={otherParticipant?.profile?.status}
        showStatus={true}
      />

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p
            className={twMerge(
              "truncate text-gray-900 dark:text-[#F2F3F5]",
              unread > 0 ? "font-semibold" : "font-medium"
            )}
          >
            {displayName}
          </p>
          {conversation.last_message && (
            <span className="text-xs text-gray-500 dark:text-[#B5BAC1]">
              {formatTime(conversation.last_message.created_at)}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center">
          <p className="text-xs truncate text-gray-600 dark:text-[#B5BAC1]">
            {getLastMessagePreview()}
          </p>
          <div className="flex items-center gap-1">
            {unreadBadge && (
              <span className="bg-[#ED4245] text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">
                {unreadBadge}
              </span>
            )}
            {/* {conversation.pinned && (
              <Pin className="size-3 text-[#B5BAC1]" />
            )} */}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ConversationItem;
