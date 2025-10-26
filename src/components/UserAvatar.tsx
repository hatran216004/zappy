import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarUrl?: string | null;
  displayName?: string;
  status?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  className?: string;
}

export function UserAvatar({
  avatarUrl,
  displayName,
  status = "offline",
  size = "md",
  showStatus = true,
  className,
}: UserAvatarProps) {
  const statusColor = status === "online" ? "bg-green-500" : "bg-gray-400";

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  const badgeSize = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
    xl: "w-4 h-4",
  };

  const badgePosition = {
    sm: "bottom-0 right-0",
    md: "bottom-0 right-0",
    lg: "bottom-0.5 right-0.5",
    xl: "bottom-1 right-1",
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className="bg-zinc-300">
          {displayName?.[0]?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      {showStatus && (
        <span
          className={cn(
            "absolute rounded-full border-2 border-white",
            statusColor,
            badgeSize[size],
            badgePosition[size]
          )}
          title={status === "online" ? "Đang hoạt động" : "Ngoại tuyến"}
        />
      )}
    </div>
  );
}
