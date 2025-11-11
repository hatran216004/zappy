import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/UserAvatar';
import { searchUsers, startChatWithUser } from '@/services/chatService';
import toast from 'react-hot-toast';
import { Search, MessageCircle, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchUsersModalProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
}

export function SearchUsersModal({
  open,
  onClose,
  currentUserId,
}: SearchUsersModalProps) {
  const [search, setSearch] = useState('');
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const navigate = useNavigate();

  // Debounce search query
  const debouncedSearch = useDebounce(search, 500);

  // Search users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['searchUsers', debouncedSearch, currentUserId],
    queryFn: () => searchUsers(debouncedSearch, currentUserId),
    enabled: debouncedSearch.length >= 2,
  });

  const handleStartChat = async (userId: string) => {
    setStartingChat(userId);
    try {
      const conversation = await startChatWithUser(userId);
      onClose();
      setSearch('');
      navigate(`/chat/${conversation.id}`);
      toast.success('Đã mở cuộc trò chuyện');
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Không thể bắt đầu cuộc trò chuyện');
    } finally {
      setStartingChat(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tìm kiếm người dùng</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm theo tên hoặc @username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Users list */}
        <ScrollArea className="h-[400px] pr-4">
          {search.length < 2 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Search className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">
                Tìm kiếm người dùng
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Nhập ít nhất 2 ký tự để bắt đầu tìm kiếm
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Search className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">
                Không tìm thấy người dùng
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Thử tìm kiếm với từ khóa khác
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleStartChat(user.id)}
                  disabled={startingChat === user.id}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg
                    hover:bg-gray-100 dark:hover:bg-gray-800
                    transition-colors text-left
                    border-2 border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <UserAvatar
                    avatarUrl={user.avatar_url}
                    displayName={user.display_name || user.username}
                    size="md"
                    showStatus={false}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {user.display_name || user.username}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      @{user.username}
                    </p>
                    {user.status && (
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {user.status}
                      </p>
                    )}
                  </div>
                  {startingChat === user.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  ) : (
                    <MessageCircle className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            Bạn có thể nhắn tin với bất kỳ ai, kể cả người lạ
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

