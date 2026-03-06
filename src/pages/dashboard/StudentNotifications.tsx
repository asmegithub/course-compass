import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Loader2 } from 'lucide-react';
import { getNotifications } from '@/lib/course-api';

const StudentNotifications = () => {
  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications-me'],
    queryFn: getNotifications,
  });

  const list = Array.isArray(notifications) ? notifications : [];

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
                  <p className="font-medium text-sm">{n.title || 'Notification'}</p>
                  {n.message && <p className="text-muted-foreground text-sm mt-1">{n.message}</p>}
                  {n.createdAt && (
                    <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                  )}
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
