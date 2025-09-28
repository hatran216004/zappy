import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type TooltipBtnProps = {
  id?: string;
  icon: React.ElementType;
  label?: string;
  onClick?: () => void;
  active?: string;
  className?: string;
};

export function TooltipBtn({
  id,
  icon: Icon,
  label,
  onClick,
  active,
  className,
}: TooltipBtnProps) {
  const isActive = !!id && active === id;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            variant="ghost"
            size="icon"
            className={cn(
              "p-2 rounded-full bg-transparent",
              isActive
                ? "bg-gray-600/50 text-white hover:bg-blue-600"
                : "text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700",
              className
            )}
          >
            <Icon className="size-5" />
          </Button>
        </TooltipTrigger>
        {label && (
          <TooltipContent side="bottom" align="center">
            <p>{label}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
