import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { getAIConversationSummary, type AIConversationSummary } from '@/services/chatService';
import {
    Sparkles,
    Loader2,
    RefreshCw,
    Copy,
    CheckCircle,
    Lightbulb,
    MessageSquare,
    ListTodo,
    Tag,
    Smile,
    Meh,
    Frown
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AISummaryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conversationId: string;
    conversationName: string;
}

type TimeRange = '24h' | '7d' | '30d' | 'all';

const timeRangeLabels: Record<TimeRange, string> = {
    '24h': '24 giờ qua',
    '7d': '7 ngày qua',
    '30d': '30 ngày qua',
    'all': 'Tất cả'
};

export function AISummaryModal({
    open,
    onOpenChange,
    conversationId,
    conversationName
}: AISummaryModalProps) {
    const [summary, setSummary] = useState<AIConversationSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('24h');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (open) {
            loadSummary();
        }
    }, [open, conversationId]);

    const loadSummary = async (range: TimeRange = timeRange) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAIConversationSummary(conversationId, range);
            setSummary(data);
        } catch (err: any) {
            console.error('Error loading AI summary:', err);
            setError(err.message || 'Không thể tải tóm tắt AI. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleTimeRangeChange = (value: string) => {
        const newRange = value as TimeRange;
        setTimeRange(newRange);
        loadSummary(newRange);
    };

    const handleCopy = async () => {
        if (!summary) return;

        const text = `📝 Tóm tắt cuộc trò chuyện - ${conversationName}

📌 Nội dung chính:
${summary.summary}

${summary.highlights.length > 0 ? `💡 Điểm nổi bật:
${summary.highlights.map(h => `• ${h}`).join('\n')}` : ''}

${summary.topics.length > 0 ? `🏷️ Chủ đề:
${summary.topics.join(', ')}` : ''}

${summary.actionItems.length > 0 ? `✅ Việc cần làm:
${summary.actionItems.map(a => `• ${a}`).join('\n')}` : ''}`;

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success('Đã sao chép tóm tắt!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Không thể sao chép');
        }
    };

    const getSentimentIcon = (sentiment: AIConversationSummary['sentiment']) => {
        switch (sentiment) {
            case 'positive':
                return <Smile className="size-5 text-green-500" />;
            case 'negative':
                return <Frown className="size-5 text-red-500" />;
            default:
                return <Meh className="size-5 text-yellow-500" />;
        }
    };

    const getSentimentLabel = (sentiment: AIConversationSummary['sentiment']) => {
        switch (sentiment) {
            case 'positive':
                return 'Tích cực';
            case 'negative':
                return 'Tiêu cực';
            default:
                return 'Bình thường';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="size-5 text-purple-500" />
                        AI Tóm tắt - {conversationName}
                    </DialogTitle>
                </DialogHeader>

                {/* Time Range Selector */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b">
                    <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Chọn khoảng thời gian" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(timeRangeLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            disabled={loading || !summary}
                        >
                            {copied ? (
                                <CheckCircle className="size-4 mr-1 text-green-500" />
                            ) : (
                                <Copy className="size-4 mr-1" />
                            )}
                            {copied ? 'Đã sao chép' : 'Sao chép'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadSummary()}
                            disabled={loading}
                        >
                            <RefreshCw className={`size-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </Button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="py-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                            <Loader2 className="size-8 animate-spin text-purple-500" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            AI đang phân tích cuộc trò chuyện...
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            Có thể mất vài giây
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="py-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                            <Sparkles className="size-8 text-red-500" />
                        </div>
                        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                        <Button onClick={() => loadSummary()} variant="outline">
                            Thử lại
                        </Button>
                    </div>
                )}

                {/* Summary Content */}
                {!loading && !error && summary && (
                    <div className="space-y-6 py-2">
                        {/* Main Summary */}
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                            <div className="flex items-start gap-3">
                                <MessageSquare className="size-5 text-purple-500 mt-0.5 shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                        Tóm tắt
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {summary.summary}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sentiment */}
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            {getSentimentIcon(summary.sentiment)}
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Tông giọng cuộc hội thoại:
                            </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                {getSentimentLabel(summary.sentiment)}
                            </span>
                        </div>

                        {/* Highlights */}
                        {summary.highlights.length > 0 && (
                            <div className="border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Lightbulb className="size-5 text-yellow-500" />
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                        Điểm nổi bật
                                    </h3>
                                </div>
                                <ul className="space-y-2">
                                    {summary.highlights.map((highlight, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                                        >
                                            <span className="text-yellow-500 mt-1">•</span>
                                            {highlight}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Topics */}
                        {summary.topics.length > 0 && (
                            <div className="border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Tag className="size-5 text-blue-500" />
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                        Chủ đề được thảo luận
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {summary.topics.map((topic, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                                        >
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Items */}
                        {summary.actionItems.length > 0 && (
                            <div className="border rounded-lg p-4 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
                                <div className="flex items-center gap-2 mb-3">
                                    <ListTodo className="size-5 text-green-500" />
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                        Việc cần làm
                                    </h3>
                                </div>
                                <ul className="space-y-2">
                                    {summary.actionItems.map((item, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                                        >
                                            <CheckCircle className="size-4 text-green-500 mt-0.5 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Empty State */}
                        {summary.summary.includes('Không có tin nhắn') && (
                            <div className="py-12 text-center text-gray-500">
                                <MessageSquare className="size-16 mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-medium">Chưa có tin nhắn</p>
                                <p className="text-sm">
                                    Không có tin nhắn nào trong khoảng thời gian đã chọn
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
