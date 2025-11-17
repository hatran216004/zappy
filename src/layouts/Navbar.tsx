import {
  MessageCircle,
  Users,
  Globe,
  Settings,
  Moon,
  Sun,
  User,
  LogOut,
  Search
} from 'lucide-react';
import { useEffect, useState, type ElementType } from 'react';
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
import { SearchUsersModal } from '@/components/modal/SearchUsersModal';
import { SettingsModal } from '@/components/modal/SettingsModal';
import useLogout from '@/hooks/useLogout';
import { useAuth } from '@/stores/user';
import {
  useFriendRequestsRealtime,
  usePendingFriendRequests
} from '@/hooks/useFriends';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { twMerge } from 'tailwind-merge';
import { avatarVariants } from '@/lib/variants';
import { useUserStatus, useUserStatusRealtime } from '@/hooks/usePresence';

type CenterNavItemProps = {
  active: boolean;
  icon: ElementType;
  label: string;
  onClick: () => void;
  badge?: number | null;
};

const CenterNavItem = ({
  active,
  icon: Icon,
  label,
  onClick,
  badge
}: CenterNavItemProps) => (
  <button
    onClick={onClick}
    className={twMerge(
      'relative flex h-[56px] w-[80px] items-center justify-center rounded-xl',
      // icon nhạt trên nền tím + hover trắng mờ
      'text-white/70 hover:bg-white/10'
    )}
  >
    <Icon
      className={twMerge(
        'h-5 w-5 text-white/80 transition-colors',
        active && 'text-white drop-shadow-sm'
      )}
    />
    {/* Active underline trắng */}
    <span
      className={twMerge(
        'pointer-events-none absolute bottom-0 left-4 right-4 h-[3px] rounded-full transition-colors',
        active ? 'bg-white' : 'bg-transparent'
      )}
    />
    {/* Badge (friend request) hồng hơn cho nổi trên tím */}
    {badge && badge > 0 && (
      <span
        className="
          absolute top-1 right-4 min-w-[18px] h-[18px] px-1
          rounded-full bg-[#FF5C93]
          text-[11px] text-white font-semibold
          flex items-center justify-center
          shadow
        "
      >
        {badge > 9 ? '9+' : badge}
      </span>
    )}
    <span className="sr-only">{label}</span>
  </button>
);

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
  const { data: statusProfile } = useUserStatus(userId || '');
  useUserStatusRealtime(userId || '');

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [searchUsersModalOpen, setSearchUsersModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
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

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const isChat = pathname.includes('chat') || pathname === '/';
  const isFriends = pathname.includes('friends');
  const isPost = pathname.includes('posts');

  const currentStatus = statusProfile?.status ?? profile?.status;

  return (
    <>
      <div
        data-tour-id="navbar"
        className="
          flex h-[56px] w-full items-center
          justify-between
          px-3
          relative
          z-10
          border-b border-transparent
          bg-gradient-to-r from-[#C93BFF] via-[#8A3BFF] to-[#3B6BFF]
        "
      >
        {/* LEFT: Logo + Search */}
        <div className="flex items-center gap-3 min-w-[260px]">
          {/* Logo tròn (đổi thành nền trắng cho hợp gradient) */}
          <button
            onClick={() => navigate('/chat')}
            className="
              flex h-10 w-10 items-center justify-center
              rounded-full bg-white/90
              text-[#8A3BFF] text-xl font-bold
              shadow-sm
            "
          >
            f
          </button>

          {/* Ô search giả (mở modal tìm user) – nền trắng mờ, text trắng */}
          <button
            onClick={() => setSearchUsersModalOpen(true)}
            className="
              hidden sm:flex items-center
              h-10 w-[220px] md:w-[260px]
              rounded-full
              bg-white/15 border border-white/25
              px-3
              text-sm text-white/90
              hover:bg-white/20
            "
          >
            <Search className="mr-2 h-4 w-4 text-white/90" />
            <span className="truncate">Tìm kiếm trên ChatApp</span>
          </button>
        </div>

        {/* CENTER: các icon điều hướng */}
        <div className="flex flex-1 justify-center gap-1">
          <CenterNavItem
            active={isChat}
            icon={MessageCircle}
            label="Tin nhắn"
            onClick={() => navigate('/chat')}
          />
          <CenterNavItem
            active={isFriends}
            icon={Users}
            label="Danh bạ"
            onClick={() => navigate('/friends')}
            badge={hasFriendRequest ? requests!.length : null}
          />
          <CenterNavItem
            active={isPost}
            icon={Globe}
            label="Posts"
            onClick={() => navigate('/posts')}
          />
        </div>

        {/* RIGHT: theme + avatar dropdown */}
        <div className="flex items-center justify-end gap-3 min-w-[180px]">
          {/* Nút search trên mobile */}
          <button
            onClick={() => setSearchUsersModalOpen(true)}
            className="
              flex sm:hidden h-9 w-9 items-center justify-center
              rounded-full bg-white/18
              text-white
              hover:bg-white/25
            "
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Nút đổi theme – icon trắng trên nền trắng mờ */}
          <button
            onClick={toggleTheme}
            className="
              flex h-9 w-9 items-center justify-center
              rounded-full bg-white/18
              text-white
              hover:bg-white/25
            "
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>

          {/* Avatar + dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="
                  relative flex h-9 w-9 items-center justify-center
                  rounded-full bg-white/18
                  hover:bg-white/25
                  focus:outline-none focus:ring-2 focus:ring-white/80
                "
              >
                <Avatar
                  className={twMerge(avatarVariants({ size: 'sm' }), 'h-7 w-7')}
                >
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-white text-[#8A3BFF] font-semibold">
                    {profile?.display_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                {currentStatus && (
                  <span
                    className={twMerge(
                      'absolute -bottom-[2px] -right-[2px] h-3 w-3 rounded-full border-2 border-white/90',
                      currentStatus === 'online'
                        ? 'bg-[#31A24C]'
                        : 'bg-[#80838A]'
                    )}
                  />
                )}
              </button>
            </DropdownMenuTrigger>

            {/* Dropdown giữ nền sáng để dễ đọc, không phụ thuộc gradient */}
            <DropdownMenuContent
              className="
                w-64 mr-2
                bg-white
                text-[#050505]
                border border-[#E4E6EB]
                shadow-xl
              "
              align="end"
            >
              <DropdownMenuLabel className="text-[#050505]">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-[#8A3BFF] text-white">
                      {profile?.display_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">
                      {profile?.display_name || 'Chưa có tên'}
                    </p>
                    <p className="text-xs leading-none text-[#65676B]">
                      {user?.email}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      {currentStatus && (
                        <>
                          <span
                            className={twMerge(
                              'h-2 w-2 rounded-full',
                              currentStatus === 'online'
                                ? 'bg-[#31A24C]'
                                : 'bg-[#80838A]'
                            )}
                          />
                          <span className="text-xs text-[#65676B]">
                            {currentStatus === 'online'
                              ? 'Đang hoạt động'
                              : 'Ngoại tuyến'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-[#E4E6EB]" />

              <DropdownMenuItem
                onClick={() => setProfileModalOpen(true)}
                className="cursor-pointer hover:bg-[#F0F2F5]"
              >
                <User className="mr-2 h-4 w-4 text-[#8A3BFF]" />
                <span>Thông tin cá nhân</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setSettingsModalOpen(true)}
                className="cursor-pointer hover:bg-[#F0F2F5]"
              >
                <Settings className="mr-2 h-4 w-4 text-[#8A3BFF]" />
                <span>Cài đặt</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-[#E4E6EB]" />

              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer text-[#E41E3F] hover:bg-[#FEEFEE]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* MODALS GIỮ NGUYÊN LOGIC */}
      <ProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />

      <SearchUsersModal
        open={searchUsersModalOpen}
        onClose={() => setSearchUsersModalOpen(false)}
        currentUserId={userId as string}
      />

      <SettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        userId={userId as string}
      />
    </>
  );
}
