export type Chat = {
  id: number;
  name: string;
  lastMsg: string;
  time: string;
  avatar: string;
  pinned?: boolean;
  unread?: number;
  active?: boolean;
};
