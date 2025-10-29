import React from 'react';
import { useFriends, useFriendsRealtime } from '@/hooks/useFriends';
import { Friend } from '@/services/friendServices';
import { supabaseUrl } from '@/lib/supabase';
import { UserAvatar } from '../UserAvatar';

interface FriendsListForChatProps {
  userId: string;
  onSelectFriend: (friendId: string) => void;
}

const FriendsListForChat: React.FC<FriendsListForChatProps> = ({
  userId,
  onSelectFriend
}) => {
  const { data: friends } = useFriends(userId);
  useFriendsRealtime(userId);

  return (
    <div className="flex-1 overflow-y-auto">
      {friends?.map((friend: Friend) => {
        return (
          <button
            key={friend.id}
            onClick={() => onSelectFriend(friend.id)}
            className="w-full text-left"
            type="button"
          >
            <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {/* Avatar + status dot */}
              <UserAvatar
                avatarUrl={friend.avatar_url}
                displayName={friend.display_name}
                status={friend.status}
                size="sm"
                showStatus={true}
                className="w-10 h-10"
              />

              {/* Text area */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[15px] text-gray-900 dark:text-gray-100 truncate">
                    {friend.display_name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate">
                    @{friend.username}
                  </p>
                </div>
              </div>
            </div>

            {/* divider mảnh kiểu Zalo */}
            <div className="mx-16 border-b border-gray-100 dark:border-gray-800" />
          </button>
        );
      })}
    </div>
  );
};

export default FriendsListForChat;
