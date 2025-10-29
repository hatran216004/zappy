import ConversationsList from '@/components/conversation/ConversationsList';
import ClassifyDropdown from '@/components/ContactBar/ClassifyDropdown';
import useUrl from '@/hooks/useUrl';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/stores/user';
import SearchBar from '@/components/SearchBar';
import { MoreVertical, Users } from 'lucide-react';
import { useState } from 'react';
import { CreateGroupModal } from '@/components/modal/CreateGroupModal';

const tabs = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' }
];

export default function ChatSidebar() {
  const { user } = useAuth();
  const userId = user?.id;
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const { currentValue, handler } = useUrl({
    field: 'tab',
    defaultValue: 'all'
  });

  return (
    <aside
      className="
        col-span-3 flex flex-col
        bg-white text-gray-900 border-r border-gray-200
        dark:bg-[#2B2D31] dark:text-[#F2F3F5] dark:border-[#2B2D31]
      "
    >
      {/* Search sticky */}
      <div className="sticky top-0 z-20 bg-white dark:bg-[#2B2D31]">
        <SearchBar />
      </div>

      {/* Header: Tin nhắn trực tiếp + actions */}
      <div
        className="
          sticky top-[52px] z-10
          flex items-center justify-between px-3 py-2
          bg-white/95 backdrop-blur-[2px]
          border-b border-gray-200
          dark:bg-[#2B2D31]/90 dark:border-[#3F4246]
        "
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#B5BAC1]">
          Tin nhắn trực tiếp
        </h3>
        <div className="flex items-center gap-1.5">
          {/* Create Group Button */}
          <button
            type="button"
            aria-label="Tạo nhóm mới"
            onClick={() => setShowCreateGroupModal(true)}
            className="
              discord-icon-btn
              text-gray-600 hover:text-gray-900
              dark:text-[#B5BAC1] dark:hover:text-white
            "
            title="Tạo nhóm"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* More / context (decorative – UI only) */}
          <button
            type="button"
            aria-label="Tùy chọn"
            className="
              discord-icon-btn
              text-gray-600 hover:text-gray-900
              dark:text-[#B5BAC1] dark:hover:text-white
            "
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Classify dropdown */}
          <div className="pl-1">
            <ClassifyDropdown
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
            />
          </div>
        </div>
      </div>

      {/* Tabs (underline blurple, hover blob) */}
      <div
        className="
          sticky top-[92px] z-10
          flex items-center gap-1 px-2
          bg-white/95 backdrop-blur-[2px]
          border-b border-gray-200
          dark:bg-[#2B2D31]/90 dark:border-[#3F4246]
        "
      >
        <div className="flex flex-1">
          {tabs.map((t) => {
            const isActive = currentValue === t.value;
            return (
              <button
                key={t.value}
                onClick={() => handler(t.value)}
                type="button"
                className={twMerge(
                  'relative flex-1 py-2 text-sm transition-colors',
                  'text-gray-600 hover:text-gray-900 dark:text-[#B5BAC1] dark:hover:text-white',
                  isActive && 'text-[#5865F2] dark:text-[#F2F3F5]'
                )}
              >
                {/* hover blob */}
                <span className="pointer-events-none absolute inset-x-3 -z-10 h-7 rounded-lg bg-gray-100 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-white/5" />
                {t.label}
                {/* underline blurple */}
                <span
                  className={twMerge(
                    'absolute left-0 right-0 -bottom-[1px] mx-auto h-[2px] w-0 rounded-full transition-all',
                    isActive ? 'w-12 bg-[#5865F2]' : 'bg-transparent'
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* List area (Discord card bg in dark) */}
      <div className="flex-1 bg-transparent dark:bg-[#313338]">
        {/* Sub-header: “Tất cả cuộc trò chuyện” */}
        <div
          className="
            px-3 py-2 text-[11px] uppercase tracking-wide
            text-gray-500 border-b border-gray-200
            dark:text-[#B5BAC1] dark:border-[#2B2D31]
          "
        >
          {currentValue === 'unread' ? 'Chưa đọc' : 'Tất cả cuộc trò chuyện'}
        </div>

        <div className="h-full overflow-y-auto discord-scroll">
          <ConversationsList
            userId={userId as string}
            selectedFilter={selectedFilter}
          />
        </div>
      </div>

      {/* Footer hint bar (decorative) */}
      <div
        className="
          h-10 flex items-center justify-between px-3
          text-[12px]
          bg-white border-t border-gray-200
          dark:bg-[#2B2D31] dark:border-[#3F4246]
        "
      >
        <span className="text-gray-500 dark:text-[#B5BAC1]">Mẹo: Nhấn <kbd className="px-1 py-[1px] rounded border border-gray-300 bg-white text-gray-700 dark:bg-[#1E1F22] dark:border-[#3F4246] dark:text-[#F2F3F5]">/</kbd> để tìm nhanh</span>
        <span className="text-gray-400 dark:text-[#B5BAC1]">Blurple UI · Discord style</span>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        open={showCreateGroupModal}
        onOpenChange={setShowCreateGroupModal}
        userId={userId as string}
      />
    </aside>
  );
}
