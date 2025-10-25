import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./components/AppRoutes";
import CustomToast from "./components/CustomToast";

import useUserStatusTracker from "./hooks/useUserStatusTracker";
import useUser from "./hooks/useUser";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Component để quản lý presence
function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useUser();

  // Sử dụng hook mới useUserStatusTracker (ưu tiên)
  useUserStatusTracker({
    userId: isAuthenticated && user?.id ? user.id : "",
    onStatusChange: (status) => {
      console.log(`User status changed to: ${status}`);
    },
    heartbeatInterval: 30000, // 30 seconds
  });

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PresenceProvider>
        <AppRoutes />
        <CustomToast />
      </PresenceProvider>
    </QueryClientProvider>
  );
}
/*
  ✅ Real-time 1:1 Chat
  ✅ Send/Receive Text Messages
  ✅ Send Images, Videos, Audio, Files
  ✅ Reply to Messages
  ✅ Edit Messages
  ✅ Recall Messages
  ✅ Message Reactions (Emoji)
  ✅ Typing Indicators
  ✅ Read Receipts
  ✅ Unread Count
  ✅ Infinite Scroll for Message History
  ✅ Message Timestamps
  ✅ Online/Offline Status
  ✅ Conversation List with Last Message Preview
  ✅ Create Direct Conversation from Friends List
  ✅ Real-time Updates for All Features
*/
