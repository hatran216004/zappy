import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type classificationList = { color: string; label: string };

type ClassifyDropdownProps = {
  classifyTags: classificationList[];
};

export default function ClassifyDropdown({
  classifyTags,
}: ClassifyDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex-1 py-2 flex items-center justify-center gap-1 bg-transparent text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition cursor-pointer">
          Phân loại
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

        {classifyTags.map((tag, i) => (
          <DropdownMenuItem
            key={i}
            className="flex items-center gap-2 cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800"
          >
            <span className={`w-2 h-2 rounded-sm ${tag.color}`} />
            {tag.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />

        <DropdownMenuItem className="cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800">
          Quản lý thẻ phân loại
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
