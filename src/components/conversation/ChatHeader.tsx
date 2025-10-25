import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Phone, Video, Users, Info } from "lucide-react";
import { TooltipBtn } from "../TooltipBtn";

interface ChatHeaderProps {
  otherParticipant:
    | {
        profile: {
          display_name: string;
          avatar_url?: string;
          status?: string;
        };
      }
    | undefined;
  typingUsers: string[];
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherParticipant,
  typingUsers,
}) => {
  const displayName = otherParticipant?.profile.display_name || "Người dùng";
  const avatarUrl =
    otherParticipant?.profile.avatar_url || "/default-avatar.png";
  const statusText =
    typingUsers.length > 0
      ? "Đang nhập..."
      : otherParticipant?.profile.status === "online"
      ? "Đang hoạt động"
      : "Không hoạt động";

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Avatar + Info */}
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-zinc-300">
            {displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="leading-tight">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {displayName}
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {statusText}
          </span>
        </div>
      </div>

      {/* Action buttons (UI-only, không đổi logic chat) */}
      <div className="flex items-center gap-2 sm:gap-3 text-gray-600 dark:text-gray-300">
        <TooltipBtn icon={Search} label="Tìm kiếm" />
        <TooltipBtn icon={Phone} label="Gọi thoại" />
        <TooltipBtn icon={Video} label="Gọi video" />
        <TooltipBtn icon={Users} label="Thành viên" />
        <TooltipBtn icon={Info} label="Thông tin" />
      </div>
    </div>
  );
};

export default ChatHeader;
