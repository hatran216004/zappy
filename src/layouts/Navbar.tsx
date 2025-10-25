import { TooltipBtn } from '@/components/TooltipBtn';
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { cn } from "@/lib/utils";
// import { avatarVariants } from "@/lib/variants";
import {
  MessageCircle,
  Users,
  Cloud,
  Briefcase,
  Settings,
  Moon,
  Sun,
  User,
  LogOut
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useProfile } from '@/hooks/useProfile';
import ProfileModal from '@/components/profile/ProfileModal';
import useLogout from '@/hooks/useLogout';
import { useAuth } from '@/stores/user';
import {
  useFriendRequestsRealtime,
  usePendingFriendRequests
} from '@/hooks/useFriends';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { twMerge } from 'tailwind-merge';
import { avatarVariants } from '@/lib/variants';

export default function Navbar() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: requests } = usePendingFriendRequests(userId as string);

  // Subscribe to realtime updates
  useFriendRequestsRealtime(userId as string);
  let hasFriendRequest = true;

  const { logout } = useLogout();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: profile } = useProfile(userId as string);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  if (!requests || requests.length === 0) {
    hasFriendRequest = false;
  }

  return (
    <>
      <div className="w-[70px] border-r dark:border-gray-800 bg-blue-500 dark:bg-gray-950 flex flex-col items-center py-4 justify-between">
        <div className="flex flex-col items-center gap-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full">
                <Avatar className={twMerge(avatarVariants({ size: 'md' }))}>
                  <AvatarImage src={profile?.avatar_url} />

                  <AvatarFallback className="bg-zinc-300">
                    {profile?.display_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 ml-4 dark:bg-gray-800 dark:border-gray-700"
              align="start"
            >
              <DropdownMenuLabel className="dark:text-gray-200">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.display_name || 'Chưa có tên'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:bg-gray-700" />
              <DropdownMenuItem
                onClick={() => setProfileModalOpen(true)}
                className="cursor-pointer dark:hover:bg-gray-700 dark:text-gray-200"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Thông tin cá nhân</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-700 dark:text-gray-200">
                <Settings className="mr-2 h-4 w-4" />
                <span>Cài đặt</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="dark:bg-gray-700" />
              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer text-red-500 dark:text-red-400 dark:hover:bg-gray-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipBtn
            onClick={() => navigate('/chat')}
            isActive={pathname.includes('chat') || pathname === '/'}
            icon={MessageCircle}
            label="Tin nhắn"
            className="text-white hover:text-white hover:bg-zinc-600/50"
          />
          <TooltipBtn
            onClick={() => navigate('/friends')}
            icon={Users}
            hasBadge={hasFriendRequest}
            isActive={pathname.includes('friends')}
            label="Danh bạ"
            className="text-white hover:text-white hover:bg-zinc-600/50"
          />
        </div>
        <div className="flex flex-col items-center gap-6">
          <TooltipBtn
            onClick={toggleTheme}
            icon={theme === 'light' ? Moon : Sun}
            label={`${theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}`}
            className="text-white hover:text-white hover:bg-zinc-600/50"
          />
          <TooltipBtn
            icon={Cloud}
            label="Cloud"
            className="text-white hover:text-white hover:bg-zinc-600/50"
          />
          <TooltipBtn
            icon={Briefcase}
            label="Công việc"
            className="text-white hover:text-white hover:bg-zinc-600/50"
          />
          <TooltipBtn
            icon={Settings}
            label="Cài đặt"
            className="text-white hover:text-white hover:bg-zinc-600/50"
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
