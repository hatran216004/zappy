import { useEffect, useState } from "react";
import ClassifyDropdown from "@/components/ContactBar/ClassifyDropdown";
import SelectableButton from "@/components/ContactBar/SelectableButton";
import SearchBar from "@/components/SearchBar";

import { BsPersonLinesFill } from "react-icons/bs";
import { HiMiniUserGroup } from "react-icons/hi2";
import { IoMdPersonAdd } from "react-icons/io";
import { Pin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Chat } from "@/types/chat";

const mockChats: Chat[] = [
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
  // {
  //   id: 3,
  //   name: "Nhóm 1",
  //   lastMsg: "Cuong: abc ...",
  //   time: "1 phút",
  //   avatar: "/test.png",
  //   unread: 64,
  //   active: true,
  // },
  // {
  //   id: 3,
  //   name: "Nhóm 1",
  //   lastMsg: "Cuong: abc ...",
  //   time: "1 phút",
  //   avatar: "/test.png",
  //   unread: 64,
  //   active: true,
  // },
  // {
  //   id: 3,
  //   name: "Nhóm 1",
  //   lastMsg: "Cuong: abc ...",
  //   time: "1 phút",
  //   avatar: "/test.png",
  //   unread: 64,
  //   active: true,
  // },
  // {
  //   id: 3,
  //   name: "Nhóm 1",
  //   lastMsg: "Cuong: abc ...",
  //   time: "1 phút",
  //   avatar: "/test.png",
  //   unread: 64,
  //   active: true,
  // },
  // {
  //   id: 3,
  //   name: "Nhóm 1",
  //   lastMsg: "Cuong: abc ...",
  //   time: "1 phút",
  //   avatar: "/test.png",
  //   unread: 64,
  //   active: true,
  // },
  // {
  //   id: 3,
  //   name: "Nhóm 1",
  //   lastMsg: "Cuong: abc ...",
  //   time: "1 phút",
  //   avatar: "/test.png",
  //   unread: 64,
  //   active: true,
  // },
  // {
  //   id: 3,
  //   name: "Nhóm 1",
  //   lastMsg: "Cuong: abc ...",
  //   time: "1 phút",
  //   avatar: "/test.png",
  //   unread: 64,
  //   active: true,
  // },
  // {
  //   id: 3,
  //   name: "Nhóm 1",
  //   lastMsg: "Cuong: abc ...",
  //   time: "1 phút",
  //   avatar: "/test.png",
  //   unread: 64,
  //   active: true,
  // },
  // {
  //   id: 3,
  //   name: "Nhóm 1",
  //   lastMsg: "Cuong: abc ...",
  //   time: "1 phút",
  //   avatar: "/test.png",
  //   unread: 64,
  //   active: true,
  // },
  // {
  //   id: 3,
  //   name: "Nhóm 1",
  //   lastMsg: "Cuong: abc ...",
  //   time: "1 phút",
  //   avatar: "/test.png",
  //   unread: 64,
  //   active: true,
  // },
  // {
  //   id: 3,
  //   name: "Nhóm 1",
  //   lastMsg: "Cuong: abc ...",
  //   time: "1 phút",
  //   avatar: "/test.png",
  //   unread: 64,
  //   active: true,
  // },
  // {
  //   id: 3,
  //   name: "Nhóm 1",
  //   lastMsg: "Cuong: abc ...",
  //   time: "1 phút",
  //   avatar: "/test.png",
  //   unread: 64,
  //   active: true,
  // },
];

const classifyTags = [
  { color: "bg-red-500", label: "Khóa luận cử nhân" },
  { color: "bg-blue-500", label: "Thực tập" },
  { color: "bg-gray-400", label: "Tin nhắn từ người lạ" },
];

const sidebarButtons = [
  { id: "ListFriend", title: "Danh sách bạn bè", icon: BsPersonLinesFill },
  { id: "Group", title: "Danh sách nhóm và cộng đồng", icon: HiMiniUserGroup },
  { id: "AddFriend", title: "Lời mời kết bạn", icon: IoMdPersonAdd },
];

const tabs = [
  { id: "all", title: "Tất cả" },
  { id: "unread", title: "Chưa đọc" },
];

type ContactBarProps = {
  currentTab: string;
  setContentContact: React.Dispatch<React.SetStateAction<object>>;
};

export default function ContactBar({
  currentTab,
  setContentContact,
}: ContactBarProps) {
  const [tab, setTab] = useState("all");
  const [isActive, setIsActive] = useState("ListFriend");

  const currenContentContact = sidebarButtons.find(
    (item) => item.id === isActive
  );

  useEffect(() => {
    if (currenContentContact) {
      setContentContact(currenContentContact);
    }
  }, [isActive, currenContentContact, setContentContact]);

  return (
    <div className="w-[350px] border-r dark:border-gray-900 bg-gray-50 dark:bg-gray-800">
      <div className="flex flex-col h-full">
        {/* Search bar */}
        <SearchBar />

        {/* Tabs */}
        <div className="flex border-b border-gray-300 dark:border-gray-700 text-sm">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 py-2",
                tab === t.id
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              {t.title}
            </button>
          ))}
          <ClassifyDropdown classifyTags={classifyTags} />
        </div>

        {/* Sidebar buttons */}
        {currentTab === "ContactList" ? (
          <div className="flex-1 overflow-y-auto scrollbar-custom">
            <div className="flex flex-col">
              {sidebarButtons.map((btn) => (
                <SelectableButton
                  key={btn.id}
                  id={btn.id}
                  title={btn.title}
                  icon={btn.icon}
                  isActive={isActive}
                  setIsActive={setIsActive}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-custom">
            {mockChats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatItem({ chat }: { chat: Chat }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 cursor-pointer ",
        chat.active
          ? "bg-blue-600/20"
          : "hover:bg-gray-200 dark:hover:bg-gray-800"
      )}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={chat.avatar} />
        <AvatarFallback className="bg-zinc-300">{chat.name[0]}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className="font-medium truncate text-gray-900 dark:text-gray-100">
            {chat.name}
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {chat.time}
          </span>
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
  );
}
