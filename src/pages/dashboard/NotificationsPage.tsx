import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Loader2, Filter, Search } from 'lucide-react';
import { format, parse } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

const notificationTypeLabels: Record<string, string> = {
  assignment: 'Bài tập',
  grade: 'Điểm số',
  class: 'Lớp học',
  system: 'Hệ thống',
  course: 'Khóa học',
  reminder: 'Nhắc nhở',
  info: 'Thông báo',
};

const notificationTypeColors: Record<string, string> = {
  assignment: 'bg-blue-500/10 text-blue-500',
  grade: 'bg-green-500/10 text-green-500',
  class: 'bg-purple-500/10 text-purple-500',
  system: 'bg-gray-500/10 text-gray-500',
  course: 'bg-orange-500/10 text-orange-500',
  reminder: 'bg-yellow-500/10 text-yellow-500',
  info: 'bg-blue-500/10 text-blue-500',
};

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => notificationsApi.getAll(),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.items || [];
  
  const filteredNotifications = notifications.filter((notification: Notification) => {
    if (filter === 'unread' && notification.isRead) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      notification.title.toLowerCase().includes(query) ||
      notification.message.toLowerCase().includes(query)
    );
  });

  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thông báo</h1>
          <p className="text-muted-foreground">
            Quản lý thông báo của bạn
            {unreadCount > 0 && (
              <span className="ml-2 text-primary font-medium">
                ({unreadCount} chưa đọc)
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <Check className="w-4 h-4 mr-2" />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm thông báo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Tất cả
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            <Filter className="w-4 h-4 mr-2" />
            Chưa đọc
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification: Notification) => (
            <Card
              key={notification.id}
              className={`transition-all ${
                !notification.isRead
                  ? 'border-l-4 border-l-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20'
                  : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      notificationTypeColors[notification.type] || 'bg-gray-500/10 text-gray-500'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium ${!notification.isRead ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      <Badge className={`self-start shrink-0 ${notificationTypeColors[notification.type] || ''}`}>
                        {notificationTypeLabels[notification.type] || notification.type}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">
                        {(() => {
                          try {
                            const date = new Date(notification.createdAt);
                            if (isNaN(date.getTime())) {
                              return notification.createdAt;
                            }
                            return format(date, 'HH:mm - dd/MM/yyyy', { locale: vi });
                          } catch {
                            return notification.createdAt;
                          }
                        })()}
                      </span>
                      <div className="flex gap-2">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            disabled={markAsReadMutation.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Đánh dấu đã đọc
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
