import { Search, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import {
  searchUsersByUsername,
  type SearchUserResult
} from '@/services/friendServices';
import useUser from '@/hooks/useUser';
import { UserAvatar } from './UserAvatar';
import { useNavigate } from 'react-router';
import { useGetOrCreateDirectConversation } from '@/hooks/useChat';
import toast from 'react-hot-toast';
import { useSendFriendRequest } from '@/hooks/useFriends';
import {
  searchConversations,
  type ConversationSearchResult
} from '@/services/chatService';

export default function SearchBar() {
  const { user } = useUser();
  const userId = user?.id as string;
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [conversationResults, setConversationResults] = useState<
    ConversationSearchResult[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const getOrCreateConversation = useGetOrCreateDirectConversation();
  const sendFriendRequestMutation = useSendFriendRequest();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search with debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const term = searchTerm.trim();
        const [userRes, convoRes] = await Promise.all([
          searchUsersByUsername(term, userId),
          searchConversations(userId, term)
        ]);
        setSearchResults(userRes);
        setConversationResults(convoRes);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Lỗi khi tìm kiếm');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, userId]);

  const handleSendMessage = async (targetUserId: string) => {
    try {
      const conversationId = await getOrCreateConversation.mutateAsync({
        currentUserId: userId,
        otherUserId: targetUserId
      });
      navigate(`/chat/${conversationId}`);
      setSearchTerm('');
      setShowResults(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Không thể mở tin nhắn');
    }
  };

  const handleAddFriend = async (targetUserId: string) => {
    try {
      await sendFriendRequestMutation.mutateAsync({ userId: targetUserId });
      toast.success('Đã gửi lời mời kết bạn');
      // Refresh search results
      const results = await searchUsersByUsername(searchTerm.trim(), userId);
      setSearchResults(results);
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Không thể gửi lời mời kết bạn');
    }
  };

  const getActionButton = (user: SearchUserResult) => {
    if (user.isFriend) {
      return (
        <button
          onClick={() => handleSendMessage(user.id)}
          className="px-3 py-1.5 text-xs rounded-md bg-[#5865F2] text-white hover:bg-[#4752C4] transition"
        >
          Nhắn tin
        </button>
      );
    }

    if (user.friendRequestStatus === 'pending') {
      return (
        <span className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400">
          Đã gửi lời mời
        </span>
      );
    }

    return (
      <button
        onClick={() => handleAddFriend(user.id)}
        disabled={sendFriendRequestMutation.isPending}
        className="px-3 py-1.5 text-xs rounded-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
      >
        Kết bạn
      </button>
    );
  };

  return (
    <div
      data-tour-id="searchbar"
      className="
        relative flex items-center
        bg-white text-gray-900
        dark:bg-[#2B2D31] dark:text-[#F2F3F5]
      "
      ref={searchRef}
    >
      {/* Search input */}
      <div
        className="
          group flex items-center flex-1 gap-2
          rounded-lg px-3 h-10
          bg-gray-100 text-gray-900
          border border-transparent
          focus-within:border-[#5865F2] focus-within:ring-4 focus-within:ring-[#5865F2]/20
          dark:bg-[#1E1F22] dark:text-[#F2F3F5]
          dark:focus-within:border-[#5865F2] dark:focus-within:ring-[#5865F2]/25
          transition-colors
        "
      >
        {isSearching ? (
          <Loader2 className="h-4 w-4 text-gray-400 dark:text-[#B5BAC1] shrink-0 animate-spin" />
        ) : (
          <Search className="h-4 w-4 text-gray-400 dark:text-[#B5BAC1] shrink-0" />
        )}
        <input
          type="text"
          placeholder="Tìm kiếm trên Messenger"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          className="
            flex-1 bg-transparent text-sm leading-none
            placeholder:text-gray-500 dark:placeholder:text-[#B5BAC1]
            focus:outline-none
          "
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults &&
        (searchResults.length > 0 || conversationResults.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 max-h-[400px] overflow-y-auto bg-white dark:bg-[#2B2D31] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            {conversationResults.length > 0 && (
              <>
                <div className="px-3 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Cuộc trò chuyện ({conversationResults.length})
                </div>
                {conversationResults.map((c) => (
                  <div
                    key={`c-${c.id}`}
                    onClick={() => {
                      navigate(`/chat/${c.id}`);
                      setShowResults(false);
                      setSearchTerm('');
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                  >
                    <UserAvatar
                      avatarUrl={
                        c.type === 'group'
                          ? c.photo_url || '/default-image.png'
                          : c.other_participant?.avatar_url
                      }
                      displayName={c.title}
                      status={c.other_participant?.status || undefined}
                      size="sm"
                      showStatus={c.type === 'direct'}
                      className="w-9 h-9"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {c.title}
                      </p>
                      {c.last_message_preview && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {c.last_message_preview}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              </>
            )}

            <div className="px-3 pt-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Người dùng ({searchResults.length})
            </div>
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <UserAvatar
                  avatarUrl={result.avatar_url}
                  displayName={result.display_name}
                  status={result.status}
                  size="sm"
                  showStatus={true}
                  className="w-10 h-10"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {result.display_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{result.username}
                  </p>
                </div>
                {getActionButton(result)}
              </div>
            ))}
          </div>
        )}

      {/* No results */}
      {showResults &&
        searchTerm.length >= 2 &&
        searchResults.length === 0 &&
        conversationResults.length === 0 &&
        !isSearching && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2B2D31] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Không tìm thấy người dùng nào
            </p>
          </div>
        )}
    </div>
  );
}
