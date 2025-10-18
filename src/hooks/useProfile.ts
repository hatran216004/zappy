import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import profileServices, {
  UpdateProfileData,
  ChangePasswordData,
} from "@/services/profileServices";

export const profileKeys = {
  all: ["profile"] as const,
  detail: (userId: string) => [...profileKeys.all, "detail", userId] as const,
};

// Hook lấy profile
export const useProfile = (userId: string) => {
  return useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: () => profileServices.getProfile(userId),
    staleTime: 60000,
  });
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
