import React from 'react';

type SidebarDangerItemProps = {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
};

export default function SidebarDangerItem({
  icon: Icon,
  label,
  onClick
}: SidebarDangerItemProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"
    >
      <Icon />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}
