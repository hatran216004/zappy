import { Button } from "@/components/ui/button";
import { Smile, Paperclip, Mic, Send } from "lucide-react";

export default function ChatFooter() {
  return (
    <div className="flex items-center gap-2 p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <Smile className="size-5 text-gray-500 dark:text-gray-300" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <Paperclip className="size-5 text-gray-500 dark:text-gray-300" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <Mic className="size-5 text-gray-500 dark:text-gray-300" />
      </Button>

      <input
        type="text"
        placeholder="Nhập @, tin nhắn tới ..."
        className="flex-1 rounded-md bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
      />

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <Send className="size-5 text-blue-500" />
      </Button>
    </div>
  );
}
