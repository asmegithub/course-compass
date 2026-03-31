import { useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Landmark, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  getMyInstructorEarning,
  getActivePayoutMethodOptions,
  getMyInstructorPayoutRequestsV2,
  requestInstructorPayoutV2,
  resubmitInstructorPayoutRequest,
  getInstructorPayoutReceiptBlob,
} from '@/lib/course-api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@/lib/formatters';

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

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

const InstructorPayouts = () => {
  const queryClient = useQueryClient();

  const [payoutAmount, setPayoutAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [details, setDetails] = useState<Record<string, string>>({});
  const [resubmitTargetId, setResubmitTargetId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  const earningQuery = useQuery({ queryKey: ['instructor-earning'], queryFn: getMyInstructorEarning });
  const methodsQuery = useQuery({ queryKey: ['payout-method-options', 'active'], queryFn: getActivePayoutMethodOptions });
  const payoutRequestsQuery = useQuery({ queryKey: ['instructor-payout-requests'], queryFn: getMyInstructorPayoutRequestsV2 });

  const requestPayoutMutation = useMutation({
    mutationFn: () => requestInstructorPayoutV2({
      amount: Number(payoutAmount),
      methodOptionId: selectedMethodId,
      payoutDetails: details,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-earning'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-payout-requests'] });
      toast({ title: 'Payout requested', description: 'Your request will be processed within 3-5 business days.' });
      setPayoutAmount('');
      setSelectedMethodId('');
      setDetails({});
      setResubmitTargetId(null);
    },
    onError: (err: Error) => {
      toast({ title: 'Request failed', description: err.message, variant: 'destructive' });
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: () => {
      if (!resubmitTargetId) throw new Error('Missing request');
      return resubmitInstructorPayoutRequest({
        requestId: resubmitTargetId,
        amount: Number(payoutAmount),
        methodOptionId: selectedMethodId,
        payoutDetails: details,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-earning'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-payout-requests'] });
      toast({ title: 'Request resubmitted', description: 'Your request is pending review again.' });
      setPayoutAmount('');
      setSelectedMethodId('');
      setDetails({});
      setResubmitTargetId(null);
    },
    onError: (err: Error) => {
      toast({ title: 'Resubmit failed', description: err.message, variant: 'destructive' });
    },
  });

  const earning = earningQuery.data ?? null;
  const methods = methodsQuery.data ?? [];
  const payoutHistory = payoutRequestsQuery.data ?? [];

  const availableBalance = earning?.currentBalance ?? 0;
  const totalWithdrawn = earning?.totalWithdrawn ?? 0;
  const pendingAmount = payoutHistory
    .filter((p) => (p.status ?? '').toUpperCase() === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleRequestPayout = () => {
    const amount = Number(payoutAmount);
    if (!payoutAmount || isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }
    if (amount > availableBalance) {
      toast({
        title: 'Insufficient balance',
        description: `Your available balance is ETB ${availableBalance.toLocaleString()}.`,
        variant: 'destructive',
      });
      return;
    }
    if (amount < 100) {
      toast({ title: 'Minimum withdrawal is ETB 100', variant: 'destructive' });
      return;
    }
    if (!selectedMethodId) {
      toast({ title: 'Select payout method', variant: 'destructive' });
      return;
    }

    const selected = methods.find((m) => m.id === selectedMethodId);
    const fields = parseFields(selected?.fieldsJson);
    for (const f of fields) {
      if (f.required && !details[f.key]) {
        toast({ title: `Missing ${f.label}`, variant: 'destructive' });
        return;
      }
    }

    if (resubmitTargetId) {
      resubmitMutation.mutate();
    } else {
      requestPayoutMutation.mutate();
    }
  };

  const selectedMethod = useMemo(() => methods.find((m) => m.id === selectedMethodId) ?? null, [methods, selectedMethodId]);
  const methodFields = useMemo(() => parseFields(selectedMethod?.fieldsJson), [selectedMethod?.fieldsJson]);

  useEffect(() => {
    if (!previewId) {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewUrl(null);
      return;
    }
    setPreviewLoading(true);
    getInstructorPayoutReceiptBlob(previewId)
      .then((blob) => {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const u = URL.createObjectURL(blob);
        previewUrlRef.current = u;
        setPreviewUrl(u);
      })
      .catch(() => {
        toast({ title: 'Could not load receipt', variant: 'destructive' });
      })
      .finally(() => setPreviewLoading(false));
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    };
  }, [previewId]);

  const isLoading = earningQuery.isLoading || methodsQuery.isLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Payouts</h1>
          <p className="text-muted-foreground text-sm mt-1">Request withdrawals and view payout history.</p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading...</span>
          </div>
        )}

        {!isLoading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-5 pb-4">
                  <DollarSign className="h-5 w-5 text-primary mb-2" />
                  <p className="text-2xl font-bold font-display">ETB {availableBalance.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Available Balance</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4">
                  <Clock className="h-5 w-5 text-yellow-600 mb-2" />
                  <p className="text-2xl font-bold font-display">ETB {pendingAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Pending Payouts</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4">
                  <CheckCircle className="h-5 w-5 text-green-600 mb-2" />
                  <p className="text-2xl font-bold font-display">ETB {totalWithdrawn.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Withdrawn</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Landmark className="h-4 w-4" /> Request Payout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Payout method</Label>
                    <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {methods.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedMethod && methodFields.length > 0 && (
                    <div className="space-y-3">
                      {methodFields.map((f) => (
                        <div key={f.key} className="space-y-2">
                          <Label>
                            {f.label}{f.required ? ' *' : ''}
                          </Label>
                          <Input
                            type={f.type === 'number' ? 'number' : 'text'}
                            value={details[f.key] ?? ''}
                            placeholder={f.placeholder}
                            onChange={(e) => setDetails((prev) => ({ ...prev, [f.key]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Amount (ETB)</Label>
                    <Input
                      type="number"
                      min={100}
                      placeholder="Min. 100 ETB"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground flex gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Payouts are processed within 3-5 business days. Minimum withdrawal is ETB 100.</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleRequestPayout}
                    disabled={requestPayoutMutation.isPending || resubmitMutation.isPending || !selectedMethodId}
                  >
                    {(requestPayoutMutation.isPending || resubmitMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : (resubmitTargetId ? 'Resubmit Request' : 'Request Payout')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Payout History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {payoutRequestsQuery.isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                    </div>
                  )}
                  {!payoutRequestsQuery.isLoading && payoutHistory.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4">No payout requests yet.</p>
                  )}
                  {!payoutRequestsQuery.isLoading &&
                    payoutHistory.map((p) => (
                      <div key={p.id} className="flex items-start justify-between gap-3 p-4 rounded-lg border bg-muted/30">
                        <div>
                          <p className="font-semibold text-sm">ETB {p.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {p.methodOption?.name ?? 'Method'} · {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                          </p>
                          {p.status === 'REJECTED' && p.rejectionReason && (
                            <p className="text-xs text-destructive mt-2">
                              Rejected: {p.rejectionReason}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={p.status === 'COMPLETED' ? 'default' : p.status === 'REJECTED' ? 'destructive' : 'secondary'} className="text-xs">
                            {p.status === 'COMPLETED' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                            {p.status}
                          </Badge>
                        {p.status === 'COMPLETED' && p.hasReceipt && (
                          <Button size="sm" variant="outline" onClick={() => setPreviewId(p.id)}>
                            View receipt
                          </Button>
                        )}
                          {p.status === 'REJECTED' && (
                            <Button
                              size="sm"
                              variant="accent"
                              onClick={() => {
                                setResubmitTargetId(p.id);
                                setPayoutAmount(String(p.amount));
                                setSelectedMethodId(p.methodOption?.id ?? '');
                                try {
                                  setDetails(p.payoutDetailsJson ? JSON.parse(p.payoutDetailsJson) : {});
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
            </div>
          </>
        )}
        <Dialog open={!!previewId} onOpenChange={(open) => !open && setPreviewId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader><DialogTitle>Payout receipt</DialogTitle></DialogHeader>
            <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/30 rounded-md p-4">
              {previewLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {!previewLoading && previewUrl && (
                <img src={previewUrl} alt="Receipt" className="max-w-full max-h-[70vh] object-contain rounded border" />
              )}
              {!previewLoading && !previewUrl && previewId && (
                <p className="text-sm text-muted-foreground">Could not load receipt.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default InstructorPayouts;
