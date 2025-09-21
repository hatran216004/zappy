import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { avatarVariants } from "@/lib/variants";
import { MessageCircle, Users, Cloud, Briefcase, Settings } from "lucide-react";

export default function Navbar() {
  return (
    <div className="w-[70px] border-r dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex flex-col items-center py-4 justify-between">
      <div className="flex flex-col items-center gap-6">
        <Avatar className={cn(avatarVariants({ size: "md" }))}>
          <AvatarImage src="https://s120-ava-talk.zadn.vn/e/6/4/0/11/120/f56b25f4693f07db6244c569eeb86226.jpg" />
          <AvatarFallback>MD</AvatarFallback>
        </Avatar>
        <NavButton
          icon={<MessageCircle className="size-6" />}
          label="Tin nhắn"
        />
        <NavButton icon={<Users className="size-6" />} label="Danh bạ" />
      </div>
      <div className="flex flex-col items-center gap-6">
        <NavButton icon={<Cloud className="size-6" />} label="Cloud" />
        <NavButton icon={<Briefcase className="size-6" />} label="Công việc" />
        <NavButton icon={<Settings className="size-6" />} label="Cài đặt" />
      </div>
    </div>
  );
}

function NavButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full h-10 w-10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
    >
      {/* wrapper span để tránh CSS target svg */}
      {icon}
      <span className="sr-only">{label}</span>
    </Button>
  );
}
