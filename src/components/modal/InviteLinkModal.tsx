import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  generateGroupInvite,
  getGroupInvites,
  revokeGroupInvite,
  type GroupInvite
} from '@/services/chatService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface InviteLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  userId: string;
}

export const InviteLinkModal: React.FC<InviteLinkModalProps> = ({
  open,
  onOpenChange,
  conversationId,
  userId
}) => {
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiresIn, setExpiresIn] = useState<string>('never');
  const [maxUses, setMaxUses] = useState<string>('unlimited');

  useEffect(() => {
    if (open) {
      loadInvites();
    }
  }, [open, conversationId]);

  const loadInvites = async () => {
    setIsLoading(true);
    try {
      const data = await getGroupInvites(conversationId);
      setInvites(data);
    } catch (error) {
      console.error('Error loading invites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    setIsGenerating(true);
    try {
      const expiresInHours =
        expiresIn === 'never' ? undefined : parseInt(expiresIn);
      const maxUsesNum =
        maxUses === 'unlimited' ? undefined : parseInt(maxUses);

      await generateGroupInvite(
        conversationId,
        userId,
        expiresInHours,
        maxUsesNum
      );

      // Reload invites
      await loadInvites();
    } catch (error) {
      console.error('Error generating invite:', error);
      alert('Lỗi khi tạo link mời. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await revokeGroupInvite(inviteId);
      await loadInvites();
    } catch (error) {
      console.error('Error revoking invite:', error);
      alert('Lỗi khi thu hồi link mời.');
    }
  };

  const copyToClipboard = (inviteCode: string) => {
    const inviteLink = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    alert('Đã sao chép link mời!');
  };

  const getInviteLink = (inviteCode: string) => {
    return `${window.location.origin}/invite/${inviteCode}`;
  };

  const isExpired = (invite: GroupInvite) => {
    if (!invite.expires_at) return false;
    return new Date(invite.expires_at) < new Date();
  };

  const isMaxUsesReached = (invite: GroupInvite) => {
    if (!invite.max_uses) return false;
    return invite.used_count >= invite.max_uses;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Link mời vào nhóm</DialogTitle>
          <DialogDescription>
            Tạo và quản lý link mời để mọi người tham gia nhóm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Generate New Invite */}
          <div className="space-y-4 rounded-xl border p-4 md:p-6 shadow-sm
  bg-white/70 border-neutral-200 text-neutral-900
  dark:bg-[#2b2d31]/80 dark:border-[#1e1f22] dark:text-neutral-100">

        <h3 className="text-base font-semibold tracking-tight
          text-neutral-900 dark:text-neutral-100">
          Tạo link mời mới
        </h3>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {/* Hết hạn sau */}
    <div className="space-y-2">
      <Label
        htmlFor="expires"
        className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
      >
        Hết hạn sau
      </Label>

      <Select value={expiresIn} onValueChange={setExpiresIn}>
        <SelectTrigger
          id="expires"
          className="h-10 rounded-lg border border-neutral-200 bg-white text-neutral-900
                     focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-0
                     dark:border-[#1e1f22] dark:bg-[#313338] dark:text-neutral-100
                     data-[state=open]:ring-2 data-[state=open]:ring-[#5865F2]"
        >
          <SelectValue placeholder="Chọn thời hạn" />
        </SelectTrigger>

        <SelectContent
          className="rounded-lg border border-neutral-200 bg-white
                     dark:border-neutral-800 dark:bg-[#1e1f22]"
        >
          <SelectItem
            value="never"
            className="data-[state=checked]:bg-[#5865F2]/15
                       focus:bg-[#5865F2]/10 dark:focus:bg-[#5865F2]/20"
          >
            Không bao giờ
          </SelectItem>
          <SelectItem value="1">1 giờ</SelectItem>
          <SelectItem value="24">24 giờ</SelectItem>
          <SelectItem value="168">7 ngày</SelectItem>
          <SelectItem value="720">30 ngày</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Số lần sử dụng tối đa */}
    <div className="space-y-2">
      <Label
        htmlFor="maxUses"
        className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
      >
        Số lần sử dụng tối đa
      </Label>

      <Select value={maxUses} onValueChange={setMaxUses}>
        <SelectTrigger
          id="maxUses"
          className="h-10 rounded-lg border border-neutral-200 bg-white text-neutral-900
                     focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-0
                     dark:border-[#1e1f22] dark:bg-[#313338] dark:text-neutral-100
                     data-[state=open]:ring-2 data-[state=open]:ring-[#5865F2]"
        >
          <SelectValue placeholder="Chọn giới hạn" />
        </SelectTrigger>

        <SelectContent
          className="rounded-lg border border-neutral-200 bg-white
                     dark:border-neutral-800 dark:bg-[#1e1f22]"
        >
          <SelectItem value="unlimited">Không giới hạn</SelectItem>
          <SelectItem value="1">1 lần</SelectItem>
          <SelectItem value="5">5 lần</SelectItem>
          <SelectItem value="10">10 lần</SelectItem>
          <SelectItem value="25">25 lần</SelectItem>
          <SelectItem value="50">50 lần</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  <Button
    onClick={handleGenerateInvite}
    disabled={isGenerating}
    className="w-full h-10 rounded-lg font-medium shadow-sm
               bg-[#5865F2] hover:bg-[#4752c4] text-white
               disabled:opacity-70 disabled:cursor-not-allowed
               focus-visible:ring-2 focus-visible:ring-[#5865F2] focus-visible:ring-offset-0"
  >
    {isGenerating ? 'Đang tạo...' : 'Tạo link mời'}
  </Button>
</div>


          {/* Active Invites List */}
          <div className="space-y-3">
  <h3 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
    Link mời hiện có
  </h3>

  {isLoading ? (
    <div className="py-8 text-center rounded-xl border bg-white/70 text-neutral-500
                    border-neutral-200
                    dark:bg-[#2b2d31]/80 dark:border-[#1e1f22] dark:text-neutral-400">
      Đang tải...
    </div>
  ) : invites.length === 0 ? (
    <div className="py-8 text-center rounded-xl border bg-white/70 text-neutral-500
                    border-neutral-200
                    dark:bg-[#2b2d31]/80 dark:border-[#1e1f22] dark:text-neutral-400">
      Chưa có link mời nào
    </div>
  ) : (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {invites.map((invite) => {
          const expired = isExpired(invite);
          const maxReached = isMaxUsesReached(invite);
          const isInvalid = expired || maxReached;

          return (
            <div
              key={invite.id}
              className={[
                "rounded-xl border p-3 md:p-4 shadow-sm transition",
                "bg-white/80 border-neutral-200 text-neutral-900",
                "dark:bg-[#2b2d31]/80 dark:border-[#1e1f22] dark:text-neutral-100",
                isInvalid ? "opacity-70 grayscale-[.15]" : "hover:shadow",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <code className="rounded-md px-2 py-1 font-mono text-sm
                                      bg-neutral-100 text-neutral-900
                                      dark:bg-[#1e1f22] dark:text-neutral-100">
                      {invite.invite_code}
                    </code>

                    {isInvalid && (
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium
                                        bg-red-100 text-red-700
                                        dark:bg-red-500/15 dark:text-red-300">
                        {expired ? "Hết hạn" : "Đã đủ số lần"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                    <div>
                      Đã sử dụng: {invite.used_count}
                      {invite.max_uses ? ` / ${invite.max_uses}` : " / ∞"}
                    </div>

                    {invite.expires_at ? (
                      <div>
                        Hết hạn:{" "}
                        {formatDistanceToNow(new Date(invite.expires_at), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </div>
                    ) : (
                      <div>Không hết hạn</div>
                    )}
                  </div>

                  <Input
                    readOnly
                    value={getInviteLink(invite.invite_code)}
                    className="mt-2 h-9 text-xs
                               bg-white border-neutral-200 text-neutral-900
                               focus-visible:ring-2 focus-visible:ring-[#5865F2] focus-visible:ring-offset-0
                               dark:bg-[#313338] dark:border-[#1e1f22] dark:text-neutral-100"
                    onClick={(e) => e.currentTarget.select()}
                  />
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(invite.invite_code)}
                    title="Sao chép link"
                    className="h-9 border-neutral-200 text-neutral-700 hover:bg-neutral-100
                               dark:border-[#1e1f22] dark:text-neutral-200 dark:hover:bg-[#3b3d42]
                               focus-visible:ring-2 focus-visible:ring-[#5865F2] focus-visible:ring-offset-0"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRevokeInvite(invite.id)}
                    title="Thu hồi link"
                    className="h-9 bg-red-600 hover:bg-red-700 text-white
                               focus-visible:ring-2 focus-visible:ring-red-600/60 focus-visible:ring-offset-0
                               dark:bg-red-600 dark:hover:bg-red-500"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  )}
</div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

