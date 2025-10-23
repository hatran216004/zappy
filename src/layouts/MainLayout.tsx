import { Outlet } from 'react-router';
import Navbar from './Navbar';

export default function MainLayout() {
  return (
    <div className="flex h-screen dark:bg-gray-900 ">
      <Navbar />
      <Outlet />
    </div>
  );
}
