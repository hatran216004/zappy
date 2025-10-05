import { ContactItem } from "./ContactItem";

type Friend = {
  id: number;
  name: string;
  avatar: string;
  tags: string[];
};

export function ContactList({ data }: { data: Friend[] }) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-custom">
      {data.map((friend) => (
        <ContactItem key={friend.id} friend={friend} />
      ))}
    </div>
  );
}
