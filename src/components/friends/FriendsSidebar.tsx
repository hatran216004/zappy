import { BsPersonLinesFill } from 'react-icons/bs';
import { HiMiniUserGroup } from 'react-icons/hi2';
import { IoMdPersonAdd } from 'react-icons/io';
import SelectableButton from '../ContactBar/SelectableButton';

const sidebarButtons = [
  { label: 'Danh sách bạn bè', icon: BsPersonLinesFill, url: '/' },
  {
    label: 'Danh sách nhóm và cộng đồng',
    icon: HiMiniUserGroup,
    url: '/group'
  },
  { label: 'Lời mời kết bạn', icon: IoMdPersonAdd, url: '/requests' }
];

export default function FriendsSidebar() {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-custom">
      <div className="flex flex-col">
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
