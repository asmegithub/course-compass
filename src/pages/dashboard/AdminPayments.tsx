import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getPayments } from '@/lib/admin-api';

const AdminPayments = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { toast } = useToast();

  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: getPayments,
  });

  const filtered = useMemo(() => {
    return payments.filter((t) => {
      const studentStr = typeof t.student === 'object' && t.student?.id ? t.student.id : '';
      const courseStr = t.course?.title || t.course?.id || '';
      const txnStr = t.transactionId || t.id || '';
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !searchLower ||
        studentStr.toLowerCase().includes(searchLower) ||
        courseStr.toLowerCase().includes(searchLower) ||
        txnStr.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const totalRevenue = useMemo(
    () => filtered.filter((t) => t.status === 'COMPLETED').reduce((s, t) => s + (t.amount ?? 0), 0),
    [filtered]
  );
  const totalFees = useMemo(
    () => filtered.filter((t) => t.status === 'COMPLETED').reduce((s, t) => s + (t.platformShare ?? 0), 0),
    [filtered]
  );
  const completedCount = useMemo(() => filtered.filter((t) => t.status === 'COMPLETED').length, [filtered]);
  const pendingCount = useMemo(() => filtered.filter((t) => t.status === 'PENDING').length, [filtered]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-1">Track all platform transactions</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold font-display">ETB {totalRevenue.toLocaleString()}</p><p className="text-xs text-muted-foreground mt-1">Total Revenue</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold font-display text-accent">ETB {totalFees.toLocaleString()}</p><p className="text-xs text-muted-foreground mt-1">Platform Fees</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold font-display text-success">{completedCount}</p><p className="text-xs text-muted-foreground mt-1">Completed</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold font-display text-warning">{pendingCount}</p><p className="text-xs text-muted-foreground mt-1">Pending</p></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by student or TXN ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading payments...</p>}
        {error && <p className="text-sm text-destructive">Failed to load payments.</p>}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">TXN ID</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Student</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Course</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Gateway</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Fee</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="p-4 font-mono text-xs">{t.transactionId || t.id}</td>
                      <td className="p-4 font-medium text-muted-foreground">{typeof t.student === 'object' && t.student?.id ? t.student.id : '–'}</td>
                      <td className="p-4 text-muted-foreground text-xs max-w-[160px] truncate">{t.course?.title || t.course?.id || '–'}</td>
                      <td className="p-4"><Badge variant="outline" className="text-xs">{t.gateway || '–'}</Badge></td>
                      <td className="p-4 text-right font-medium">ETB {t.amount != null ? t.amount.toLocaleString() : '–'}</td>
                      <td className="p-4 text-right text-muted-foreground">ETB {t.platformShare != null ? t.platformShare.toLocaleString() : '–'}</td>
                      <td className="p-4">
                        <Badge variant={t.status === 'COMPLETED' ? 'default' : t.status === 'REFUNDED' ? 'destructive' : 'secondary'} className="text-xs">{t.status || '–'}</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {t.paidAt || t.createdAt ? new Date(t.paidAt || t.createdAt!).toLocaleDateString() : '–'}
                      </td>
                      <td className="p-4 text-right">
                        {t.status === 'COMPLETED' && (
                          <Button size="sm" variant="ghost" className="text-xs" onClick={() => toast({ title: 'Refund initiated', description: `Refund for ${t.transactionId || t.id} is being processed.` })}>
                            <RefreshCw className="h-3 w-3 mr-1" /> Refund
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminPayments;
