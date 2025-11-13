import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface UseUserStatusTrackerOptions {
  userId: string;
  onStatusChange?: (status: "online" | "offline") => void;
  heartbeatInterval?: number; // milliseconds, default 30000 (30 seconds)
}

/**
 * Custom Hook để quản lý trạng thái người dùng (Online/Offline) một cách đáng tin cậy
 *
 * Tính năng:
 * - Tự động set online khi component mount
 * - Heartbeat định kỳ để duy trì trạng thái online
 * - Set offline đáng tin cậy khi đóng tab/cửa sổ
 * - Cleanup khi component unmount
 */
export const useUserStatusTracker = ({
  userId,
  onStatusChange,
  heartbeatInterval = 30000,
}: UseUserStatusTrackerOptions) => {
  const heartbeatRef = useRef<NodeJS.Timeout>();
  const isOnlineRef = useRef<boolean>(false);

  // Hàm set online status
  const setOnline = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          status: "online",
          last_seen_at: new Date().toISOString(),
          status_updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Failed to set online status:", error);
        return;
      }

      isOnlineRef.current = true;
      onStatusChange?.("online");
    } catch (error) {
      console.error("Error setting online status:", error);
    }
  }, [userId, onStatusChange]);

  // Hàm set offline status
  const setOffline = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          status: "offline",
          last_seen_at: new Date().toISOString(),
          status_updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Failed to set offline status:", error);
        return;
      }

      isOnlineRef.current = false;
      onStatusChange?.("offline");
    } catch (error) {
      console.error("Error setting offline status:", error);
    }
  }, [userId, onStatusChange]);

  // Hàm heartbeat để duy trì trạng thái online
  const heartbeat = useCallback(async () => {
    if (!userId || !isOnlineRef.current) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          status: "online",
          last_seen_at: new Date().toISOString(),
          status_updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Heartbeat failed:", error);
        // Nếu heartbeat fail, có thể user đã logout hoặc bị ban
        // Không set isOnlineRef.current = false ở đây để tránh conflict
      }
    } catch (error) {
      console.error("Heartbeat error:", error);
    }
  }, [userId]);

  // Hàm set offline đáng tin cậy khi đóng tab
  const handleBeforeUnload = useCallback(() => {
    if (!userId || !isOnlineRef.current) return;

    // Lấy session từ localStorage (synchronous)
    try {
      const storageKey = `sb-${
        import.meta.env.VITE_SUPABASE_URL?.split("//")[1]?.split(".")[0]
      }-auth-token`;
      const session = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const token = session?.access_token;

      if (!token || !userId) return;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
      const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`;

      const data = JSON.stringify({
        status: "offline",
        last_seen_at: new Date().toISOString(),
        status_updated_at: new Date().toISOString(),
      });

      // Phương pháp 1: fetch với keepalive (modern, ưu tiên)
      try {
        fetch(url, {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: data,
          keepalive: true, // Đảm bảo request gửi ngay cả khi tab đóng
        });
      } catch (fetchError) {
        // Phương pháp 2: Synchronous XHR (fallback, reliable)
        try {
          const xhr = new XMLHttpRequest();
          xhr.open("PATCH", url, false); // false = synchronous
          xhr.setRequestHeader("apikey", supabaseKey);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.setRequestHeader("Prefer", "return=minimal");
          xhr.send(data);
        } catch (xhrError) {
          console.error("Failed to set offline:", xhrError);
        }
      }
    } catch (error) {
      console.error("Error in beforeunload:", error);
    }
  }, [userId]);

  // Effect chính để quản lý lifecycle
  useEffect(() => {
    if (!userId) return;

    // 1. Set online khi component mount
    setOnline();

    // 2. Bắt đầu heartbeat
    const intervalId = setInterval(() => {
      heartbeat();
    }, heartbeatInterval);
    heartbeatRef.current = intervalId;

    // 3. Lắng nghe sự kiện đóng tab
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup function
    return () => {
      // Clear heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = undefined;
      }

      // Remove event listener
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Set offline khi component unmount (ví dụ: đăng xuất)
      // Chỉ set offline nếu đang online để tránh race condition
      if (isOnlineRef.current) {
        setOffline();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, heartbeatInterval]); // Chỉ depend vào userId và interval

  // Return các hàm để có thể sử dụng thủ công nếu cần
  return {
    setOnline,
    setOffline,
    isOnline: isOnlineRef.current,
  };
};

export default useUserStatusTracker;
