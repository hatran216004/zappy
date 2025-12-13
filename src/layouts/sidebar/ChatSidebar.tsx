import ConversationsList from '@/components/conversation/ConversationsList';
import ClassifyDropdown from '@/components/ContactBar/ClassifyDropdown';
import useUrl from '@/hooks/useUrl';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/stores/user';
import SearchBar from '@/components/SearchBar';
import { MoreVertical, Users, UserPlus } from 'lucide-react';
import { useState, useRef } from 'react';
import { CreateGroupModal } from '@/components/modal/CreateGroupModal';
import AddFriendModal from '@/components/modal/AddFriendModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Bot, Sparkles } from 'lucide-react';
import { ZappyAIChatModal } from '@/components/modal/ZappyAIChatModal';

const tabs = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' },
  { value: 'groups', label: 'Nhóm' }
];

export default function ChatSidebar() {
  const { user } = useAuth();
  const userId = user?.id;
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showZappyAIModal, setShowZappyAIModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const { currentValue, handler } = useUrl({
    field: 'tab',
    defaultValue: 'all'
  });

  return (
    <aside
      ref={sidebarRef}
      className="
        col-span-3 flex flex-col
        bg-white text-gray-900 border-r border-gray-200
        dark:bg-[#2B2D31] dark:text-[#F2F3F5] dark:border-[#2B2D31]
      "
    >
      {/* Header: Đoạn chat + actions */}
      <div className="sticky top-0 z-20 bg-white dark:bg-[#2B2D31] border-b border-gray-200 dark:border-[#3F4246]">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F2F3F5]">
            Đoạn chat
          </h2>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Tùy chọn"
                  className="
                    p-1.5 rounded-full
                    text-gray-600 hover:text-gray-900 hover:bg-gray-100
                    dark:text-[#B5BAC1] dark:hover:text-white dark:hover:bg-white/10
                    transition-colors
                  "
                  title="Tùy chọn"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => {
                    setShowCreateGroupModal(true);
                  }}
                  className="cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Tạo nhóm</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setShowAddFriendModal(true);
                  }}
                  className="cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Thêm bạn</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* <button
              type="button"
              aria-label="Soạn tin nhắn mới"
              onClick={() => setShowCreateGroupModal(true)}
              className="
                p-1.5 rounded-full
                text-gray-600 hover:text-gray-900 hover:bg-gray-100
                dark:text-[#B5BAC1] dark:hover:text-white dark:hover:bg-white/10
                transition-colors
              "
              title="Soạn tin nhắn mới"
            >
              <SquarePen className="w-5 h-5" />
            </button> */}
          </div>
        </div>

        {/* Search bar */}
        <div className="px-3 pb-3">
          <SearchBar />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-3 pb-2">
          {tabs.map((t) => {
            const isActive = currentValue === t.value;
            return (
              <button
                key={t.value}
                onClick={() => handler(t.value)}
                type="button"
                className={twMerge(
                  'relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-[#B5BAC1] dark:hover:text-white'
                )}
              >
                {t.label}
              </button>
            );
          })}
          <div className="ml-auto">
            <ClassifyDropdown
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
            />
          </div>
        </div>
        {/* Zappy AI Banner */}
        <div className="px-3 pb-2">
          <button
            onClick={() => setShowZappyAIModal(true)}
            className="
            w-full flex items-center justify-between p-3
            bg-gradient-to-r from-blue-600 to-purple-600
            rounded-xl shadow-md
            text-white hover:opacity-90 transition-opacity
            group
          "
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Zappy AI</p>
                <p className="text-[11px] text-blue-100 dark:text-gray-200">Hỏi tôi bất cứ điều gì!</p>
              </div>
            </div>
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
          </button>
        </div>
      </div>

      {/* List area */}
      <div
        className="h-[calc(100vh-290px)] bg-transparent dark:bg-[#313338] overflow-y-auto overflow-x-hidden discord-scroll relative"
        style={{ contain: 'layout style paint' }}
      >
        <ConversationsList
          userId={userId as string}
          selectedFilter={selectedFilter}
          tab={currentValue}
          sidebarRef={sidebarRef}
        />
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        open={showCreateGroupModal}
        onOpenChange={setShowCreateGroupModal}
        userId={userId as string}
      />

      {/* Add Friend Modal */}
      <AddFriendModal
        open={showAddFriendModal}
        onOpenChange={setShowAddFriendModal}
      />

      {/* Zappy AI Modal */}
      <ZappyAIChatModal
        open={showZappyAIModal}
        onOpenChange={setShowZappyAIModal}
      />
    </aside>
  );
}
