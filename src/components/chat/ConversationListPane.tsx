import {
  BellOff,
  Pin,
  UserPlus,
  Settings,
  Users,
  Clock,
  FileText,
  AlertTriangle,
  Trash2,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useParams } from 'react-router';
import { useAuth } from '@/stores/user';
import {
  useConversation,
  useConversationMedia,
  useConversationFiles,
  useConversationLinks
} from '@/hooks/useChat';
import { getAttachmentUrl } from '@/services/chatService';
import { useEffect, useState, useMemo } from 'react';

import SidebarDangerItem from '@/components/sidebar/SidebarDangerItem';
import { TooltipBtn } from '@/components/TooltipBtn';
import { SidebarAccordionSection } from '../sidebar/SidebarAccordionSection';
import { twMerge } from 'tailwind-merge';
import { supabaseUrl } from '@/lib/supabase';


export default function ConversationListPane() {
  const { user } = useAuth();
  const params = useParams();
  const conversationId = params.conversationId as string;

  const { data: conversation } = useConversation(conversationId);
  const { data: mediaData, isLoading: mediaLoading } = useConversationMedia(conversationId, 'both');
  const { data: filesData, isLoading: filesLoading } = useConversationFiles(conversationId);
  const { data: linksData, isLoading: linksLoading } = useConversationLinks(conversationId);

  const [mediaUrls, setMediaUrls] = useState<{ [key: string]: string }>({});
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') return document.documentElement.classList.contains('dark');
    return true;
  });

  // Theme toggle (UI-only, no app logic changed)
  const toggleTheme = () => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark');
    setIsDark(document.documentElement.classList.contains('dark'));
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
      ? otherParticipant?.profile.avatar_url
      : `${supabaseUrl}/storage/v1/object/public/chat-attachments/${conversation?.photo_url || 'default-group-photo.png'}`;

  const participantsCount = conversation?.participants.length || 0;

  // helpers (unchanged)
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) return 'Hôm nay';
    if (diffInHours < 48) return 'Hôm qua';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // data maps (unchanged)
  const mediaItems = useMemo(() => {
    const items = mediaData?.slice(0, 16).map((m) => ({ src: mediaUrls[m.id] || '/default-image.png' })) || [];
    return items;
  }, [mediaData, mediaUrls]);

  const fileItems = useMemo(() => {
    const items = filesData?.map((file) => {
      const fileName = file.storage_path.split('/').pop() || 'Unknown';
      const cleanName = fileName.replace(/^\d+_[a-z0-9]+\./, '');
      return {
        name: cleanName || fileName,
        size: formatFileSize(file.byte_size),
        time: formatTime((file as any).messages.created_at)
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
      <div className="flex flex-col border-l border-gray-200 bg-white dark:border-[#2B2D31] dark:bg-[#2B2D31]">
        <div className="p-4 border-b border-gray-200 dark:border-[#3F4246] sticky top-0 bg-white dark:bg-[#2B2D31] z-10 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-[#F2F3F5]">Thông tin cuộc trò chuyện</h2>
          <button
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm border border-gray-200 hover:bg-gray-50 active:scale-[.98] transition dark:border-[#3F4246] dark:hover:bg-[#313338] dark:text-[#DCDDDE]"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <p className="text-gray-500 dark:text-[#B5BAC1]">Chọn một cuộc trò chuyện để xem thông tin</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        flex flex-col border-l border-gray-200 bg-white
        dark:border-[#2B2D31] dark:bg-[#2B2D31]
      "
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
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-gray-800 dark:text-[#F2F3F5]">
            {conversation?.type === 'direct' ? 'Thông tin cuộc trò chuyện' : 'Thông tin nhóm'}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-[#B5BAC1] truncate">
            {conversation?.type === 'direct' ? 'Direct message' : 'Group details'}
          </p>
        </div>
      </div>

      <div className="h-[calc(100vh-59px)] overflow-y-auto discord-scroll">
        {/* Avatar & quick actions */}
        <div
          className="
            flex flex-col items-center py-3 gap-3
            border-b border-gray-100/70
            dark:border-[#3F4246]
            bg-white dark:bg-[#2B2D31]
          "
        >
          <div className="relative">
            <Avatar className="h-16 w-16 ring-2 ring-white shadow-sm shadow-black/5 dark:ring-[#2B2D31]">
              <AvatarImage src={avatarUrl || '/default_user.jpg'} />
              <AvatarFallback className="bg-gray-300 text-gray-700 dark:bg-[#404249] dark:text-white">
                {displayName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {/* Presence dot (visual only) */}
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#2B2D31] bg-emerald-500 shadow" />
          </div>

          <div className="text-center px-6">
            <p className="font-medium text-gray-900 dark:text-[#F2F3F5] truncate max-w-[220px]">{displayName}</p>
            {conversation?.type === 'group' && (
              <div className="mt-0.5 text-xs text-gray-500 dark:text-[#B5BAC1]">{participantsCount} thành viên</div>
            )}
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1">
          {/* Thành viên nhóm */}
          {conversation?.type === 'group' && (
            <SectionWrap>
              <SectionHeader>Thành viên</SectionHeader>
              <SidebarAccordionSection
                type="list"
                title="Thành viên nhóm"
                items={[
                  {
                    label: `${participantsCount} thành viên`,
                    icon: <Users className="size-5" />
                  }
                ]}
              />
            </SectionWrap>
          )}

          {/* Bảng tin nhóm */}
          <SectionWrap>
            <SectionHeader>Bảng tin</SectionHeader>
            <SidebarAccordionSection
              type="list"
              title="Bảng tin nhóm"
              items={[
                { label: 'Danh sách nhắc hẹn', icon: <Clock className="size-5" /> },
                { label: 'Ghi chú, ghim, bình chọn', icon: <FileText className="size-5" /> }
              ]}
            />
          </SectionWrap>

          {/* Ảnh/Video */}
          <SectionWrap>
            <SectionHeader>Phương tiện</SectionHeader>
            {mediaLoading ? (
              <RowLoading label="Đang tải ảnh/video..." />
            ) : mediaItems.length > 0 ? (
              <SidebarAccordionSection
                type="media"
                title={`Ảnh/Video (${mediaData?.length || 0})`}
                items={mediaItems}
              />
            ) : (
              <EmptyRow label="Chưa có ảnh/video" />
            )}
          </SectionWrap>

          {/* Files */}
          <SectionWrap>
            <SectionHeader>Tệp đính kèm</SectionHeader>
            {filesLoading ? (
              <RowLoading label="Đang tải files..." />
            ) : fileItems.length > 0 ? (
              <SidebarAccordionSection
                type="file"
                title={`File (${filesData?.length || 0})`}
                items={fileItems}
              />
            ) : (
              <EmptyRow label="Chưa có tệp" />
            )}
          </SectionWrap>

          {/* Links */}
          <SectionWrap>
            <SectionHeader>Liên kết</SectionHeader>
            {linksLoading ? (
              <RowLoading label="Đang tải links..." />
            ) : linkItems.length > 0 ? (
              <SidebarAccordionSection
                type="link"
                title={`Link (${linkItems.length})`}
                items={linkItems}
              />
            ) : (
              <EmptyRow label="Chưa có liên kết" />
            )}
          </SectionWrap>

          {/* Danger zone */}
          <div className="p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-600 dark:text-[#B5BAC1] mb-2">
              Thiết lập bảo mật
            </h3>
            <div className="flex flex-col gap-2">
              <SidebarDangerItem icon={AlertTriangle} label="Báo xấu" />
              {conversation?.type === 'group' && <SidebarDangerItem icon={LogOut} label="Rời nhóm" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ---------- UI helpers (UI-only) ---------- */

function SectionWrap({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={twMerge(
        'border-b border-gray-200/70 bg-white',
        'dark:border-[#2B2D31] dark:bg-[#313338]'
      )}
    >
      {children}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 pt-3">
      <div className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-gray-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-600 dark:bg-[#2B2D31] dark:text-[#B5BAC1]">
        {children}
      </div>
    </div>
  );
}

function RowLoading({ label }: { label: string }) {
  return (
    <div className="px-6 py-4">
      <p className="text-sm text-gray-500 dark:text-[#B5BAC1] flex items-center gap-2">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
        {label}
      </p>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="px-6 pb-4 pt-2">
      <p className="text-sm text-gray-400 dark:text-[#7A7D84]">{label}</p>
    </div>
  );
}

function ToolIcon({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <TooltipBtn
      icon={Icon}
      label={label}
      tooltipSide="bottom"
      className={twMerge(
        'discord-icon-btn text-gray-600 hover:text-gray-900',
        'dark:text-[#B5BAC1] dark:hover:text-white',
        // subtle surface for Discord-like feel
        'rounded-lg p-2 hover:bg-gray-100 active:scale-[.98]',
        'dark:hover:bg-[#313338]'
      )}
    />
  );
}
