import FriendHeading from '@/components/friends/FriendHeading';
import FriendsList from '@/components/friends/FriendsList';
import { FriendTopbarAction } from '@/components/friends/FriendTopbarAction';
import { BsPersonLinesFill } from 'react-icons/bs';

export default function FriendPage() {
  return (
    <>
      <FriendHeading>
        <BsPersonLinesFill />
        <span> Danh sách bạn bè</span>
      </FriendHeading>
      <div className="my-2 select-none font-medium text-gray-700 dark:text-gray-200">
        Bạn bè ({2})
      </div>
      <FriendTopbarAction />
      <FriendsList />
    </>
  );
}
