import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

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
 * Custom Hook để lắng nghe và hiển thị trạng thái bạn bè theo thời gian thực
 *
 * Tính năng:
 * - Subscribe realtime changes cho danh sách bạn bè
 * - Tự động cập nhật trạng thái khi có thay đổi
 * - Quản lý connection lifecycle
 * - Xử lý lỗi và reconnection
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

  // Hàm xử lý khi có cập nhật trạng thái
  const handleStatusUpdate = useCallback(
    (payload: any) => {
      try {
        const updated = payload.new as any;
        const friendStatus: FriendStatus = {
          id: updated.id,
          status: updated.status,
          last_seen_at: updated.last_seen_at,
          status_updated_at: updated.status_updated_at,
          display_name: updated.display_name,
          avatar_url: updated.avatar_url,
          username: updated.username,
        };

        // Cập nhật state
        setFriendStatuses((prev) => {
          const newMap = new Map(prev);
          newMap.set(friendStatus.id, friendStatus);
          return newMap;
        });

        // Gọi callback nếu có
        onStatusUpdate?.(friendStatus);
      } catch (err) {
        const error = new Error(`Failed to process status update: ${err}`);
        setError(error);
        onError?.(error);
      }
    },
    [onStatusUpdate, onError]
  );

  // Hàm subscribe realtime
  const subscribeToStatusChanges = useCallback(() => {
    if (friendIds.length === 0) return;

    try {
      // Tạo channel mới
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
          handleStatusUpdate
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setIsConnected(true);
            setError(null);
          } else if (status === "CHANNEL_ERROR") {
            const error = new Error(
              "Failed to subscribe to friend status changes"
            );
            setError(error);
            setIsConnected(false);
            onError?.(error);
          }
        });

      channelRef.current = channel;
    } catch (err) {
      const error = new Error(`Failed to subscribe: ${err}`);
      setError(error);
      setIsConnected(false);
      onError?.(error);
    }
  }, [friendIds, handleStatusUpdate, onError]);

  // Hàm unsubscribe
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Hàm lấy trạng thái hiện tại của một bạn bè
  const getFriendStatus = useCallback(
    (friendId: string): FriendStatus | null => {
      return friendStatuses.get(friendId) || null;
    },
    [friendStatuses]
  );

  // Hàm kiểm tra bạn bè có online không
  const isFriendOnline = useCallback(
    (friendId: string): boolean => {
      const status = getFriendStatus(friendId);
      if (!status) return false;

      if (status.status === "offline") return false;
      if (!status.last_seen_at) return false;

      const lastSeen = new Date(status.last_seen_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSeen.getTime()) / 1000 / 60;

      // Nếu last_seen > 3 phút thì coi là offline
      return diffMinutes <= 3;
    },
    [getFriendStatus]
  );

  // Hàm format thời gian last seen
  const formatLastSeen = useCallback(
    (friendId: string): string => {
      const status = getFriendStatus(friendId);
      if (!status) return "Ngoại tuyến";

      if (status.status === "online" && status.last_seen_at) {
        const isOnline = isFriendOnline(friendId);
        if (isOnline) return "Đang hoạt động";
      }

      if (!status.last_seen_at) return "Ngoại tuyến";

      const lastSeen = new Date(status.last_seen_at);
      const now = new Date();
      const diffMinutes = Math.floor(
        (now.getTime() - lastSeen.getTime()) / 1000 / 60
      );

      if (diffMinutes < 1) return "Vừa xong";
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;

      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays} ngày trước`;

      return lastSeen.toLocaleDateString("vi-VN");
    },
    [getFriendStatus, isFriendOnline]
  );

  // Hàm lấy màu sắc trạng thái
  const getStatusColor = useCallback(
    (friendId: string): string => {
      const isOnline = isFriendOnline(friendId);
      return isOnline ? "bg-green-500" : "bg-gray-400";
    },
    [isFriendOnline]
  );

  // Effect để subscribe/unsubscribe
  useEffect(() => {
    if (friendIds.length === 0) return;

    subscribeToStatusChanges();

    return () => {
      unsubscribe();
    };
  }, [friendIds.join(","), subscribeToStatusChanges, unsubscribe]);

  // Effect để load trạng thái ban đầu
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
        data?.forEach((profile: any) => {
          statusMap.set(profile.id, {
            id: profile.id,
            status: profile.status,
            last_seen_at: profile.last_seen_at,
            status_updated_at: profile.status_updated_at,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            username: profile.username,
          });
        });

        setFriendStatuses(statusMap);
      } catch (err) {
        const error = new Error(`Failed to load initial statuses: ${err}`);
        setError(error);
        onError?.(error);
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
