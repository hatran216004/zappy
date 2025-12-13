import SelectableButton from '@/components/ContactBar/SelectableButton';
import { BsPersonLinesFill } from 'react-icons/bs';
import { HiMiniUserGroup } from 'react-icons/hi2';
import { IoMdPersonAdd } from 'react-icons/io';
import { usePendingFriendRequests, useFriendRequestsRealtime } from '@/hooks/useFriends';
import { useAuth } from '@/stores/user';

const sidebarButtons = [
  { label: 'Danh sách bạn bè', icon: BsPersonLinesFill, url: '/friends' },
  {
    label: 'Danh sách nhóm',
    icon: HiMiniUserGroup,
    url: '/friends/group'
  },
  { label: 'Lời mời kết bạn', icon: IoMdPersonAdd, url: '/friends/requests', showBadge: true }
];

export default function FriendSidebar() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: friendRequests } = usePendingFriendRequests(userId as string);

  // Subscribe to realtime updates for friend requests
  useFriendRequestsRealtime(userId as string);

  // Count friend requests for badge
  const friendRequestCount = friendRequests?.length || 0;

  return (
    <div className="col-span-3 overflow-y-auto scrollbar-custom border-r h-[calc(100vh-56px)]">
      <div className="flex flex-col border-t">
        {sidebarButtons.map((link, index) => (
          <SelectableButton
            key={index}
            label={link.label}
            icon={link.icon}
            url={link.url}
            badgeCount={link.showBadge ? friendRequestCount : undefined}
          />
        ))}
      </div>
    </div>
  );
}
