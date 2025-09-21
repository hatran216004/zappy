import {
  BellOff,
  Pin,
  UserPlus,
  Settings,
  Users,
  Clock,
  FileText,
  Image,
  File,
  Link,
  AlertTriangle,
  Trash2,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  return (
    <div className="w-[300px] flex flex-col h-full border-l dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700 text-center">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200">
          Thông tin nhóm
        </h2>
      </div>

      <div className="flex flex-col items-center py-6 border-b dark:border-gray-700">
        <Avatar className="h-16 w-16">
          <AvatarImage src="/avatar.png" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <p className="mt-3 font-medium text-gray-900 dark:text-gray-100">
          Cường đại đế và tàu ngọc trai đen
        </p>
        <div className="flex gap-6 mt-4">
          <SidebarAction icon={<BellOff />} label="Tắt thông báo" />
          <SidebarAction icon={<Pin />} label="Ghim hội thoại" />
          <SidebarAction icon={<UserPlus />} label="Thêm thành viên" />
          <SidebarAction icon={<Settings />} label="Quản lý nhóm" />
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-2">
        <SidebarSection title="Thành viên nhóm">
          <SidebarItem
            icon={<Users className="size-5" />}
            label="5 thành viên"
          />
        </SidebarSection>

        <SidebarSection title="Bảng tin nhóm">
          <SidebarItem
            icon={<Clock className="size-5" />}
            label="Danh sách nhắc hẹn"
          />
          <SidebarItem
            icon={<FileText className="size-5" />}
            label="Ghi chú, ghim, bình chọn"
          />
        </SidebarSection>

        <SidebarSection title="Ảnh/Video">
          <SidebarItem icon={<Image className="size-5" />} label="Ảnh/Video" />
        </SidebarSection>

        <SidebarSection title="File">
          <SidebarItem icon={<File className="size-5" />} label="File" />
        </SidebarSection>

        <SidebarSection title="Link">
          <SidebarItem icon={<Link className="size-5" />} label="Link" />
        </SidebarSection>

        <SidebarSection title="Thiết lập bảo mật">
          <SidebarItem
            icon={<AlertTriangle className="size-5 text-red-500" />}
            label="Báo xấu"
            danger
          />
          <SidebarItem
            icon={<Trash2 className="size-5 text-red-500" />}
            label="Xoá lịch sử trò chuyện"
            danger
          />
          <SidebarItem
            icon={<LogOut className="size-5 text-red-500" />}
            label="Rời nhóm"
            danger
          />
        </SidebarSection>
      </div>
    </div>
  );
}

function SidebarAction({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300">
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

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3 border-b dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer ${
        danger
          ? "text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </div>
  );
}
