import FriendHeading from '@/components/friends/FriendHeading';
import { BsPersonLinesFill } from 'react-icons/bs';
import { Outlet } from 'react-router';

export default function FriendLayout() {
  return (
    <div className="flex-1 p-4 flex flex-col h-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-sm">
      <FriendHeading>
        <BsPersonLinesFill />
        <span> Danh sách bạn bè</span>
      </FriendHeading>
      <Outlet />
    </div>
  );
}
