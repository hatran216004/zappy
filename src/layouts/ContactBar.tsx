import { useState } from "react";
import { Search, UserPlus, Pin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { TbUsersPlus } from "react-icons/tb";

import { TooltipBtn } from "@/components/TooltipBtn";
import ClassifyDropdown from "@/components/ContactBar/ClassifyDropdown";

const mockChats = [
  {
    id: 1,
    name: "Hieu",
    lastMsg: "Bạn: Test123",
    time: "5 ngày",
    avatar: "/test.png",
    pinned: true,
  },
  {
    id: 2,
    name: "Ha",
    lastMsg: "Ha: @Nguyễn Trọng Hiếu ...",
    time: "23 giờ",
    avatar: "/test.png",
    unread: 25,
    pinned: true,
  },
  {
    id: 3,
    name: "Nhóm 1",
    lastMsg: "Cuong: abc ...",
    time: "1 phút",
    avatar: "/test.png",
    unread: 64,
    active: true,
  },
];

const classifyTags = [
  { color: "bg-red-500", label: "Khóa luận cử nhân" },
  { color: "bg-blue-500", label: "Thực tập" },
  { color: "bg-gray-400", label: "Tin nhắn từ người lạ" },
];

export default function ContactBar() {
  const [tab, setTab] = useState("all");

  return (
    <div className="w-[350px] border-r dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col h-full">
        {/* Search bar */}
        <div className="flex items-center gap-2 p-2">
          <div className="flex items-center flex-1 bg-gray-200 dark:bg-gray-800 rounded-md px-2">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm"
              className="flex-1 bg-transparent text-sm px-2 py-1 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
            />
          </div>

          <TooltipBtn icon={<UserPlus className="size-5" />} label="Thêm bạn" />
          <TooltipBtn
            icon={<TbUsersPlus className="size-5" />}
            label="Tạo nhóm"
          />
        </div>

        <div className="flex border-b border-gray-300 dark:border-gray-700 text-sm">
          {/* Tất cả */}
          <button
            onClick={() => setTab("all")}
            className={`flex-1 py-2 ${
              tab === "all"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Tất cả
          </button>

          {/* Chưa đọc */}
          <button
            onClick={() => setTab("unread")}
            className={`flex-1 py-2 ${
              tab === "unread"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Chưa đọc
          </button>

          {/* Phân loại */}
          <ClassifyDropdown classifyTags={classifyTags} />
        </div>

        {/* Banner */}
        {/* <div className="bg-blue-600 text-white text-sm px-3 py-2">
          Khi đăng nhập Zalo Web trên nhiều trình duyệt, một số trò chuyện sẽ
          không đủ tin nhắn cũ.
          <br />
          <span className="underline cursor-pointer">Tải Zalo PC</span> để xem
          đầy đủ tin nhắn
        </div> */}

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto scrollbar-custom [scrollbar-gutter:stable]">
          {mockChats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                chat.active
                  ? "bg-blue-600/20"
                  : "hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={chat.avatar} />
                <AvatarFallback className="bg-zinc-300">
                  {chat.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-medium truncate text-gray-900 dark:text-gray-100">
                    {chat.name}
                  </p>
                  <span className="text-xs text-gray-500">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs truncate text-gray-500 dark:text-gray-400">
                    {chat.lastMsg}
                  </p>
                  <div className="flex items-center gap-1">
                    {chat.unread && (
                      <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5">
                        {chat.unread > 99 ? "99+" : chat.unread}
                      </span>
                    )}
                    {chat.pinned && (
                      <Pin className="size-3 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
