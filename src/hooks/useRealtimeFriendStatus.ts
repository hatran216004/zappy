import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  RealtimeChannel,
  RealtimePostgresUpdatePayload,
} from "@supabase/supabase-js";

// Định nghĩa kiểu dữ liệu của bảng "profiles"
export interface FriendStatus {
  id: string;
  status: "online" | "offline" | "away" | "busy";
  last_seen_at: string | null;
  status_updated_at: string;
  display_name: string;
  avatar_url: string | null;
  username: string;
}

interface UseRealtimeFriendStatusOptions {
  friendIds: string[];
  onStatusUpdate?: (friendStatus: FriendStatus) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom Hook: Theo dõi trạng thái online/offline của bạn bè (realtime)
 */
export const useRealtimeFriendStatus = ({
  friendIds,
  onStatusUpdate,
  onError,
}: UseRealtimeFriendStatusOptions) => {
  const [friendStatuses, setFriendStatuses] = useState<
    Map<string, FriendStatus>
  >(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // ✅ Xử lý khi có bản ghi cập nhật realtime từ Supabase
  const handleStatusUpdate = useCallback(
    (payload: RealtimePostgresUpdatePayload<FriendStatus>) => {
      try {
        const updated = payload.new;

        if (!updated || !updated.id) return;

        const friendStatus: FriendStatus = {
          id: updated.id,
          status: updated.status,
          last_seen_at: updated.last_seen_at,
          status_updated_at: updated.status_updated_at,
          display_name: updated.display_name,
          avatar_url: updated.avatar_url,
          username: updated.username,
        };

        setFriendStatuses((prev) => {
          const newMap = new Map(prev);
          newMap.set(friendStatus.id, friendStatus);
          return newMap;
        });

        onStatusUpdate?.(friendStatus);
      } catch (err) {
        const e = new Error(`Failed to process status update: ${String(err)}`);
        setError(e);
        onError?.(e);
      }
    },
    [onStatusUpdate, onError]
  );

  // ✅ Đăng ký realtime subscription
  const subscribeToStatusChanges = useCallback(() => {
    if (friendIds.length === 0) return;

    try {
      const channel = supabase
        .channel("friend_status_changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=in.(${friendIds.join(",")})`,
          },
          (payload) =>
            handleStatusUpdate(
              payload as RealtimePostgresUpdatePayload<FriendStatus>
            )
        )

        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setIsConnected(true);
            setError(null);
          } else if (status === "CHANNEL_ERROR") {
            const e = new Error("Failed to subscribe to friend status changes");
            setError(e);
            setIsConnected(false);
            onError?.(e);
          }
        });

      channelRef.current = channel;
    } catch (err) {
      const e = new Error(`Failed to subscribe: ${String(err)}`);
      setError(e);
      setIsConnected(false);
      onError?.(e);
    }
  }, [friendIds, handleStatusUpdate, onError]);

  // ✅ Hủy đăng ký
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // ✅ Lấy trạng thái 1 bạn bè
  const getFriendStatus = useCallback(
    (friendId: string): FriendStatus | null =>
      friendStatuses.get(friendId) || null,
    [friendStatuses]
  );

  // ✅ Kiểm tra bạn có online không
  const isFriendOnline = useCallback(
    (friendId: string): boolean => {
      const status = getFriendStatus(friendId);
      if (!status || status.status === "offline" || !status.last_seen_at)
        return false;

      const lastSeen = new Date(status.last_seen_at);
      const diffMinutes = (Date.now() - lastSeen.getTime()) / 1000 / 60;
      return diffMinutes <= 3;
    },
    [getFriendStatus]
  );

  // ✅ Format thời gian "hoạt động gần đây"
  const formatLastSeen = useCallback(
    (friendId: string): string => {
      const status = getFriendStatus(friendId);
      if (!status) return "Ngoại tuyến";

      if (isFriendOnline(friendId)) return "Đang hoạt động";
      if (!status.last_seen_at) return "Ngoại tuyến";

      const lastSeen = new Date(status.last_seen_at);
      const diffMinutes = Math.floor(
        (Date.now() - lastSeen.getTime()) / 1000 / 60
      );

      if (diffMinutes < 1) return "Vừa xong";
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      if (diffMinutes < 1440)
        return `${Math.floor(diffMinutes / 60)} giờ trước`;
      if (diffMinutes < 10080)
        return `${Math.floor(diffMinutes / 1440)} ngày trước`;

      return lastSeen.toLocaleDateString("vi-VN");
    },
    [getFriendStatus, isFriendOnline]
  );

  // ✅ Lấy màu trạng thái
  const getStatusColor = useCallback(
    (friendId: string): string =>
      isFriendOnline(friendId) ? "bg-green-500" : "bg-gray-400",
    [isFriendOnline]
  );

  // ✅ Subscribe lifecycle
  useEffect(() => {
    if (friendIds.length === 0) return;
    subscribeToStatusChanges();
    return () => unsubscribe();
  }, [friendIds.join(","), subscribeToStatusChanges, unsubscribe]);

  // ✅ Load dữ liệu ban đầu
  useEffect(() => {
    if (friendIds.length === 0) return;

    const loadInitialStatuses = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, status, last_seen_at, status_updated_at, display_name, avatar_url, username"
          )
          .in("id", friendIds);

        if (error) throw error;

        const statusMap = new Map<string, FriendStatus>();
        data?.forEach((profile) => {
          statusMap.set(profile.id, profile);
        });

        setFriendStatuses(statusMap);
      } catch (err) {
        const e = new Error(`Failed to load initial statuses: ${String(err)}`);
        setError(e);
        onError?.(e);
      }
    };

    loadInitialStatuses();
  }, [friendIds, onError]);

  return {
    friendStatuses: Array.from(friendStatuses.values()),
    isConnected,
    error,
    getFriendStatus,
    isFriendOnline,
    formatLastSeen,
    getStatusColor,
    subscribe: subscribeToStatusChanges,
    unsubscribe,
  };
};

export default useRealtimeFriendStatus;
