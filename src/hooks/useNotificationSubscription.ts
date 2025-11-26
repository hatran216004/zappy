// hooks/useNotificationSubscription.ts
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Hook để quản lý notification subscription với khả năng restart
export const useNotificationSubscription = (userId: string | null) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const restartCountRef = useRef(0);

  const startSubscription = () => {
    if (!userId) return;

    // Remove existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `notifications:${userId}:${restartCountRef.current}`;
    console.log('🔄 Starting notification subscription:', channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔔 New notification received:', payload);
          
          // Invalidate notification queries
          queryClient.invalidateQueries({ 
            queryKey: ['notifications', userId],
            exact: false 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['unreadNotificationsCount', userId] 
          });
        }
      )
      .subscribe((status) => {
        console.log('🔔 Notification subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to notifications');
        }
      });

    channelRef.current = channel;
  };

  const restartSubscription = () => {
    restartCountRef.current += 1;
    console.log('🔄 Restarting notification subscription...');
    startSubscription();
  };

  useEffect(() => {
    startSubscription();

    return () => {
      if (channelRef.current) {
        console.log('🔕 Unsubscribing from notifications');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]);

  return { restartSubscription };
};
