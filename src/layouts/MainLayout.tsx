import { Outlet, useLocation } from 'react-router';
import Navbar from './Navbar';
import FriendsSidebar from '@/components/friends/FriendsSidebar';
import ConversatinList from '@/components/ConversatinList';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen dark:bg-gray-900 ">
      <Navbar />
      <Sidebar>
        {pathname.includes('friends') ? (
          <FriendsSidebar />
        ) : (
          <ConversatinList />
        )}
      </Sidebar>
      <Outlet />
    </div>
  );
}
