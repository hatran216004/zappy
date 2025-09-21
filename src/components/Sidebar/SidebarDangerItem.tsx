export default function SidebarDangerItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center  gap-2 px-2 py-1 rounded-md cursor-pointer text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
  );
}
