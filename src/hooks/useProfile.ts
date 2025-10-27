import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import profileServices, {
  UpdateProfileData,
  ChangePasswordData,
} from "@/services/profileServices";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const profileKeys = {
  all: ["profile"] as const,
  detail: (userId: string) => [...profileKeys.all, "detail", userId] as const,
};

// Hook lấy profile có realtime
export const useProfile = (userId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: () => profileServices.getProfile(userId),
    staleTime: 60000,
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`profile_status_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const updatedProfile = payload.new;
          queryClient.setQueryData(profileKeys.detail(userId), updatedProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
};

// Hook cập nhật profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) =>
      profileServices.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
  });
};

// Hook upload avatar
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => profileServices.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

// Hook đổi mật khẩu
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordData) =>
      profileServices.changePassword(data),
  });
};
