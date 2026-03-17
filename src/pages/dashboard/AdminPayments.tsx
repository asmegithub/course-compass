import { useState, useMemo, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, RefreshCw, CheckCircle2, XCircle, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getPayments,
  getPendingPaymentProofs,
  approvePaymentProof,
  rejectPaymentProof,
  getPaymentProofReceiptBlob,
  type PaymentProof,
  type AdminPayment,
} from '@/lib/admin-api';

function formatStudentName(student: AdminPayment['student'] | PaymentProof['student']): string {
  if (!student) return '–';
  const first = (student as { firstName?: string }).firstName ?? '';
  const last = (student as { lastName?: string }).lastName ?? '';
  const name = [first, last].filter(Boolean).join(' ').trim();
  if (name) return name;
  return (student as { email?: string }).email ?? student.id ?? '–';
}

function formatProofFor(proof: PaymentProof): string {
  if (proof.order?.items?.length) {
    const titles = proof.order.items.map((i) => i.course?.title).filter(Boolean);
    return titles.length ? `Cart: ${titles.join(', ')}` : `Cart order ${proof.order.id ?? ''}`;
  }
  if (proof.course?.title) return proof.course.title;
  if (proof.course?.id) return `Course ${proof.course.id}`;
  if (proof.order?.id) return `Cart order ${proof.order.id}`;
  return '–';
}

const AdminPayments = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [previewProofId, setPreviewProofId] = useState<string | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [receiptPreviewLoading, setReceiptPreviewLoading] = useState(false);
  const receiptUrlRef = useRef<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!previewProofId) {
      if (receiptUrlRef.current) {
        URL.revokeObjectURL(receiptUrlRef.current);
        receiptUrlRef.current = null;
      }
      setReceiptPreviewUrl(null);
      return;
    }
    setReceiptPreviewLoading(true);
    setReceiptPreviewUrl(null);
    getPaymentProofReceiptBlob(previewProofId)
      .then((blob) => {
        if (receiptUrlRef.current) URL.revokeObjectURL(receiptUrlRef.current);
        const url = URL.createObjectURL(blob);
        receiptUrlRef.current = url;
        setReceiptPreviewUrl(url);
      })
      .catch(() => {
        toast({
          title: 'Could not load receipt',
          description: 'The receipt image could not be loaded.',
          variant: 'destructive',
        });
      })
      .finally(() => setReceiptPreviewLoading(false));
    return () => {
      if (receiptUrlRef.current) {
        URL.revokeObjectURL(receiptUrlRef.current);
        receiptUrlRef.current = null;
      }
    };
  }, [previewProofId, toast]);

  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: getPayments,
  });

  const {
    data: pendingProofs = [],
    isLoading: proofsLoading,
    error: proofsError,
  } = useQuery({
    queryKey: ['admin-payment-proofs', 'pending'],
    queryFn: getPendingPaymentProofs,
  });

  const approveMutation = useMutation({
    mutationFn: (proofId: string) => approvePaymentProof(proofId),
    onSuccess: (_data, proofId) => {
      toast({
        title: 'Receipt approved',
        description: 'Enrollments will be created for this payment.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-proofs', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Approval failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ proofId, reason }: { proofId: string; reason?: string }) => rejectPaymentProof(proofId, reason),
    onSuccess: () => {
      toast({
        title: 'Receipt rejected',
        description: 'The student will not be enrolled from this proof.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-proofs', 'pending'] });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Rejection failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleApprove = (proof: PaymentProof) => {
    if (!proof.id) return;
    approveMutation.mutate(proof.id);
  };

  const handleReject = (proof: PaymentProof) => {
    if (!proof.id) return;
    const reason = window.prompt('Optional: add a rejection reason shown to the student.');
    if (reason === null) return;
    rejectMutation.mutate({ proofId: proof.id, reason: reason || undefined });
  };

  const filtered = useMemo(() => {
    return payments.filter((t) => {
      const studentName = formatStudentName(t.student);
      const courseStr = t.course?.title || t.course?.id || (t.order ? 'Cart' : '') || '';
      const txnStr = t.transactionId || t.id || '';
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !searchLower ||
        studentName.toLowerCase().includes(searchLower) ||
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

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Pending manual payment receipts</p>
                <p className="text-xs text-muted-foreground">
                  Review uploaded bank / wallet receipts and approve to create enrollments.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {pendingProofs.length} pending
              </Badge>
            </div>

            {proofsLoading && <p className="text-xs text-muted-foreground">Loading pending receipts...</p>}
            {proofsError && (
              <p className="text-xs text-destructive">Failed to load pending receipts. Please try again.</p>
            )}

            {!proofsLoading && !proofsError && pendingProofs.length === 0 && (
              <p className="text-xs text-muted-foreground">No pending manual payment receipts.</p>
            )}

            {!proofsLoading && !proofsError && pendingProofs.length > 0 && (
              <div className="space-y-3">
                {pendingProofs.map((proof) => (
                  <div
                    key={proof.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">Student:</span>
                        <span className="text-muted-foreground">
                          {formatStudentName(proof.student)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">Amount:</span>
                        <span className="text-muted-foreground">
                          {proof.amount != null ? `${proof.currency ?? 'ETB'} ${proof.amount.toLocaleString()}` : '–'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">For:</span>
                        <span className="text-muted-foreground max-w-[200px] truncate" title={formatProofFor(proof)}>
                          {formatProofFor(proof)}
                        </span>
                      </div>
                      {proof.note && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">Note:</span>
                          <span className="text-muted-foreground">{proof.note}</span>
                        </div>
                      )}
                      {proof.createdAt && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">Submitted:</span>
                          <span className="text-muted-foreground">
                            {new Date(proof.createdAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewProofId(proof.id)}
                        disabled={!proof.id}
                      >
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Preview receipt
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-success"
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        onClick={() => handleApprove(proof)}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        onClick={() => handleReject(proof)}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                      <td className="p-4 font-medium text-muted-foreground max-w-[140px] truncate" title={formatStudentName(t.student)}>{formatStudentName(t.student)}</td>
                      <td className="p-4 text-muted-foreground text-xs max-w-[180px] truncate" title={t.course?.title || (t.order ? 'Cart' : '')}>{t.course?.title || (t.order ? 'Cart' : '–')}</td>
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

        <Dialog open={!!previewProofId} onOpenChange={(open) => !open && setPreviewProofId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Receipt preview</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/30 rounded-md p-4">
              {receiptPreviewLoading && (
                <p className="text-sm text-muted-foreground">Loading receipt…</p>
              )}
              {!receiptPreviewLoading && receiptPreviewUrl && (
                <img
                  src={receiptPreviewUrl}
                  alt="Payment receipt"
                  className="max-w-full max-h-[70vh] object-contain rounded border"
                />
              )}
              {!receiptPreviewLoading && !receiptPreviewUrl && previewProofId && (
                <p className="text-sm text-muted-foreground">Receipt could not be loaded.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminPayments;
