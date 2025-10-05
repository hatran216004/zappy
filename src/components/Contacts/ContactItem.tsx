import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoreHorizontal } from "lucide-react";
import { avatarVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";

type Friend = {
  id: number;
  name: string;
  avatar: string;
  tags: string[];
};

export function ContactItem({ friend }: { friend: Friend }) {
  return (
    <div
      key={friend.id}
      className="relative flex items-center justify-between p-3 
                 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
    >
      <div className="flex items-center gap-3 relative z-10">
        <Avatar className={cn(avatarVariants({ size: "md" }))}>
          <AvatarImage src={friend.avatar} />
          <AvatarFallback className="bg-zinc-300">MD</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{friend.name}</span>

          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              5 thành viên
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {friend.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs font-medium rounded-full 
                             bg-gray-100 text-gray-700 
                             dark:bg-gray-700 dark:text-gray-200 
                             hover:bg-gray-200 dark:hover:bg-gray-600 
                             transition-colors"
                >
                  {tag}
                </span>
              ))}

              {friend.tags.length > 3 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded-full 
                "
                      >
                        +{friend.tags.length - 3}
                      </span>
                    </TooltipTrigger>

                    <TooltipContent side="top">
                      {friend.tags.slice(3).map((tag, i) => (
                        <div key={i} className="px-2 py-0.5 rounded-full">
                          {tag}
                        </div>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 relative z-10"
      >
        <MoreHorizontal className="size-4" />
      </Button>

      <div className="absolute bottom-0 left-[60px] right-0 border-b border-gray-700"></div>
    </div>
  );
}
