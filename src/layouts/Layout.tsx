import ChatWindow from "./ChatWindow";
import ContactBar from "./ContactBar";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function Layout() {
  return (
    <div className="flex h-screen dark:bg-gray-900">
      {/* Navbar */}
      <Navbar />

      {/* ContactBar */}
      <ContactBar />

      {/* Chat Window */}
      {/* <div className="flex-1 bg-white dark:bg-gray-800"></div> */}
      <ChatWindow />

      {/* Sidebar */}
      {/* <div className="w-[300px] border-l dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      </div> */}
      <Sidebar />
    </div>
  );
}

export default Layout;
