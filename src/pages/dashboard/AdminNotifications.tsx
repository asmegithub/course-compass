import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Loader2, ExternalLink } from 'lucide-react';
import { getNotifications } from '@/lib/course-api';

const AdminNotifications = () => {
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
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Alerts for course submissions, instructor applications, withdrawal and payout requests.
          </p>
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{n.title || 'Notification'}</p>
                      {n.message && <p className="text-muted-foreground text-sm mt-1">{n.message}</p>}
                      {n.type && (
                        <span className="inline-block mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {n.type}
                        </span>
                      )}
                      {n.createdAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {n.actionUrl && (
                      <Button variant="outline" size="sm" asChild className="shrink-0">
                        <Link to={n.actionUrl}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Link>
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

export default AdminNotifications;
