import SelectableButton from '@/components/ContactBar/SelectableButton';
import { BsPersonLinesFill } from 'react-icons/bs';
import { HiMiniUserGroup } from 'react-icons/hi2';
import { IoMdPersonAdd } from 'react-icons/io';

const sidebarButtons = [
  { label: 'Danh sách bạn bè', icon: BsPersonLinesFill, url: '/friends' },
  {
    label: 'Danh sách nhóm',
    icon: HiMiniUserGroup,
    url: '/friends/group'
  },
  { label: 'Lời mời kết bạn', icon: IoMdPersonAdd, url: '/friends/requests' }
];

export default function FriendSidebar() {
  return (
    <div className="col-span-3 overflow-y-auto scrollbar-custom border-r">
      <div className="flex flex-col border-t">
        {sidebarButtons.map((link, index) => (
          <SelectableButton
            key={index}
            label={link.label}
            icon={link.icon}
            url={link.url}
          />
        ))}
      </div>
    </div>
  );
}
