// services/presenceServices.ts
import { supabase, supabaseKey, supabaseUrl } from "@/lib/supabase";
import { Database } from "@/types/supabase.type";

export type UserStatus = Database["public"]["Enums"]["user_status"];

export interface UserPresence {
  id: string;
  status: UserStatus;
  last_seen_at: string | null;
  status_updated_at: string;
  display_name: string;
  avatar_url: string;
  username: string;
}

const presenceServices = {
  // =====================
  // 🔹 Cập nhật trạng thái người dùng
  // =====================
  updateStatus: async (status: UserStatus) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Không tìm thấy người dùng");

    const { data, error } = await supabase
      .from("profiles")
      .update({
        status,
        status_updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // =====================
  // 🔹 Lấy trạng thái của 1 người dùng
  // =====================
  getStatus: async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, status, last_seen_at, status_updated_at, display_name, avatar_url, username"
      )
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data as UserPresence;
  },

  // =====================
  // 🔹 Lấy trạng thái của nhiều người dùng
  // =====================
  getMultipleStatus: async (userIds: string[]) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, status, last_seen_at, status_updated_at, display_name, avatar_url, username"
      )
      .in("id", userIds);

    if (error) throw error;
    return data as UserPresence[];
  },

  // =====================
  // 🔹 Subscribe realtime status changes
  // =====================
  subscribeStatus: (
    userIds: string[],
    onUpdate: (profile: UserPresence) => void
  ) => {
    const channel = supabase
      .channel("user_status_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=in.(${userIds.join(",")})`,
        },
        (payload) => {
          const updated = payload.new as any;
          onUpdate({
            id: updated.id,
            status: updated.status,
            last_seen_at: updated.last_seen_at,
            status_updated_at: updated.status_updated_at,
            display_name: updated.display_name,
            avatar_url: updated.avatar_url,
            username: updated.username,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // =====================
  // 🔹 Set user offline
  // =====================
  setOffline: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        status: "offline",
        last_seen_at: new Date().toISOString(),
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  },

  // 🔹 Set user online
  setOnline: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        status: "online",
        last_seen_at: new Date().toISOString(),
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  },

  // 🔹 Heartbeat định kỳ để duy trì online
  heartbeat: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        status: "online",
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  },

  // =====================
  // 🔹 Tiện ích hiển thị
  // =====================
  isUserOnline: (lastSeenAt: string | null, status: UserStatus): boolean => {
    if (status === "offline") return false;
    if (!lastSeenAt) return false;

    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / 1000 / 60;

    // Nếu last_seen > 3 phút thì coi là offline
    return diffMinutes <= 3;
  },

  formatLastSeen: (lastSeenAt: string | null, status: UserStatus): string => {
    if (status === "online" && lastSeenAt) {
      const isOnline = presenceServices.isUserOnline(lastSeenAt, status);
      if (isOnline) return "Đang hoạt động";
    }

    if (!lastSeenAt) return "Ngoại tuyến";

    const lastSeen = new Date(lastSeenAt);
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

  // =====================
  // 🔹 Xử lý khi user đóng tab (từ helper)
  // =====================

  /** Gửi request setOffline khi tab đóng, đảm bảo hoạt động ngay cả khi trình duyệt tắt */
  setOfflineOnUnload: async (userId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`;
      const token = session.access_token;
      const data = {
        status: "offline",
        last_seen_at: new Date().toISOString(),
        status_updated_at: new Date().toISOString(),
      };

      // Ưu tiên fetch với keepalive
      try {
        await fetch(url, {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(data),
          keepalive: true,
        });
        return true;
      } catch {
        // Fallback synchronous XHR
        const xhr = new XMLHttpRequest();
        xhr.open("PATCH", url, false);
        xhr.setRequestHeader("apikey", supabaseKey);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Prefer", "return=minimal");
        xhr.send(JSON.stringify(data));
        return xhr.status >= 200 && xhr.status < 300;
      }
    } catch (error) {
      console.error("Error in setOfflineOnUnload:", error);
      return false;
    }
  },

  /** Tạo handler gắn vào window.beforeunload */
  createBeforeUnloadHandler: (userId: string) => {
    return () => {
      const session = JSON.parse(
        localStorage.getItem("supabase.auth.token") || "{}"
      );
      const token = session?.currentSession?.access_token;
      if (!token || !userId) return;

      const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`;
      const data = JSON.stringify({
        status: "offline",
        last_seen_at: new Date().toISOString(),
        status_updated_at: new Date().toISOString(),
      });

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
          keepalive: true,
        });
      } catch {
        const xhr = new XMLHttpRequest();
        xhr.open("PATCH", url, false);
        xhr.setRequestHeader("apikey", supabaseKey);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Prefer", "return=minimal");
        xhr.send(data);
      }
    };
  },
};

export default presenceServices;
