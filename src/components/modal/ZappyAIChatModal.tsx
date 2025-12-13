import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Send, Bot, User, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chatWithZappyAI } from '@/services/chatService';
import { useAuth } from '@/stores/user';
import { twMerge } from 'tailwind-merge';
import toast from 'react-hot-toast';

interface ZappyAIChatModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export const ZappyAIChatModal: React.FC<ZappyAIChatModalProps> = ({
    open,
    onOpenChange
}) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Xin chào! Mình là Zappy AI 🤖\nMình có thể giúp gì cho bạn hôm nay?',
            timestamp: Date.now()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, open]);

    // Focus input when open
    useEffect(() => {
        if (open) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [open]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: Date.now()
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Prepare history for AI (excluding welcome message if needed, but it's fine to keep)
            const history = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const responseContent = await chatWithZappyAI(userMessage.content, history);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseContent,
                timestamp: Date.now()
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            toast.error('Có lỗi xảy ra khi kết nối với Zappy AI');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: 'Đã xóa lịch sử trò chuyện. Chúng ta bắt đầu lại nhé! 🚀',
                timestamp: Date.now()
            }
        ]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 bg-white dark:bg-[#313338] border-gray-200 dark:border-[#2B2D31]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2B2D31] bg-white dark:bg-[#2B2D31] rounded-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                Zappy AI
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium">
                                    Beta
                                </span>
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-[#B5BAC1]">
                                Trợ lý ảo thông minh của bạn
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearChat}
                            title="Xóa lịch sử trò chuyện"
                            className="text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 mr-10"
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                        {/* <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="text-gray-500 dark:text-[#B5BAC1] hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                            <X className="w-5 h-5" />
                        </Button> */}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#313338]">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={twMerge(
                                "flex w-full",
                                msg.role === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={twMerge(
                                    "flex max-w-[80%] gap-2",
                                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                {/* Avatar */}
                                <div className="flex-shrink-0 mt-1">
                                    {msg.role === 'user' ? (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#2B2D31] flex items-center justify-center overflow-hidden">
                                            {user?.user_metadata?.avatar_url ? (
                                                <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-5 h-5 text-gray-500" />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                                            <Bot className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div
                                    className={twMerge(
                                        "px-4 py-2.5 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-blue-600 text-white rounded-tr-none"
                                            : "bg-white dark:bg-[#2B2D31] text-gray-900 dark:text-[#DCDDDE] border border-gray-200 dark:border-[#26272D] rounded-tl-none"
                                    )}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start w-full">
                            <div className="flex max-w-[80%] gap-2 flex-row">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white dark:bg-[#2B2D31] border border-gray-200 dark:border-[#26272D] flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-[#2B2D31] border-t border-gray-200 dark:border-[#26272D] rounded-b-md">
                    <div className="relative flex items-center">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhắn tin cho Zappy AI..."
                            disabled={isLoading}
                            className="
                w-full pl-5 pr-12 py-3.5 
                rounded-full 
                bg-gray-100 dark:bg-[#383A40] 
                text-gray-900 dark:text-[#DCDDDE] 
                placeholder-gray-500 dark:placeholder-[#949BA4]
                border-none focus:ring-2 focus:ring-blue-500/50 outline-none
                transition-all
              "
                        />
                        <Button
                            size="icon"
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className={twMerge(
                                "absolute right-2 top-1/2 -translate-y-1/2 rounded-full w-9 h-9 transition-all",
                                input.trim()
                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                    : "bg-transparent text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            Zappy AI có thể mắc lỗi. Hãy kiểm tra các thông tin quan trọng.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
