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
import { ArrowUpDownIcon, ChevronDown, Check, Filter } from "lucide-react";

const classifyTags = [
  { color: "bg-red-500", label: "Khóa luận cử nhân" },
  { color: "bg-blue-500", label: "Thực tập" },
];

export function ContactHeader({
  title,
  count,
}: {
  title?: string;
  count: number;
}) {
  const [filter, setFilter] = useState("Tất cả");
  const [sort, setSort] = useState("Tên (A-Z)");

  const formattedTitle = title
    ?.replace(/^Danh sách\s*/i, "")
    ?.trim()
    ?.replace(/^./, (c) => c.toUpperCase());

  return (
    <>
      <div className="px-3 py-2 select-none font-medium text-gray-700 dark:text-gray-200">
        {formattedTitle} ({count})
      </div>

      <div className="flex gap-2 p-3">
        <Input
          placeholder="Tìm bạn..."
          className="flex-1 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 transition"
        />

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center justify-between w-1/4 h-9 rounded-lg 
                         bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <ArrowUpDownIcon className="size-4 mr-1 opacity-70" />
              <span className="truncate">{sort}</span>
              <ChevronDown className="size-4 ml-1 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["Tên (A-Z)", "Tên (Z-A)"].map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => setSort(option)}
                className="flex justify-between items-center"
              >
                {option}
                {sort === option && <Check className="size-4 text-blue-500" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center justify-between w-1/4 h-9 rounded-lg 
                         bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <Filter className="size-4 mr-1 opacity-70" />
              <span className="truncate">{filter}</span>
              <ChevronDown className="size-4 ml-1 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilter("Tất cả")}>
              Tất cả
              {filter === "Tất cả" && (
                <Check className="size-4 text-blue-500" />
              )}
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Phân loại</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {classifyTags.map((tag) => (
                  <DropdownMenuItem
                    key={tag.label}
                    onClick={() => setFilter(tag.label)}
                  >
                    <span className="flex items-center">
                      <span
                        className={`w-2 h-2 rounded-full inline-block mr-2 ${tag.color}`}
                      />
                      {tag.label}
                    </span>
                    {filter === tag.label && (
                      <Check className="size-4 text-blue-500" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem>Quản lý thẻ phân loại</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
