import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Search, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getEmailLogs, type EmailLog } from '@/lib/admin-api';
import { useQuery } from '@tanstack/react-query';

function formatSentAt(createdAt?: string): string {
  if (!createdAt) return '—';
  const d = new Date(createdAt);
  return d.toLocaleString();
}

const AdminEmailLogs = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

  const { data: emails = [], isLoading, isError } = useQuery({
    queryKey: ['email-logs'],
    queryFn: getEmailLogs,
  });

  const filtered = emails.filter((e) => {
    const to = e.email ?? e.recipient?.email ?? '';
    const matchesSearch =
      to.toLowerCase().includes(search.toLowerCase()) ||
      (e.subject ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || e.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const delivered = emails.filter((e) => (e.status ?? '').toUpperCase() === 'DELIVERED' || (e.status ?? '').toUpperCase() === 'SENT').length;
  const failed = emails.filter((e) => (e.status ?? '').toUpperCase() === 'FAILED').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Email Logs</h1>
          <p className="text-muted-foreground mt-1">Monitor all outgoing platform emails</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold font-display">{emails.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold font-display text-green-600">{delivered}</p>
              <p className="text-xs text-muted-foreground mt-1">Delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold font-display text-destructive">{failed}</p>
              <p className="text-xs text-muted-foreground mt-1">Failed</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
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

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading email logs...</span>
          </div>
        )}
        {isError && (
          <p className="text-sm text-destructive py-4">Failed to load email logs.</p>
        )}
        {!isLoading && !isError && (
          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">No email logs match your filters.</p>
            )}
            {filtered.map((e) => {
              const to = e.email ?? e.recipient?.email ?? '—';
              const status = (e.status ?? '').toUpperCase();
              const isDelivered = status === 'DELIVERED' || status === 'SENT';
              return (
                <Card
                  key={e.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedEmail(e)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{e.subject ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">
                            To: {to} · {formatSentAt(e.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {e.type ?? '—'}
                        </Badge>
                        <Badge variant={isDelivered ? 'default' : 'destructive'} className="text-xs">
                          {isDelivered ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {e.status ?? '—'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Email Details</DialogTitle>
            </DialogHeader>
            {selectedEmail && (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">To:</span>{' '}
                  <span className="font-medium ml-1">
                    {selectedEmail.email ?? selectedEmail.recipient?.email ?? '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Subject:</span>{' '}
                  <span className="font-medium ml-1">{selectedEmail.subject ?? '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{' '}
                  <Badge variant="outline" className="ml-1 text-xs">
                    {selectedEmail.type ?? '—'}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Sent:</span>{' '}
                  <span className="ml-1">{formatSentAt(selectedEmail.createdAt)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <Badge
                    variant={
                      (selectedEmail.status ?? '').toUpperCase() === 'DELIVERED' ||
                      (selectedEmail.status ?? '').toUpperCase() === 'SENT'
                        ? 'default'
                        : 'destructive'
                    }
                    className="ml-1 text-xs"
                  >
                    {selectedEmail.status ?? '—'}
                  </Badge>
                </div>
                {selectedEmail.errorMessage && (
                  <div className="border-t border-border pt-3">
                    <p className="text-muted-foreground text-xs mb-1">Error:</p>
                    <p className="bg-destructive/10 text-destructive p-3 rounded-lg text-xs">
                      {selectedEmail.errorMessage}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminEmailLogs;
