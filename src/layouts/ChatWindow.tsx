import ChatFooter from "@/components/ChatWindow/ChatFooter";
import ChatHeader from "@/components/ChatWindow/ChatHeader";
import ChatMessages from "@/components/ChatWindow/ChatMessages";

export default function ChatWindow() {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <ChatHeader />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900">
        <ChatMessages />
      </div>

      {/* Footer */}
      <ChatFooter />
    </div>
  );
}
