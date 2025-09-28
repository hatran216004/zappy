import { Search, UserPlus } from "lucide-react";
import { TooltipBtn } from "./TooltipBtn";
import { TbUsersPlus } from "react-icons/tb";

export default function SearchBar() {
  return (
    <div className="flex items-center gap-2 p-2">
      <div className="flex items-center flex-1 bg-gray-200 dark:bg-gray-800 rounded-md px-2">
        <Search className="h-4 w-4 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Tìm kiếm"
          className="flex-1 bg-transparent text-sm px-2 py-1 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
        />
      </div>

      <TooltipBtn icon={UserPlus} label="Thêm bạn" />
      <TooltipBtn icon={TbUsersPlus} label="Tạo nhóm" />
    </div>
  );
}
