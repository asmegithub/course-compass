import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Search, Eye, CheckCircle2, XCircle, Clock } from 'lucide-react';

const emails = [
  { id: '1', to: 'dawit@example.com', subject: 'Welcome to LearnHub!', type: 'WELCOME', status: 'DELIVERED', sentAt: '2026-02-13 14:30', body: 'Hi Dawit, welcome to LearnHub! Start exploring courses today.' },
  { id: '2', to: 'abebe@example.com', subject: 'Your course "Advanced React Patterns" has been approved', type: 'APPROVAL', status: 'DELIVERED', sentAt: '2026-02-13 10:15', body: 'Congratulations! Your course has been approved and is now live.' },
  { id: '3', to: 'meron@example.com', subject: 'Course Rejection: Business Analytics with Excel', type: 'REJECTION', status: 'DELIVERED', sentAt: '2026-02-12 16:45', body: 'Your course submission needs revisions. Please review the feedback.' },
  { id: '4', to: 'hana@example.com', subject: 'Enrollment Confirmation: UI/UX Design', type: 'ENROLLMENT', status: 'DELIVERED', sentAt: '2026-02-12 09:20', body: 'You have been enrolled in UI/UX Design Masterclass.' },
  { id: '5', to: 'solomon@example.com', subject: 'Password Reset Request', type: 'SECURITY', status: 'DELIVERED', sentAt: '2026-02-11 22:10', body: 'Click the link below to reset your password.' },
  { id: '6', to: 'sara@example.com', subject: 'Payout Processed: ETB 12,500', type: 'PAYOUT', status: 'FAILED', sentAt: '2026-02-11 15:00', body: 'Your payout of ETB 12,500 has been processed.' },
  { id: '7', to: 'henok@example.com', subject: 'Account Suspended', type: 'SECURITY', status: 'DELIVERED', sentAt: '2026-02-10 11:30', body: 'Your account has been suspended due to policy violations.' },
];

const AdminEmailLogs = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedEmail, setSelectedEmail] = useState<typeof emails[0] | null>(null);

  const filtered = emails.filter(e => {
    const matchesSearch = e.to.toLowerCase().includes(search.toLowerCase()) || e.subject.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || e.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const delivered = emails.filter(e => e.status === 'DELIVERED').length;
  const failed = emails.filter(e => e.status === 'FAILED').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Email Logs</h1>
          <p className="text-muted-foreground mt-1">Monitor all outgoing platform emails</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold font-display">{emails.length}</p><p className="text-xs text-muted-foreground mt-1">Total Sent</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold font-display text-success">{delivered}</p><p className="text-xs text-muted-foreground mt-1">Delivered</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold font-display text-destructive">{failed}</p><p className="text-xs text-muted-foreground mt-1">Failed</p></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by email or subject..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="WELCOME">Welcome</SelectItem>
              <SelectItem value="APPROVAL">Approval</SelectItem>
              <SelectItem value="REJECTION">Rejection</SelectItem>
              <SelectItem value="ENROLLMENT">Enrollment</SelectItem>
              <SelectItem value="SECURITY">Security</SelectItem>
              <SelectItem value="PAYOUT">Payout</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {filtered.map(e => (
            <Card key={e.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedEmail(e)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{e.subject}</p>
                      <p className="text-xs text-muted-foreground">To: {e.to} · {e.sentAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">{e.type}</Badge>
                    <Badge variant={e.status === 'DELIVERED' ? 'default' : 'destructive'} className="text-xs">
                      {e.status === 'DELIVERED' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                      {e.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Email Details</DialogTitle></DialogHeader>
            {selectedEmail && (
              <div className="space-y-3 text-sm">
                <div><span className="text-muted-foreground">To:</span> <span className="font-medium ml-1">{selectedEmail.to}</span></div>
                <div><span className="text-muted-foreground">Subject:</span> <span className="font-medium ml-1">{selectedEmail.subject}</span></div>
                <div><span className="text-muted-foreground">Type:</span> <Badge variant="outline" className="ml-1 text-xs">{selectedEmail.type}</Badge></div>
                <div><span className="text-muted-foreground">Sent:</span> <span className="ml-1">{selectedEmail.sentAt}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={selectedEmail.status === 'DELIVERED' ? 'default' : 'destructive'} className="ml-1 text-xs">{selectedEmail.status}</Badge></div>
                <div className="border-t border-border pt-3">
                  <p className="text-muted-foreground text-xs mb-1">Body:</p>
                  <p className="bg-muted p-3 rounded-lg">{selectedEmail.body}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminEmailLogs;
