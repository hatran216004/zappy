import ChatWindow from '@/layouts/ChatWindow';
import ContactBar from '@/layouts/ContactBar';
import Navbar from '@/layouts/Navbar';
import Sidebar from '@/layouts/Sidebar';

export default function HomePage() {
  return (
    <div className="flex h-screen dark:bg-gray-900">
      <Navbar />

      <ContactBar />

      {/* <div className="flex-1 bg-white dark:bg-gray-800"></div> */}
      <ChatWindow />

      {/* <div className="w-[300px] border-l dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        </div> */}
      <Sidebar />
    </div>
  );
}
