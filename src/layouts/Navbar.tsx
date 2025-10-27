// 🔧 ĐỔI MÀU UI THEO DISCORD BLURPLE (#5865F2)
// (GIỮ NGUYÊN LOGIC)

import { TooltipBtn } from "@/components/TooltipBtn";
import {
  MessageCircle,
  Users,
  Cloud,
  Briefcase,
  Settings,
  Moon,
  Sun,
  User,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProfile } from "@/hooks/useProfile";
import ProfileModal from "@/components/profile/ProfileModal";
import useLogout from "@/hooks/useLogout";
import { useAuth } from "@/stores/user";
import {
  useFriendRequestsRealtime,
  usePendingFriendRequests,
} from "@/hooks/useFriends";
import { UserAvatar } from "@/components/UserAvatar";

export default function Navbar() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: requests } = usePendingFriendRequests(userId as string);
  useFriendRequestsRealtime(userId as string);
  const hasFriendRequest = !!requests && requests.length > 0;

  const { logout } = useLogout();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: profile } = useProfile(userId as string);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.remove("light");
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
      document.body.classList.add("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <>
      <div
        className="
          w-[70px]
          flex flex-col items-center py-4 justify-between
          border-r border-[#4752C4] 
          bg-[#5865F2] 
          text-white
        "
      >
        <div className="flex flex-col items-center gap-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="select-none">
                <UserAvatar
                  size="md"
                  avatarUrl={profile?.avatar_url}
                  displayName={profile?.display_name}
                  status={profile?.status}
                  showStatus={true}
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="
                w-56 ml-4
                bg-[#313338]
                text-[#F2F3F5]
                border border-[#3F4246]
              "
              align="start"
            >
              <DropdownMenuLabel className="text-white">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.display_name || "Chưa có tên"}
                  </p>
                  <p className="text-xs leading-none text-[#B5BAC1]">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-[#3F4246]" />

              <DropdownMenuItem
                onClick={() => setProfileModalOpen(true)}
                className="cursor-pointer hover:bg-[#4752C4] text-white"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Thông tin cá nhân</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer hover:bg-[#4752C4] text-white">
                <Settings className="mr-2 h-4 w-4" />
                <span>Cài đặt</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-[#3F4246]" />

              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer text-[#ED4245] hover:bg-[#4752C4]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipBtn
            onClick={() => navigate("/chat")}
            isActive={pathname.includes("chat") || pathname === "/"}
            icon={MessageCircle}
            label="Tin nhắn"
            className="
              text-white
              hover:text-white
              hover:bg-[#4752C4]
            "
          />

          <TooltipBtn
            onClick={() => navigate("/friends")}
            icon={Users}
            hasBadge={hasFriendRequest}
            isActive={pathname.includes("friends")}
            label="Danh bạ"
            className="
              text-white
              hover:text-white
              hover:bg-[#4752C4]
            "
          />
        </div>

        <div className="flex flex-col items-center gap-6">
          <TooltipBtn
            onClick={toggleTheme}
            icon={theme === "light" ? Moon : Sun}
            label={theme === "light" ? "Chế độ tối" : "Chế độ sáng"}
            className="text-white hover:text-white hover:bg-[#4752C4]"
          />
          <TooltipBtn
            icon={Cloud}
            label="Cloud"
            className="text-white hover:text-white hover:bg-[#4752C4]"
          />
          <TooltipBtn
            icon={Briefcase}
            label="Công việc"
            className="text-white hover:text-white hover:bg-[#4752C4]"
          />
          <TooltipBtn
            icon={Settings}
            label="Cài đặt"
            className="text-white hover:text-white hover:bg-[#4752C4]"
          />
        </div>
      </div>

      <ProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </>
  );
}
