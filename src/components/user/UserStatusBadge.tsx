import { useUserStatus, useUserStatusRealtime } from "@/hooks/useUserStatus";
import { cn } from "@/lib/utils";

interface UserStatusBadgeProps {
  userId: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserStatusBadge({
  userId,
  showText = false,
  size = "md",
  className,
}: UserStatusBadgeProps) {
  const { data: statusData } = useUserStatus(userId);
  useUserStatusRealtime(userId); // Subscribe realtime

  const isOnline = statusData?.status === "online";
  const statusColor = isOnline ? "bg-green-500" : "bg-gray-400";
  const statusText = isOnline ? "Đang hoạt động" : "Ngoại tuyến";

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "rounded-full border-2 border-white",
          statusColor,
          sizeClasses[size]
        )}
        title={statusText}
      />
      {showText && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {statusText}
        </span>
      )}
    </div>
  );
}
