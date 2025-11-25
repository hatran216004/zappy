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
    const timestamp = Date.now();
    // Format: userId.jpg?ts=timestamp
    const fileName = `${user.id}.${fileExt}?ts=${timestamp}`;
    // Upload path: userId.jpg (without query string)
    const filePath = `${user.id}.${fileExt}`;

    // Delete old avatar if exists (optional - to save storage)
    // We can list files with prefix user.id and delete them
    
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true, // Overwrite if exists
      });

    if (uploadError) throw uploadError;

    // Return path in format: userId.jpg?ts=timestamp
    return fileName;
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
