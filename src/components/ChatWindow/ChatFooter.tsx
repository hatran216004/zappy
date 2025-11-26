/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import { Smile, Paperclip, Mic, Send, X, MapPin } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { getAvatarUrl } from '@/lib/supabase';

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
  disabled?: boolean;
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
  onMentionSelected,
  disabled = false
}: ChatFooterProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const mentionRef = useRef<HTMLDivElement>(null);
  const mentionItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const canSend = !!messageText && !sendTextMutation.isPending;

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

  // Handle paste image from clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Only handle if input is focused
      if (!inputRef.current || document.activeElement !== inputRef.current) {
        return;
      }

      // Don't handle if disabled
      if (disabled || sendFileMutation.isPending) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      // Find image in clipboard
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Check if it's an image
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();

          const blob = item.getAsFile();
          if (!blob) continue;

          // Create a File object from the blob
          const file = new File([blob], `pasted-image-${Date.now()}.png`, {
            type: blob.type || 'image/png'
          });

          // Create fake event for handleFileSelect
          const fakeEvent = {
            target: {
              files: [file]
            }
          } as unknown as React.ChangeEvent<HTMLInputElement>;

          // Call handleFileSelect
          try {
            await handleFileSelect(fakeEvent);
          } catch (error) {
            console.error('Error handling pasted image:', error);
          }

          break; // Only process first image
        }
      }
    };

    const textarea = inputRef.current;
    if (textarea) {
      textarea.addEventListener('paste', handlePaste);
    }

    return () => {
      if (textarea) {
        textarea.removeEventListener('paste', handlePaste);
      }
    };
  }, [handleFileSelect, inputRef, disabled, sendFileMutation.isPending]);

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
        setActiveMentionIndex(0); // Reset active index when mention list shows
        return;
      }
    }
    setShowMentionList(false);
    setMentionStart(null);
    setMentionQuery('');
    setActiveMentionIndex(0);
  }, [messageText, inputRef]);

  // Calculate filtered participants
  const filteredParticipants = (() => {
    const base = (participants || []).filter((p) =>
      p.name.toLowerCase().includes(mentionQuery.toLowerCase())
    );
    // Tag all option for group chats
    const includeAll =
      (participants || []).length > 1 &&
      ('all'.startsWith(mentionQuery.toLowerCase()) ||
        mentionQuery.length === 0);
    return includeAll ? [{ id: 'ALL', name: 'all' }, ...base] : base;
  })();

  // Reset active index when filtered participants change
  useEffect(() => {
    if (showMentionList && filteredParticipants.length > 0) {
      setActiveMentionIndex((prev) => {
        // Ensure active index is within bounds
        if (prev >= filteredParticipants.length) {
          return 0;
        }
        return prev;
      });
      // Reset refs array
      mentionItemRefs.current = new Array(filteredParticipants.length).fill(null);
    }
  }, [filteredParticipants, showMentionList]);

  // Scroll active item into view when index changes
  useEffect(() => {
    if (showMentionList && filteredParticipants.length > 0) {
      // Wait for DOM to update
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const activeItem = mentionItemRefs.current[activeMentionIndex];
          const container = mentionRef.current;
          
          if (!activeItem || !container) return;
          
          // Get bounding rectangles
          const containerRect = container.getBoundingClientRect();
          const itemRect = activeItem.getBoundingClientRect();
          
          // Calculate item's scroll position
          const itemTopInScroll = container.scrollTop + (itemRect.top - containerRect.top);
          const itemHeight = activeItem.offsetHeight;
          const itemBottomInScroll = itemTopInScroll + itemHeight;
          
          // Current viewport
          const viewportTop = container.scrollTop;
          const viewportBottom = viewportTop + container.clientHeight;
          
          // Scroll if needed
          if (itemTopInScroll < viewportTop) {
            // Item is above - scroll to show it
            container.scrollTop = itemTopInScroll - 4;
          } else if (itemBottomInScroll > viewportBottom) {
            // Item is below - scroll to show it
            container.scrollTop = itemBottomInScroll - container.clientHeight + 4;
          }
        });
      });
    }
  }, [activeMentionIndex, showMentionList, filteredParticipants.length]);

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
    const event = {
      target: { value: inserted }
    } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
    handleInputChange(event);
    setShowMentionList(false);
    setMentionQuery('');
    setMentionStart(null);
    setActiveMentionIndex(0);
    onMentionSelected && onMentionSelected(p.id);
    // Restore focus and move caret to after inserted mention
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const newPos = (before + `@${p.name} `).length;
        inputRef.current.selectionStart = inputRef.current.selectionEnd =
          newPos;
        inputRef.current.focus();
      }
    });
  };

  // Scroll helper function - using scrollIntoView with container scroll
  const scrollToActiveItem = (index: number) => {
    // Wait for DOM to update
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const activeItem = mentionItemRefs.current[index];
        const container = mentionRef.current;
        
        if (!activeItem || !container) return;
        
        // Get bounding rectangles
        const containerRect = container.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        
        // Check if item is visible
        const isFullyVisible = 
          itemRect.top >= containerRect.top && 
          itemRect.bottom <= containerRect.bottom;
        
        if (!isFullyVisible) {
          // Calculate scroll position
          // The item's position relative to container's scroll position
          const relativeTop = itemRect.top - containerRect.top;
          const currentScroll = container.scrollTop;
          const itemScrollPosition = currentScroll + relativeTop;
          
          const itemHeight = activeItem.offsetHeight;
          const containerHeight = container.clientHeight;
          
          // Determine scroll target
          let scrollTarget: number;
          
          if (itemRect.top < containerRect.top) {
            // Item is above - scroll to show it at top
            scrollTarget = itemScrollPosition - 4;
          } else {
            // Item is below - scroll to show it at bottom
            scrollTarget = itemScrollPosition + itemHeight - containerHeight + 4;
          }
          
          // Perform scroll
          container.scrollTo({
            top: Math.max(0, scrollTarget),
            behavior: 'smooth'
          });
        }
      });
    });
  };

  // Handle keyboard navigation for mention list
  const handleMentionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionList && filteredParticipants.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newIndex = activeMentionIndex === filteredParticipants.length - 1 ? 0 : activeMentionIndex + 1;
        setActiveMentionIndex(newIndex);
        // Scroll will be handled by useEffect
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIndex = activeMentionIndex === 0 ? filteredParticipants.length - 1 : activeMentionIndex - 1;
        setActiveMentionIndex(newIndex);
        // Scroll will be handled by useEffect
        return;
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const selectedParticipant = filteredParticipants[activeMentionIndex];
        if (selectedParticipant) {
          insertMention(selectedParticipant);
        }
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionList(false);
        setMentionQuery('');
        setMentionStart(null);
        setActiveMentionIndex(0);
        return;
      }
    }
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
              type="button"
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
            onClick={() => !disabled && setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
          >
            <Smile className="size-5 text-gray-500 dark:text-gray-300" />
          </Button>

          {showEmojiPicker && !disabled && (
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
          disabled={disabled || sendFileMutation.isPending}
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
          disabled={disabled || sendTextMutation.isPending}
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
          disabled={disabled || sendTextMutation.isPending}
          title="Chia sẻ vị trí"
        >
          <MapPin className="size-5 text-gray-500 dark:text-gray-300" />
        </Button>

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={messageText}
          onChange={handleInputChange}
          onKeyDown={handleMentionKeyDown}
          onKeyPress={handleKeyPress}
          placeholder={
            disabled
              ? 'Bạn không thể gửi tin nhắn'
              : 'Nhập @, tin nhắn hoặc /poll Pizza hay KFC? để tạo nhanh bình chọn ...'
          }
          rows={1}
          disabled={disabled}
          className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minHeight: '40px' }}
        />

        {/* Mention list */}
        {showMentionList && filteredParticipants.length > 0 && (
          <div
            ref={mentionRef}
            className="absolute bottom-14 left-16 z-50 w-72 max-h-64 overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
          >
            {filteredParticipants.map((p, index) => {
              const isActive = index === activeMentionIndex;
              const avatarUrl = getAvatarUrl(p.avatar_url || null);
              return (
                <button
                  key={p.id}
                  ref={(el) => {
                    mentionItemRefs.current[index] = el;
                    // Auto scroll when item becomes active
                    if (el && isActive) {
                      requestAnimationFrame(() => {
                        const container = mentionRef.current;
                        if (container) {
                          const containerRect = container.getBoundingClientRect();
                          const itemRect = el.getBoundingClientRect();
                          const itemTopInScroll = container.scrollTop + (itemRect.top - containerRect.top);
                          const itemHeight = el.offsetHeight;
                          const itemBottomInScroll = itemTopInScroll + itemHeight;
                          const viewportTop = container.scrollTop;
                          const viewportBottom = viewportTop + container.clientHeight;
                          
                          if (itemTopInScroll < viewportTop) {
                            container.scrollTop = itemTopInScroll - 4;
                          } else if (itemBottomInScroll > viewportBottom) {
                            container.scrollTop = itemBottomInScroll - container.clientHeight + 4;
                          }
                        }
                      });
                    }
                  }}
                  type="button"
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => insertMention(p)}
                  onMouseEnter={() => setActiveMentionIndex(index)}
                >
                  <img
                    src={avatarUrl || '/default_user.jpg'}
                    className="w-6 h-6 rounded-full object-cover"
                    alt={p.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default_user.jpg';
                    }}
                  />
                  <span className="truncate">@{p.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Send button */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          type="button"
          onClick={handleSendMessage}
          disabled={disabled || !canSend}
        >
          <Send
            className={`size-5 ${
              canSend && !disabled ? 'text-blue-500' : 'text-gray-400'
            }`}
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
