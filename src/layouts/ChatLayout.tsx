import { Outlet } from 'react-router';
import ChatSidebar from './sidebar/ChatSidebar';

export default function ChatLayout() {
  return (
    <>
      <ChatSidebar />
      <main className="col-span-9">
        <Outlet />
      </main>
    </>
  );
}
