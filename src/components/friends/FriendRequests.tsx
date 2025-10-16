import {
  usePendingFriendRequests,
  useFriendRequestsRealtime
} from '../../hooks/useFriends';
import useUser from '@/hooks/useUser';
import { Separator } from '../ui/separator';
import FriendRequestItem from './FriendRequestItem';

export const FriendRequests = () => {
  const { user } = useUser();
  const userId = user?.id;

  const { data: requests, isLoading } = usePendingFriendRequests(
    userId as string
  );

  // Subscribe to realtime updates
  useFriendRequestsRealtime(userId as string);

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Đang tải...</div>;
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Không có lời mời kết bạn nào
      </div>
    );
  }

  return (
    <div className="mx-auto w-full rounded-xl border border-zinc-200 bg-white">
      <Separator />

      {/* List */}
      <ul className="divide-y divide-zinc-100">
        {requests.map((request) => (
          <FriendRequestItem request={request} />
        ))}
      </ul>
    </div>
  );
};
