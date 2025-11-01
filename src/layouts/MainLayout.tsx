import { Outlet } from 'react-router';
import Navbar from './Navbar';
import { useAuth } from '@/stores/user';
import { useUserStatusTracker } from '@/hooks/useUserStatusTracker';
import { useCall } from '@/hooks/useCall';
import VideoCall from '@/components/VideoCall';

export default function MainLayout() {
  const { user } = useAuth();
  
  // Tự động set status online khi user đã đăng nhập
  useUserStatusTracker({
    userId: user?.id as string,
    onStatusChange: (status) => {
      console.log('🔔 Status changed:', status);
    }
  });

  // Lắng nghe video call
  const { activeCall, endCall } = useCall(user?.id);

  return (
    <div className="h-screen flex dark:bg-gray-900">
      <Navbar />
      <div className="grid grid-cols-12 flex-1">
        <Outlet />
      </div>
      
      {/* Video Call Overlay */}
      {activeCall && (
        <VideoCall
          callInfo={activeCall.callInfo}
          participant={activeCall.participant}
          onEndCall={endCall}
        />
      )}
    </div>
  );
}
