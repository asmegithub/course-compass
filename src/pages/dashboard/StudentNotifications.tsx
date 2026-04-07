import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check, Loader2 } from 'lucide-react';
import { getNotifications, markNotificationRead } from '@/lib/course-api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const StudentNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications-me'],
    queryFn: getNotifications,
  });

  const list = Array.isArray(notifications) ? notifications : [];
  const unreadCount = list.filter((item) => !item.isRead).length;

  const markOneReadMutation = useMutation({
    mutationFn: async (notification: (typeof list)[number]) => {
      await markNotificationRead(notification, true);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications-me'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['notification-unread-count', user?.id] }),
      ]);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to update notification.';
      toast({ title: 'Could not mark as read', description: message, variant: 'destructive' });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = list.filter((n) => !n.isRead);
      await Promise.all(unread.map((n) => markNotificationRead(n, true)));
      return unread.length;
    },
    onSuccess: async (changedCount) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications-me'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['notification-unread-count', user?.id] }),
      ]);
      if (changedCount > 0) {
        toast({ title: 'Notifications updated', description: `${changedCount} marked as read.` });
      }
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to update notifications.';
      toast({ title: 'Could not mark all as read', description: message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load notifications.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Your activity and course updates.</p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
          >
            <Check className="h-4 w-4 mr-1" />
            Mark all as read
          </Button>
        </div>

        {list.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No notifications yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {list.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg border p-4 ${n.isRead ? 'bg-muted/30' : 'bg-accent/5 border-accent/20'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{n.title || 'Notification'}</p>
                      {n.message && <p className="text-muted-foreground text-sm mt-1">{n.message}</p>}
                      {n.createdAt && (
                        <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                      )}
                      {n.actionUrl && (
                        <a href={n.actionUrl} className="text-xs text-accent underline mt-2 inline-block">Open related item</a>
                      )}
                    </div>
                    {!n.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => markOneReadMutation.mutate(n)}
                        disabled={markOneReadMutation.isPending}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentNotifications;
