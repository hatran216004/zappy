// components/ConversationsList.tsx
// 🎨 Discord-like styling with DARK/LIGHT modes (UI-only, no logic changes)

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
import { UserAvatar } from "../UserAvatar";

interface ConversationsListProps {
  userId: string;
  selectedConversationId?: string;
  selectedFilter?: string | null;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  userId,
  selectedConversationId,
  selectedFilter = null,
}) => {
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations(userId);
  const { data: friends } = useFriends(userId);
  const getOrCreateConversation = useGetOrCreateDirectConversation();
  const [isCreating, setIsCreating] = useState(false);

  useFriendsRealtime(userId);
  useConversationsRealtime(userId);

  const handleSelectFriend = async (friendId: string) => {
    if (isCreating) return;
    try {
      setIsCreating(true);
      const conversationId = await getOrCreateConversation.mutateAsync({
        currentUserId: userId,
        otherUserId: friendId,
      });
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Error creating/opening conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter friends based on label if selectedFilter is set
  const filteredFriends = selectedFilter
    ? friends?.filter((friend) => friend.label_id?.includes(selectedFilter))
    : friends;

  // Filter conversations based on label if selectedFilter is set
  const filteredConversations = selectedFilter
    ? conversations?.filter((conv) => {
        // Only filter direct conversations (2 participants)
        if (conv.participants.length !== 2) return true; // Keep group conversations
        
        // Find the other participant (not current user)
        const otherParticipant = conv.participants.find((p) => p.user_id !== userId);
        if (!otherParticipant) return false;
        
        // Check if that participant is a friend with the selected label
        const friend = filteredFriends?.find((f) => f.id === otherParticipant.user_id);
        return friend !== undefined;
      })
    : conversations;

  const friendsWithoutConversation =
    filteredFriends?.filter((friend) => {
      const hasConversation = filteredConversations?.some((conv) => {
        if (conv.participants.length !== 2) return false;
        const hasFriend = conv.participants.some((p) => p.user_id === friend.id);
        const hasCurrentUser = conv.participants.some((p) => p.user_id === userId);
        return hasFriend && hasCurrentUser;
      });
      return !hasConversation;
    }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 text-gray-600 dark:text-[#B5BAC1]">
        Đang tải...
      </div>
    );
  }

  // Empty state: không có conversation và không có bạn bè
  if (filteredConversations?.length === 0 && filteredFriends?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white text-gray-900 dark:bg-[#1E1F22] dark:text-[#F2F3F5]">
        <div className="mb-4 text-gray-400 dark:text-[#B5BAC1]">
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
        <p className="font-medium mb-2">
          {selectedFilter ? 'Không có tin nhắn nào với nhãn này' : 'Chưa có tin nhắn nào'}
        </p>
        <p className="text-sm text-gray-500 dark:text-[#B5BAC1]">
          {selectedFilter ? 'Hãy thử chọn nhãn khác' : 'Hãy kết bạn để bắt đầu trò chuyện'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto bg-white text-gray-900 dark:bg-[#1E1F22] dark:text-[#F2F3F5]">
      {/* Danh sách conversations */}
      {filteredConversations && filteredConversations.length > 0 && (
        <>
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className="
                group relative transition-colors
                hover:bg-gray-100 dark:hover:bg-white/5
                data-[active=true]:bg-gray-200 dark:data-[active=true]:bg-[#404249]
              "
              data-active={conversation.id === selectedConversationId}
            >
              {/* Active pill (trái) */}
              <div
                className={`
                  absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full
                  ${conversation.id === selectedConversationId ? "h-8 bg-[#5865F2]" : "h-0 bg-transparent"}
                `}
              />
              <ConversationItem
                conversation={conversation}
                userId={userId}
                isSelected={conversation.id === selectedConversationId}
              />
            </div>
          ))}
        </>
      )}

      {/* Empty state cho conversations nếu chỉ có bạn bè */}
      {filteredConversations?.length === 0 && friendsWithoutConversation.length > 0 && (
        <div className="flex flex-col items-center justify-center p-6 text-center border-b border-gray-200 dark:border-[#2B2D31]">
          <div className="mb-3 text-gray-400 dark:text-[#B5BAC1]">
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
          <p className="font-medium mb-1 text-gray-900 dark:text-white">Chưa có tin nhắn nào</p>
          <p className="text-sm text-gray-500 dark:text-[#B5BAC1]">
            Chọn bạn bè bên dưới để bắt đầu trò chuyện
          </p>
        </div>
      )}

      {/* Danh sách bạn bè chưa có conversation */}
      {friendsWithoutConversation.length > 0 && (
        <div className="mt-2">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#B5BAC1]">
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
                <div className="flex items-center gap-3 px-3 py-2.5 transition-colors disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-white/5">
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
                      <p className="font-medium text-[15px] text-gray-900 dark:text-white truncate">
                        {friend.display_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-[13px] text-gray-500 dark:text-[#B5BAC1] truncate">
                        @{friend.username}
                      </p>
                    </div>
                  </div>
                </div>

                {/* divider */}
                <div className="mx-16 border-b border-gray-200 dark:border-[#2B2D31]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state khi đang tạo conversation */}
      {isCreating && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div className="rounded-lg p-4 shadow-xl border
                          bg-white text-gray-900 border-gray-200
                          dark:bg-[#2B2D31] dark:text-[#F2F3F5] dark:border-[#3F4246]">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
              <span>Đang tạo cuộc trò chuyện...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationsList;
