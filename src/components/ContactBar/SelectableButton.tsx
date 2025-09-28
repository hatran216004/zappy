import { Button } from "@/components/ui/button";

type SelectableButtonProps = {
  id: string;
  title: string;
  icon: React.ElementType;
  isActive: string;
  setIsActive: React.Dispatch<React.SetStateAction<string>>;
};

export default function SelectableButton({
  id,
  title,
  icon: Icon,
  isActive,
  setIsActive,
}: SelectableButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={() => setIsActive(id)}
      className={`rounded-none flex items-center justify-start gap-3 px-3 py-6 
                  text-gray-700 dark:text-gray-200 
                  hover:bg-gray-200 dark:hover:bg-gray-800
                  cursor-pointer
                  ${
                    isActive === id
                      ? "bg-blue-500/20 dark:bg-blue-500/30 text-black dark:text-white"
                      : ""
                  }`}
    >
      <Icon className="size-5" /> {/* 👈 icon auto size */}
      <span className="text-sm font-medium">{title}</span>
    </Button>
  );
}
