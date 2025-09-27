import {
  BellOff,
  Pin,
  UserPlus,
  Settings,
  Users,
  Clock,
  FileText,
  AlertTriangle,
  Trash2,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { SidebarAccordionSection } from "../components/Sidebar/SidebarAccordionSection";
import SidebarAction from "@/components/Sidebar/SidebarAction";
import SidebarDangerItem from "@/components/Sidebar/SidebarDangerItem";

export default function Sidebar() {
  return (
    <div className="w-[300px] flex flex-col h-full border-l dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700 text-center">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200">
          Thông tin nhóm
        </h2>
      </div>
      <div className="overflow-y-auto scrollbar-custom [scrollbar-gutter:stable]">
        {/* Group Info */}
        <div className="flex flex-col items-center py-6 border-b dark:border-gray-700">
          <Avatar className="h-16 w-16">
            <AvatarImage src="/avatar.png" />
            <AvatarFallback className="bg-zinc-300">U</AvatarFallback>
          </Avatar>
          <p className="mt-3 font-medium text-gray-900 dark:text-gray-100 text-center">
            Nhóm 1
          </p>
          <div className="flex gap-6 mt-4">
            <SidebarAction icon={<BellOff />} label="Tắt thông báo" />
            <SidebarAction icon={<Pin />} label="Ghim hội thoại" />
            <SidebarAction icon={<UserPlus />} label="Thêm thành viên" />
            <SidebarAction icon={<Settings />} label="Quản lý nhóm" />
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1  px-2">
          {/* Thành viên nhóm */}
          <SidebarAccordionSection
            type="list"
            title="Thành viên nhóm"
            items={[
              { label: `5 thành viên`, icon: <Users className="size-5" /> },
            ]}
          />

          {/* Bảng tin nhóm */}
          <SidebarAccordionSection
            type="list"
            title="Bảng tin nhóm"
            items={[
              {
                label: "Danh sách nhắc hẹn",
                icon: <Clock className="size-5" />,
              },
              {
                label: "Ghi chú, ghim, bình chọn",
                icon: <FileText className="size-5" />,
              },
            ]}
          />

          {/* Accordion Sections */}
          <SidebarAccordionSection
            type="media"
            title="Ảnh/Video"
            items={[
              { src: "/default-image.png" },
              { src: "/default-image.png" },
              { src: "/default-image.png" },
              { src: "/default-image.png" },
              { src: "/default-image.png" },
              { src: "/default-image.png" },
              { src: "/default-image.png" },
              { src: "/default-image.png" },
              { src: "/default-image.png" },
              { src: "/default-image.png" },
              { src: "/default-image.png" },
              { src: "/default-image.png" },
              { src: "/default-image.png" },
              { src: "/default-image.png" },
              { src: "/default-image.png" },
              { src: "/default-image.png" },
            ]}
          />

          <SidebarAccordionSection
            type="file"
            title="File"
            items={[
              {
                name: "NguyenTrongHieu_2001221402.docx",
                size: "124.24 KB",
                time: "Hôm nay",
              },
              {
                name: "Mau phieu-nhan-xet.docx",
                size: "294.65 KB",
                time: "Hôm nay",
              },
            ]}
          />

          <SidebarAccordionSection
            type="link"
            title="Link"
            items={[
              {
                title: "ChatGPT - Quét heuristic virus",
                url: "chatgpt.com",
                time: "Hôm nay",
              },
              {
                title: "https://chatgpt.com/share/68ce70a1",
                url: "chatgpt.com",
                time: "Hôm nay",
              },
            ]}
          />

          {/* Thiết lập bảo mật */}
          <div className="py-3 border-b dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Thiết lập bảo mật
            </h3>
            <div className="flex flex-col gap-2">
              <SidebarDangerItem icon={<AlertTriangle />} label="Báo xấu" />
              <SidebarDangerItem
                icon={<Trash2 />}
                label="Xoá lịch sử trò chuyện"
              />
              <SidebarDangerItem icon={<LogOut />} label="Rời nhóm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
