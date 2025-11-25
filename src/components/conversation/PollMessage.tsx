import { useEffect, useMemo, useState } from 'react';
import { getPollByMessage, votePoll, unvotePoll, subscribePollVotesForPoll, type PollWithOptions } from '@/services/chatService';
import useUser from '@/hooks/useUser';

export function PollMessage({ messageId, conversationId }: { messageId: string; conversationId: string }) {
  const { user } = useUser();
  const userId = user?.id || '';
  const [poll, setPoll] = useState<PollWithOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await getPollByMessage(messageId, userId);
      if (mounted) {
        setPoll(data);
        setLoading(false);
      }
    })();
    // After initial load, subscribe narrowly to this poll id for realtime updates
    let unsub = () => {};
    const setup = async () => {
      const data = await getPollByMessage(messageId, userId);
      if (data?.id) {
        unsub = subscribePollVotesForPoll(data.id, async () => {
          const updated = await getPollByMessage(messageId, userId);
          setPoll(updated);
        });
      }
    };
    setup();
    return () => {
      mounted = false;
      unsub();
    };
  }, [messageId, userId, conversationId]);

  const totalVotes = useMemo(
    () => (poll?.options || []).reduce((sum, o) => sum + (o.votes_count || 0), 0),
    [poll?.options]
  );

  if (loading || !poll) {
    return (
      <div className="p-3 rounded-lg bg-gray-100 text-gray-700 dark:bg-[#2B2D31] dark:text-[#B5BAC1]">
        Đang tải bình chọn...
      </div>
    );
  }

  const myVotes = new Set(poll.my_votes || []);
  const canMulti = poll.multiple;

  const handleToggleVote = async (optionId: string) => {
    if (!userId || !poll.can_vote) return;
    setSubmitting(optionId);
    try {
      if (myVotes.has(optionId)) {
        // optimistic
        setPoll((prev) =>
          prev
            ? {
                ...prev,
                my_votes: (prev.my_votes || []).filter((id) => id !== optionId),
                options: prev.options.map((o) =>
                  o.id === optionId ? { ...o, votes_count: (o.votes_count || 0) - 1 } : o
                )
              }
            : prev
        );
        await unvotePoll(poll.id, optionId, userId);
      } else {
        if (!canMulti && (poll.my_votes?.length || 0) > 0) {
          // if single-choice, unvote the previous first (optimistic)
          const prevId = poll.my_votes![0];
          setPoll((prev) =>
            prev
              ? {
                  ...prev,
                  my_votes: [optionId],
                  options: prev.options.map((o) =>
                    o.id === optionId
                      ? { ...o, votes_count: (o.votes_count || 0) + 1 }
                      : o.id === prevId
                      ? { ...o, votes_count: (o.votes_count || 0) - 1 }
                      : o
                  )
                }
              : prev
          );
          await unvotePoll(poll.id, prevId, userId);
          await votePoll(poll.id, optionId, userId);
        } else {
          // optimistic
          setPoll((prev) =>
            prev
              ? {
                  ...prev,
                  my_votes: [...(prev.my_votes || []), optionId],
                  options: prev.options.map((o) =>
                    o.id === optionId ? { ...o, votes_count: (o.votes_count || 0) + 1 } : o
                  )
                }
              : prev
          );
          await votePoll(poll.id, optionId, userId);
        }
      }
    } catch (_e) {
      // fallback: refetch
      const latest = await getPollByMessage(messageId, userId);
      setPoll(latest);
    } finally {
      setSubmitting(null);
    }
  };

  const canVote = poll.can_vote !== false;
  const hasRestrictions = (poll.allowed_participants?.length || 0) > 0;

  return (
    <div className="p-3 rounded-lg bg-white text-gray-900 dark:bg-[#2B2D31] dark:text-[#F2F3F5] border border-gray-200 dark:border-[#3F4246] w-[min(520px,80vw)]">
      <div className="font-semibold mb-2">📊 {poll.question}</div>
      
      {/* Show warning if user cannot vote */}
      {!canVote && hasRestrictions && (
        <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-300">
          ⚠️ Bạn không được phép tham gia bình chọn này (chỉ xem)
        </div>
      )}

      <div className="space-y-2">
        {poll.options.map((opt) => {
          const count = opt.votes_count || 0;
          const percent = totalVotes > 0 ? Math.round((count * 100) / totalVotes) : 0;
          const selected = myVotes.has(opt.id);
          return (
            <button
              key={opt.id}
              disabled={!!submitting || !canVote}
              onClick={() => handleToggleVote(opt.id)}
              className={`w-full text-left px-3 py-2 rounded-md border transition
                ${!canVote ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                ${selected ? 'bg-blue-50 border-blue-400 dark:bg-white/10 dark:border-blue-400' : 'bg-gray-50 border-gray-200 dark:bg-white/5 dark:border-[#3F4246]'}
              `}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">{opt.option_text}</span>
                <span className="text-xs text-gray-500">{count} phiếu • {percent}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded bg-gray-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded bg-blue-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {canMulti ? 'Cho phép chọn nhiều' : 'Chỉ được chọn một'}
        {totalVotes > 0 ? ` • Tổng ${totalVotes} phiếu` : ''}
        {hasRestrictions && ` • Giới hạn ${poll.allowed_participants?.length} người`}
      </div>
    </div>
  );
}


