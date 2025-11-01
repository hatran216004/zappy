// 🔧 DISCORD STYLING (dark rail + blurple accent) – UI ONLY
// (KHÔNG ĐỔI LOGIC)

import { TooltipBtn } from '@/components/TooltipBtn';
import {
  MessageCircle,
  Users,
  Cloud,
  Briefcase,
  Settings,
  Moon,
  Sun,
  User, 
  Globe,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { twMerge } from "tailwind-merge";
import { avatarVariants } from "@/lib/variants";
import { useUserStatusTracker } from "@/hooks/useUserStatusTracker";
import { useUserStatus, useUserStatusRealtime } from "@/hooks/usePresence";

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
  const { data: statusProfile, isOnline } = useUserStatus(userId || "");
  useUserStatusRealtime(userId || "");

  // Tracker: set online khi mount, heartbeat định kỳ, set offline khi unload
  useUserStatusTracker({ userId: userId || "" });

  // Debug: Log profile status
  useEffect(() => {
    if (profile) {
      console.log('👤 Profile Status:', {
        status: profile.status,
        display_name: profile.display_name,
        isOnline: profile.status === 'online'
      });
    }
  }, [profile?.status]);

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
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // Helper để render nút kiểu Discord + active pill
  const ItemWrap = ({
    active,
    children,
  }: {
    active: boolean;
    children: React.ReactNode;
  }) => (
    <div className="relative w-full flex items-center justify-center">
      {/* Active pill (trái) */}
      <div
        className={twMerge(
          "absolute left-0 w-1 rounded-r-full transition-all",
          active ? "h-8 bg-[#5865F2]" : "h-0 bg-transparent"
        )}
      />
      {/* Hover “blob” nhẹ sau icon */}
      <div
        className={twMerge(
          "absolute inset-0 mx-auto w-10 h-10 rounded-2xl transition-colors",
          active
            ? "bg-[#5865F2]/20"
            : "hover:bg-white/5"
        )}
      />
      <div className="relative">{children}</div>
    </div>
  );

  const isChat = pathname.includes("chat") || pathname === "/";
  const isFriends = pathname.includes("friends");
  const isPost = pathname.includes("posts");

  return (
    <>
      <div
        className="
          w-[72px]
          flex flex-col items-center py-3 justify-between
          border-r
          text-white
          bg-[#1E1F22] dark:bg-[#1E1F22]
          border-[#2B2D31]
        "
      >
        {/* TOP */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Avatar + status như Discord user-tray (đưa lên top cho dễ click) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="
                  relative
                  focus:outline-none focus:ring-2 focus:ring-[#5865F2]
                  rounded-full p-0.5
                  transition-transform hover:scale-[1.02]
                "
              >
                <Avatar className={twMerge(avatarVariants({ size: 'md' }))}>
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-[#5865F2] text-white">
                    {profile?.display_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                {/* Status indicator (viền ăn theo màu rail) */}
                {(statusProfile?.status || profile?.status) && (
                  <span
                    className={twMerge(
                      "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1E1F22]",
                      (statusProfile?.status || profile?.status) === "online"
                        ? "bg-[#23A55A]"
                        : "bg-[#3F4246]"
                    )}
                    title={(statusProfile?.status || profile?.status) === "online" ? "Đang hoạt động" : "Ngoại tuyến"}
                  />
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="
                w-64 ml-3
                bg-[#2B2D31]
                text-[#F2F3F5]
                border border-[#3F4246]
                shadow-xl
              "
              align="start"
            >
              <DropdownMenuLabel className="text-white">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-[#5865F2] text-white">
                      {profile?.display_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">
                      {profile?.display_name || "Chưa có tên"}
                    </p>
                    <p className="text-xs leading-none text-[#B5BAC1]">
                      {user?.email}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className={twMerge("w-2 h-2 rounded-full", (statusProfile?.status || profile?.status) === "online" ? "bg-[#23A55A]" : "bg-[#3F4246]")}/>
                      <span className="text-xs text-[#B5BAC1]">
                        {(statusProfile?.status || profile?.status) === "online" ? "Đang hoạt động" : "Ngoại tuyến"}
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-[#3F4246]" />

              <DropdownMenuItem
                onClick={() => setProfileModalOpen(true)}
                className="cursor-pointer hover:bg-[#4752C4] hover:text-white"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Thông tin cá nhân</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer hover:bg-[#4752C4] hover:text-white">
                <Settings className="mr-2 h-4 w-4" />
                <span>Cài đặt</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-[#3F4246]" />

              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer text-[#ED4245] hover:bg-[#4752C4] hover:text-white"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Divider chấm như Discord */}
          <div className="h-px w-8 bg-[#2B2D31]" />

          {/* Nav items */}
          <ItemWrap active={isChat}>
            <TooltipBtn
              onClick={() => navigate("/chat")}
              isActive={isChat}
              icon={MessageCircle}
              label="Tin nhắn"
              className="
                relative z-[1]
                text-[#B5BAC1]
                hover:text-white
                !rounded-2xl
                w-10 h-10
                flex items-center justify-center
                data-[active=true]:text-white
              "
            />
          </ItemWrap>

          <ItemWrap active={isFriends}>
            <div className="relative">
              <TooltipBtn
                onClick={() => navigate("/friends")}
                icon={Users}
                hasBadge={false}
                isActive={isFriends}
                label="Danh bạ"
                className="
                  relative z-[1]
                  text-[#B5BAC1]
                  hover:text-white
                  !rounded-2xl
                  w-10 h-10
                  flex items-center justify-center
                  data-[active=true]:text-white
                "
              />
              {/* Badge friend request kiểu Discord */}
              {hasFriendRequest && (
                <span className="
                  absolute -top-1 -right-1 min-w-4 h-4 px-1
                  z-10
                  rounded-full bg-[#ED4245]
                  text-[10px] text-white font-semibold
                  flex items-center justify-center
                  shadow
                ">
                  {Math.min(requests!.length, 9)}
                </span>
              )}
            </div>
          </ItemWrap>


          <ItemWrap active={isPost}>
            <TooltipBtn
              onClick={() => navigate("/posts")}
              isActive={isPost}
              icon={Globe}
              label="Posts"
              className="
                relative z-[1]
                text-[#B5BAC1]
                hover:text-white
                !rounded-2xl
                w-10 h-10
                flex items-center justify-center
                data-[active=true]:text-white
              "
            />
          </ItemWrap>
          <div className="h-2" />
        </div>

        {/* BOTTOM – quick actions như user-tray */}
        <div className="flex flex-col items-center gap-3 w-full">
          <ItemWrap active={false}>
            <TooltipBtn
              onClick={toggleTheme}
              icon={theme === 'light' ? Moon : Sun}
              label={theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
              className="
                relative z-[1]
                text-[#B5BAC1] hover:text-white
                !rounded-2xl w-10 h-10 flex items-center justify-center
              "
            />
          </ItemWrap>

          {/* <ItemWrap active={false}>
            <TooltipBtn
              icon={Cloud}
              label="Cloud"
              className="relative z-[1] text-[#B5BAC1] hover:text-white !rounded-2xl w-10 h-10 flex items-center justify-center"
            />
          </ItemWrap>

          <ItemWrap active={false}>
            <TooltipBtn
              icon={Briefcase}
              label="Công việc"
              className="relative z-[1] text-[#B5BAC1] hover:text-white !rounded-2xl w-10 h-10 flex items-center justify-center"
            />
          </ItemWrap>

          <ItemWrap active={false}>
            <TooltipBtn
              icon={Settings}
              label="Cài đặt"
              className="relative z-[1] text-[#B5BAC1] hover:text-white !rounded-2xl w-10 h-10 flex items-center justify-center"
            />
          </ItemWrap> */}

          {/* Khoảng cách đáy */}
          <div className="h-1" />
        </div>
      </div>

      <ProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </>
  );
}
