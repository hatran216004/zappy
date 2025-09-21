import { Users, Phone, Video, Search, Info } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function ChatHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src="/group.png" />
          <AvatarFallback>G</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            Cường đại đế và tàu ngọc trai đen
          </p>
          <span className="text-xs text-gray-500">5 thành viên</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
        <Search className="size-5 cursor-pointer" />
        <Phone className="size-5 cursor-pointer" />
        <Video className="size-5 cursor-pointer" />
        <Users className="size-5 cursor-pointer" />
        <Info className="size-5 cursor-pointer" />
      </div>
    </div>
  );
}
