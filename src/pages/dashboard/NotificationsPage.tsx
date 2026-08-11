import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Loader2, Trash2, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeacherCard } from '@/components/Dashboard/teacher/TeacherCard';
import { TeacherPageHeader } from '@/components/Dashboard/teacher/TeacherPageHeader';
import { notificationsApi, Notification } from '@/services/dashboardApi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const ITEMS_PER_PAGE = 20;

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', currentPage],
    queryFn: () => notificationsApi.getAll({ page: currentPage, pageSize: ITEMS_PER_PAGE }),
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notificationsData?.items || [];
  const totalPages = Math.ceil((notificationsData?.total || 0) / ITEMS_PER_PAGE);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
      case 'user_register':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
      case 'submission':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
      case 'school_request':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleMarkAllRead = () => {
    if (confirm('Đánh dấu tất cả thông báo đã đọc?')) {
      markAllAsReadMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <TeacherPageHeader
        title="Thông báo"
        description={notificationsData?.unreadCount ? `Bạn có ${notificationsData.unreadCount} thông báo chưa đọc` : 'Tất cả thông báo của bạn'}
        action={
          notificationsData?.unreadCount && notificationsData.unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllAsReadMutation.isPending}
              className="border-border hover:bg-accent"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              {markAllAsReadMutation.isPending ? 'Đang xử lý...' : 'Đánh dấu đã đọc tất cả'}
            </Button>
          )
        }
      />

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : notifications.length === 0 ? (
        <TeacherCard className="p-12 text-center" noPadding={false}>
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Không có thông báo nào</h3>
          <p className="text-muted-foreground text-sm">Bạn sẽ nhận được thông báo khi có cập nhật mới.</p>
        </TeacherCard>
      ) : (
        <TeacherCard noPadding className="divide-y divide-border">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-accent/50 transition-colors ${
                !notification.isRead ? 'bg-indigo-500/10' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {getNotificationIcon(notification.title)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                      title="Đánh dấu đã đọc"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </TeacherCard>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border hover:bg-accent"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-border hover:bg-accent"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
