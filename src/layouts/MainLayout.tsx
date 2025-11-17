import { Outlet, useNavigate } from 'react-router';
import Navbar from './Navbar';
import { useAuth } from '@/stores/user';
import { useUserStatusTracker } from '@/hooks/useUserStatusTracker';
import { useCall } from '@/hooks/useCall';
import VideoCall from '@/components/VideoCall';
import { useEffect, useRef } from 'react';
import { useProfile } from '@/hooks/useProfile';
import authServices from '@/services/authServices';
import toast from 'react-hot-toast';
import OnboardingTour from '@/components/OnboardingTour';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function MainLayout() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile(user?.id as string);
  const previousIsDisabledRef = useRef<boolean | undefined>(undefined);
  const isLoggingOutRef = useRef(false);

  // Reset refs khi user thay đổi
  useEffect(() => {
    previousIsDisabledRef.current = undefined;
    isLoggingOutRef.current = false;
  }, [user?.id]);

  // Kiểm tra is_disabled khi profile được load hoặc thay đổi (realtime)
  useEffect(() => {
    if (!user || !profile) return;

    const currentIsDisabled = profile.is_disabled;
    const previousIsDisabled = previousIsDisabledRef.current;

    // Chỉ logout khi is_disabled thay đổi từ false -> true (hoặc undefined -> true)
    // Tránh logout nhiều lần nếu đã logout rồi
    if (currentIsDisabled && !isLoggingOutRef.current) {
      // Nếu lần đầu load và is_disabled = true, hoặc thay đổi từ false -> true
      if (previousIsDisabled === undefined || previousIsDisabled === false) {
        isLoggingOutRef.current = true;

        // User bị ban, logout ngay lập tức
        const handleBan = async () => {
          try {
            await authServices.logout();
            setUser(null);
            navigate('/login', { replace: true });
            toast.error(
              'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin qua email: hieuntadmin@gmail.com để được hỗ trợ.',
              { duration: 10000 }
            );
          } catch (error) {
            console.error('Error during logout:', error);
            // Force logout even if there's an error
            setUser(null);
            navigate('/login', { replace: true });
            toast.error(
              'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin qua email: hieuntadmin@gmail.com để được hỗ trợ.',
              { duration: 10000 }
            );
          }
        };
        handleBan();
      }
    }

    // Cập nhật previous value
    previousIsDisabledRef.current = currentIsDisabled;
  }, [user, profile, setUser, navigate]);

  // Tự động set status online khi user đã đăng nhập
  useUserStatusTracker({
    userId: user?.id as string,
    onStatusChange: () => {
      // console.log('🔔 Status changed:', status);
    }
  });

  // Lắng nghe video call
  const {
    activeCall,
    endCall,
    acceptCall,
    toggleMic,
    toggleCamera,
    micEnabled,
    cameraEnabled,
    remoteParticipants,
    localParticipant
  } = useCall(user?.id);

  // Onboarding tour
  const {
    currentStep,
    isActive,
    showCompletionBanner,
    nextStep,
    prevStep,
    skipTour,
    finishTour,
    setShowCompletionBanner
  } = useOnboarding(user?.id);

  return (
    <>
      <div className="h-[calc(100vh-56px)] flex dark:bg-gray-900">
        <div className="grid grid-cols-12 flex-1">
          <Outlet />
        </div>

        {/* Video Call Overlay */}
        {activeCall && (
          <VideoCall
            callInfo={activeCall.callInfo}
            participant={activeCall.participant}
            status={activeCall.status}
            onAcceptCall={acceptCall}
            onEndCall={endCall}
            onToggleMic={toggleMic}
            onToggleCamera={toggleCamera}
            micEnabled={micEnabled}
            cameraEnabled={cameraEnabled}
            remoteParticipants={remoteParticipants}
            localParticipant={localParticipant}
          />
        )}

        {/* Onboarding Tour */}
        <OnboardingTour
          currentStep={currentStep}
          isActive={isActive}
          showCompletionBanner={showCompletionBanner}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTour}
          onFinish={finishTour}
          onDismissBanner={() => setShowCompletionBanner(false)}
        />
      </div>
      <Navbar />
    </>
  );
}
