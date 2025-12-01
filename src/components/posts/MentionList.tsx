import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getAvatarUrl } from '@/lib/supabase';

interface Friend {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

interface MentionListProps {
  show: boolean;
  onSelect: (friend: Friend) => void;
  onClose: () => void;
  searchQuery: string;
  currentUserId: string;
}

export const MentionList: React.FC<MentionListProps> = ({
  show,
  onSelect,
  onClose,
  searchQuery,
  currentUserId
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const mentionRef = useRef<HTMLDivElement>(null);
  const mentionItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Fetch friends
  const fetchFriends = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      console.log('🔍 Fetching friends for user:', currentUserId);
      
      const { data, error } = await supabase
        .from('friends')
        .select(`
          friend:profiles!friends_friend_id_fkey(
            id, display_name, username, avatar_url, is_private
          )
        `)
        .eq('user_id', currentUserId);

      console.log('📋 Friends query result:', { data, error });

      if (error) throw error;

      // Filter out friends who have privacy mode enabled
      const friendsList = data?.map(item => item.friend)
        .filter(Boolean)
        .filter((friend: any) => !friend.is_private) as Friend[] || [];
      console.log('👥 Processed friends list (excluding private users):', friendsList);
      setFriends(friendsList);
    } catch (error) {
      console.error('❌ Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Filter friends based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend =>
        friend.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
    setActiveMentionIndex(0);
  }, [friends, searchQuery]);

  // Fetch friends when component mounts
  useEffect(() => {
    if (show) {
      fetchFriends();
    }
  }, [show, fetchFriends]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!show || filteredFriends.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveMentionIndex(prev => 
          prev < filteredFriends.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredFriends.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredFriends[activeMentionIndex]) {
          onSelect(filteredFriends[activeMentionIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (show && filteredFriends.length > 0) {
      const activeItem = mentionItemRefs.current[activeMentionIndex];
      const container = mentionRef.current;

      if (activeItem && container) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const containerRect = container.getBoundingClientRect();
            const itemRect = activeItem.getBoundingClientRect();

            const visualOffset = itemRect.top - containerRect.top;
            const itemScrollTop = container.scrollTop + visualOffset;
            const itemHeight = activeItem.offsetHeight;
            const itemScrollBottom = itemScrollTop + itemHeight;

            const viewportTop = container.scrollTop;
            const viewportBottom = viewportTop + container.clientHeight;

            if (itemScrollTop < viewportTop) {
              container.scrollTo({
                top: itemScrollTop - 4,
                behavior: 'smooth'
              });
            } else if (itemScrollBottom > viewportBottom) {
              container.scrollTo({
                top: itemScrollBottom - container.clientHeight + 4,
                behavior: 'smooth'
              });
            }
          }, 0);
        });
      }
    }
  }, [activeMentionIndex, show, filteredFriends.length]);

  // Attach keyboard listener to document
  useEffect(() => {
    if (show) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [show, filteredFriends, activeMentionIndex]);

  console.log('🎯 MentionList render:', { show, loading, friendsCount: friends.length, filteredCount: filteredFriends.length });
  
  if (!show || loading) return null;

  return (
    <div
      ref={mentionRef}
      className="absolute z-50 w-72 max-h-64 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
    >
      {filteredFriends.length > 0 ? (
        filteredFriends.map((friend, index) => {
          const isActive = index === activeMentionIndex;
          const avatarUrl = getAvatarUrl(friend.avatar_url);
          
          return (
            <button
              key={friend.id}
              ref={(el) => {
                mentionItemRefs.current[index] = el;
              }}
              type="button"
              className={`w-full text-left px-3 py-2 flex items-center gap-2 ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => onSelect(friend)}
              onMouseEnter={() => setActiveMentionIndex(index)}
            >
              <img
                src={avatarUrl || '/default_user.jpg'}
                className="w-6 h-6 rounded-full object-cover"
                alt={friend.display_name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/default_user.jpg';
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {friend.display_name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  @{friend.username}
                </div>
              </div>
            </button>
          );
        })
      ) : (
        <div className="px-3 py-2 text-sm text-gray-500">
          Không tìm thấy bạn bè
        </div>
      )}
    </div>
  );
};
