import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function MediaSection() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="media">
        <AccordionTrigger>Ảnh/Video</AccordionTrigger>
        <AccordionContent>
          {/* Grid ảnh */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              "/img1.png",
              "/img2.png",
              "/img3.png",
              "/img4.png",
              "/img5.png",
              "/img6.png",
            ].map((src, i) => (
              <img
                key={i}
                src={src}
                className="rounded-md object-cover w-full h-20"
              />
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
