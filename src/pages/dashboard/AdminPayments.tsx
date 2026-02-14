import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Search, ArrowUpRight, TrendingUp, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const transactions = [
  { id: 'TXN-00451', student: 'Dawit Alemu', course: 'Complete Web Dev Bootcamp', amount: 299, gateway: 'Telebirr', status: 'COMPLETED', platformFee: 45, instructorPay: 254, date: '2026-02-13' },
  { id: 'TXN-00450', student: 'Hana Mesfin', course: 'Python for Data Science', amount: 349, gateway: 'Chapa', status: 'COMPLETED', platformFee: 52, instructorPay: 297, date: '2026-02-12' },
  { id: 'TXN-00449', student: 'Solomon Gebre', course: 'UI/UX Design Masterclass', amount: 249, gateway: 'Telebirr', status: 'PENDING', platformFee: 37, instructorPay: 212, date: '2026-02-12' },
  { id: 'TXN-00448', student: 'Kebede Mengistu', course: 'Digital Marketing Guide', amount: 199, gateway: 'CBE Birr', status: 'COMPLETED', platformFee: 30, instructorPay: 169, date: '2026-02-11' },
  { id: 'TXN-00447', student: 'Meron Tadesse', course: 'Learn Amharic', amount: 149, gateway: 'Chapa', status: 'REFUNDED', platformFee: 0, instructorPay: 0, date: '2026-02-10' },
  { id: 'TXN-00446', student: 'Sara Tadesse', course: 'Leadership Skills', amount: 179, gateway: 'Telebirr', status: 'COMPLETED', platformFee: 27, instructorPay: 152, date: '2026-02-09' },
];

const AdminPayments = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { toast } = useToast();

  const filtered = transactions.filter(t => {
    const matchesSearch = t.student.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = transactions.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0);
  const totalFees = transactions.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.platformFee, 0);

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
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold font-display text-success">{transactions.filter(t => t.status === 'COMPLETED').length}</p><p className="text-xs text-muted-foreground mt-1">Completed</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold font-display text-warning">{transactions.filter(t => t.status === 'PENDING').length}</p><p className="text-xs text-muted-foreground mt-1">Pending</p></CardContent></Card>
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
                  {filtered.map(t => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="p-4 font-mono text-xs">{t.id}</td>
                      <td className="p-4 font-medium">{t.student}</td>
                      <td className="p-4 text-muted-foreground text-xs max-w-[160px] truncate">{t.course}</td>
                      <td className="p-4"><Badge variant="outline" className="text-xs">{t.gateway}</Badge></td>
                      <td className="p-4 text-right font-medium">ETB {t.amount}</td>
                      <td className="p-4 text-right text-muted-foreground">ETB {t.platformFee}</td>
                      <td className="p-4">
                        <Badge variant={t.status === 'COMPLETED' ? 'default' : t.status === 'REFUNDED' ? 'destructive' : 'secondary'} className="text-xs">{t.status}</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">{t.date}</td>
                      <td className="p-4 text-right">
                        {t.status === 'COMPLETED' && (
                          <Button size="sm" variant="ghost" className="text-xs" onClick={() => toast({ title: 'Refund initiated', description: `Refund for ${t.id} is being processed.` })}>
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
