import ChatWindow from "@/layouts/ChatWindow";
import ContactBar from "@/layouts/ContactBar";
import Navbar from "@/layouts/Navbar";
import Sidebar from "@/layouts/Sidebar";
import { useState } from "react";

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState("ChatList");
  const [contentContact, setContentContact] = useState<{
    id?: string;
    title?: string;
    icon?: React.ElementType;
  }>({});

  return (
    <div className="flex h-screen dark:bg-gray-900 ">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <ContactBar
        currentTab={currentTab}
        setContentContact={setContentContact}
      />

      <ChatWindow currentTab={currentTab} contentContact={contentContact} />

      {currentTab === "ContactList" ? null : <Sidebar />}
    </div>
  );
}
