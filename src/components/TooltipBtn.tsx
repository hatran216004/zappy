import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TooltipBtnProps = {
  icon: React.ElementType;
  label?: string;

  onClick?: () => void | undefined;
};

export function TooltipBtn({ icon: Icon, label, onClick }: TooltipBtnProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            variant="secondary"
            size="icon"
            className="p-4 bg-transparent hover:bg-gray-800/50 dark:hover:bg-gray-600 cursor-pointer"
          >
            {/* <UserPlus className="size-5 text-gray-500 dark:text-gray-300" /> */}
            <Icon className="size-5 text-white " />
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
