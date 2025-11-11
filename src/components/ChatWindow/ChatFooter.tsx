/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import { Smile, Paperclip, Mic, Send, X, MapPin } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

type ChatFooterProps = {
  fileInputRef: React.RefObject<HTMLInputElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  messageText: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSendMessage: () => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEmojiSelect: (emoji: string) => void;
  handleLocationClick: () => void;
  sendFileMutation: { isPending: boolean };
  sendTextMutation: { isPending: boolean };
  participants?: { id: string; name: string; avatar_url?: string }[];
  onMentionSelected?: (userId: string) => void;
};

export default function ChatFooter({
  fileInputRef,
  inputRef,
  messageText,
  handleInputChange,
  handleKeyPress,
  handleSendMessage,
  handleFileSelect,
  handleEmojiSelect,
  handleLocationClick,
  sendFileMutation,
  sendTextMutation,
  participants,
  onMentionSelected
}: ChatFooterProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const mentionRef = useRef<HTMLDivElement>(null);

  const canSend = !!messageText&& !sendTextMutation.isPending;  

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        mentionRef.current &&
        !mentionRef.current.contains(event.target as Node)
      ) {
        setShowMentionList(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Detect @ mention typing
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const value = messageText;
    const caret = el.selectionStart ?? value.length;
    const slice = value.slice(0, caret);
    const atIndex = slice.lastIndexOf('@');
    if (atIndex >= 0) {
      const afterAt = slice.slice(atIndex + 1);
      const match = afterAt.match(/^[\w\s\p{L}.-]*$/u);
      if (match) {
        setMentionStart(atIndex);
        setMentionQuery(afterAt.trim());
        setShowMentionList(true);
        return;
      }
    }
    setShowMentionList(false);
    setMentionStart(null);
    setMentionQuery('');
  }, [messageText, inputRef]);

  const filteredParticipants = (() => {
    const base = (participants || []).filter((p) =>
      p.name.toLowerCase().includes(mentionQuery.toLowerCase())
    );
    // Tag all option for group chats
    const includeAll =
      (participants || []).length > 1 &&
      ('all'.startsWith(mentionQuery.toLowerCase()) || mentionQuery.length === 0);
    return includeAll ? [{ id: 'ALL', name: 'all' }, ...base] : base;
  })();

  const insertMention = (p: { id: string; name: string }) => {
    const el = inputRef.current;
    if (!el || mentionStart === null) return;
    const before = messageText.slice(0, mentionStart);
    const afterCaret = el.selectionStart ?? messageText.length;
    const slice = messageText.slice(0, afterCaret);
    const atIndex = slice.lastIndexOf('@');
    const after = messageText.slice(afterCaret);
    const inserted = `${before}@${p.name} ` + after;
    // Manually set value using the provided handler
    const event = { target: { value: inserted } } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
    handleInputChange(event);
    setShowMentionList(false);
    setMentionQuery('');
    setMentionStart(null);
    onMentionSelected && onMentionSelected(p.id);
    // Restore focus and move caret to after inserted mention
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const newPos = (before + `@${p.name} `).length;
        inputRef.current.selectionStart = inputRef.current.selectionEnd = newPos;
        inputRef.current.focus();
      }
    });
  };

  // ✅ Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm'
        });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
          type: 'audio/webm'
        });

        // Create fake event for handleFileSelect
        const fakeEvent = {
          target: {
            files: [audioFile]
          }
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        // Call handleFileSelect
        await handleFileSelect(fakeEvent);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Không thể truy cập microphone. Vui lòng cấp quyền.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      audioChunksRef.current = [];

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      // Stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ✅ Recording UI
  if (isRecording) {
    return (
      <div className="p-3 border-t dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              Đang ghi âm... {formatTime(recordingTime)}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              type='button'
              onClick={cancelRecording}
              className="text-gray-600 dark:text-gray-300"
            >
              <X className="size-4 mr-1" />
              Hủy
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Gửi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 relative">
      <div className="flex items-end gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
        />

        {/* ✅ Emoji Picker */}
        <div className="relative" ref={emojiPickerRef}>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="size-5 text-gray-500 dark:text-gray-300" />
          </Button>

          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-50">
              <Picker
                data={data}
                onEmojiSelect={(emoji: any) => {
                  handleEmojiSelect(emoji.native);
                  setShowEmojiPicker(false);
                }}
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
              />
            </div>
          )}
        </div>

        {/* Attach file */}
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

        {/* ✅ Voice Recording */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          type="button"
          onClick={startRecording}
          disabled={sendTextMutation.isPending}
        >
          <Mic className="size-5 text-gray-500 dark:text-gray-300" />
        </Button>

        {/* ✅ Location Sharing */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          type="button"
          onClick={handleLocationClick}
          disabled={sendTextMutation.isPending}
          title="Chia sẻ vị trí"
        >
          <MapPin className="size-5 text-gray-500 dark:text-gray-300" />
        </Button>

        {/* Text input */}
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

        {/* Mention list */}
        {showMentionList && filteredParticipants.length > 0 && (
          <div ref={mentionRef} className="absolute bottom-14 left-16 z-50 w-72 max-h-64 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
            {filteredParticipants.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={() => insertMention(p)}
              >
                <img
                  src={p.avatar_url || '/default_user.jpg'}
                  className="w-6 h-6 rounded-full object-cover"
                  alt={p.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default_user.jpg';
                  }}
                />
                <span className="truncate">@{p.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Send button */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          type="button"
          onClick={handleSendMessage}
          disabled={!canSend}
        >
          <Send
            className={`size-5 ${canSend ? 'text-blue-500' : 'text-gray-400'}`}
          />
        </Button>
      </div>

      {sendFileMutation.isPending && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Đang gửi file...
        </div>
      )}
    </div>
  );
}
