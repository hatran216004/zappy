import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { askAIAboutChat } from '@/services/chatService';
import { Sparkles, Loader2, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface AskAIChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  conversationName?: string;
}

export function AskAIChatModal({
  open,
  onOpenChange,
  conversationId,
  conversationName
}: AskAIChatModalProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ question: string; answer: string }>
  >([]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim() || loading) return;

    const currentQuestion = question.trim();
    setQuestion('');
    setLoading(true);
    setAnswer(null);

    try {
      const aiAnswer = await askAIAboutChat(conversationId, currentQuestion);
      setAnswer(aiAnswer);
      setConversationHistory((prev) => [
        ...prev,
        { question: currentQuestion, answer: aiAnswer }
      ]);
    } catch (error) {
      console.error('Error asking AI:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Có lỗi xảy ra khi hỏi AI. Vui lòng thử lại.';
      
      // Show error toast
      toast.error(errorMessage, {
        duration: 5000
      });
      
      // Set error message in UI
      setAnswer(`❌ Lỗi: ${errorMessage}\n\nVui lòng kiểm tra:\n- Kết nối mạng\n- Cấu hình API key (VITE_OPENAI_API_KEY trong file .env)\n- Hoặc thiết lập Supabase Edge Function 'ask-ai-about-chat'`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setConversationHistory([]);
    setAnswer(null);
    setQuestion('');
  };

  const exampleQuestions = [
    'Lịch hẹn tụi mình tuần sau là ngày nào?',
    'Lan nói muốn mua điện thoại gì?',
    'Những file quan trọng gần đây là gì?',
    'Ai là người gửi tin nhắn nhiều nhất?',
    'Có tin nhắn nào về deadline không?'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-purple-500" />
            Hỏi AI về cuộc trò chuyện
            {conversationName && (
              <span className="text-sm font-normal text-gray-500">
                - {conversationName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Conversation History */}
          {conversationHistory.length > 0 && (
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              {conversationHistory.map((item, index) => (
                <div key={index} className="space-y-2">
                  {/* Question */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] bg-blue-500 text-white rounded-lg px-4 py-2">
                      <p className="text-sm font-medium">{item.question}</p>
                    </div>
                  </div>
                  {/* Answer */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-white dark:bg-gray-800 border rounded-lg px-4 py-2">
                      <p className="text-sm whitespace-pre-wrap">{item.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span className="text-sm text-gray-500">
                        Đang suy nghĩ...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Current Answer (if no history yet) */}
          {conversationHistory.length === 0 && answer && (
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="bg-white dark:bg-gray-800 border rounded-lg px-4 py-3">
                <p className="text-sm whitespace-pre-wrap">{answer}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && conversationHistory.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-8 animate-spin text-purple-500" />
                <p className="text-sm text-gray-500">
                  Đang phân tích lịch sử chat...
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading &&
            conversationHistory.length === 0 &&
            !answer && (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <Sparkles className="size-16 text-purple-500 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  Hỏi AI về cuộc trò chuyện
                </p>
                <p className="text-sm text-gray-500 text-center mb-6">
                  AI có thể trả lời các câu hỏi về nội dung, lịch hẹn, file,
                  và thông tin trong cuộc trò chuyện này.
                </p>
                <div className="w-full max-w-md space-y-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Câu hỏi mẫu:
                  </p>
                  {exampleQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuestion(q)}
                      className="w-full text-left text-sm p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="min-h-[80px] pr-10 resize-none"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmit();
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={!question.trim() || loading}
                className="h-[80px]"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
              {conversationHistory.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="h-10"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </form>
          <p className="text-xs text-gray-500 text-center">
            Nhấn Ctrl+Enter hoặc Cmd+Enter để gửi
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

