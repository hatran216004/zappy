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
      <ContactBar isContact={true} />

      {/* Chat Window */}
      <ChatWindow />

      {/* Sidebar */}
      <Sidebar />
    </div>
  );
}

export default Layout;
