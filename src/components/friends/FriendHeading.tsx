export default function FriendHeading({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-8 px-4 py-2 border-b dark:border-gray-700 bg-white dark:bg-gray-800 ">
      {children}
    </div>
  );
}
