import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

const ONBOARDING_STORAGE_KEY = 'zappy_onboarded';

export interface OnboardingStep {
  id: string;
  target: string; // CSS selector hoặc data-tour-id
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

// Định nghĩa các bước onboarding tour
export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    target: 'body',
    title: 'Chào mừng đến với Zappy! 🎉',
    content:
      'Chào mừng bạn đến với Zappy. Hãy cùng khám phá nhanh các tính năng quan trọng nhé!',
    position: 'center'
  },
  {
    id: 'navbar',
    target: '[data-tour-id="navbar"]',
    title: 'Thanh điều hướng',
    content:
      'Đây là thanh điều hướng chính. Bạn có thể truy cập Tin nhắn, Danh bạ, Tìm kiếm và các tính năng khác từ đây.',
    position: 'right'
  },
  {
    id: 'searchbar',
    target: '[data-tour-id="searchbar"]',
    title: 'Thanh tìm kiếm',
    content:
      'Sử dụng thanh tìm kiếm để tìm người dùng, cuộc trò chuyện hoặc thêm bạn bè mới.',
    position: 'right'
  },
  {
    id: 'conversations',
    target: '[data-tour-id="conversations"]',
    title: 'Danh sách cuộc trò chuyện',
    content:
      'Xem tất cả cuộc trò chuyện của bạn ở đây. Click vào bất kỳ cuộc trò chuyện nào để bắt đầu nhắn tin.',
    position: 'left'
  },
  {
    id: 'chat-window',
    target: '[data-tour-id="chat-window"]',
    title: 'Cửa sổ chat',
    content:
      'Đây là nơi bạn sẽ nhắn tin với bạn bè. Bạn có thể gửi tin nhắn, hình ảnh, file và nhiều hơn nữa.',
    position: 'left'
  }
];

/**
 * Hook kiểm tra trạng thái onboarding từ database
 */
export const useOnboardingStatus = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['onboarding-status', userId],
    queryFn: async () => {
      if (!userId) return { isOnboarded: false };

      // Kiểm tra local storage trước (nhanh hơn)
      const localStatus = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (localStatus === 'true') {
        return { isOnboarded: true };
      }

      try {
        // Kiểm tra từ database
        const { data, error } = await supabase
          .from('profiles')
          .select('is_onboarded')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching onboarding status:', error);
          // Nếu không tìm thấy profile hoặc lỗi, coi như chưa onboard
          return { isOnboarded: false };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isOnboarded = (data as any)?.is_onboarded;
        // Nếu null hoặc undefined, coi như false (chưa onboard)
        return { isOnboarded: isOnboarded === true };
      } catch (error) {
        console.error('Error in useOnboardingStatus:', error);
        // Nếu có lỗi, coi như chưa onboard để đảm bảo tour hiển thị
        return { isOnboarded: false };
      }
    },
    enabled: !!userId,
    staleTime: Infinity // Không cần refetch
  });
};

/**
 * Hook đánh dấu đã hoàn thành onboarding
 */
export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      try {
        // Lưu vào database
        const { error: dbError } = await supabase
          .from('profiles')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ is_onboarded: true } as any)
          .eq('id', userId);

        if (dbError) {
          console.error('Error updating onboarding status:', dbError);
          // Fallback to local storage
          localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
          throw dbError;
        }

        // Cũng lưu vào local storage để backup
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      } catch (error) {
        console.error('Error in useCompleteOnboarding:', error);
        // Fallback to local storage
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        throw error;
      }
    },
    onSuccess: (_, userId) => {
      // Cập nhật cache
      queryClient.setQueryData(['onboarding-status', userId], {
        isOnboarded: true
      });
      queryClient.invalidateQueries({
        queryKey: ['profile', 'detail', userId]
      });
    }
  });
};

/**
 * Hook chính để quản lý onboarding tour
 */
export const useOnboarding = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  const { data: statusData, isLoading } = useOnboardingStatus(userId);
  const completeOnboarding = useCompleteOnboarding();

  const isOnboarded = statusData?.isOnboarded ?? false;

  // Tự động bắt đầu tour nếu user chưa onboard
  useEffect(() => {
    // Chỉ chạy khi đã load xong và có userId
    if (isLoading || !userId) return;

    // Debug log
    console.log('[Onboarding] Status check:', {
      isLoading,
      userId,
      isOnboarded,
      statusData
    });

    // Nếu đã onboard, không hiển thị tour
    if (isOnboarded) {
      console.log('[Onboarding] User already onboarded, skipping tour');
      setIsActive(false);
      return;
    }

    // Nếu chưa onboard, hiển thị tour sau một chút delay để UI render xong
    console.log('[Onboarding] Starting tour for new user');
    const timer = setTimeout(() => {
      setIsActive(true);
      setCurrentStep(0);
      console.log('[Onboarding] Tour activated');
    }, 1500); // Tăng delay lên 1.5s để đảm bảo UI đã render xong

    return () => clearTimeout(timer);
  }, [isLoading, isOnboarded, userId, statusData]);

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    if (userId) {
      completeOnboarding.mutate(userId);
    }
    setIsActive(false);
    setCurrentStep(0);
  };

  const finishTour = () => {
    if (userId) {
      completeOnboarding.mutate(userId);
    }
    setIsActive(false);
    setCurrentStep(0);
    setShowCompletionBanner(true);
    // Tự động ẩn banner sau 5 giây
    setTimeout(() => {
      setShowCompletionBanner(false);
    }, 5000);
  };

  const restartTour = async () => {
    if (userId) {
      try {
        // Reset status trong database
        const { error } = await supabase
          .from('profiles')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ is_onboarded: false } as any)
          .eq('id', userId);

        if (error) {
          throw error;
        }

        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        // Cập nhật cache
        queryClient.setQueryData(['onboarding-status', userId], {
          isOnboarded: false
        });
        // Reset và bắt đầu tour
        setCurrentStep(0);
        setIsActive(true);
        setShowCompletionBanner(false);
      } catch (error) {
        console.error('Error resetting onboarding status:', error);
        // Fallback: chỉ reset local state
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        setCurrentStep(0);
        setIsActive(true);
        setShowCompletionBanner(false);
      }
    } else {
      // Nếu không có userId, chỉ reset local state
      setCurrentStep(0);
      setIsActive(true);
      setShowCompletionBanner(false);
    }
  };

  return {
    currentStep,
    isActive,
    isOnboarded,
    isLoading,
    showCompletionBanner,
    nextStep,
    prevStep,
    skipTour,
    finishTour,
    restartTour,
    setIsActive,
    setShowCompletionBanner
  };
};
