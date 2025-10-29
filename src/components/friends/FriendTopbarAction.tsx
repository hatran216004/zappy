import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ArrowUpDownIcon, ChevronDown, Check, Filter, Settings } from 'lucide-react';
import { useContactLabels } from '@/hooks/useFriends';
import useUser from '@/hooks/useUser';
import { ManageLabelsModal } from '../modal/ManageLabelsModal';

interface FriendTopbarActionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedFilter: string | null;
  onFilterChange: (filterId: string | null) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const LABEL_COLORS = [
  { value: 0, color: 'bg-gray-500' },
  { value: 1, color: 'bg-red-500' },
  { value: 2, color: 'bg-orange-500' },
  { value: 3, color: 'bg-yellow-500' },
  { value: 4, color: 'bg-green-500' },
  { value: 5, color: 'bg-blue-500' },
  { value: 6, color: 'bg-purple-500' },
  { value: 7, color: 'bg-pink-500' },
];

export function FriendTopbarAction({
  searchTerm,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  sortBy,
  onSortChange
}: FriendTopbarActionProps) {
  const { user } = useUser();
  const userId = user?.id as string;
  const { data: labels } = useContactLabels(userId || '');
  const [manageLabelsOpen, setManageLabelsOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const getFilterDisplayName = () => {
    if (!selectedFilter) return 'Tất cả';
    const label = labels?.find((l) => l.id === selectedFilter);
    return label?.name || 'Tất cả';
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Tìm bạn..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 transition"
        />

        {/* Sort Dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center justify-between min-w-[120px] h-9 px-3 rounded-lg 
                       bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
                       border border-gray-300 dark:border-gray-600 transition"
          >
            <ArrowUpDownIcon className="size-4 mr-1 opacity-70" />
            <span className="truncate text-xs flex-1 text-left">{sortBy}</span>
            <ChevronDown className="size-4 ml-1 opacity-70" />
          </button>

          {sortOpen && (
            <div className="absolute right-0 mt-1 min-w-[160px] bg-white dark:bg-gray-800 
                            border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg 
                            z-50 py-1 animate-in fade-in-0 zoom-in-95">
              {['Tên (A-Z)', 'Tên (Z-A)'].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onSortChange(option);
                    setSortOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 
                             flex items-center justify-between transition-colors"
                >
                  {option}
                  {sortBy === option && <Check className="size-4 text-blue-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center justify-between min-w-[120px] h-9 px-3 rounded-lg 
                       bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
                       border border-gray-300 dark:border-gray-600 transition"
          >
            <Filter className="size-4 mr-1 opacity-70" />
            <span className="truncate text-xs flex-1 text-left">{getFilterDisplayName()}</span>
            <ChevronDown className="size-4 ml-1 opacity-70" />
          </button>

          {filterOpen && (
            <div className="absolute right-0 mt-1 min-w-[200px] bg-white dark:bg-gray-800 
                            border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg 
                            z-50 py-1 animate-in fade-in-0 zoom-in-95 max-h-[400px] overflow-y-auto">
              {/* Tất cả */}
              <button
                onClick={() => {
                  onFilterChange(null);
                  setFilterOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 
                           flex items-center justify-between transition-colors"
              >
                Tất cả
                {!selectedFilter && <Check className="size-4 text-blue-500" />}
              </button>

              {/* Separator */}
              {labels && labels.length > 0 && (
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              )}

              {/* Labels */}
              {labels && labels.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Phân loại
                  </div>
                  {labels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => {
                        onFilterChange(label.id);
                        setFilterOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 
                                 flex items-center transition-colors"
                    >
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          LABEL_COLORS[label.color]?.color || 'bg-gray-500'
                        }`}
                      />
                      <span className="flex-1">{label.name}</span>
                      {selectedFilter === label.id && (
                        <Check className="size-4 text-blue-500" />
                      )}
                    </button>
                  ))}
                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                </>
              )}

              {/* Quản lý nhãn */}
              <button
                onClick={() => {
                  setManageLabelsOpen(true);
                  setFilterOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 
                           flex items-center transition-colors"
              >
                <Settings className="size-4 mr-2" />
                Quản lý nhãn
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manage Labels Modal */}
      <ManageLabelsModal
        open={manageLabelsOpen}
        onOpenChange={setManageLabelsOpen}
        userId={userId}
      />
    </>
  );
}
