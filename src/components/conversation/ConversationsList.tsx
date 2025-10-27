// components/ConversationsList.tsx

import React, { useState } from "react";
import {
  useConversations,
  useConversationsRealtime,
  useGetOrCreateDirectConversation,
} from "@/hooks/useChat";
import ConversationItem from "./ConversationItem";
import { useFriends, useFriendsRealtime } from "@/hooks/useFriends";
import { useNavigate } from "react-router";
import { supabaseUrl } from "@/lib/supabase";

interface ConversationsListProps {
  userId: string;
  selectedConversationId?: string;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  userId,

  selectedConversationId,
}) => {
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations(userId);
  const { data: friends } = useFriends(userId);
  const getOrCreateConversation = useGetOrCreateDirectConversation();
  const [isCreating, setIsCreating] = useState(false);

  useFriendsRealtime(userId);
  useConversationsRealtime(userId);

  // Handle click vào bạn bè -> tạo hoặc mở conversation
  const handleSelectFriend = async (friendId: string) => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      const conversationId = await getOrCreateConversation.mutateAsync({
        currentUserId: userId,
        otherUserId: friendId,
      });

      // Navigate đến conversation
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Error creating/opening conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Lọc ra các bạn bè chưa có conversation
  const friendsWithoutConversation =
    friends?.filter((friend) => {
      // Check xem đã có conversation với friend này chưa
      const hasConversation = conversations?.some((conv) => {
        // Direct conversation: must have exactly 2 participants (current user + friend)
        if (conv.participants.length !== 2) return false;

        // Check if friend is in participants
        const hasFriend = conv.participants.some(
          (p) => p.user_id === friend.id
        );
        const hasCurrentUser = conv.participants.some(
          (p) => p.user_id === userId
        );

        return hasFriend && hasCurrentUser;
      });

      return !hasConversation;
    }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  // Empty state: không có conversation và không có bạn bè
  if (conversations?.length === 0 && friends?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">
          Chưa có tin nhắn nào
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Hãy kết bạn để bắt đầu trò chuyện
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {/* Danh sách conversations */}
      {conversations && conversations.length > 0 && (
        <>
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              userId={userId}
              isSelected={conversation.id === selectedConversationId}
            />
          ))}
        </>
      )}

      {/* Empty state cho conversations nếu chỉ có bạn bè */}
      {conversations?.length === 0 && friendsWithoutConversation.length > 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center border-b border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 dark:text-gray-500 mb-3">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
            Chưa có tin nhắn nào
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Chọn bạn bè bên dưới để bắt đầu trò chuyện
          </p>
        </div>
      )}

      {/* Danh sách bạn bè chưa có conversation */}
      {friendsWithoutConversation.length > 0 && (
        <div className="mt-2">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Bạn bè ({friendsWithoutConversation.length})
          </div>
          <div className="flex-1 overflow-y-auto">
            {friendsWithoutConversation.map((friend) => (
              <button
                key={friend.id}
                onClick={() => handleSelectFriend(friend.id)}
                className="w-full text-left"
                type="button"
                disabled={isCreating}
              >
                <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                  {/* Avatar + status dot */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={`${supabaseUrl}${friend.avatar_url}`}
                      alt={friend.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {friend.status === "online" && (
                      <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800" />
                    )}
                  </div>

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
            ))}
          </div>
        </div>
      )}

      {/* Loading state khi đang tạo conversation */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-700 dark:text-gray-300">
                Đang tạo cuộc trò chuyện...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationsList;
