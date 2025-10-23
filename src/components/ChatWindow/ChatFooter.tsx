import { Button } from '@/components/ui/button';
import { Smile, Paperclip, Mic, Send } from 'lucide-react';
import React from 'react';

type ChatFooterProps = {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  messageText: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSendMessage: () => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sendFileMutation: { isPending: boolean };
  sendTextMutation: { isPending: boolean };
};

export default function ChatFooter({
  fileInputRef,
  inputRef,
  messageText,
  handleInputChange,
  handleKeyPress,
  handleSendMessage,
  handleFileSelect,
  sendFileMutation,
  sendTextMutation
}: ChatFooterProps) {
  const canSend = !!messageText.trim() && !sendTextMutation.isPending;

  return (
    <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-end gap-2">
        {/* hidden input giữ logic upload file */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
        />

        {/* Emoji (UI-only) */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          type="button"
        >
          <Smile className="size-5 text-gray-500 dark:text-gray-300" />
        </Button>

        {/* Attach file (giữ logic: click => input file) */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          type="button"
          onClick={() => fileInputRef?.current?.click()}
          disabled={sendFileMutation.isPending}
        >
          <Paperclip className="size-5 text-gray-500 dark:text-gray-300" />
        </Button>

        {/* Voice (UI-only, không thêm logic) */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          type="button"
          disabled={sendTextMutation.isPending}
        >
          <Mic className="size-5 text-gray-500 dark:text-gray-300" />
        </Button>

        {/* Ô nhập: giữ textarea + keypress Enter như cũ */}
        <textarea
          ref={inputRef}
          value={messageText}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Nhập @, tin nhắn tới ..."
          rows={1}
          className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 resize-none"
          style={{ minHeight: '40px' }}
        />

        {/* Send: giữ điều kiện disabled/handler */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          type="button"
          onClick={handleSendMessage}
          disabled={!canSend}
        >
          <Send className="size-5 text-blue-500" />
        </Button>
      </div>

      {sendFileMutation.isPending && (
        <div className="mt-2 text-sm text-gray-500">Đang gửi file...</div>
      )}
    </div>
  );
}
