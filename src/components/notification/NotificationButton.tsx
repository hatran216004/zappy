// components/notification/NotificationButton.tsx
import { Bell } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { NotificationPanel } from './NotificationPanel';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import { useState } from 'react';

interface NotificationButtonProps {
  userId: string;
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({
  userId
}) => {
  const { data: unreadCount } = useUnreadNotificationsCount(userId);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="
            relative
            flex h-9 w-9 items-center justify-center
            rounded-full
            bg-white/18
            text-white
            hover:bg-white/25
            transition-colors
            focus:outline-none
            focus:ring-2
            focus:ring-white/80
          "
        >
          <Bell className="h-4 w-4" />
          {Number(unreadCount) > 0 && (
            <Badge
              variant="destructive"
              className="
                absolute -top-1 -right-1
                min-w-[18px] h-[18px]
                px-1
                bg-[#FF5C93]
                border-0
                text-[11px]
                font-semibold
                shadow-md
              "
            >
              {Number(unreadCount) > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Thông báo</span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[400px] p-0" sideOffset={8}>
        <NotificationPanel userId={userId} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};
