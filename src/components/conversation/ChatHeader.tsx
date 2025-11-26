import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  Phone,
  Video,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Palette,
  Ban,
  Unlock,
  BarChart3,
  MoreVertical,
  Sparkles,
  Music
} from 'lucide-react';
import { TooltipBtn } from '../TooltipBtn';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useLocation } from 'react-router';
import type { ConversationWithDetails } from '@/services/chatService';
import type { PinnedMessage } from '@/services/chatService';
import { InviteLinkModal } from '../modal/InviteLinkModal';
import { GroupInfoModal } from '../modal/GroupInfoModal';
import { supabaseUrl, getAvatarUrl, getGroupPhotoUrl } from '@/lib/supabase';
import { BackgroundPicker } from './BackgroundPicker';
import { useUpdateConversationBackground } from '@/hooks/useChat';
import { PinnedMessagesModal } from '../modal/PinnedMessagesModal';
import { CreatePollModal } from '../modal/CreatePollModal';
import { SelectCallParticipantsModal } from '../modal/SelectCallParticipantsModal';
import { SummaryChatModal } from '../modal/SummaryChatModal';
import { AskAIChatModal } from '../modal/AskAIChatModal';
import useUser from '@/hooks/useUser';
import {
  useBlockUser,
  useUnblockUser,
  useIsBlockedByMe,
  useIsBlockedByUser
} from '@/hooks/useFriends';
import { useConfirm } from '@/components/modal/ModalConfirm';
import toast from 'react-hot-toast';

interface ChatHeaderProps {
  otherParticipant:
    | {
        user_id: string;
        profile: {
          display_name: string;
          avatar_url?: string;
          status?: string;
        };
      }
    | undefined;
  typingUsers: string[];
  onSearch?: (query: string, direction: 'next' | 'prev') => void;
  searchResults?: { current: number; total: number };
  onCloseSearch?: () => void;
  conversation?: ConversationWithDetails;
  currentUserId?: string;
  onCall?: (userId: string, isVideo: boolean) => void;
  onGroupCall?: (conversationId: string, isVideo: boolean) => void;
  onCallWithParticipants?: (
    conversationId: string,
    isVideo: boolean,
    participants: string[]
  ) => void;
  pinned?: PinnedMessage[];
  onUnpin?: (messageId: string) => void;
  onJumpTo?: (messageId: string) => void;
  onCreateThread?: () => void;
  initialShowSearch?: boolean;
  onOpenPlaylist?: () => void;
  hasActivePlaylist?: boolean;
  isPlaylistPlaying?: boolean;
  playlistTrackCount?: number;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherParticipant,
  typingUsers,
  onSearch,
  searchResults,
  onCloseSearch,
  conversation,
  currentUserId,
  onCall,
  onGroupCall,
  onCallWithParticipants,
  pinned,
  onUnpin,
  onJumpTo,
  onCreateThread,
  initialShowSearch = false,
  onOpenPlaylist,
  hasActivePlaylist = false,
  isPlaylistPlaying = false,
  playlistTrackCount = 0
}) => {
  const { user } = useUser();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(initialShowSearch);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showPinsModal, setShowPinsModal] = useState(false);
  const [showSelectCallModal, setShowSelectCallModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showAskAIModal, setShowAskAIModal] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [callIsVideo, setCallIsVideo] = useState(false);

  // Handle initial show search from location state or prop
  useEffect(() => {
    const state = location.state as any;
    if (state?.openSearch || initialShowSearch) {
      setShowSearch(true);
    }
  }, [location.pathname, location.state, initialShowSearch]);

  const updateBackgroundMutation = useUpdateConversationBackground();

  // Check if group chat first (needed for block hooks)
  const isGroupChat = conversation?.type === 'group';

  // Block/unblock hooks (only for direct chat)
  const otherUserId = !isGroupChat ? otherParticipant?.user_id : undefined;
  const { data: isBlockedByMe } = useIsBlockedByMe(otherUserId || '');
  const { data: isBlockedByUser } = useIsBlockedByUser(otherUserId || '');
  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();
  const confirm = useConfirm();
  const displayName = isGroupChat
    ? conversation?.title || 'Nhóm'
    : otherParticipant?.profile.display_name || 'Người dùng';

  // Check if blocked (either direction)
  const isBlocked =
    !isGroupChat && (isBlockedByMe === true || isBlockedByUser === true);

  const avatarUrl = isGroupChat
    ? getGroupPhotoUrl(conversation?.photo_url) || '/default-avatar.png'
    : getAvatarUrl(otherParticipant?.profile.avatar_url) ||
      '/default-avatar.png';

  const statusText = isGroupChat
    ? `${conversation?.participants?.length || 0} thành viên`
    : isBlockedByUser
    ? 'Đã bị chặn'
    : typingUsers.length > 0
    ? 'Đang nhập...'
    : otherParticipant?.profile.status === 'online'
    ? 'Đang hoạt động'
    : 'Không hoạt động';

  const handleBlock = async () => {
    if (!otherUserId) return;

    const confirmed = await confirm({
      title: 'Chặn người dùng',
      description: `Bạn có chắc muốn chặn ${displayName}? Bạn sẽ không thể nhắn tin với nhau và không thấy bài viết của nhau.`,
      confirmText: 'Chặn',
      cancelText: 'Hủy',
      destructive: true
    });

    if (confirmed) {
      try {
        await blockUserMutation.mutateAsync(otherUserId);
        toast.success(`Đã chặn ${displayName}`);
      } catch (error: any) {
        console.error('Error blocking user:', error);
        toast.error(error?.message || 'Lỗi khi chặn người dùng');
      }
    }
  };

  const handleUnblock = async () => {
    if (!otherUserId) return;

    const confirmed = await confirm({
      title: 'Bỏ chặn người dùng',
      description: `Bạn có chắc muốn bỏ chặn ${displayName}? Bạn sẽ có thể nhắn tin và thấy bài viết của nhau.`,
      confirmText: 'Bỏ chặn',
      cancelText: 'Hủy'
    });

    if (!confirmed) return;

    try {
      await unblockUserMutation.mutateAsync(otherUserId);
      toast.success(`Đã bỏ chặn ${displayName}`);
    } catch (error: any) {
      console.error('Error unblocking user:', error);
      toast.error(error?.message || 'Lỗi khi bỏ chặn người dùng');
    }
  };

  // Check if current user is admin
  const isAdmin =
    isGroupChat &&
    conversation?.participants?.some(
      (p) => p.user_id === currentUserId && p.role === 'admin'
    );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch && e.target.value) {
      onSearch(e.target.value, 'next');
    }
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
    onCloseSearch?.();
  };

  const handleBackgroundChange = (
    type: 'color' | 'gradient' | 'image',
    value: string
  ) => {
    if (!conversation) return;

    updateBackgroundMutation.mutate({
      conversationId: conversation.id,
      backgroundType: type,
      backgroundValue: value
    });
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
          {/* Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                title="Tùy chọn"
              >
                <MoreVertical className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" sideOffset={5}>
              {/* Background Picker */}
              {conversation && (
                <DropdownMenuItem onClick={() => setShowBackgroundPicker(true)}>
                  <Palette className="size-4" />
                  <span>Đổi background</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={() => setShowSearch(!showSearch)}>
                <Search className="size-4" />
                <span>Tìm kiếm</span>
              </DropdownMenuItem>

              {/* Playlist button */}
              {conversation && onOpenPlaylist && (
                <DropdownMenuItem onClick={onOpenPlaylist}>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Music className="size-4" />
                      {hasActivePlaylist && (
                        <div className="absolute -top-1 -right-1">
                          {isPlaylistPlaying ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          ) : (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      )}
                    </div>
                    <span>Playlist Cùng Nghe</span>
                    {hasActivePlaylist && playlistTrackCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {playlistTrackCount}
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              )}

              {/* Show invite button for group admins */}
              {isGroupChat && isAdmin && conversation && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowInviteModal(true)}>
                    <LinkIcon className="size-4" />
                    <span>Tạo link mời</span>
                  </DropdownMenuItem>
                </>
              )}

              {/* Call buttons for direct chat */}
              {!isGroupChat && otherParticipant && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onCall?.(otherParticipant.user_id, false)}
                    disabled={isBlocked}
                  >
                    <Phone className="size-4" />
                    <span>Gọi thoại</span>
                  </DropdownMenuItem>
                </>
              )}

              {/* Call buttons for group chat */}
              {isGroupChat && conversation && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setCallIsVideo(false);
                      setShowSelectCallModal(true);
                    }}
                  >
                    <Phone className="size-4" />
                    <span>Gọi thoại</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setCallIsVideo(true);
                      setShowSelectCallModal(true);
                    }}
                  >
                    <Video className="size-4" />
                    <span>Gọi video</span>
                  </DropdownMenuItem>
                </>
              )}

              {/* Group Info Button */}
              {isGroupChat && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowGroupInfoModal(true)}>
                    <Info className="size-4" />
                    <span>Thông tin nhóm</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Direct chat info and block buttons (outside menu) */}
          {!isGroupChat && (
            <>
              <TooltipBtn icon={Info} label="Thông tin" />
              {/* Block/Unblock button for direct chat */}
              {otherUserId &&
                (isBlockedByMe ? (
                  <TooltipBtn
                    icon={Unlock}
                    label="Bỏ chặn"
                    onClick={handleUnblock}
                  />
                ) : (
                  <TooltipBtn icon={Ban} label="Chặn" onClick={handleBlock} />
                ))}
            </>
          )}

          {/* Create Poll (only for groups) */}
          {isGroupChat && conversation && user?.id && (
            <CreatePollModal
              conversationId={conversation.id}
              userId={user.id}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-xs px-2"
                  title="Tạo bình chọn"
                >
                  Tạo bình chọn
                </Button>
              }
            />
          )}

          {/* Summary button (only for groups) */}
          {isGroupChat && conversation && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs px-2"
              onClick={() => setShowSummaryModal(true)}
              title="Tóm tắt cuộc trò chuyện"
            >
              <BarChart3 className="size-4 mr-1" />
              Summary
            </Button>
          )}

          {/* Create Thread button (only for groups) */}
          {onCreateThread && isGroupChat && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs px-2"
              onClick={onCreateThread}
              title="Tạo chủ đề"
            >
              Tạo chủ đề
            </Button>
          )}

          {/* Pinned messages button */}
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-xs px-2"
            onClick={() => setShowPinsModal(true)}
            title="Xem tin nhắn đã ghim"
          >
            Ghim ({pinned?.length || 0})
          </Button>
        </div>
      </div>

      {/* Pinned messages bar */}
      {pinned && pinned.length > 0 && (
        <div className="px-4 py-1.5 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700">
          <div className="flex items-center gap-2 overflow-x-auto">
            {pinned.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-full shadow-sm"
              >
                <button
                  className="text-xs font-medium text-gray-700 dark:text-gray-200 max-w-[200px] truncate"
                  title={p.message?.content_text || 'Tin nhắn'}
                  onClick={() => onJumpTo?.(p.message_id)}
                >
                  {p.message?.content_text || '(Tin nhắn)'}
                </button>
                <button
                  className="text-xs text-red-600 hover:text-red-700"
                  onClick={() => onUnpin?.(p.message_id)}
                >
                  Bỏ ghim
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                    setSearchQuery('');
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
                  onClick={() => onSearch?.(searchQuery, 'prev')}
                  disabled={searchResults.current <= 1}
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => onSearch?.(searchQuery, 'next')}
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

      {/* Invite Link Modal */}
      {isGroupChat && isAdmin && conversation && currentUserId && (
        <InviteLinkModal
          open={showInviteModal}
          onOpenChange={setShowInviteModal}
          conversationId={conversation.id}
          userId={currentUserId}
        />
      )}

      {/* Group Info Modal */}
      {isGroupChat && conversation && currentUserId && (
        <GroupInfoModal
          open={showGroupInfoModal}
          onOpenChange={setShowGroupInfoModal}
          conversation={conversation}
          currentUserId={currentUserId}
        />
      )}

      {/* Pinned Messages Modal */}
      {conversation && (
        <PinnedMessagesModal
          open={showPinsModal}
          onOpenChange={setShowPinsModal}
          conversationId={conversation.id}
          onUnpin={(id) => onUnpin?.(id)}
          onJumpTo={(id) => onJumpTo?.(id)}
        />
      )}

      {/* Select Call Participants Modal */}
      {isGroupChat && conversation && currentUserId && (
        <SelectCallParticipantsModal
          open={showSelectCallModal}
          onOpenChange={setShowSelectCallModal}
          conversationId={conversation.id}
          currentUserId={currentUserId}
          isVideo={callIsVideo}
          onStartCall={(participantIds) => {
            if (onCallWithParticipants) {
              onCallWithParticipants(
                conversation.id,
                callIsVideo,
                participantIds
              );
            } else {
              // Fallback to old method if callback not provided
              onGroupCall?.(conversation.id, callIsVideo);
            }
          }}
        />
      )}

      {/* Summary Chat Modal */}
      {isGroupChat && conversation && (
        <SummaryChatModal
          open={showSummaryModal}
          onOpenChange={setShowSummaryModal}
          conversationId={conversation.id}
          conversationName={conversation.title || 'Nhóm'}
        />
      )}

      {/* Background Picker Modal */}
      {conversation && (
        <BackgroundPicker
          currentBackground={{
            type: (conversation.background_type || 'color') as
              | 'color'
              | 'gradient'
              | 'image',
            value: conversation.background_value || '#FFFFFF'
          }}
          onSelect={handleBackgroundChange}
          open={showBackgroundPicker}
          onOpenChange={setShowBackgroundPicker}
        />
      )}
    </div>
  );
};

export default ChatHeader;
