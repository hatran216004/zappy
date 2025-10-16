import ClassifyDropdown from '@/components/ContactBar/ClassifyDropdown';
import SearchBar from '@/components/SearchBar';

import useUrl from '@/hooks/useUrl';
import { twMerge } from 'tailwind-merge';

const classifyTags = [
  { color: 'bg-red-500', label: 'Khóa luận cử nhân' },
  { color: 'bg-blue-500', label: 'Thực tập' },
  { color: 'bg-gray-400', label: 'Tin nhắn từ người lạ' }
];

const tabs = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' }
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const { currentValue, handler } = useUrl({
    field: 'tab',
    defaultValue: 'all'
  });

  return (
    <div className="w-[350px] border-r dark:border-gray-900 bg-gray-50 dark:bg-gray-800">
      <div className="flex flex-col h-full">
        <SearchBar />

        <div className="flex border-b border-gray-300 dark:border-gray-700 text-sm">
          {tabs.map((t) => {
            const isTabActive = currentValue === t.value;
            return (
              <button
                onClick={() => handler(t.value)}
                key={t.value}
                className={twMerge(
                  'flex-1 py-2 border-b-2 border-transparent text-gray-500 dark:text-gray-400',
                  isTabActive && 'border-blue-500 text-blue-500'
                )}
              >
                {t.label}
              </button>
            );
          })}
          <ClassifyDropdown classifyTags={classifyTags} />
        </div>
        {children}
      </div>
    </div>
  );
}
