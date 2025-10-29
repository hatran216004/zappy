import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check } from "lucide-react";
import { useContactLabels } from "@/hooks/useFriends";
import useUser from "@/hooks/useUser";
import { ManageLabelsModal } from "../modal/ManageLabelsModal";

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

type ClassifyDropdownProps = {
  selectedFilter: string | null;
  onFilterChange: (filterId: string | null) => void;
};

export default function ClassifyDropdown({
  selectedFilter,
  onFilterChange,
}: ClassifyDropdownProps) {
  const { user } = useUser();
  const userId = user?.id as string;
  const { data: labels } = useContactLabels(userId || '');
  const [manageLabelsOpen, setManageLabelsOpen] = useState(false);

  const getFilterDisplayName = () => {
    if (!selectedFilter) return 'Phân loại';
    const label = labels?.find((l) => l.id === selectedFilter);
    return label?.name || 'Phân loại';
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex-1 py-2 flex items-center justify-center gap-1 bg-transparent text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition cursor-pointer">
            {getFilterDisplayName()}
            <ChevronDown className="size-4" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-48 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-md"
        >
          <DropdownMenuLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Theo thẻ phân loại
          </DropdownMenuLabel>

          {/* Tất cả */}
          <DropdownMenuItem
            onClick={() => onFilterChange(null)}
            className="flex items-center justify-between gap-2 cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800"
          >
            <span>Tất cả</span>
            {!selectedFilter && <Check className="size-4 text-blue-500" />}
          </DropdownMenuItem>

          {/* Labels */}
          {labels && labels.length > 0 && (
            <>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
              {labels.map((label) => (
                <DropdownMenuItem
                  key={label.id}
                  onClick={() => onFilterChange(label.id)}
                  className="flex items-center gap-2 cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      LABEL_COLORS[label.color]?.color || 'bg-gray-500'
                    }`}
                  />
                  <span className="flex-1">{label.name}</span>
                  {selectedFilter === label.id && (
                    <Check className="size-4 text-blue-500" />
                  )}
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />

          <DropdownMenuItem
            onClick={() => setManageLabelsOpen(true)}
            className="cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800"
          >
            Quản lý thẻ phân loại
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Manage Labels Modal */}
      <ManageLabelsModal
        open={manageLabelsOpen}
        onOpenChange={setManageLabelsOpen}
        userId={userId}
      />
    </>
  );
}
