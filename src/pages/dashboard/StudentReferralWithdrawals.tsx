import { useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  getActivePayoutMethodOptions,
  getMyWithdrawals,
  getReferralBalance,
  getReferralWithdrawalReceiptBlob,
  reportReferralWithdrawalIssue,
  requestWithdrawal,
  resubmitReferralWithdrawal,
} from '@/lib/course-api';
import { getApiBaseUrl } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, Loader2, AlertCircle, CheckCircle, Clock, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type MethodField = { key: string; label: string; required?: boolean; placeholder?: string; type?: 'text' | 'number' };

const parseFields = (fieldsJson?: string): MethodField[] => {
  if (!fieldsJson) return [];
  try {
    const parsed = JSON.parse(fieldsJson);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((f) => ({
        key: String(f.key ?? ''),
        label: String(f.label ?? ''),
        required: Boolean(f.required),
        placeholder: f.placeholder ? String(f.placeholder) : undefined,
        type: f.type === 'number' ? 'number' : 'text',
      }))
      .filter((f) => f.key && f.label);
  } catch {
    return [];
  }
};

const toDetailEntries = (raw?: string): Array<{ key: string; value: string }> => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.entries(parsed)
      .map(([key, value]) => ({
        key: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value),
      }))
      .filter((e) => e.value && e.value !== 'null');
  } catch {
    return [{ key: 'Details', value: raw }];
  }
};

const StudentReferralWithdrawals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [details, setDetails] = useState<Record<string, string>>({});
  const [resubmitTargetId, setResubmitTargetId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [issueTargetId, setIssueTargetId] = useState<string | null>(null);
  const [issueMessage, setIssueMessage] = useState('');
  const urlRef = useRef<string | null>(null);

  const balanceQuery = useQuery({ queryKey: ['referral-balance'], queryFn: getReferralBalance });
  const methodsQuery = useQuery({ queryKey: ['payout-method-options', 'active'], queryFn: getActivePayoutMethodOptions });
  const withdrawalsQuery = useQuery({ queryKey: ['referral-withdrawals'], queryFn: getMyWithdrawals });

  const list = withdrawalsQuery.data ?? [];
  const previewTarget = list.find((w) => w.id === previewId) ?? null;
  const toAbsoluteReceiptUrl = (url: string) => (
    /^https?:\/\//i.test(url) ? url : `${getApiBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`
  );

  useEffect(() => {
    if (!previewId) {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
      setPreviewUrl(null);
      setPreviewMime(null);
      setPreviewError(null);
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    getReferralWithdrawalReceiptBlob(previewId)
      .then((blob) => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        const u = URL.createObjectURL(blob);
        urlRef.current = u;
        setPreviewUrl(u);
        setPreviewMime(blob.type || 'application/octet-stream');
      })
      .catch(() => {
        if (previewTarget?.receiptUrl) {
          if (urlRef.current) URL.revokeObjectURL(urlRef.current);
          urlRef.current = null;
          const absolute = toAbsoluteReceiptUrl(previewTarget.receiptUrl);
          setPreviewUrl(absolute);
          const lower = absolute.toLowerCase();
          setPreviewMime(lower.endsWith('.pdf') ? 'application/pdf' : 'image/*');
          return;
        }
        setPreviewError('Receipt is not available yet. Admin may have approved without uploading a receipt.');
        toast({ title: 'Could not load receipt', variant: 'destructive' });
      })
      .finally(() => setPreviewLoading(false));
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    };
  }, [previewId, previewTarget, toast]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const num = Number(amount);
      if (!amount || Number.isNaN(num) || num < 100) throw new Error('Minimum withdrawal is ETB 100');
      if (!selectedMethodId) throw new Error('Select a payout method');
      const selected = methods.find((m) => m.id === selectedMethodId);
      const fields = parseFields(selected?.fieldsJson);
      for (const f of fields) {
        if (f.required && !details[f.key]) throw new Error(`Missing ${f.label}`);
      }
      if (resubmitTargetId) {
        return resubmitReferralWithdrawal({
          requestId: resubmitTargetId,
          amount: num,
          methodOptionId: selectedMethodId,
          payoutDetails: details,
        });
      }
      return requestWithdrawal({
        amount: num,
        methodOptionId: selectedMethodId,
        payoutDetails: details,
      });
    },
    onSuccess: () => {
      toast({ title: resubmitTargetId ? 'Request resubmitted' : 'Withdrawal requested', description: 'An admin will process your payment and attach a receipt when complete.' });
      queryClient.invalidateQueries({ queryKey: ['referral-balance'] });
      queryClient.invalidateQueries({ queryKey: ['referral-withdrawals'] });
      setAmount('');
      setSelectedMethodId('');
      setDetails({});
      setResubmitTargetId(null);
    },
    onError: (err: unknown) => {
      toast({ title: 'Request failed', description: err instanceof Error ? err.message : 'Try again', variant: 'destructive' });
    },
  });

  const reportIssueMutation = useMutation({
    mutationFn: () => {
      if (!issueTargetId) throw new Error('Missing request');
      return reportReferralWithdrawalIssue({
        requestId: issueTargetId,
        message: issueMessage || 'Receipt is invalid or not accessible.',
      });
    },
    onSuccess: () => {
      toast({ title: 'Issue reported', description: 'Admin has been notified to update receipt and re-approve.' });
      setIssueTargetId(null);
      setIssueMessage('');
      queryClient.invalidateQueries({ queryKey: ['referral-withdrawals'] });
    },
    onError: (err: unknown) => {
      toast({ title: 'Failed to report issue', description: err instanceof Error ? err.message : 'Try again', variant: 'destructive' });
    },
  });

  const balance = balanceQuery.data?.balance ?? 0;
  const methods = methodsQuery.data ?? [];
  const pendingSum = list.filter((w) => (w.status ?? '').toUpperCase() === 'PENDING').reduce((s, w) => s + w.amount, 0);
  const available = balance - pendingSum;

  const selectedMethod = useMemo(() => methods.find((m) => m.id === selectedMethodId) ?? null, [methods, selectedMethodId]);
  const methodFields = useMemo(() => parseFields(selectedMethod?.fieldsJson), [selectedMethod?.fieldsJson]);

  const isLoading = balanceQuery.isLoading || methodsQuery.isLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Referral withdrawals</h1>
          <p className="text-sm text-muted-foreground mt-1">Request cash-out from your referral balance. Uses the same payout methods as instructor withdrawals.</p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading…
          </div>
        )}

        {!isLoading && (
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Banknote className="h-4 w-4" /> Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Available (after pending):</span> <span className="font-semibold">ETB {Math.max(0, available).toFixed(2)}</span></p>
                <p><span className="text-muted-foreground">Pending requests:</span> ETB {pendingSum.toFixed(2)}</p>
                <div className="p-3 rounded-md bg-muted/50 text-xs text-muted-foreground flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Balance is only reduced after an admin approves your request and attaches a transfer receipt.
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">{resubmitTargetId ? 'Resubmit withdrawal' : 'New withdrawal request'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Payout method</Label>
                  <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
                    <SelectTrigger><SelectValue placeholder="Telebirr, bank…" /></SelectTrigger>
                    <SelectContent>
                      {methods.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedMethod && methodFields.length > 0 && (
                  <div className="space-y-3">
                    {methodFields.map((f) => (
                      <div key={f.key} className="space-y-2">
                        <Label>{f.label}{f.required ? ' *' : ''}</Label>
                        <Input
                          type={f.type === 'number' ? 'number' : 'text'}
                          value={details[f.key] ?? ''}
                          placeholder={f.placeholder}
                          onChange={(e) => setDetails((p) => ({ ...p, [f.key]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Amount (ETB)</Label>
                  <Input type="number" min={100} placeholder="Min. 100" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => submitMutation.mutate()}
                    disabled={submitMutation.isPending || !selectedMethodId || available < 100}
                  >
                    {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (resubmitTargetId ? 'Resubmit' : 'Submit request')}
                  </Button>
                  {resubmitTargetId && (
                    <Button variant="outline" onClick={() => { setResubmitTargetId(null); setAmount(''); setDetails({}); }}>
                      Cancel resubmit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {withdrawalsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!withdrawalsQuery.isLoading && list.length === 0 && (
              <p className="text-sm text-muted-foreground">No withdrawal requests yet.</p>
            )}
            {list.map((w) => (
              <div key={w.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 rounded-lg border">
                <div>
                  <p className="font-semibold text-sm">ETB {w.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {w.methodOption?.name ?? 'Method'} · {w.createdAt ? new Date(w.createdAt).toLocaleString() : '—'}
                  </p>
                  {toDetailEntries(w.payoutDetailsJson).length > 0 && (
                    <div className="mt-2 rounded-md border bg-muted/20 p-2 space-y-1">
                      {toDetailEntries(w.payoutDetailsJson).map((entry) => (
                        <div key={entry.key} className="flex justify-between gap-3 text-[11px]">
                          <span className="text-muted-foreground">{entry.key}</span>
                          <span className="font-medium text-right break-all">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {w.status === 'REJECTED' && w.rejectionReason && (
                    <p className="text-xs text-destructive mt-2">Rejected: {w.rejectionReason}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={w.status === 'COMPLETED' ? 'default' : w.status === 'REJECTED' || w.status === 'RECEIPT_ISSUE' ? 'destructive' : 'secondary'}>
                    {w.status === 'COMPLETED' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                    {w.status}
                  </Badge>
                  {w.status === 'COMPLETED' && w.hasReceipt && (
                    <Button size="sm" variant="outline" onClick={() => setPreviewId(w.id)}>
                      <ImageIcon className="h-4 w-4 mr-1" /> Receipt
                    </Button>
                  )}
                  {w.status === 'COMPLETED' && !w.hasReceipt && (
                    <span className="text-[11px] text-muted-foreground">No receipt uploaded by admin yet</span>
                  )}
                  {w.status === 'COMPLETED' && (
                    <Button size="sm" variant="destructive" onClick={() => setIssueTargetId(w.id)}>
                      Report receipt issue
                    </Button>
                  )}
                  {w.status === 'RECEIPT_ISSUE' && (
                    <span className="text-[11px] text-muted-foreground">Issue reported. Waiting admin correction.</span>
                  )}
                  {w.status === 'REJECTED' && (
                    <Button
                      size="sm"
                      variant="accent"
                      onClick={() => {
                        setResubmitTargetId(w.id);
                        setAmount(String(w.amount));
                        setSelectedMethodId(w.methodOption?.id ?? '');
                        try {
                          setDetails(w.payoutDetailsJson ? JSON.parse(w.payoutDetailsJson) : {});
                        } catch {
                          setDetails({});
                        }
                      }}
                    >
                      Resubmit
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Dialog open={!!previewId} onOpenChange={(open) => !open && setPreviewId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader><DialogTitle>Transfer receipt</DialogTitle></DialogHeader>
            <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/30 rounded-md p-4">
              {previewLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {!previewLoading && previewUrl && (
                previewMime?.includes('pdf') ? (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">PDF receipt preview is opened in a new tab.</p>
                    <Button variant="outline" onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}>
                      Open PDF receipt
                    </Button>
                  </div>
                ) : (
                  <img src={previewUrl} alt="Receipt" className="max-w-full max-h-[70vh] object-contain rounded border" />
                )
              )}
              {!previewLoading && !previewUrl && previewError && (
                <p className="text-sm text-muted-foreground">{previewError}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!issueTargetId} onOpenChange={(open) => !open && setIssueTargetId(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Report receipt issue</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Describe why this receipt is invalid or unavailable.
              </p>
              <Input
                value={issueMessage}
                onChange={(e) => setIssueMessage(e.target.value)}
                placeholder="Example: receipt does not match amount / file cannot be opened"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIssueTargetId(null)} disabled={reportIssueMutation.isPending}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => reportIssueMutation.mutate()} disabled={reportIssueMutation.isPending}>
                  {reportIssueMutation.isPending ? 'Submitting…' : 'Send report'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default StudentReferralWithdrawals;
