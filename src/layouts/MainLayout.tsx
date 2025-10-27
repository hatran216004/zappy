import { Outlet } from 'react-router';
import Navbar from './Navbar';

export default function MainLayout() {
  return (
    <div className="h-screen flex dark:bg-gray-900">
      <Navbar />
      <div className="grid grid-cols-12 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
