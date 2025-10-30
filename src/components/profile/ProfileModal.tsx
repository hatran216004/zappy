import { useState, useEffect } from "react";
import { Camera, ChevronRight, Lock, User, Mail, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  useUpdateProfile,
  useUploadAvatar,
  useChangePassword,
  useProfile,
} from "@/hooks/useProfile";
import useUser from "@/hooks/useUser";
import toast from "react-hot-toast";
import { Profile } from "@/services/friendServices";
import { supabaseUrl } from "@/lib/supabase";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileModal = ({ open, onOpenChange }: ProfileModalProps) => {
  const { user } = useUser();
  const userId = user?.id as string;

  const { data: profile, isLoading, error } = useProfile(userId);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editField, setEditField] = useState<"name" | "bio" | "gender" | null>(
    null
  );

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState<string>("false");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const changePasswordMutation = useChangePassword();

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setGender(profile.gender ? "true" : "false");
    }
  }, [profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    try {
      const avatarUrl = await uploadAvatarMutation.mutateAsync(file);
      await updateProfileMutation.mutateAsync({ avatar_url: avatarUrl });
      toast.success("Cập nhật ảnh đại diện thành công");
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast.error("Có lỗi xảy ra khi cập nhật ảnh đại diện");
    }
  };

  const handleEditField = (field: "name" | "bio" | "gender") => {
    setEditField(field);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const updateData: Partial<Profile> = {};

      if (editField === "name") {
        updateData.display_name = displayName;
      } else if (editField === "bio") {
        updateData.bio = bio;
      } else if (editField === "gender") {
        updateData.gender = gender === "true";
      }

      await updateProfileMutation.mutateAsync(updateData);
      toast.success("Cập nhật thông tin thành công");
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Có lỗi xảy ra khi cập nhật thông tin");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      toast.success("Đổi mật khẩu thành công");
      setPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Có lỗi xảy ra khi đổi mật khẩu");
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-center h-64">
            <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
              Đang tải thông tin cá nhân...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-center h-64">
            <div className="text-center py-8 text-destructive dark:text-red-400">
              Có lỗi xảy ra khi tải thông tin cá nhân
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <h1 className="text-lg font-semibold dark:text-white">
              Thông tin cá nhân
            </h1>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Avatar Section */}
            <div className="bg-white dark:bg-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {profile?.avatar_url ? (
                        <img
                          src={`${supabaseUrl}/${profile.avatar_url}`}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                          <User size={32} />
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 bg-blue-500 dark:bg-blue-600 rounded-full p-1.5 cursor-pointer hover:bg-blue-600 dark:hover:bg-blue-700 transition"
                    >
                      <Camera size={14} className="text-white" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                        disabled={uploadAvatarMutation.isPending}
                      />
                    </label>
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg dark:text-white">
                      {profile?.display_name || "Chưa có tên"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{profile?.username}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <div
                  className="px-4 py-4 flex items-center justify-between border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleEditField("name")}
                >
                  <div className="flex items-center gap-3">
                    <User
                      size={20}
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Tên hiển thị
                      </p>
                      <p className="text-sm font-medium dark:text-white">
                        {profile?.display_name || "Chưa đặt tên"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-gray-400 dark:text-gray-500"
                  />
                </div>

                <div
                  className="px-4 py-4 flex items-center justify-between border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleEditField("bio")}
                >
                  <div className="flex items-center gap-3">
                    <Info
                      size={20}
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Giới thiệu
                      </p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {profile?.bio || "Thêm giới thiệu về bạn"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-gray-400 dark:text-gray-500"
                  />
                </div>

                <div
                  className="px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleEditField("gender")}
                >
                  <div className="flex items-center gap-3">
                    <User
                      size={20}
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Giới tính
                      </p>
                      <p className="text-sm font-medium dark:text-white">
                        {profile?.gender === true
                          ? "Nam"
                          : profile?.gender === false
                          ? "Nữ"
                          : "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-gray-400 dark:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-2 pb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <div className="px-4 py-4 flex items-center justify-between border-b dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Mail
                      size={20}
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Email
                      </p>
                      <p className="text-sm font-medium dark:text-white">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  <div className="flex items-center gap-3">
                    <Lock
                      size={20}
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <p className="text-sm font-medium dark:text-white">
                      Đổi mật khẩu
                    </p>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-gray-400 dark:text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editField === "name" && "Chỉnh sửa tên hiển thị"}
              {editField === "bio" && "Chỉnh sửa giới thiệu"}
              {editField === "gender" && "Chọn giới tính"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editField === "name" && (
              <div>
                <Label
                  htmlFor="display-name"
                  className="dark:text-gray-200 mb-2"
                >
                  Tên hiển thị
                </Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  maxLength={50}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {displayName.length}/50
                </p>
              </div>
            )}

            {editField === "bio" && (
              <div>
                <Label htmlFor="bio" className="dark:text-gray-200 mb-2">
                  Giới thiệu
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Viết vài dòng về bản thân..."
                  rows={4}
                  maxLength={200}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {bio.length}/200
                </p>
              </div>
            )}

            {editField === "gender" && (
              <RadioGroup value={gender} onValueChange={setGender}>
                <div className="flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                  <RadioGroupItem value="true" id="male" />
                  <Label
                    htmlFor="male"
                    className="cursor-pointer flex-1 dark:text-gray-200"
                  >
                    Nam
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                  <RadioGroupItem value="false" id="female" />
                  <Label
                    htmlFor="female"
                    className="cursor-pointer flex-1 dark:text-gray-200"
                  >
                    Nữ
                  </Label>
                </div>
              </RadioGroup>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateProfileMutation.isPending}
              className="flex-1 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {updateProfileMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Đổi mật khẩu</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label
                htmlFor="current-password"
                className="dark:text-gray-200 mb-2"
              >
                Mật khẩu hiện tại
              </Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <div>
              <Label htmlFor="new-password" className="dark:text-gray-200 mb-2">
                Mật khẩu mới
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <div>
              <Label
                htmlFor="confirm-password"
                className="dark:text-gray-200 mb-2"
              >
                Xác nhận mật khẩu mới
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 ">
              Mật khẩu phải có ít nhất 6 ký tự
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
              className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Hủy
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
              className="flex-1 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {changePasswordMutation.isPending
                ? "Đang xử lý..."
                : "Đổi mật khẩu"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileModal;
