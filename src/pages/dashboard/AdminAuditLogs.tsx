import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Search, ShieldCheck, Users, BookOpen, DollarSign, Cog } from 'lucide-react';

const logs = [
  { id: '1', admin: 'Tigist Haile', action: 'APPROVE_COURSE', target: 'Python for Data Science', category: 'COURSE', time: '2h ago', ip: '196.188.12.xx' },
  { id: '2', admin: 'Tigist Haile', action: 'BAN_USER', target: 'spam_user@test.com', category: 'USER', time: '5h ago', ip: '196.188.12.xx' },
  { id: '3', admin: 'Tigist Haile', action: 'UPDATE_SETTING', target: 'platform_fee → 15%', category: 'SYSTEM', time: '1d ago', ip: '196.188.12.xx' },
  { id: '4', admin: 'Tigist Haile', action: 'PROCESS_REFUND', target: 'TXN-00234 · ETB 299', category: 'PAYMENT', time: '2d ago', ip: '196.188.12.xx' },
  { id: '5', admin: 'Tigist Haile', action: 'REJECT_COURSE', target: 'Intro to Blockchain', category: 'COURSE', time: '3d ago', ip: '196.188.12.xx' },
  { id: '6', admin: 'Tigist Haile', action: 'CREATE_COUPON', target: 'WELCOME20 · 20%', category: 'COUPON', time: '4d ago', ip: '196.188.12.xx' },
  { id: '7', admin: 'Tigist Haile', action: 'UNBAN_USER', target: 'henok@example.com', category: 'USER', time: '5d ago', ip: '196.188.12.xx' },
  { id: '8', admin: 'Tigist Haile', action: 'DELETE_CATEGORY', target: 'Deprecated Category', category: 'SYSTEM', time: '1w ago', ip: '196.188.12.xx' },
];

const categoryIcons: Record<string, React.ElementType> = {
  COURSE: BookOpen, USER: Users, SYSTEM: Cog, PAYMENT: DollarSign, COUPON: ShieldCheck,
};

const AdminAuditLogs = () => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');

  const filtered = logs.filter(l => {
    const matchesSearch = l.action.toLowerCase().includes(search.toLowerCase()) || l.target.toLowerCase().includes(search.toLowerCase());
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
            <Input placeholder="Search actions or targets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
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

        <div className="space-y-2">
          {filtered.map(log => {
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
                          <span className="text-accent">{log.admin}</span> · <span className="font-mono text-xs">{log.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Target: {log.target}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs mb-1">{log.category}</Badge>
                      <p className="text-xs text-muted-foreground">{log.time}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAuditLogs;
