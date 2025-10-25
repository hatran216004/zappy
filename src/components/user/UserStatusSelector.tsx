// components/UserStatusSelector.tsx - Component để chọn status
import { useState } from "react";
import { Check } from "lucide-react";
import { useUpdateUserStatus } from "@/hooks/useUserStatus";
import { UserStatus } from "@/services/userStatusService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface StatusOption {
  value: UserStatus;
  label: string;
  color: string;
  icon: string;
}

const statusOptions: StatusOption[] = [
  {
    value: "online",
    label: "Đang hoạt động",
    color: "text-green-500",
    icon: "🟢",
  },
  { value: "away", label: "Vắng mặt", color: "text-yellow-500", icon: "🟡" },
  { value: "busy", label: "Bận", color: "text-red-500", icon: "🔴" },
  { value: "offline", label: "Ẩn", color: "text-gray-500", icon: "⚫" },
];

interface UserStatusSelectorProps {
  currentStatus: UserStatus;
}

export function UserStatusSelector({ currentStatus }: UserStatusSelectorProps) {
  const updateStatus = useUpdateUserStatus();
  const [open, setOpen] = useState(false);

  const handleStatusChange = (status: UserStatus) => {
    updateStatus.mutate(status);
    setOpen(false);
  };

  const currentOption =
    statusOptions.find((opt) => opt.value === currentStatus) ||
    statusOptions[0];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span className="text-lg">{currentOption.icon}</span>
          <span className="flex-1 text-left">{currentOption.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className="gap-2 cursor-pointer"
          >
            <span className="text-lg">{option.icon}</span>
            <span className="flex-1">{option.label}</span>
            {currentStatus === option.value && (
              <Check size={16} className="text-blue-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
