import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type Status = 'online' | 'offline' | 'away' | 'busy';

export const presenceKeys = {
  user: (userId: string) => ['profiles', 'detail', userId] as const,
};

export function useUserStatus(userId: string) {
  const query = useQuery({
    queryKey: presenceKeys.user(userId),
    queryFn: async () => {
      if (!userId) return null as any;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, status, last_seen_at')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data as { id: string; status: Status; last_seen_at: string | null };
    },
    enabled: !!userId,
    staleTime: 30000,
  });

  const isOnline = useMemo(() => query.data?.status === 'online', [query.data]);
  const color = isOnline ? 'bg-green-500' : 'bg-gray-400';
  const text = isOnline ? 'Đang hoạt động' : 'Ngoại tuyến';

  return { ...query, isOnline, color, text };
}

export function useUserStatusRealtime(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`presence:user:${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: presenceKeys.user(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

export function usePresenceSubscription(friendIds: string[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!friendIds || friendIds.length === 0) return;
    const channel = supabase
      .channel('presence:friends')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=in.(${friendIds.join(',')})`,
        },
        (payload) => {
          const id = (payload.new as any)?.id as string;
          if (id) {
            queryClient.invalidateQueries({ queryKey: presenceKeys.user(id) });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [friendIds.join(','), queryClient]);
}


