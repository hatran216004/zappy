import { cva } from "class-variance-authority";

export const avatarVariants = cva(
  "relative flex items-center justify-center rounded-full overflow-hidden",
  {
    variants: {
      size: {
        xs: "h-5 w-5 text-[10px]",
        sm: "h-6 w-6 text-xs",
        md: "h-12 w-12 text-sm",
        lg: "h-16 w-16 text-lg",
        xl: "h-20 w-20 text-xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);
