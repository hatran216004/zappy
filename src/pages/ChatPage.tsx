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
    <div className="flex h-[calc(100vh-56px)] bg-gray-100 dark:bg-[#313338]">
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversationId ? (
          <ChatWindow userId={currentUserId} />
        ) : (
          <div
            data-tour-id="chat-window"
            className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#2B2D31]"
          >
            <div className="text-center px-6 max-w-md">
              <div className="text-gray-400 dark:text-[#B5BAC1] mb-6">
                <svg
                  className="w-28 h-28 mx-auto"
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
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-[#F2F3F5] mb-3">
                Chào mừng đến với Zappy
              </h2>
              <p className="text-base text-gray-600 dark:text-[#B5BAC1] mb-2">
                Chọn một cuộc trò chuyện từ danh sách bên phải
              </p>
              <p className="text-sm text-gray-500 dark:text-[#80838A]">
                hoặc tìm kiếm bạn bè để bắt đầu trò chuyện mới
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
