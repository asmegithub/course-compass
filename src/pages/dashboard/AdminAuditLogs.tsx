import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Search, ShieldCheck, Users, BookOpen, DollarSign, Cog, Loader2 } from 'lucide-react';
import { getAuditLogs } from '@/lib/admin-api';
import { useQuery } from '@tanstack/react-query';

const categoryIcons: Record<string, React.ElementType> = {
  COURSE: BookOpen,
  USER: Users,
  SYSTEM: Cog,
  PAYMENT: DollarSign,
  COUPON: ShieldCheck,
};

function formatTime(createdAt?: string): string {
  if (!createdAt) return '—';
  const d = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffM / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffM < 60) return `${diffM}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString();
}

const AdminAuditLogs = () => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');

  const { data: logs = [], isLoading, isError } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: getAuditLogs,
  });

  const displayLogs = logs.map((log) => ({
    id: log.id,
    admin: log.admin
      ? [log.admin.firstName, log.admin.lastName].filter(Boolean).join(' ') || log.admin.email || '—'
      : '—',
    action: log.action ?? '—',
    target: log.targetId || log.changes || log.newValue || log.targetType || '—',
    category: (log.targetType || log.action?.split('_')[0] || 'SYSTEM').toUpperCase(),
    time: formatTime(log.createdAt),
    ip: log.ipAddress ?? '—',
  }));

  const filtered = displayLogs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase()) ||
      l.admin.toLowerCase().includes(search.toLowerCase());
    const matchesCat = catFilter === 'ALL' || l.category === catFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Track all administrative actions</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search actions or targets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="COURSE">Course</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="PAYMENT">Payment</SelectItem>
              <SelectItem value="SYSTEM">System</SelectItem>
              <SelectItem value="COUPON">Coupon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading audit logs...</span>
          </div>
        )}
        {isError && (
          <p className="text-sm text-destructive py-4">Failed to load audit logs.</p>
        )}
        {!isLoading && !isError && (
          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">No audit logs match your filters.</p>
            )}
            {filtered.map((log) => {
              const Icon = categoryIcons[log.category] || Activity;
              return (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            <span className="text-accent">{log.admin}</span> ·{' '}
                            <span className="font-mono text-xs">{log.action}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">Target: {log.target}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs mb-1">
                          {log.category}
                        </Badge>
                        <p className="text-xs text-muted-foreground">{log.time}</p>
                        {log.ip !== '—' && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">{log.ip}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAuditLogs;
