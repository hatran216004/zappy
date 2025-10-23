// components/ConversationsList.tsx
import React from 'react';
import { useConversations, useConversationsRealtime } from '@/hooks/useChat';
import ConversationItem from './ConversationItem';
import { useFriends, useFriendsRealtime } from '@/hooks/useFriends';
import FriendsListForChat from '../friends/FriendsListForChat';

interface ConversationsListProps {
  userId: string;
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onSelectFriend: (friendId: string) => Promise<void>;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  userId,
  selectedConversationId,
  onSelectConversation,
  onSelectFriend
}) => {
  const { data: conversations, isLoading } = useConversations(userId);
  const { data: friends } = useFriends(userId);
  useFriendsRealtime(userId);

  // Subscribe to realtime updates
  useConversationsRealtime(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if ((!conversations || conversations.length === 0) && friends?.length === 0) {
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
        <p className="text-gray-500">Chưa có tin nhắn nào</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {conversations?.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          userId={userId}
          isSelected={conversation.id === selectedConversationId}
          onClick={() => onSelectConversation(conversation.id)}
        />
      ))}
      {/* <FriendsListForChat userId={userId} onSelectFriend={onSelectFriend} /> */}
    </div>
  );
};

export default ConversationsList;
