import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { useContactLabels, useAssignLabelToFriend, useRemoveLabelFromFriend } from "@/hooks/useFriends";
import useUser from "@/hooks/useUser";
import { Check, Tag } from "lucide-react";
import toast from "react-hot-toast";

interface FriendItemProps {
  friend: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string;
    status: string;
    label_id?: string[];
  };
  onRemove: () => void;
  onMessage?: (friendId: string) => void;
}

const LABEL_COLORS = [
  { value: 0, color: 'bg-gray-500' },
  { value: 1, color: 'bg-red-500' },
  { value: 2, color: 'bg-orange-500' },
  { value: 3, color: 'bg-yellow-500' },
  { value: 4, color: 'bg-green-500' },
  { value: 5, color: 'bg-blue-500' },
  { value: 6, color: 'bg-purple-500' },
  { value: 7, color: 'bg-pink-500' },
];

export default function FriendItem({
  friend,
  onRemove,
  onMessage,
}: FriendItemProps) {
  const { user } = useUser();
  const userId = user?.id as string;
  const { data: labels } = useContactLabels(userId || ''); // Pass empty string if undefined
  const assignLabelMutation = useAssignLabelToFriend();
  const removeLabelMutation = useRemoveLabelFromFriend();

  const handleMessage = () => {
    if (onMessage) {
      onMessage(friend.id);
    }
  };

  const handleToggleLabel = async (labelId: string) => {
    const hasLabel = friend.label_id?.includes(labelId);
    
    try {
      if (hasLabel) {
        await removeLabelMutation.mutateAsync({
          friendId: friend.id,
          labelId
        });
        toast.success('Đã bỏ nhãn');
      } else {
        await assignLabelMutation.mutateAsync({
          friendId: friend.id,
          labelId
        });
        toast.success('Đã gán nhãn');
      }
    } catch (error) {
      console.error('Error toggling label:', error);
      toast.error('Lỗi khi cập nhật nhãn');
    }
  };

  return (
    <li className="relative rounded-xl">
      {/* Row */}
      <div
        className="group flex rounded-xl items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-accent/50 transition-colors"
        role="button"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar className="w-12 h-12 ring-1 ring-gray-200 dark:ring-gray-700 flex items-center justify-center rounded-full bg-muted">
            <AvatarImage
              className="object-cover rounded-full size-full"
              src={friend.avatar_url || "/default-avatar.png"}
              alt={friend.display_name}
            />
            <AvatarFallback>
              {friend.display_name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {friend.status === "online" && (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card
                         bg-[oklch(0.79_0.14_145)]"
              title="Online"
            />
          )}
        </div>

        {/* Texts */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm sm:text-[15px] font-medium text-foreground truncate">
              {friend.display_name}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <p className="text-xs text-muted-foreground truncate">
              @{friend.username}
            </p>
            {/* Display assigned labels */}
            {friend.label_id && friend.label_id.length > 0 && (
              <>
                {friend.label_id.slice(0, 2).map((labelId) => {
                  const label = labels?.find(l => l.id === labelId);
                  if (!label) return null;
                  return (
                    <span
                      key={labelId}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white ${
                        LABEL_COLORS[label.color]?.color || 'bg-gray-500'
                      }`}
                    >
                      {label.name}
                    </span>
                  );
                })}
                {friend.label_id.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{friend.label_id.length - 2}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick actions (show on hover like Zalo) */}
        <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleMessage}
            className="h-8 px-3 text-sm rounded-full bg-primary text-primary-foreground hover:opacity-90"
            title="Nhắn tin"
            type="button"
          >
            Nhắn tin
          </button>
        </div>

        {/* Kebab menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ml-1 p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent"
              aria-label="Mở menu"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8a2 2 0 100-4 2 2 0 000 4Zm0 6a2 2 0 100-4 2 2 0 000 4Zm0 6a2 2 0 100-4 2 2 0 000 4Z" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleMessage}>
              Nhắn tin
            </DropdownMenuItem>
            <DropdownMenuItem>
              Trang cá nhân
            </DropdownMenuItem>

            {/* Assign Labels */}
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Tag className="size-4 mr-2" />
                Phân loại
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {labels && labels.length > 0 ? (
                  labels.map((label) => {
                    const hasLabel = friend.label_id?.includes(label.id);
                    return (
                      <DropdownMenuItem
                        key={label.id}
                        onClick={() => handleToggleLabel(label.id)}
                      >
                        <span
                          className={`w-3 h-3 rounded-full mr-2 ${
                            LABEL_COLORS[label.color]?.color || 'bg-gray-500'
                          }`}
                        />
                        <span className="flex-1">{label.name}</span>
                        {hasLabel && <Check className="size-4 text-blue-500" />}
                      </DropdownMenuItem>
                    );
                  })
                ) : (
                  <DropdownMenuItem disabled>
                    Chưa có nhãn nào
                  </DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onRemove}
              className="text-destructive focus:text-destructive"
            >
              Xóa bạn bè
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
