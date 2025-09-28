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

type NavbarProps = {
  currentTab: string;
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
};

export default function Navbar({ currentTab, setCurrentTab }: NavbarProps) {
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
    <div className="w-[70px] border-r dark:border-gray-800 bg-blue-500 dark:bg-gray-950 flex flex-col items-center py-4 justify-between">
      <div className="flex flex-col items-center gap-6">
        <Avatar className={cn(avatarVariants({ size: "md" }))}>
          <AvatarImage src="https://s120-ava-talk.zadn.vn/e/6/4/0/11/120/f56b25f4693f07db6244c569eeb86226.jpg" />
          <AvatarFallback className="bg-zinc-300">MD</AvatarFallback>
        </Avatar>
        <TooltipBtn
          id="ChatList"
          active={currentTab}
          onClick={() => setCurrentTab("ChatList")}
          icon={MessageCircle}
          label="Tin nhắn"
          className="text-white hover:text-white hover:bg-zinc-600/50"
        />
        <TooltipBtn
          id="ContactList"
          active={currentTab}
          onClick={() => setCurrentTab("ContactList")}
          icon={Users}
          label="Danh bạ"
          className="text-white hover:text-white hover:bg-zinc-600/50"
        />
      </div>
      <div className="flex flex-col items-center gap-6">
        <TooltipBtn
          onClick={toggleTheme}
          icon={theme === "light" ? MoonIcon : SunIcon}
          label={`${theme === "light" ? "Chế độ tối" : "Chế độ sáng"}`}
          className="text-white hover:text-white hover:bg-zinc-600/50"
        />
        <TooltipBtn
          icon={Cloud}
          label="Cloud"
          className="text-white hover:text-white hover:bg-zinc-600/50"
        />
        <TooltipBtn
          icon={Briefcase}
          label="Công việc"
          className="text-white hover:text-white hover:bg-zinc-600/50"
        />
        <TooltipBtn
          icon={Settings}
          label="Cài đặt"
          className="text-white hover:text-white hover:bg-zinc-600/50"
        />
      </div>
    </div>
  );
}
