import { useState } from 'react';
import {
  useThreads,
  useJoinThread,
  useLeaveThread,
  useToggleThreadPin,
  useToggleThreadClose,
  useConversation,
  useThreadsRealtime
} from '@/hooks/useChat';
import { ThreadWithDetails } from '@/services/chatService';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { UserAvatar } from '@/components/UserAvatar';
import {
  MessageSquare,
  Users,
  Pin,
  Lock,
  Search,
  Plus,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { twMerge } from 'tailwind-merge';

interface ThreadListProps {
  conversationId: string;
  currentUserId: string;
  onSelectThread?: (thread: ThreadWithDetails) => void;
  onCreateThread?: () => void;
  selectedThreadId?: string;
}

export function ThreadList({
  conversationId,
  currentUserId,
  onSelectThread,
  onCreateThread,
  selectedThreadId
}: ThreadListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<
    'updated_at' | 'created_at' | 'message_count'
  >('updated_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<
    'all' | 'active' | 'closed' | 'pinned' | 'joined'
  >('all');

  const { data: threads, isLoading } = useThreads(
    conversationId,
    currentUserId,
    {
      sortBy,
      order,
      filter
    }
  );

  const joinThreadMutation = useJoinThread();
  const leaveThreadMutation = useLeaveThread();
  const togglePinMutation = useToggleThreadPin();
  const toggleCloseMutation = useToggleThreadClose();

  // Get user's role in conversation (for admin check)
  const { data: conversation } = useConversation(conversationId);
  const currentUserParticipant = conversation?.participants?.find(
    (p) => p.user_id === currentUserId
  );
  const isAdmin = currentUserParticipant?.role === 'admin';

  // Subscribe to real-time thread updates
  useThreadsRealtime(conversationId, currentUserId);

  // Filter threads by search query
  const filteredThreads =
    threads?.filter((thread) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        thread.title.toLowerCase().includes(query) ||
        thread.description?.toLowerCase().includes(query) ||
        thread.creator.display_name.toLowerCase().includes(query)
      );
    }) || [];

  const handleJoinThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await joinThreadMutation.mutateAsync({ threadId, userId: currentUserId });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleLeaveThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await leaveThreadMutation.mutateAsync({
        threadId,
        userId: currentUserId
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Chủ đề
          </h3>
          {onCreateThread && (
            <Button size="sm" onClick={onCreateThread} className="h-8">
              <Plus className="w-4 h-4 mr-1" />
              Tạo mới
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm chủ đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select
            value={filter}
            onValueChange={(value: any) => setFilter(value)}
          >
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="closed">Đã đóng</SelectItem>
              <SelectItem value="pinned">Đã ghim</SelectItem>
              <SelectItem value="joined">Đã tham gia</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value: any) => setSortBy(value)}
          >
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">Cập nhật</SelectItem>
              <SelectItem value="created_at">Tạo mới</SelectItem>
              <SelectItem value="message_count">Số tin nhắn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Threads List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Đang tải...</div>
        ) : filteredThreads.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? 'Không tìm thấy chủ đề nào' : 'Chưa có chủ đề nào'}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredThreads.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                currentUserId={currentUserId}
                isSelected={selectedThreadId === thread.id}
                isAdmin={isAdmin}
                onSelect={() => {
                  onSelectThread?.(thread);
                }}
                onJoin={(e) => handleJoinThread(thread.id, e)}
                onLeave={(e) => handleLeaveThread(thread.id, e)}
                onPin={(e) => {
                  e.stopPropagation();
                  togglePinMutation.mutate({
                    threadId: thread.id,
                    userId: currentUserId,
                    isPinned: !thread.is_pinned
                  });
                }}
                onClose={(e) => {
                  e.stopPropagation();
                  toggleCloseMutation.mutate({
                    threadId: thread.id,
                    userId: currentUserId,
                    isClosed: !thread.is_closed
                  });
                }}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface ThreadItemProps {
  thread: ThreadWithDetails;
  currentUserId: string;
  isSelected?: boolean;
  onSelect?: () => void;
  onJoin?: (e: React.MouseEvent) => void;
  onLeave?: (e: React.MouseEvent) => void;
  onPin?: (e: React.MouseEvent) => void;
  onClose?: (e: React.MouseEvent) => void;
}

function ThreadItem({
  thread,
  currentUserId,
  isSelected,
  onSelect,
  onJoin,
  onLeave,
  onPin,
  onClose,
  isAdmin = false
}: ThreadItemProps & { isAdmin?: boolean }) {
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );

      if (diffInMinutes < 1) return 'vừa xong';
      if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} giờ trước`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays} ngày trước`;
      const diffInWeeks = Math.floor(diffInDays / 7);
      if (diffInWeeks < 4) return `${diffInWeeks} tuần trước`;
      const diffInMonths = Math.floor(diffInDays / 30);
      if (diffInMonths < 12) return `${diffInMonths} tháng trước`;
      return `${Math.floor(diffInDays / 365)} năm trước`;
    } catch {
      return '';
    }
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg cursor-pointer transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        isSelected &&
          'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <UserAvatar
          avatarUrl={thread.creator.avatar_url}
          displayName={thread.creator.display_name}
          status={thread.creator.status}
          size="md"
          className="w-10 h-10 flex-shrink-0"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{thread.title}</h4>
              {thread.is_pinned && (
                <Pin className="w-3 h-3 text-yellow-500 flex-shrink-0" />
              )}
              {thread.is_closed && (
                <Lock className="w-3 h-3 text-gray-500 flex-shrink-0" />
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>

          {/* Description */}
          {thread.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-1">
              {thread.description}
            </p>
          )}

          {/* Last Message Preview */}
          {thread.last_message && (
            <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1 mb-1">
              {thread.last_message.sender.display_name}:{' '}
              {thread.last_message.content_text || 'Đã gửi file'}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {thread.message_count}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {thread.participant_count}
            </span>
            <span>{formatTime(thread.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Pin/Unpin button (only for creator or admin) */}
          {(thread.created_by === currentUserId || isAdmin) && onPin && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2"
              onClick={onPin}
              title={thread.is_pinned ? 'Bỏ ghim' : 'Ghim chủ đề'}
            >
              <Pin
                className={twMerge(
                  'w-3 h-3',
                  thread.is_pinned && 'text-yellow-500 fill-yellow-500'
                )}
              />
            </Button>
          )}

          {/* Close/Reopen button (only for creator or admin) */}
          {(thread.created_by === currentUserId || isAdmin) && onClose && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2"
              onClick={onClose}
              title={thread.is_closed ? 'Mở lại chủ đề' : 'Đóng chủ đề'}
            >
              <Lock
                className={twMerge(
                  'w-3 h-3',
                  thread.is_closed && 'text-red-500'
                )}
              />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {thread.is_closed ? (
            <span className="text-xs text-gray-500">Đã đóng</span>
          ) : thread.is_joined ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={onLeave}
            >
              Rời chủ đề
            </Button>
          ) : (
            <Button size="sm" className="h-7 text-xs" onClick={onJoin}>
              Tham gia
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
