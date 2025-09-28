import { Users, Phone, Video, Search, Info } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TooltipBtn } from "../TooltipBtn";

export default function ChatHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src="/group.png" />
          <AvatarFallback className="bg-zinc-300">G</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            Nhóm 1
          </p>
          <span className="text-xs text-gray-500">5 thành viên</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
        <TooltipBtn icon={Search} />
        <TooltipBtn icon={Phone} />
        <TooltipBtn icon={Video} />
        <TooltipBtn icon={Users} />
        <TooltipBtn icon={Info} />
      </div>
    </div>
  );
}
