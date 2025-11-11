import { useState } from 'react';

import type { SearchUserResult } from '@/services/friendServices';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Mail, Search as SearchIcon } from 'lucide-react';
import useUser from '@/hooks/useUser';
import {
  useCancelFriendRequest,
  useSearchUsers,
  useSendFriendRequest
} from '@/hooks/useFriends';

export const FriendSearch = () => {
  const { user } = useUser();
  const currentUserId = user?.id;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const {
    data: users,
    isLoading,
    error
  } = useSearchUsers(
    searchTerm,
    currentUserId as string,
    searchTerm.length >= 2
  );

  const sendRequestMutation = useSendFriendRequest();
  const cancelRequestMutation = useCancelFriendRequest();

  const handleSendRequest = async (userId: string) => {
    try {
      await sendRequestMutation.mutateAsync({ userId, message });
      setMessage('');
      setSelectedUser(null);
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  };

  const handleCancelRequest = async (userId: string) => {
    try {
      await cancelRequestMutation.mutateAsync(userId);
    } catch (err) {
      console.error('Error canceling friend request:', err);
    }
  };

  const renderActionButton = (user: SearchUserResult) => {
    if (user.isFriend) {
      return (
        <span className="px-3 py-1 text-sm text-green-600 bg-green-50 rounded-full">
          Bạn bè
        </span>
      );
    }

    if (user.friendRequestStatus === 'pending') {
      return (
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
            Đã gửi lời mời
          </span>
          <button
            onClick={() => handleCancelRequest(user.id)}
            disabled={cancelRequestMutation.isPending}
            className="px-2 py-1 text-xs text-blue-600 border border-blue-400 bg-white rounded-full hover:bg-blue-50 disabled:opacity-50"
            type="button"
          >
            Hủy
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => setSelectedUser(user.id)}
        disabled={sendRequestMutation.isPending}
        className="px-3 py-1 text-sm text-white bg-[#0068ff] rounded-full hover:bg-[#005ae0] disabled:opacity-50"
      >
        Kết bạn
      </button>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                inputMode="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nhập username hoặc email để tìm kiếm..."
                className="w-full pl-9 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-[#0068ff]"
              />
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            </div>
            <Button
              variant="secondary"
              className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <SearchIcon className="w-4 h-4 mr-2" /> Tìm
            </Button>
          </div>
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-700" />

        <div className="p-3">
          {isLoading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Đang tìm kiếm...
            </div>
          )}
          {error && (
            <div className="text-center py-8 text-red-500">
              Có lỗi xảy ra khi tìm kiếm
            </div>
          )}
          {users && users.length === 0 && searchTerm.length >= 2 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Không tìm thấy người dùng nào
            </div>
          )}

          <ScrollArea className="h-[420px] pr-1">
            <div className="space-y-2">
              {users?.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                >
                  <Avatar className="w-12 h-12 ring-1 ring-gray-200 dark:ring-gray-700">
                    <AvatarImage
                      src={user.avatar_url || '/default-avatar.png'}
                      alt={user.display_name}
                    />
                    <AvatarFallback>
                      {user.display_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.display_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">
                        {user.bio}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {renderActionButton(user)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Modal gửi lời mời kết bạn */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={(o) => !o && setSelectedUser(null)}
      >
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle className="text-[15px] font-semibold">
              Gửi lời mời kết bạn
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 pt-4 pb-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập lời nhắn (tuỳ chọn)..."
              rows={4}
              className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus-visible:ring-[#0068ff]"
            />
          </div>

          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                setSelectedUser(null);
                setMessage('');
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={() => selectedUser && handleSendRequest(selectedUser)}
              disabled={sendRequestMutation.isPending}
              className="bg-[#0068ff] hover:bg-[#005ae0] text-white"
            >
              {sendRequestMutation.isPending ? 'Đang gửi...' : 'Gửi'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
