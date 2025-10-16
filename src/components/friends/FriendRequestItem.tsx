import { FriendRequest, Profile } from '@/services/friendServices';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  useAcceptFriendRequest,
  useRejectFriendRequest
} from '@/hooks/useFriends';
import { Button } from '../ui/button';

export default function FriendRequestItem({
  request
}: {
  request: FriendRequest & { from_user: Profile };
}) {
  const acceptMutation = useAcceptFriendRequest();
  const rejectMutation = useRejectFriendRequest();

  const handleAccept = async (fromUserId: string) => {
    try {
      await acceptMutation.mutateAsync(fromUserId);
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  };

  const handleReject = async (fromUserId: string) => {
    try {
      await rejectMutation.mutateAsync(fromUserId);
    } catch (err) {
      console.error('Error rejecting friend request:', err);
    }
  };

  return (
    <li
      key={request.id}
      className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-50/80 transition-colors"
    >
      {/* Avatar tròn 44px giống Zalo */}
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage
          src={request.from_user.avatar_url || '/default-avatar.png'}
          alt={request.from_user.display_name}
        />
        <AvatarFallback>
          {request.from_user.display_name?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[15px] font-medium text-zinc-900">
            {request.from_user.display_name}
          </p>
        </div>
        <p className="truncate text-[13px] leading-5 text-zinc-500">
          @{request.from_user.username}
        </p>

        {request.message && (
          <p className="mt-1 line-clamp-2 rounded-md bg-zinc-50 px-2 py-1 text-[13px] text-zinc-700">
            “{request.message}”
          </p>
        )}

        <p className="mt-1 text-[12px] text-zinc-400">
          {new Date(request.created_at).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {/* Actions kiểu Zalo: 2 nút nằm ngang, cao 32px, chữ đậm nhẹ */}
      <div className="flex shrink-0 items-center gap-2">
        <Button
          onClick={() => handleAccept(request.from_user_id)}
          disabled={acceptMutation.isPending || rejectMutation.isPending}
          className="h-8 px-3 text-[13px] font-semibold"
        >
          {acceptMutation.isPending ? 'Đang xử lý...' : 'Chấp nhận'}
        </Button>
        <Button
          onClick={() => handleReject(request.from_user_id)}
          disabled={acceptMutation.isPending || rejectMutation.isPending}
          variant="outline"
          className="h-8 px-3 text-[13px] font-medium text-zinc-700"
        >
          Từ chối
        </Button>
      </div>
    </li>
  );
}
