import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/services';
import { useAuthStore } from '@/stores/authStore';

// Poll thay vì SignalR riêng cho badge nhỏ này — tần suất thấp (30s) đủ để
// sidebar "sống" mà không cần thêm hạ tầng realtime chỉ cho 1 chấm đỏ.
const POLL_INTERVAL_MS = 30_000;

export const useUnreadNotificationsCount = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getAll(),
    enabled: isAuthenticated,
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS,
  });

  return data?.unreadCount || 0;
};
