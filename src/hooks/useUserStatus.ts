import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import userStatusService, {
  UserStatus,
  UserStatusData,
} from "../services/userStatusService.ts";

export const userStatusKeys = {
  all: ["user-status"] as const,
  detail: (userId: string) => [...userStatusKeys.all, userId] as const,
  multiple: (userIds: string[]) =>
    [...userStatusKeys.all, "multiple", userIds] as const,
};

/**
 * Hook để lấy trạng thái của một user
 */
export const useUserStatus = (userId: string, enabled = true) => {
  return useQuery({
    queryKey: userStatusKeys.detail(userId),
    queryFn: () => userStatusService.getUserStatus(userId),
    enabled,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch mỗi 1 phút
  });
};

/**
 * Hook để lấy trạng thái của nhiều users
 */
export const useMultipleUserStatus = (userIds: string[], enabled = true) => {
  return useQuery({
    queryKey: userStatusKeys.multiple(userIds),
    queryFn: () => userStatusService.getMultipleUserStatus(userIds),
    enabled: enabled && userIds.length > 0,
    staleTime: 30000,
  });
};

/**
 * Hook để cập nhật trạng thái user
 */
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: UserStatus) => userStatusService.updateStatus(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userStatusKeys.all });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
  });
};

/**
 * Hook để subscribe realtime changes của một user
 */
export const useUserStatusRealtime = (userId: string, enabled = true) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = userStatusService.subscribeToUserStatus(
      userId,
      (newStatus) => {
        // Update cache
        queryClient.setQueryData(userStatusKeys.detail(userId), newStatus);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, queryClient, enabled]);
};

/**
 * Hook để subscribe realtime changes của nhiều users
 */
export const useMultipleUserStatusRealtime = (
  userIds: string[],
  enabled = true
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || userIds.length === 0) return;

    const unsubscribe = userStatusService.subscribeToMultipleUserStatus(
      userIds,
      (newStatus) => {
        // Update individual user cache
        queryClient.setQueryData(
          userStatusKeys.detail(newStatus.id),
          newStatus
        );

        // Update multiple users cache
        queryClient.setQueryData(
          userStatusKeys.multiple(userIds),
          (old: UserStatusData[] | undefined) => {
            if (!old) return [newStatus];
            return old.map((user) =>
              user.id === newStatus.id ? newStatus : user
            );
          }
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userIds, queryClient, enabled]);
};

/**
 * Hook để tự động quản lý trạng thái user (online/offline/away)
 * Auto detect: online khi active, away khi idle, offline khi close tab
 */
export const useAutoUserStatus = (enabled = true) => {
  const updateStatus = useUpdateUserStatus();
  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    if (!enabled) return;

    // Set online khi mount
    userStatusService.setOnline();

    // Auto offline khi close tab/browser
    const handleBeforeUnload = () => {
      // Sử dụng sendBeacon để đảm bảo request được gửi ngay cả khi close tab
      navigator.sendBeacon(
        "/api/user-status-offline", // Bạn cần tạo API endpoint này
        JSON.stringify({ status: "offline" })
      );
      userStatusService.setOffline();
    };

    // Track user activity
    const handleActivity = () => {
      setLastActivity(Date.now());
      setIsIdle(false);

      // Update last_seen
      userStatusService.updateLastSeen();
    };

    // Check idle status mỗi 30 giây
    const idleCheckInterval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivity;
      const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 phút

      if (idleTime > IDLE_THRESHOLD && !isIdle) {
        setIsIdle(true);
        userStatusService.setAway();
      } else if (idleTime <= IDLE_THRESHOLD && isIdle) {
        setIsIdle(false);
        userStatusService.setOnline();
      }
    }, 30000);

    // Update last_seen mỗi 1 phút
    const lastSeenInterval = setInterval(() => {
      if (!isIdle) {
        userStatusService.updateLastSeen();
      }
    }, 60000);

    // Listen to user activity events
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Listen to visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        userStatusService.setAway();
      } else {
        userStatusService.setOnline();
        handleActivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Cleanup
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(idleCheckInterval);
      clearInterval(lastSeenInterval);

      // Set offline when component unmounts
      userStatusService.setOffline();
    };
  }, [enabled, isIdle, lastActivity]);

  return {
    isIdle,
    updateStatus: updateStatus.mutate,
    isUpdating: updateStatus.isPending,
  };
};

/**
 * Hook để format và hiển thị trạng thái
 */
export const useStatusDisplay = (
  status?: UserStatus,
  lastSeenAt?: string | null
) => {
  const getStatusColor = (status?: UserStatus) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      case "offline":
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status?: UserStatus, lastSeenAt?: string | null) => {
    switch (status) {
      case "online":
        return "Đang hoạt động";
      case "away":
        return "Vắng mặt";
      case "busy":
        return "Bận";
      case "offline":
        if (lastSeenAt) {
          return formatLastSeen(lastSeenAt);
        }
        return "Ngoại tuyến";
      default:
        return "Không rõ";
    }
  };

  const formatLastSeen = (lastSeenAt: string) => {
    const now = new Date();
    const lastSeen = new Date(lastSeenAt);
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xem";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return lastSeen.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return {
    statusColor: getStatusColor(status),
    statusText: getStatusText(status, lastSeenAt),
    isOnline: status === "online",
  };
};
