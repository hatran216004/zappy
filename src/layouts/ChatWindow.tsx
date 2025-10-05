import ChatFooter from "@/components/ChatWindow/ChatFooter";
import ChatHeader from "@/components/ChatWindow/ChatHeader";
import ChatMessages from "@/components/ChatWindow/ChatMessages";
import ContactWindow from "./ContactWindow";
import Sidebar from "./Sidebar";

type ChatWindowProps = {
  currentTab: string;
  contentContact: { id?: string; title?: string; icon?: React.ElementType };
};

export default function ChatWindow({
  currentTab,
  contentContact,
}: ChatWindowProps) {
  return (
    <>
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {/* Header */}
        <ChatHeader currentTab={currentTab} contentContact={contentContact} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-custom px-4 pt-4 bg-gray-100 dark:bg-gray-900">
          {currentTab === "ContactList" ? <ContactWindow /> : <ChatMessages />}
        </div>

        {/* Footer */}
        {currentTab === "ContactList" ? null : <ChatFooter />}
      </div>
      {currentTab === "ContactList" ? null : <Sidebar />}
    </>
  );
}
