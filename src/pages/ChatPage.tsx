import ConversationListPane from '@/components/chat/ConversationListPane';
import ChatWindow from '@/components/conversation/ChatWindow';
import { useAuth } from '@/stores/user';
import { useParams } from 'react-router';

function ChatPage() {
  const { user } = useAuth();
  const currentUserId = user?.id as string;
  const params = useParams();
  const selectedConversationId = params.conversationId;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-[#313338]">
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversationId ? (
          <ChatWindow userId={currentUserId} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-24 h-24 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Chào mừng đến với Zappy
              </h2>
              <p className="text-gray-500">
                Chọn một cuộc trò chuyện để bắt đầu nhắn tin
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="shrink-0">
        <ConversationListPane />
      </div>
    </div>
  );
}

export default ChatPage;
