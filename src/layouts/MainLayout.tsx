import { Outlet } from 'react-router';
import Navbar from './Navbar';
import { useAuth } from '@/stores/user';
import { useUserStatusTracker } from '@/hooks/useUserStatusTracker';

export default function MainLayout() {
  const { user } = useAuth();
  
  // Tự động set status online khi user đã đăng nhập
  useUserStatusTracker({
    userId: user?.id as string,
    onStatusChange: (status) => {
      console.log('🔔 Status changed:', status);
    }
  });

  return (
    <div className="h-screen flex dark:bg-gray-900">
      <Navbar />
      <div className="grid grid-cols-12 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
