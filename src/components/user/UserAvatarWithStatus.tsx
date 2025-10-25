// components/UserAvatarWithStatus.tsx - Avatar kèm status indicator
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserStatusBadge } from "./UserStatus";
import { cn } from "@/lib/utils";

interface UserAvatarWithStatusProps {
  userId: string;
  avatarUrl?: string;
  displayName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showStatusBadge?: boolean;
  className?: string;
}

export function UserAvatarWithStatus({
  userId,
  avatarUrl,
  displayName,
  size = "md",
  showStatusBadge = true,
  className,
}: UserAvatarWithStatusProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  const badgeSizes = {
    sm: "sm" as const,
    md: "sm" as const,
    lg: "md" as const,
    xl: "md" as const,
  };

  const badgePositions = {
    sm: "bottom-0 right-0",
    md: "bottom-0 right-0",
    lg: "bottom-1 right-1",
    xl: "bottom-1 right-1",
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback>
          {displayName?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      {showStatusBadge && (
        <div className={cn("absolute", badgePositions[size])}>
          <UserStatusBadge userId={userId} size={badgeSizes[size]} />
        </div>
      )}
    </div>
  );
}
