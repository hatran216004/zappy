import { Users, Phone, Video, Search, Info } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TooltipBtn } from '../TooltipBtn';

export default function ChatHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700 bg-white dark:bg-gray-800 ">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src="/group.png" />
          <AvatarFallback className="bg-zinc-300">G</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            Nhóm 1
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            5 thành viên
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 sm:gap-3 text-gray-600 dark:text-gray-300">
        <TooltipBtn icon={Search} label="Tìm kiếm" />
        <TooltipBtn icon={Phone} label="Gọi thoại" />
        <TooltipBtn icon={Video} label="Gọi video" />
        <TooltipBtn icon={Users} label="Thành viên" />
        <TooltipBtn icon={Info} label="Thông tin" />
      </div>
    </div>
  );
}
