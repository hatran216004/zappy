import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

export function FileSection() {
  const files = [
    {
      name: "NguyenTrongHieu_2001221402.docx",
      size: "124.24 KB",
      time: "Hôm nay",
    },
    {
      name: "Mau phieu-nhan-xet-sv-thuc-tap.docx",
      size: "294.65 KB",
      time: "Hôm nay",
    },
    {
      name: "Mau bao cao Thuc tap tot nghiep.docx",
      size: "70.87 KB",
      time: "Hôm nay",
    },
  ];

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="file">
        <AccordionTrigger>File</AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-2 mb-3">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              >
                <img src="/word.png" className="w-8 h-8" />
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <span className="text-xs text-gray-500">
                    {f.size} · {f.time}
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
