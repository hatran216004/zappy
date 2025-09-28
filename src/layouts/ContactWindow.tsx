import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Filter, MoreHorizontal, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";

// Mock friends data
const friends = [
  { id: 1, name: "User 1", avatar: "/default_user.jpg" },
  { id: 2, name: "User 2", avatar: "/default_user.jpg" },
  { id: 3, name: "User 3", avatar: "/default_user.jpg" },
  { id: 4, name: "User 4", avatar: "/default_user.jpg" },
  { id: 5, name: "User 5", avatar: "/default_user.jpg" },
  { id: 6, name: "User 6", avatar: "/default_user.jpg" },
  { id: 7, name: "User 7", avatar: "/default_user.jpg" },
  { id: 8, name: "User 8", avatar: "/default_user.jpg" },
];

const classifyTags = [
  { color: "bg-red-500", label: "Khóa luận cử nhân" },
  { color: "bg-blue-500", label: "Thực tập" },
];

export default function ContactWindow() {
  const [filter, setFilter] = useState("Tất cả");
  const [sort, setSort] = useState("Tên (A-Z)");

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="px-3 py-2 select-none">Bạn bè ({friends.length})</div>

      {/* Search + Controls */}
      <div className="flex gap-2 p-3">
        {/* Search */}
        <Input
          placeholder="Tìm bạn..."
          className="flex-1 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 
                 focus:ring-2 focus:ring-blue-500 transition"
        />
        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center justify-between w-1/4 h-9 rounded-lg 
                     bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <span className="truncate">{sort}</span>
              <ChevronDown className="size-4 ml-1 shrink-0 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[var(--radix-dropdown-menu-trigger-width)] 
                   bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
                   border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg"
          >
            {["Tên (A-Z)", "Tên (Z-A)"].map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => setSort(option)}
                className="flex justify-between items-center px-3 py-2 rounded-md 
                         hover:bg-gray-100 dark:hover:bg-gray-700 transition truncate"
              >
                {option}
                {sort === option && (
                  <Check className="size-4 text-blue-500 shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Filter dropdown */}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center justify-between w-1/4 h-9 rounded-lg 
                     bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <Filter className="size-4 mr-1 shrink-0 opacity-70" />
              <span className="truncate">{filter}</span>
              <ChevronDown className="size-4 ml-1 shrink-0 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[var(--radix-dropdown-menu-trigger-width)] 
                   bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
                   border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg overflow-hidden"
          >
            <DropdownMenuItem
              onClick={() => setFilter("Tất cả")}
              className="flex justify-between items-center px-3 py-2 rounded-md 
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Tất cả
              {filter === "Tất cả" && (
                <Check className="size-4 text-blue-500 shrink-0" />
              )}
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="px-3 py-2 rounded-md">
                Phân loại
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                className="w-[var(--radix-dropdown-menu-trigger-width)]  
             bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
             border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg 
             overflow-hidden max-h-[300px]"
              >
                {classifyTags.map((tag) => (
                  <DropdownMenuItem
                    key={tag.label}
                    onClick={() => setFilter(tag.label)}
                    className="flex justify-between items-center px-3 py-2 rounded-md 
                 hover:bg-gray-100 dark:hover:bg-gray-700 transition truncate"
                  >
                    <span className="flex items-center">
                      <span
                        className={`w-2 h-2 rounded-full inline-block mr-2 ${tag.color}`}
                      />
                      {tag.label}
                    </span>
                    {filter === tag.label && (
                      <Check className="size-4 text-blue-500 shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="px-3 py-2">
                  Quản lý thẻ phân loại
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Friend list */}
      <div className="flex-1 overflow-y-auto scrollbar-custom">
        {friends.map((friend) => (
          <div
            key={friend.id}
            className="mt-2 relative flex items-center justify-between px-3 py-2 
                     hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"
          >
            <div className="flex items-center gap-3 relative z-10">
              <Avatar className={cn(avatarVariants({ size: "md" }))}>
                <AvatarImage src={friend.avatar} />
                <AvatarFallback className="bg-zinc-300">MD</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{friend.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 relative z-10"
            >
              <MoreHorizontal className="size-4" />
            </Button>

            {/* Border custom */}
            <div className="absolute bottom-0 left-[60px] right-0 border-b border-gray-700"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
