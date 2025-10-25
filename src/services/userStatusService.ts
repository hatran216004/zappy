// services/userStatusService.ts
import { supabase } from "@/lib/supabase";

export type UserStatus = "online" | "offline" | "away" | "busy";

export interface UserStatusData {
  id: string;
  status: UserStatus;
  status_updated_at: string;
  last_seen_at: string | null;
}

const userStatusService = {
  /**
   * Cập nhật trạng thái người dùng
   */
  updateStatus: async (status: UserStatus) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

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

  /**
   * Lấy trạng thái của một người dùng
   */
  getUserStatus: async (userId: string): Promise<UserStatusData> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, status, status_updated_at, last_seen_at")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Lấy trạng thái của nhiều người dùng
   */
  getMultipleUserStatus: async (
    userIds: string[]
  ): Promise<UserStatusData[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, status, status_updated_at, last_seen_at")
      .in("id", userIds);

    if (error) throw error;
    return data || [];
  },

  /**
   * Set user online
   */
  setOnline: async () => {
    return userStatusService.updateStatus("online");
  },

  /**
   * Set user offline
   */
  setOffline: async () => {
    return userStatusService.updateStatus("offline");
  },

  /**
   * Set user away
   */
  setAway: async () => {
    return userStatusService.updateStatus("away");
  },

  /**
   * Set user busy
   */
  setBusy: async () => {
    return userStatusService.updateStatus("busy");
  },

  /**
   * Subscribe to user status changes
   */
  subscribeToUserStatus: (
    userId: string,
    onStatusChange: (status: UserStatusData) => void
  ) => {
    const channel = supabase
      .channel(`user-status-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const newStatus = payload.new as UserStatusData;
          onStatusChange(newStatus);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  },

  /**
   * Subscribe to multiple users status
   */
  subscribeToMultipleUserStatus: (
    userIds: string[],
    onStatusChange: (status: UserStatusData) => void
  ) => {
    const channels = userIds.map((userId) => {
      return supabase
        .channel(`user-status-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            const newStatus = payload.new as UserStatusData;
            onStatusChange(newStatus);
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach((channel) => channel.unsubscribe());
    };
  },

  /**
   * Update last seen timestamp
   */
  updateLastSeen: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  },
};

export default userStatusService;
