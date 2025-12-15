import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getGroupPhotoUrl } from "@/lib/supabase";

interface GroupAvatarProps {
    photoUrl?: string | null;
    displayName?: string;
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    className?: string;
}

export function GroupAvatar({
    photoUrl,
    displayName,
    size = "md",
    className,
}: GroupAvatarProps) {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
        xl: "w-20 h-20",
        "2xl": "w-32 h-32",
    };

    // Get full photo URL (ensure it handles null/undefined gracefuly inside getGroupPhotoUrl or here)
    const fullPhotoUrl = getGroupPhotoUrl(photoUrl);

    return (
        <Avatar className={cn(sizeClasses[size], className)}>
            <AvatarImage src={fullPhotoUrl || undefined} className="object-cover" />
            <AvatarFallback
                className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold flex items-center justify-center text-lg uppercase"
            >
                {displayName?.charAt(0) || "G"}
            </AvatarFallback>
        </Avatar>
    );
}
