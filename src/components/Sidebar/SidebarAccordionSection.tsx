import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link as LinkIcon } from "lucide-react";
import { Button } from "../ui/button";

type MediaItem = { src: string };
type FileItem = { name: string; size: string; time: string; icon?: string };
type LinkItem = { title: string; url: string; time: string };
type ListItem = { icon: React.ReactNode; label: string };

type SidebarAccordionSectionProps = {
  type: "media" | "file" | "link" | "list";
  title: string;
  items?: MediaItem[] | FileItem[] | LinkItem[] | ListItem[];
};

export function SidebarAccordionSection({
  type,
  title,
  items = [],
}: SidebarAccordionSectionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full border-b border-gray-200 dark:border-gray-700"
    >
      <AccordionItem value={title.toLowerCase()}>
        <AccordionTrigger className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:no-underline">
          {title}
        </AccordionTrigger>

        <AccordionContent className="pt-2">
          {/* List */}
          {type === "list" && (
            <div className="flex flex-col gap-2 mb-3">
              {(items as ListItem[]).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer text-gray-700 dark:text-gray-300"
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Media */}
          {type === "media" && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {(items as MediaItem[]).slice(0, 8).map((m, i) => (
                <img
                  key={i}
                  src={m.src}
                  className="rounded-md object-cover w-full h-16 hover:opacity-90 transition"
                />
              ))}
            </div>
          )}

          {/* Files */}
          {type === "file" && (
            <div className="flex flex-col gap-2 mb-3">
              {(items as FileItem[]).slice(0, 3).map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
                >
                  <img
                    src={f.icon || "/word.png"}
                    alt="file"
                    className="w-8 h-8 object-contain"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">
                      {f.name}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {f.size} · {f.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Links */}
          {type === "link" && (
            <div className="flex flex-col gap-2 mb-3">
              {(items as LinkItem[]).slice(0, 3).map((l, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
                >
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-600 dark:text-gray-300">
                    <LinkIcon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">
                      {l.title}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                      {l.url} · {l.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* nút xem tất cả */}
          {type !== "list" && items.length > 0 && (
            <Button className="w-full py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              Xem tất cả
            </Button>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
