import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, ImageIcon, UploadCloud } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyPaymentProofs, getMyPayments, resubmitPaymentProof, type PaymentProofPayload } from '@/lib/course-api';
import { formatPrice } from '@/lib/formatters';
import { apiFetchBlob, getApiBaseUrl } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const StudentPaymentHistory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'payments' | 'receipts'>('payments');

  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['my-payments'],
    queryFn: getMyPayments,
  });

  const list = payments ?? [];

  const {
    data: proofs = [],
    isLoading: proofsLoading,
    error: proofsError,
  } = useQuery({
    queryKey: ['my-payment-proofs'],
    queryFn: getMyPaymentProofs,
  });

  const [previewProofId, setPreviewProofId] = useState<string | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [receiptPreviewMime, setReceiptPreviewMime] = useState<string | null>(null);
  const [receiptPreviewLoading, setReceiptPreviewLoading] = useState(false);
  const receiptUrlRef = useRef<string | null>(null);
  const previewProof = proofs.find((p) => p.id === previewProofId) ?? null;
  const toAbsoluteReceiptUrl = (url: string) => (
    /^https?:\/\//i.test(url) ? url : `${getApiBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`
  );

  useEffect(() => {
    if (!previewProofId) {
      if (receiptUrlRef.current) {
        URL.revokeObjectURL(receiptUrlRef.current);
        receiptUrlRef.current = null;
      }
      setReceiptPreviewUrl(null);
      setReceiptPreviewMime(null);
      return;
    }
    setReceiptPreviewLoading(true);
    setReceiptPreviewUrl(null);
    apiFetchBlob(`/api/payment-proofs/${previewProofId}/receipt`)
      .then((blob) => {
        if (receiptUrlRef.current) URL.revokeObjectURL(receiptUrlRef.current);
        const url = URL.createObjectURL(blob);
        receiptUrlRef.current = url;
        setReceiptPreviewUrl(url);
        setReceiptPreviewMime(blob.type || 'application/octet-stream');
      })
      .catch(() => {
        if (previewProof?.receiptUrl) {
          if (receiptUrlRef.current) {
            URL.revokeObjectURL(receiptUrlRef.current);
            receiptUrlRef.current = null;
          }
          const absolute = toAbsoluteReceiptUrl(previewProof.receiptUrl);
          setReceiptPreviewUrl(absolute);
          const lower = absolute.toLowerCase();
          setReceiptPreviewMime(lower.endsWith('.pdf') ? 'application/pdf' : 'image/*');
          return;
        }
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
  }, [previewProofId, previewProof, toast]);

  const [resubmitTarget, setResubmitTarget] = useState<PaymentProofPayload | null>(null);
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [resubmitFilePreviewUrl, setResubmitFilePreviewUrl] = useState<string | null>(null);
  const [resubmitFilePreviewMime, setResubmitFilePreviewMime] = useState<string | null>(null);
  const resubmitPreviewRef = useRef<string | null>(null);
  const [resubmitNote, setResubmitNote] = useState('');

  useEffect(() => {
    if (!resubmitFile) {
      if (resubmitPreviewRef.current) URL.revokeObjectURL(resubmitPreviewRef.current);
      resubmitPreviewRef.current = null;
      setResubmitFilePreviewUrl(null);
      setResubmitFilePreviewMime(null);
      return;
    }
    if (resubmitPreviewRef.current) URL.revokeObjectURL(resubmitPreviewRef.current);
    const url = URL.createObjectURL(resubmitFile);
    resubmitPreviewRef.current = url;
    setResubmitFilePreviewUrl(url);
    setResubmitFilePreviewMime(resubmitFile.type || null);
    return () => {
      if (resubmitPreviewRef.current) URL.revokeObjectURL(resubmitPreviewRef.current);
      resubmitPreviewRef.current = null;
    };
  }, [resubmitFile]);

  const resubmitMutation = useMutation({
    mutationFn: () => {
      if (!resubmitTarget?.id) throw new Error('Missing proof');
      if (!resubmitFile) throw new Error('Please choose a receipt file');
      return resubmitPaymentProof({ proofId: resubmitTarget.id, note: resubmitNote || undefined, file: resubmitFile });
    },
    onSuccess: () => {
      toast({ title: 'Receipt resubmitted', description: 'Your receipt is now pending review.' });
      setResubmitTarget(null);
      setResubmitFile(null);
      setResubmitNote('');
      queryClient.invalidateQueries({ queryKey: ['my-payment-proofs'] });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Resubmit failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Payment History</h1>
          <p className="text-muted-foreground mt-1">View your course purchase history</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'payments' | 'receipts')} className="space-y-4">
          <TabsList>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="receipts">Manual receipts</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {error && <p className="text-sm text-destructive">Failed to load payments.</p>}
            {!isLoading && !error && list.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No payments yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">When you purchase a course, it will appear here.</p>
                </CardContent>
              </Card>
            )}
            {!isLoading && !error && list.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Course</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Gateway</th>
                          <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((p) => (
                          <tr key={p.id} className="border-b border-border last:border-0">
                            <td className="p-4 text-muted-foreground">
                              {p.paidAt || p.createdAt
                                ? new Date(p.paidAt || p.createdAt!).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : '–'}
                            </td>
                            <td className="p-4 font-medium">{p.courseTitle || 'Course'}</td>
                            <td className="p-4 text-muted-foreground">{p.gateway || '–'}</td>
                            <td className="p-4 text-right font-medium">
                              {p.amount != null ? formatPrice(p.amount, p.currency || 'ETB') : '–'}
                            </td>
                            <td className="p-4">
                              <Badge variant={p.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                {p.status || '–'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="receipts" className="space-y-4">
            {proofsLoading && <p className="text-sm text-muted-foreground">Loading receipts...</p>}
            {proofsError && <p className="text-sm text-destructive">Failed to load receipts.</p>}
            {!proofsLoading && !proofsError && proofs.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-muted-foreground">No manual payment receipts yet.</p>
                </CardContent>
              </Card>
            )}

            {!proofsLoading && !proofsError && proofs.length > 0 && (
              <div className="space-y-3">
                {proofs.map((p) => {
                  const title =
                    p.courseTitle ||
                    (p.orderCourseTitles?.length ? `Cart: ${p.orderCourseTitles.join(', ')}` : 'Cart');
                  return (
                    <Card key={p.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate" title={title}>{title}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.createdAt ? new Date(p.createdAt).toLocaleString() : '–'}
                            </p>
                          </div>
                          <Badge
                            variant={
                              p.status === 'APPROVED'
                                ? 'default'
                                : p.status === 'REJECTED'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="w-fit"
                          >
                            {p.status || '–'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Amount</p>
                            <p className="font-medium">
                              {p.amount != null ? formatPrice(p.amount, p.currency || 'ETB') : '–'}
                            </p>
                          </div>
                          {p.status === 'REJECTED' && p.rejectionReason && (
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Rejection reason</p>
                              <p className="text-sm text-destructive break-words">{p.rejectionReason}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => setPreviewProofId(p.id)}>
                            <ImageIcon className="h-4 w-4" />
                            Preview
                          </Button>
                          {p.status === 'REJECTED' && (
                            <Button size="sm" variant="accent" onClick={() => setResubmitTarget(p)}>
                              <UploadCloud className="h-4 w-4" />
                              Resubmit
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={!!previewProofId} onOpenChange={(open) => !open && setPreviewProofId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Receipt preview</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/30 rounded-md p-4">
              {receiptPreviewLoading && <p className="text-sm text-muted-foreground">Loading receipt…</p>}
              {!receiptPreviewLoading && receiptPreviewUrl && (
                receiptPreviewMime?.includes('pdf') ? (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">PDF receipt preview is opened in a new tab.</p>
                    <Button variant="outline" onClick={() => window.open(receiptPreviewUrl, '_blank', 'noopener,noreferrer')}>
                      Open PDF receipt
                    </Button>
                  </div>
                ) : (
                  <img
                    src={receiptPreviewUrl}
                    alt="Payment receipt"
                    className="max-w-full max-h-[70vh] object-contain rounded border"
                  />
                )
              )}
              {!receiptPreviewLoading && !receiptPreviewUrl && previewProofId && (
                <p className="text-sm text-muted-foreground">Receipt could not be loaded.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!resubmitTarget} onOpenChange={(open) => !open && setResubmitTarget(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Resubmit receipt</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Upload a new receipt image and optionally add a note. This will set your receipt back to <span className="font-medium">PENDING</span>.
                </p>
                <Input type="file" accept="image/*,application/pdf" onChange={(e) => setResubmitFile(e.target.files?.[0] ?? null)} />
                {resubmitFile && (
                  <div className="rounded-md border p-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground truncate">{resubmitFile.name}</p>
                      <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => setResubmitFile(null)}>
                        Remove
                      </Button>
                    </div>
                    {resubmitFilePreviewUrl && (
                      resubmitFilePreviewMime?.includes('pdf') ? (
                        <iframe title="Selected receipt preview" src={resubmitFilePreviewUrl} className="w-full h-40 rounded border bg-background" />
                      ) : (
                        <img src={resubmitFilePreviewUrl} alt="Selected receipt preview" className="max-h-40 w-full object-contain rounded border" />
                      )
                    )}
                  </div>
                )}
                <Input value={resubmitNote} onChange={(e) => setResubmitNote(e.target.value)} placeholder="Optional note" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setResubmitTarget(null)} disabled={resubmitMutation.isPending}>
                  Cancel
                </Button>
                <Button variant="accent" onClick={() => resubmitMutation.mutate()} disabled={resubmitMutation.isPending}>
                  {resubmitMutation.isPending ? 'Submitting…' : 'Resubmit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default StudentPaymentHistory;
