import { cn } from "@/lib/utils";

export default function Tag({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-[11px] font-medium text-white rounded-full",
        color
      )}
    >
      {label}
    </span>
  );
}
