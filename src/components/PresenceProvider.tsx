import React, { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
import { usePresenceSubscription } from "@/hooks/usePresence";

interface PresenceProviderProps {
  children: React.ReactNode;
  friendIds?: string[];
}

/**
 * Component provider để quản lý realtime presence cho danh sách bạn bè
 * Tự động subscribe realtime updates và invalidate cache
 */
export const PresenceProvider: React.FC<PresenceProviderProps> = ({
  children,
  friendIds = [],
}) => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  // Subscribe realtime updates cho danh sách bạn bè
  usePresenceSubscription(friendIds);

  // Invalidate cache khi có thay đổi
  useEffect(() => {
    if (friendIds.length > 0) {
      // Invalidate profile queries cho tất cả friends
      friendIds.forEach((friendId) => {
        queryClient.invalidateQueries({
          queryKey: ["profiles", "detail", friendId],
        });
      });
    }
  }, [friendIds, queryClient]);

  return <>{children}</>;
};

export default PresenceProvider;
