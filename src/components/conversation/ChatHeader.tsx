import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Phone,
  Video,
  Users,
  Info,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { TooltipBtn } from "../TooltipBtn";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
  onSearch?: (query: string, direction: "next" | "prev") => void;
  searchResults?: { current: number; total: number };
  onCloseSearch?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherParticipant,
  typingUsers,

  onSearch,
  searchResults,
  onCloseSearch,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const displayName = otherParticipant?.profile.display_name || "Người dùng";

  const avatarUrl =
    otherParticipant?.profile.avatar_url || "/default-avatar.png";
  const statusText =
    typingUsers.length > 0
      ? "Đang nhập..."
      : otherParticipant?.profile.status === "online"
      ? "Đang hoạt động"
      : "Không hoạt động";

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch && e.target.value) {
      onSearch(e.target.value, "next");
    }
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
    onCloseSearch?.();
  };

  return (
    <div className="border-b dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between px-4 py-2">
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

        {/* Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3 text-gray-600 dark:text-gray-300">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="size-5" />
          </Button>
          <TooltipBtn icon={Phone} label="Gọi thoại" />
          <TooltipBtn icon={Video} label="Gọi video" />
          <TooltipBtn icon={Users} label="Thành viên" />
          <TooltipBtn icon={Info} label="Thông tin" />
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm tin nhắn..."
                className="w-full px-3 py-2 pr-8 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    onCloseSearch?.();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {searchResults && searchResults.total > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {searchResults.current}/{searchResults.total}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => onSearch?.(searchQuery, "prev")}
                  disabled={searchResults.current <= 1}
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => onSearch?.(searchQuery, "next")}
                  disabled={searchResults.current >= searchResults.total}
                >
                  <ChevronDown className="size-4" />
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleCloseSearch}
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
