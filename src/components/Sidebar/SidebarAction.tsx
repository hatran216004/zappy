import { Button } from "../ui/button";

export default function SidebarAction({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col text-center items-center gap-1 text-gray-600 dark:text-gray-300">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
      >
        {icon}
      </Button>
      <span className="text-xs">{label}</span>
    </div>
  );
}
