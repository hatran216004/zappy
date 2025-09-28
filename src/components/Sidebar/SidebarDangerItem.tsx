import React from "react";

type SidebarDangerItemProps = {
  icon: React.ElementType;
  label: string;
};

export default function SidebarDangerItem({
  icon: Icon,
  label,
}: SidebarDangerItemProps) {
  return (
    <div className="flex items-center  gap-2 px-2 py-1 rounded-md cursor-pointer text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40">
      <Icon />
      <span className="text-sm font-bold">{label}</span>
    </div>
  );
}
