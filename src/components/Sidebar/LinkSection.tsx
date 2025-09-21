import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

export function LinkSection() {
  const links = [
    {
      title: "ChatGPT - Quét heuristic virus",
      url: "chatgpt.com",
      time: "Hôm nay",
    },
    {
      title: "https://chatgpt.com/share/68ce70a1...",
      url: "chatgpt.com",
      time: "Hôm nay",
    },
    {
      title: "https://qr.sli.do/8EbXcQkC8QDjqUES...",
      url: "qr.sli.do",
      time: "Hôm nay",
    },
  ];

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="link">
        <AccordionTrigger>Link</AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-2 mb-3">
            {links.map((l, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              >
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-md flex items-center justify-center">
                  🔗
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{l.title}</p>
                  <span className="text-xs text-gray-500">
                    {l.url} · {l.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">
            Xem tất cả
          </button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
