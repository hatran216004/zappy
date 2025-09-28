const messages = [
  {
    id: 1,
    sender: "Trần Minh Hà",
    text: "test",
    time: "10:44",
    mine: false,
  },
  {
    id: 2,
    sender: "Me",
    text: "Test1",
    time: "10:47",
    mine: true,
  },
];

export default function ChatMessages() {
  return (
    <div className="flex flex-col gap-3 pb-4 sc">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
              m.mine
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
            }`}
          >
            {m.text}
            <div className="text-[10px] text-gray-400 mt-1 text-right">
              {m.time}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
