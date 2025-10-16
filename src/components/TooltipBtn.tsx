import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

type TooltipBtnProps = {
  id?: string;
  label?: string;
  isActive?: boolean;
  className?: string;
  icon: React.ElementType;
  onClick?: () => void;
};

export function TooltipBtn({
  icon: Icon,
  label,
  className,
  isActive,
  onClick
}: TooltipBtnProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            variant="ghost"
            size="icon"
            className={clsx(
              twMerge(
                'p-2 rounded-full bg-transparent',
                isActive
                  ? 'bg-gray-600/50 text-white hover:bg-blue-600'
                  : 'text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700',
                className
              )
            )}
          >
            <Icon className="size-5" />
          </Button>
        </TooltipTrigger>
        {label && (
          <TooltipContent side="right" align="center" sideOffset={8}>
            <p>{label}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
