import { useState } from 'react';
import FriendHeading from '@/components/friends/FriendHeading';
import FriendsList from '@/components/friends/FriendsList';
import { FriendTopbarAction } from '@/components/friends/FriendTopbarAction';
import { BsPersonLinesFill } from 'react-icons/bs';
import { useFriends } from '@/hooks/useFriends';
import useUser from '@/hooks/useUser';

export default function FriendPage() {
  const { user } = useUser();
  const userId = user?.id as string;
  const { data: friends } = useFriends(userId);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('Tên (A-Z)');

  // Count filtered friends for display
  const friendCount = friends?.length || 0;

  return (
    <>
      <FriendHeading>
        <BsPersonLinesFill />
        <span> Danh sách bạn bè</span>
      </FriendHeading>
      <div className="my-2 select-none font-medium text-gray-700 dark:text-gray-200">
        Bạn bè ({friendCount})
      </div>
      <FriendTopbarAction
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      <FriendsList
        searchTerm={searchTerm}
        selectedFilter={selectedFilter}
        sortBy={sortBy}
      />
    </>
  );
}
