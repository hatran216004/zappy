import { supabase } from "@/lib/supabase";

export interface UpdateProfileData {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  gender?: boolean;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

const profileServices = {
  // Cập nhật thông tin profile
  updateProfile: async (data: UpdateProfileData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Không tìm thấy người dùng");

    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;
    return updatedProfile;
  },

  // Upload avatar
  uploadAvatar: async (file: File) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Không tìm thấy người dùng");

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return publicUrl;
  },

  // Đổi mật khẩu
  changePassword: async ({ newPassword }: ChangePasswordData) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { success: true };
  },

  // Lấy thông tin profile
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },
};

export default profileServices;
