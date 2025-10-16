import { Chat } from '@/types/chat';
import ConversationItem from './ConversationItem';

export type Conversation = Chat;

const mockData: Conversation[] = [
  {
    id: 1,
    name: 'Hieu',
    lastMsg: 'Bạn: Test123',
    time: '5 ngày',
    avatar: '/test.png',
    pinned: true
  }
];

export default function ConversatinList() {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-custom">
      {mockData.map((conversation) => (
        <ConversationItem conversation={conversation} />
      ))}
    </div>
  );
}
