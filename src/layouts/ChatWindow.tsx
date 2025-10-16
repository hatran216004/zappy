import ConversationListPane from '@/components/chat/ConversationListPane';
import ChatFooter from '@/components/ChatWindow/ChatFooter';
import ChatHeader from '@/components/ChatWindow/ChatHeader';
import ChatMessages from '@/components/ChatWindow/ChatMessages';

export default function ChatWindow() {
  return (
    <>
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        <ChatHeader />
        <ChatMessages />
        <ChatFooter />
      </div>
      <ConversationListPane />
    </>
  );
}
