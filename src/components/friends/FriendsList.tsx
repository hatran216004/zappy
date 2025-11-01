import { useState, useMemo } from "react";
import {
  useFriends,
  useRemoveFriend,
  useFriendsRealtime,
  useContactLabels
} from "../../hooks/useFriends";
import { useGetOrCreateDirectConversation } from "@/hooks/useChat";
import useUser from "@/hooks/useUser";
import FriendItem from "./FriendItem";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";

interface FriendsListProps {
  searchTerm?: string;
  selectedFilter?: string | null;
  sortBy?: string;
}

export const FriendsList = ({ searchTerm = '', selectedFilter = null, sortBy = 'Tên (A-Z)' }: FriendsListProps) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const userId = user?.id as string;
  const { data: friends, isLoading, error } = useFriends(userId);
  const { data: labels } = useContactLabels(userId);
  const removeFriendMutation = useRemoveFriend();
  const getOrCreateConversation = useGetOrCreateDirectConversation();
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  // Subscribe realtime
  useFriendsRealtime(userId);

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriendMutation.mutateAsync(friendId);
      setSelectedFriend(null);
      // Success - UI will update via query invalidation
    } catch (err: any) {
      console.error("Error removing friend:", err);
      // Show user-friendly error message
      const errorMessage = err?.message || "Không thể xóa bạn bè. Vui lòng thử lại.";
      toast.error(errorMessage);
    }
  };

  const handleMessage = async (friendId: string) => {
    if (isCreatingConversation) return;

    try {
      setIsCreatingConversation(true);
      const conversationId = await getOrCreateConversation.mutateAsync({
        currentUserId: userId,
        otherUserId: friendId,
      });

      // Navigate đến conversation
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Error creating/opening conversation:", error);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  // Filter, search and sort friends
  const filteredAndSortedFriends = useMemo(() => {
    if (!friends) return [];

    let result = [...friends];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (friend) =>
          friend.display_name.toLowerCase().includes(searchLower) ||
          friend.username.toLowerCase().includes(searchLower)
      );
    }

    // Apply label filter
    if (selectedFilter) {
      result = result.filter((friend) =>
        friend.label_id && friend.label_id.includes(selectedFilter)
      );
    }

    // Apply sorting
    if (sortBy === 'Tên (A-Z)') {
      result.sort((a, b) =>
        a.display_name.localeCompare(b.display_name, 'vi')
      );
    } else if (sortBy === 'Tên (Z-A)') {
      result.sort((a, b) =>
        b.display_name.localeCompare(a.display_name, 'vi')
      );
    }

    return result;
  }, [friends, searchTerm, selectedFilter, sortBy]);

  // Group friends by label
  const groupedFriends = useMemo(() => {
    return filteredAndSortedFriends.reduce((acc, friend) => {
      if (friend.label_id && friend.label_id.length > 0) {
        friend.label_id.forEach((labelId: string) => {
          if (!acc[labelId]) acc[labelId] = [];
          acc[labelId].push(friend);
        });
      } else {
        if (!acc["no_label"]) acc["no_label"] = [];
        acc["no_label"].push(friend);
      }
      return acc;
    }, {} as Record<string, typeof filteredAndSortedFriends>);
  }, [filteredAndSortedFriends]);

  // Get label name by ID
  const getLabelName = (labelId: string) => {
    const label = labels?.find((l) => l.id === labelId);
    return label?.name || 'Nhãn không xác định';
  };

  const LABEL_COLORS = [
    { value: 0, color: 'bg-gray-500' },
    { value: 1, color: 'bg-red-500' },
    { value: 2, color: 'bg-orange-500' },
    { value: 3, color: 'bg-yellow-500' },
    { value: 4, color: 'bg-green-500' },
    { value: 5, color: 'bg-blue-500' },
    { value: 6, color: 'bg-purple-500' },
    { value: 7, color: 'bg-pink-500' },
  ];

  const getLabelColor = (labelId: string) => {
    const label = labels?.find((l) => l.id === labelId);
    return LABEL_COLORS[label?.color || 0]?.color || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Đang tải danh sách bạn bè...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Có lỗi xảy ra khi tải danh sách bạn bè
      </div>
    );
  }

  if (!friends || friends.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          <svg
            className="w-20 h-20 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <p className="text-foreground/80 text-lg">Bạn chưa có bạn bè nào</p>
        <p className="text-muted-foreground text-sm mt-2">
          Hãy tìm kiếm và kết bạn với mọi người
        </p>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Empty search/filter result */}
      {filteredAndSortedFriends.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Không tìm thấy bạn bè nào
        </div>
      ) : (
        <div className="space-y-6">
          {/* If filtering by label, only show that label group */}
          {selectedFilter ? (
            groupedFriends?.[selectedFilter] && (
              <section>
                <div className="flex items-center gap-2 px-2 sm:px-0 mb-2">
                  <span
                    className={`w-2 h-2 rounded-full ${getLabelColor(selectedFilter)}`}
                  />
                  <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {getLabelName(selectedFilter)}
                  </h3>
                </div>
                <ul className="bg-card rounded-xl border border-border divide-y divide-border">
                  {groupedFriends[selectedFilter].map((friend) => (
                    <FriendItem
                      key={friend.id}
                      friend={friend}
                      onRemove={() => setSelectedFriend(friend.id)}
                      onMessage={handleMessage}
                    />
                  ))}
                </ul>
              </section>
            )
          ) : (
            <>
              {/* No label */}
              {groupedFriends?.["no_label"] && (
                <ul className="bg-card rounded-xl border border-border divide-y divide-border">
                  {groupedFriends["no_label"].map((friend) => (
                    <FriendItem
                      key={friend.id}
                      friend={friend}
                      onRemove={() => setSelectedFriend(friend.id)}
                      onMessage={handleMessage}
                    />
                  ))}
                </ul>
              )}

              {/* Labeled groups */}
              {Object.entries(groupedFriends || {})
                .filter(([key]) => key !== "no_label")
                .map(([labelId, friendsList]) => {
                  return (
                    <section key={labelId}>
                      <div className="flex items-center gap-2 px-2 sm:px-0 mb-2">
                        <span
                          className={`w-2 h-2 rounded-full ${getLabelColor(labelId)}`}
                        />
                        <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                          {getLabelName(labelId)}
                        </h3>
                      </div>
                      <ul className="bg-card rounded-xl border border-border divide-y divide-border">
                        {(friendsList ?? []).map((friend) => (
                          <FriendItem
                            key={friend.id}
                            friend={friend}
                            onRemove={() => setSelectedFriend(friend.id)}
                            onMessage={handleMessage}
                          />
                        ))}
                      </ul>
                    </section>
                  );
                })}
            </>
          )}
        </div>
      )}

      {/* Confirm remove modal */}
      {selectedFriend && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-card text-foreground rounded-xl max-w-md w-full p-6 border border-border shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Xóa bạn bè</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Bạn có chắc chắn muốn xóa người này khỏi danh sách bạn bè?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedFriend(null)}
                className="flex-1 h-9 px-4 rounded-lg border border-input bg-secondary text-foreground hover:bg-accent transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleRemoveFriend(selectedFriend)}
                disabled={removeFriendMutation.isPending}
                className="flex-1 h-9 px-4 rounded-lg bg-destructive text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {removeFriendMutation.isPending ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state khi đang tạo conversation */}
      {isCreatingConversation && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-foreground font-medium">
                Đang tạo cuộc trò chuyện...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsList;
