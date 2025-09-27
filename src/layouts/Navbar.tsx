import { TooltipBtn } from "@/components/TooltipBtn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { avatarVariants } from "@/lib/variants";
import {
  MessageCircle,
  Users,
  Cloud,
  Briefcase,
  Settings,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.remove("light");
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
      document.body.classList.add("light");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="w-[70px] border-r dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex flex-col items-center py-4 justify-between">
      <div className="flex flex-col items-center gap-6">
        <Avatar className={cn(avatarVariants({ size: "md" }))}>
          <AvatarImage src="https://s120-ava-talk.zadn.vn/e/6/4/0/11/120/f56b25f4693f07db6244c569eeb86226.jpg" />
          <AvatarFallback className="bg-zinc-300">MD</AvatarFallback>
        </Avatar>
        <TooltipBtn
          icon={<MessageCircle className="size-6" />}
          label="Tin nhắn"
        />
        <TooltipBtn icon={<Users className="size-6" />} label="Danh bạ" />
      </div>
      <div className="flex flex-col items-center gap-6">
        <TooltipBtn
          onClick={toggleTheme}
          icon={
            theme === "light" ? (
              <MoonIcon className="size-6" />
            ) : (
              <SunIcon className="size-6" />
            )
          }
          label={`${theme === "light" ? "Chế độ tối" : "Chế độ sáng"}`}
        />
        <TooltipBtn icon={<Cloud className="size-6" />} label="Cloud" />
        <TooltipBtn icon={<Briefcase className="size-6" />} label="Công việc" />
        <TooltipBtn icon={<Settings className="size-6" />} label="Cài đặt" />
      </div>
    </div>
  );
}
