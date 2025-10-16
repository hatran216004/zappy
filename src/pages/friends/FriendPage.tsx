import FriendsList from '@/components/friends/FriendsList';
import { FriendTopbarAction } from '@/components/friends/FriendTopbarAction';

export default function FriendPage() {
  return (
    <>
      <div className="my-2 select-none font-medium text-gray-700 dark:text-gray-200">
        Bạn bè ({2})
      </div>
      <FriendTopbarAction />
      <FriendsList />
    </>
  );
}
