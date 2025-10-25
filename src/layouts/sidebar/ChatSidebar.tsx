import ConversationsList from '@/components/conversation/ConversationsList';
import ClassifyDropdown from '@/components/ContactBar/ClassifyDropdown';
import useUrl from '@/hooks/useUrl';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/stores/user';
import SearchBar from '@/components/SearchBar';

const classifyTags = [
  { color: 'bg-red-500', label: 'Khóa luận cử nhân' },
  { color: 'bg-blue-500', label: 'Thực tập' },
  { color: 'bg-gray-400', label: 'Tin nhắn từ người lạ' }
];

const tabs = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' }
];

export default function ChatSidebar() {
  const { user } = useAuth();
  const userId = user?.id;

  const { currentValue, handler } = useUrl({
    field: 'tab',
    defaultValue: 'all'
  });

  return (
    <aside className="col-span-3 border-r dark:border-gray-900 bg-gray-50 dark:bg-gray-800 flex flex-col">
      <SearchBar />
      <div className="flex-1 border-r dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-1 px-3 mt-2 border-b border-gray-300 dark:border-gray-700 text-sm">
          <div className="flex flex-1">
            {tabs.map((t) => {
              const isTabActive = currentValue === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => handler(t.value)}
                  className={twMerge(
                    'flex-1 py-2 border-b-2 border-transparent text-gray-500 dark:text-gray-400',
                    isTabActive && 'border-blue-500 text-blue-500'
                  )}
                  type="button"
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <ClassifyDropdown classifyTags={classifyTags} />
        </div>

        <ConversationsList userId={userId as string} />
      </div>
    </aside>
  );
}
