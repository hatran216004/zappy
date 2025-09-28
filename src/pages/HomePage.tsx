import ChatWindow from "@/layouts/ChatWindow";
import ContactBar from "@/layouts/ContactBar";
import Navbar from "@/layouts/Navbar";
import Sidebar from "@/layouts/Sidebar";

export default function HomePage() {
  return (
    <div className="flex h-screen dark:bg-gray-900">
      <Navbar />

      <ContactBar isContact={true} />

      <ChatWindow />

      <Sidebar />
    </div>
  );
}
