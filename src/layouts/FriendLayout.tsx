import { Outlet } from 'react-router';
import FriendSidebar from './sidebar/FriendSidebar';

export default function FriendLayout() {
  return (
    <>
      <FriendSidebar />
      <main className="col-span-9 p-4 h-[calc(100vh-56px)] overflow-y-auto">
        <Outlet />
      </main>
    </>
  );
}
