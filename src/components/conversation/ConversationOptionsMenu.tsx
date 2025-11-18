// components/conversation/ConversationOptionsMenu.tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import {
  BellOff,
  Bell,
  Clock,
  Info,
  Search,
  Palette,
  Ban,
  Unlock,
  LogOut,
  Trash2
} from 'lucide-react';
import { useMuteConversation, useUnmuteConversation } from '@/hooks/useMute';
import { isConversationMuted, type MuteDuration } from '@/services/muteService';
import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  useIsBlockedByMe,
  useBlockUser,
  useUnblockUser
} from '@/hooks/useFriends';
import { leaveGroup } from '@/services/chatService';
import { useConfirm } from '@/components/modal/ModalConfirm';
import { useDeleteGroup } from '@/hooks/useChat';
import toast from 'react-hot-toast';
import { TransferAdminModal } from '@/components/modal/TransferAdminModal';
import { GroupInfoModal } from '@/components/modal/GroupInfoModal';
import { BackgroundPicker } from '../conversation/BackgroundPicker';
import { Button } from '@/components/ui/button';
import { useUpdateConversationBackground } from '@/hooks/useChat';
import type { ConversationWithDetails } from '@/services/chatService';

interface ConversationOptionsMenuProps {
  conversationId: string;
  userId: string;
  muteUntil: string | null;
  conversationType: 'direct' | 'group';
  otherUserId?: string;
  otherUserName?: string;
  conversation?: ConversationWithDetails;
  children: ReactNode;
  onClose?: () => void;
}

export const ConversationOptionsMenu: React.FC<
  ConversationOptionsMenuProps
> = ({
  conversationId,
  userId,
  muteUntil,
  conversationType,
  otherUserId,
  otherUserName,
  conversation,
  children,
  onClose
}) => {
  const navigate = useNavigate();
  const muteMutation = useMuteConversation();
  const unmuteMutation = useUnmuteConversation();
  const deleteGroupMutation = useDeleteGroup();
  const confirm = useConfirm();

  // Get mute_until from conversation prop (more reliable than prop)
  const currentUserParticipant = conversation?.participants?.find(
    (p) => p.user_id === userId
  );
  const actualMuteUntil = currentUserParticipant?.mute_until || muteUntil || null;
  const isMuted = isConversationMuted(actualMuteUntil);
  const isAdmin = conversationType === 'group' && currentUserParticipant?.role === 'admin';
  const [showTransferAdminModal, setShowTransferAdminModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [open, setOpen] = useState(false);
  
  const updateBackgroundMutation = useUpdateConversationBackground();

  // Check if blocked (only for direct chat)
  const { data: isBlockedByMe } = useIsBlockedByMe(otherUserId || '');
  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();

  const closeMenu = () => {
    setOpen(false);
    onClose?.();
  };

  const handleMute = (duration: MuteDuration) => {
    muteMutation.mutate({ conversationId, userId, duration });
    closeMenu();
  };

  const handleUnmute = () => {
    unmuteMutation.mutate({ conversationId, userId });
    closeMenu();
  };

  const handleViewInfo = () => {
    closeMenu();
    if (conversationType === 'group') {
      // Show group info modal
      setShowGroupInfoModal(true);
    } else {
      // For direct chat, navigate to profile or show info
      navigate(`/chat/${conversationId}`);
      toast('Xem thông tin người dùng ở header', {
        icon: 'ℹ️',
        duration: 2000
      });
    }
  };

  const handleSearch = () => {
    closeMenu();
    // Navigate to chat - ChatWindow will handle search state
    navigate(`/chat/${conversationId}`, { state: { openSearch: true } });
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

  const handleBlock = async () => {
    if (!otherUserId) return;
    closeMenu();

    const confirmed = await confirm({
      title: 'Chặn người dùng',
      description: `Bạn có chắc muốn chặn ${otherUserName || 'người dùng này'}? Bạn sẽ không thể nhắn tin với nhau và không thấy bài viết của nhau.`,
      confirmText: 'Chặn',
      cancelText: 'Hủy',
      destructive: true
    });

    if (confirmed) {
      try {
        await blockUserMutation.mutateAsync(otherUserId);
        toast.success(`Đã chặn ${otherUserName || 'người dùng'}`);
      } catch (error: any) {
        console.error('Error blocking user:', error);
        toast.error(error?.message || 'Lỗi khi chặn người dùng');
      }
    }
  };

  const handleUnblock = async () => {
    if (!otherUserId) return;
    closeMenu();

    const confirmed = await confirm({
      title: 'Bỏ chặn người dùng',
      description: `Bạn có chắc muốn bỏ chặn ${otherUserName || 'người dùng này'}? Bạn sẽ có thể nhắn tin và thấy bài viết của nhau.`,
      confirmText: 'Bỏ chặn',
      cancelText: 'Hủy'
    });

    if (!confirmed) return;

    try {
      await unblockUserMutation.mutateAsync(otherUserId);
      toast.success(`Đã bỏ chặn ${otherUserName || 'người dùng'}`);
    } catch (error: any) {
      console.error('Error unblocking user:', error);
      toast.error(error?.message || 'Lỗi khi bỏ chặn người dùng');
    }
  };

  const handleLeaveGroup = async () => {
    closeMenu();

    const confirmed = await confirm({
      title: 'Rời nhóm',
      description: 'Bạn có chắc muốn rời khỏi nhóm này?',
      confirmText: 'Rời nhóm',
      cancelText: 'Hủy',
      destructive: true
    });

    if (!confirmed) return;

    try {
      const result = await leaveGroup(conversationId, userId);

      // Check if user is last admin
      if (result.isLastAdmin) {
        // Show transfer admin modal
        setShowTransferAdminModal(true);
        return;
      }

      // Normal leave
      toast.success('Bạn đã rời khỏi nhóm');
      setTimeout(() => {
        navigate('/chat');
      }, 1000);
    } catch (error) {
      console.error('Error leaving group:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Lỗi khi rời nhóm';
      toast.error(errorMessage);
    }
  };

  const handleDeleteGroup = async () => {
    if (!isAdmin) {
      toast.error('Chỉ admin mới có thể xóa nhóm');
      return;
    }

    closeMenu();

    const confirmed = await confirm({
      title: 'Xóa nhóm',
      description: 'Bạn có chắc muốn xóa nhóm này? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa nhóm',
      cancelText: 'Hủy',
      destructive: true
    });

    if (!confirmed) return;

    try {
      await deleteGroupMutation.mutateAsync({
        conversationId,
        adminId: userId
      });
      // Navigate away after deletion
      setTimeout(() => {
        navigate('/chat');
      }, 1000);
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error(error?.message || 'Lỗi khi xóa nhóm');
    }
  };

  const handleTransferAdminSuccess = async () => {
    try {
      await leaveGroup(conversationId, userId);
      toast.success('Đã chuyển quyền admin và rời khỏi nhóm');
      setShowTransferAdminModal(false);
      setTimeout(() => {
        navigate('/chat');
      }, 1000);
    } catch (error) {
      console.error('Error leaving group after transfer:', error);
      toast.error('Đã chuyển quyền admin nhưng không thể rời nhóm');
    }
  };

  const handleDeleteConversation = async () => {
    closeMenu();

    const confirmed = await confirm({
      title: 'Xóa cuộc trò chuyện',
      description: 'Bạn có chắc muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      destructive: true
    });

    if (confirmed) {
      toast.success('Chức năng đang được phát triển');
    }
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Thông tin */}
          <DropdownMenuItem onClick={handleViewInfo}>
            <Info className="mr-2 h-4 w-4" />
            <span>Thông tin cuộc trò chuyện</span>
          </DropdownMenuItem>

          {/* Tìm kiếm */}
          <DropdownMenuItem onClick={handleSearch}>
            <Search className="mr-2 h-4 w-4" />
            <span>Tìm kiếm</span>
          </DropdownMenuItem>

          {/* Đổi nền */}
          {conversation && (
            <DropdownMenuItem
              onClick={() => {
                closeMenu();
                setShowBackgroundPicker(true);
              }}
            >
              <Palette className="mr-2 h-4 w-4" />
              <span>Đổi nền cuộc trò chuyện</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Tắt/Bật thông báo */}
          {isMuted ? (
            <>
              <DropdownMenuItem onClick={handleUnmute}>
                <Bell className="mr-2 h-4 w-4" />
                <span>Bật thông báo</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <BellOff className="mr-2 h-4 w-4" />
                  <span>Tắt thông báo</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleMute('15m')}>
                    <Clock className="mr-2 h-4 w-4" />
                    <span>15 phút</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMute('1h')}>
                    <Clock className="mr-2 h-4 w-4" />
                    <span>1 giờ</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMute('8h')}>
                    <Clock className="mr-2 h-4 w-4" />
                    <span>8 giờ</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMute('24h')}>
                    <Clock className="mr-2 h-4 w-4" />
                    <span>24 giờ</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleMute('forever')}>
                    <BellOff className="mr-2 h-4 w-4" />
                    <span>Tắt cho đến khi bật lại</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Block/Unblock - only for direct chat */}
          {conversationType === 'direct' && otherUserId && (
            <>
              {isBlockedByMe ? (
                <DropdownMenuItem onClick={handleUnblock}>
                  <Unlock className="mr-2 h-4 w-4" />
                  <span>Bỏ chặn</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleBlock}>
                  <Ban className="mr-2 h-4 w-4" />
                  <span>Chặn người dùng</span>
                </DropdownMenuItem>
              )}
            </>
          )}

          {/* Leave group - only for group chat */}
          {conversationType === 'group' && (
            <DropdownMenuItem onClick={handleLeaveGroup}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Rời khỏi nhóm</span>
            </DropdownMenuItem>
          )}

          {/* Delete group - only for group chat and admin */}
          {conversationType === 'group' && isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDeleteGroup}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Xóa nhóm</span>
              </DropdownMenuItem>
            </>
          )}

          {/* Delete conversation - only for direct chat */}
          {conversationType === 'direct' && (
            <DropdownMenuItem
              onClick={handleDeleteConversation}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Xóa cuộc trò chuyện</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Transfer Admin Modal (for leaving group as last admin) */}
      {conversationType === 'group' && (
        <TransferAdminModal
          open={showTransferAdminModal}
          onClose={() => setShowTransferAdminModal(false)}
          conversationId={conversationId}
          currentAdminId={userId}
          onSuccess={handleTransferAdminSuccess}
        />
      )}

      {/* Group Info Modal */}
      {conversationType === 'group' && conversation && (
        <GroupInfoModal
          open={showGroupInfoModal}
          onOpenChange={setShowGroupInfoModal}
          conversation={conversation}
          currentUserId={userId}
        />
      )}

      {/* Background Picker */}
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
          trigger={<></>}
        />
      )}
    </>
  );
};

