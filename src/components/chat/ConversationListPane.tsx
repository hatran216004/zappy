import {
  Users,
  AlertTriangle,
  LogOut,
  Sun,
  Moon,
  Star,
  Image,
  FolderOpen,
  Info,
  Link as LinkIcon
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '@/stores/user';
import {
  useConversation,
  useConversationMedia,
  useConversationFiles,
  useConversationLinks
} from '@/hooks/useChat';
import { getAttachmentUrl, leaveGroup } from '@/services/chatService';
import { useEffect, useState, useMemo } from 'react';
import { SidebarAccordionSection } from '../sidebar/SidebarAccordionSection';
import { twMerge } from 'tailwind-merge';
import { getAvatarUrl, getGroupPhotoUrl } from '@/lib/supabase';
import { ReportConversationModal } from '@/components/modal/ReportConversationModal';
import { TransferAdminModal } from '@/components/modal/TransferAdminModal';
import { PinnedMessagesModal } from '@/components/modal/PinnedMessagesModal';
import { GroupInfoModal } from '@/components/modal/GroupInfoModal';
import { MediaViewerModal } from '@/components/modal/MediaViewerModal';
import { useConfirm } from '@/components/modal/ModalConfirm';
import toast from 'react-hot-toast';

export default function ConversationListPane() {
  const { user } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const conversationId = params.conversationId as string;
  const confirm = useConfirm();

  const { data: conversation } = useConversation(conversationId);
  const { data: mediaData, isLoading: mediaLoading } = useConversationMedia(
    conversationId,
    'both'
  );
  const { data: filesData, isLoading: filesLoading } =
    useConversationFiles(conversationId);
  const { data: linksData, isLoading: linksLoading } =
    useConversationLinks(conversationId);

  const [mediaUrls, setMediaUrls] = useState<{ [key: string]: string }>({});
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTransferAdminModal, setShowTransferAdminModal] = useState(false);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined')
      return document.documentElement.classList.contains('dark');
    return true;
  });
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('pane_collapsed');
      return v === '1';
    } catch {
      return false;
    }
  });

  // Theme toggle (UI-only, no app logic changed)
  const toggleTheme = () => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark');
    setIsDark(document.documentElement.classList.contains('dark'));
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pane_collapsed', next ? '1' : '0');
      } catch {
        // Ignore localStorage errors
      }
      try {
        window.dispatchEvent(
          new CustomEvent('pane-collapsed-changed', { detail: next })
        );
      } catch {
        // Ignore event dispatch errors
      }
      return next;
    });
  };

  // Fetch signed URLs for media (unchanged logic)
  useEffect(() => {
    const fetchMediaUrls = async () => {
      if (!mediaData || mediaData.length === 0) return;

      const urls: { [key: string]: string } = {};
      await Promise.all(
        mediaData.map(async (media) => {
          try {
            const url = await getAttachmentUrl(media.storage_path);
            urls[media.id] = url;
          } catch (error) {
            console.error('Error fetching media URL:', error);
          }
        })
      );
      setMediaUrls(urls);
    };

    fetchMediaUrls();
  }, [mediaData]);

  // Other participant (unchanged)
  const otherParticipant = conversation?.participants.find(
    (p) => p.user_id !== user?.id
  );

  const displayName =
    conversation?.type === 'direct'
      ? otherParticipant?.profile.display_name
      : conversation?.title || 'Nhóm';

  const avatarUrl =
    conversation?.type === 'direct'
      ? getAvatarUrl(otherParticipant?.profile.avatar_url)
      : getGroupPhotoUrl(conversation?.photo_url);

  const participantsCount = conversation?.participants.length || 0;

  // helpers (unchanged)
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) return 'Hôm nay';
    if (diffInHours < 48) return 'Hôm qua';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} ngày trước`;
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Handle leave group
  const handleLeaveGroup = async () => {
    if (!conversation || conversation.type !== 'group' || !user?.id) return;

    const confirmed = await confirm({
      title: 'Rời nhóm',
      description: 'Bạn có chắc muốn rời khỏi nhóm này?',
      confirmText: 'Rời nhóm',
      cancelText: 'Hủy',
      destructive: true
    });

    if (!confirmed) return;

    try {
      const result = await leaveGroup(conversation.id, user.id);

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

  // Handle transfer admin success
  const handleTransferAdminSuccess = async () => {
    if (!conversation || !user?.id) return;

    try {
      await leaveGroup(conversation.id, user.id);
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

  // data maps (unchanged)
  const mediaItems = useMemo(() => {
    const items =
      mediaData?.slice(0, 16).map((m) => ({
        src: mediaUrls[m.id] || '/default-image.png',
        kind: m.kind as 'image' | 'video',
        id: m.id
      })) || [];
    return items;
  }, [mediaData, mediaUrls]);

  const handleMediaClick = (index: number) => {
    setSelectedMediaIndex(index);
    setShowMediaViewer(true);
  };

  const fileItems = useMemo(() => {
    const items =
      filesData?.map((file) => {
        const fileName = file.storage_path.split('/').pop() || 'Unknown';
        const cleanName = fileName.replace(/^\d+_[a-z0-9]+\./, '');
        const fileWithMessages = file as typeof file & {
          messages: { created_at: string };
        };
        return {
          name: cleanName || fileName,
          size: formatFileSize(file.byte_size),
          time: formatTime(fileWithMessages.messages.created_at)
        };
      }) || [];
    return items;
  }, [filesData]);

  const linkItems = useMemo(() => {
    const items: Array<{ title: string; url: string; time: string }> = [];
    linksData?.forEach((msg) => {
      msg.urls.forEach((url) => {
        try {
          const urlObj = new URL(url);
          items.push({
            title: msg.content_text.substring(0, 50) || url,
            url: urlObj.hostname,
            time: formatTime(msg.created_at)
          });
        } catch {
          items.push({
            title: url.substring(0, 50),
            url: url,
            time: formatTime(msg.created_at)
          });
        }
      });
    });
    return items;
  }, [linksData]);

  if (!conversationId) {
    return (
      <div
        className={twMerge(
          'flex flex-col border-l border-gray-200 bg-white dark:border-[#2B2D31] dark:bg-[#2B2D31]',
          collapsed ? 'w-[44px]' : 'w-[320px]'
        )}
      >
        <div className="p-4 border-b border-gray-200 dark:border-[#3F4246] sticky top-0 bg-white dark:bg-[#2B2D31] z-10 flex items-center justify-between">
          {collapsed ? (
            <button
              onClick={toggleCollapsed}
              className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-[#313338]"
              title="Mở bảng thông tin"
              type="button"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6l6 6-6 6" />
              </svg>
            </button>
          ) : (
            <>
              <h2 className="font-semibold text-gray-800 dark:text-[#F2F3F5]">
                Thông tin cuộc trò chuyện
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleCollapsed}
                  className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-[#313338]"
                  title="Thu gọn"
                  type="button"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M14 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm border border-gray-200 hover:bg-gray-50 active:scale-[.98] transition dark:border-[#3F4246] dark:hover:bg-[#313338] dark:text-[#DCDDDE]"
                  aria-label="Toggle theme"
                  type="button"
                >
                  {isDark ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isDark ? 'Light' : 'Dark'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
        {!collapsed && (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <p className="text-gray-500 dark:text-[#B5BAC1]">
              Chọn một cuộc trò chuyện để xem thông tin
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        'flex flex-col border-l border-gray-200 bg-white dark:border-[#2B2D31] dark:bg-[#2B2D31]',
        collapsed ? 'w-[44px]' : 'w-[320px]'
      )}
    >
      {/* Header sticky */}
      <div
        className="
          p-2 sm:p-2 border-b border-gray-200
          bg-white/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-20
          dark:bg-[#2B2D31]/80 dark:border-[#3F4246]
          flex items-center justify-between
        "
      >
        {collapsed ? (
          <button
            onClick={toggleCollapsed}
            className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-[#313338]"
            title="Mở bảng thông tin"
            type="button"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6l6 6-6 6" />
            </svg>
          </button>
        ) : (
          <>
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-gray-800 dark:text-[#F2F3F5]">
                {conversation?.type === 'direct'
                  ? 'Thông tin cuộc trò chuyện'
                  : 'Thông tin nhóm'}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-[#B5BAC1] truncate">
                {conversation?.type === 'direct'
                  ? 'Tin nhắn trực tiếp'
                  : 'Tin nhắn nhóm'}
              </p>
            </div>
            <button
              onClick={toggleCollapsed}
              className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-[#313338]"
              title="Thu gọn"
              type="button"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 18l-6-6 6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {!collapsed && (
        <div className="h-[calc(100vh-115px)] overflow-y-auto discord-scroll">
          {/* Avatar & Info */}
          <div className="flex flex-col items-center py-6 gap-2 border-b border-gray-200 dark:border-[#3F4246]">
            <Avatar className="h-20 w-20 ring-4 ring-white dark:ring-[#2B2D31] shadow-lg">
              <AvatarImage src={avatarUrl || '/default_user.jpg'} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl font-semibold">
                {displayName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="text-center px-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {displayName}
              </h3>
              {conversation?.type === 'direct' ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Người dùng
                </p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {participantsCount} thành viên
                </p>
              )}
            </div>
          </div>

          {/* Sections */}
          <div className="flex-1 py-2">
            {/* Tin nhắn đã ghim */}
            <SimpleSection
              icon={<Star className="w-5 h-5 text-amber-500" />}
              label="Tin nhắn đã ghim"
              onClick={() => setShowPinnedModal(true)}
            />

            {/* Media */}
            {mediaLoading ? (
              <SimpleSection
                icon={<Image className="w-5 h-5 text-pink-500" />}
                label="Đang tải..."
              />
            ) : (
              <SidebarAccordionSection
                type="media"
                title={`Ảnh & Video (${mediaData?.length || 0})`}
                items={mediaItems}
                onMediaClick={handleMediaClick}
              />
            )}

            {/* Files & Docs */}
            {filesLoading ? (
              <SimpleSection
                icon={<FolderOpen className="w-5 h-5 text-blue-500" />}
                label="Đang tải..."
              />
            ) : fileItems.length > 0 ? (
              <SidebarAccordionSection
                type="file"
                title={`Tệp & Tài liệu (${filesData?.length || 0})`}
                items={fileItems}
              />
            ) : (
              <SimpleSection
                icon={<FolderOpen className="w-5 h-5 text-blue-500" />}
                label={`Tệp & Tài liệu (0)`}
              />
            )}

            {/* Links */}
            {linksLoading ? (
              <SimpleSection
                icon={<LinkIcon className="w-5 h-5 text-indigo-500" />}
                label="Đang tải..."
              />
            ) : linkItems.length > 0 ? (
              <SidebarAccordionSection
                type="link"
                title={`Liên kết (${linkItems.length})`}
                items={linkItems}
              />
            ) : (
              <SimpleSection
                icon={<LinkIcon className="w-5 h-5 text-indigo-500" />}
                label={`Liên kết (0)`}
              />
            )}

            {/* Thành viên nhóm */}
            {conversation?.type === 'group' && (
              <SimpleSection
                icon={<Users className="w-5 h-5 text-green-500" />}
                label={`Thành viên (${participantsCount})`}
              />
            )}

            {/* Thông tin */}
            <SimpleSection
              icon={<Info className="w-5 h-5 text-gray-500" />}
              label="Thông tin"
              onClick={() => setShowGroupInfoModal(true)}
            />

            {/* Danger zone */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#3F4246]">
              <div className="px-3 space-y-1">
                {conversation?.type === 'group' && (
                  <>
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                    >
                      <AlertTriangle className="w-5 h-5" />
                      <span>Báo cáo nhóm</span>
                    </button>
                    <button
                      onClick={handleLeaveGroup}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Rời khỏi nhóm</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Conversation Modal */}
      {conversation?.type === 'group' && user?.id && (
        <ReportConversationModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          conversationId={conversation.id}
          reportedBy={user.id}
          conversationName={conversation.title || undefined}
        />
      )}

      {/* Transfer Admin Modal */}
      {conversation?.type === 'group' && user?.id && (
        <TransferAdminModal
          open={showTransferAdminModal}
          onClose={() => setShowTransferAdminModal(false)}
          conversationId={conversation.id}
          currentAdminId={user.id}
          onSuccess={handleTransferAdminSuccess}
        />
      )}

      {/* Pinned Messages Modal */}
      {conversation && (
        <PinnedMessagesModal
          open={showPinnedModal}
          onOpenChange={setShowPinnedModal}
          conversationId={conversation.id}
          onUnpin={() => {
            // Refresh handled by modal's realtime subscription
          }}
          onJumpTo={() => {
            // Jump to message not needed in this context
            setShowPinnedModal(false);
          }}
        />
      )}

      {/* Group Info Modal */}
      {conversation && user?.id && (
        <GroupInfoModal
          open={showGroupInfoModal}
          onOpenChange={setShowGroupInfoModal}
          conversation={conversation}
          currentUserId={user.id}
        />
      )}

      {/* Media Viewer Modal */}
      <MediaViewerModal
        open={showMediaViewer}
        onOpenChange={setShowMediaViewer}
        mediaItems={mediaItems}
        initialIndex={selectedMediaIndex}
      />
    </div>
  );
}

/** ---------- UI helpers (UI-only) ---------- */

function SimpleSection({
  icon,
  label,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#313338] transition-colors disabled:cursor-default"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      </div>
      <svg
        className="w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
}
