import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TooltipBtnProps = {
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void | undefined;
};

export function TooltipBtn({ icon, label, onClick }: TooltipBtnProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            variant="secondary"
            size="icon"
            className="p-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
          >
            {/* <UserPlus className="size-5 text-gray-500 dark:text-gray-300" /> */}
            {icon}
          </Button>
        </TooltipTrigger>
        {label && (
          <TooltipContent side="bottom" align="start">
            <p>{label}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
