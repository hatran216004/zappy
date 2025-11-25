import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link as LinkIcon } from "lucide-react";
import { Button } from "../ui/button";

type MediaItem = { src: string; kind?: 'image' | 'video'; id?: string };
type FileItem = { name: string; size: string; time: string; icon?: string };
type LinkItem = { title: string; url: string; time: string };
type ListItem = { icon: React.ReactNode; label: string };

type SidebarAccordionSectionProps = {
  type: "media" | "file" | "link" | "list";
  title: string;
  items?: MediaItem[] | FileItem[] | LinkItem[] | ListItem[];
  onMediaClick?: (index: number) => void;
};

export function SidebarAccordionSection({
  type,
  title,
  items = [],
  onMediaClick,
}: SidebarAccordionSectionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full border-b border-gray-200 dark:border-gray-700"
    >
      <AccordionItem value={title.toLowerCase()}>
        <AccordionTrigger className="px-6 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:no-underline">
          {title}
        </AccordionTrigger>

        <AccordionContent className="p-5">
          {/* List */}
          {type === "list" && (
            <div className="flex flex-col gap-2">
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
            <>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {(items as MediaItem[]).map((m, i) => {
                  const isVideo = m.kind === 'video';
                  return (
                    <div
                      key={m.id || i}
                      onClick={() => onMediaClick?.(i)}
                      className="relative rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition group"
                    >
                      {isVideo ? (
                        <video
                          src={m.src}
                          className="w-full h-16 object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={m.src}
                          alt={`Media ${i + 1}`}
                          className="rounded-md object-cover w-full h-16"
                        />
                      )}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {items.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  Chưa có ảnh/video nào
                </p>
              )}
            </>
          )}

          {/* Files */}
          {type === "file" && (
            <>
              <div className="flex flex-col gap-2 mb-3 max-h-[300px] overflow-y-auto">
                {(items as FileItem[]).map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-600 dark:text-gray-300">
                      📄
                    </div>
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
              {items.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  Chưa có file nào
                </p>
              )}
            </>
          )}

          {/* Links */}
          {type === "link" && (
            <>
              <div className="flex flex-col gap-2 mb-3 max-h-[300px] overflow-y-auto">
                {(items as LinkItem[]).map((l, i) => (
                  <a
                    key={i}
                    href={`https://${l.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
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
                  </a>
                ))}
              </div>
              {items.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  Chưa có link nào
                </p>
              )}
            </>
          )}

        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
