import { useEffect, useRef, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageIcon, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  approvePaymentProof,
  getPaymentProofReceiptBlob,
  getPendingPaymentProofs,
  rejectPaymentProof,
  type PaymentProof,
} from '@/lib/admin-api';

const formatStudent = (proof: PaymentProof) => {
  const first = proof.student?.firstName ?? '';
  const last = proof.student?.lastName ?? '';
  const full = [first, last].filter(Boolean).join(' ').trim();
  return full || proof.student?.email || proof.student?.id || '–';
};

const formatTarget = (proof: PaymentProof) => {
  if (proof.course?.title) return proof.course.title;
  if (proof.order?.items?.length) {
    const titles = proof.order.items.map((i) => i.course?.title).filter(Boolean);
    return titles.length ? `Cart: ${titles.join(', ')}` : 'Cart order';
  }
  return proof.order?.id ? `Cart order ${proof.order.id}` : '–';
};

const AdminManualPayments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [previewProofId, setPreviewProofId] = useState<string | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [receiptPreviewLoading, setReceiptPreviewLoading] = useState(false);
  const receiptUrlRef = useRef<string | null>(null);

  const [rejectTarget, setRejectTarget] = useState<PaymentProof | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: pendingProofs = [], isLoading, error } = useQuery({
    queryKey: ['admin-payment-proofs', 'pending'],
    queryFn: getPendingPaymentProofs,
  });

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

  const approveMutation = useMutation({
    mutationFn: (proofId: string) => approvePaymentProof(proofId),
    onSuccess: () => {
      toast({
        title: 'Receipt approved',
        description: 'Enrollment is created after manual payment approval.',
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
        description: 'Student can upload a new receipt and resubmit.',
      });
      setRejectTarget(null);
      setRejectReason('');
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Manual Payment Approvals</h1>
          <p className="text-muted-foreground mt-1">
            Review uploaded receipts and approve or reject student manual payments.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2 text-base">
              Pending Receipts
              <Badge variant="outline">{pendingProofs.length} pending</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Loading pending receipts...</p>}
            {error && <p className="text-sm text-destructive">Failed to load pending receipts.</p>}
            {!isLoading && !error && pendingProofs.length === 0 && (
              <p className="text-sm text-muted-foreground">No pending manual payment receipts.</p>
            )}

            {!isLoading &&
              !error &&
              pendingProofs.map((proof) => (
                <div
                  key={proof.id}
                  className="rounded-md border p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
                >
                  <div className="space-y-1 text-sm min-w-0">
                    <p><span className="font-medium">Student:</span> <span className="text-muted-foreground">{formatStudent(proof)}</span></p>
                    <p><span className="font-medium">For:</span> <span className="text-muted-foreground">{formatTarget(proof)}</span></p>
                    <p>
                      <span className="font-medium">Amount:</span>{' '}
                      <span className="text-muted-foreground">
                        {proof.amount != null ? `${proof.currency ?? 'ETB'} ${proof.amount.toLocaleString()}` : '–'}
                      </span>
                    </p>
                    {proof.note && (
                      <p><span className="font-medium">Note:</span> <span className="text-muted-foreground">{proof.note}</span></p>
                    )}
                    {proof.createdAt && (
                      <p><span className="font-medium">Submitted:</span> <span className="text-muted-foreground">{new Date(proof.createdAt).toLocaleString()}</span></p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Button variant="outline" size="sm" onClick={() => setPreviewProofId(proof.id)} disabled={!proof.id}>
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() => proof.id && approveMutation.mutate(proof.id)}
                    >
                      {approveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() => setRejectTarget(proof)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        <Dialog open={!!previewProofId} onOpenChange={(open) => !open && setPreviewProofId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Receipt preview</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/30 rounded-md p-4">
              {receiptPreviewLoading && <p className="text-sm text-muted-foreground">Loading receipt…</p>}
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

        <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Reject receipt</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Add a rejection reason so the student knows what to fix before resubmitting.
              </p>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason (optional)"
              />
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setRejectTarget(null)} disabled={rejectMutation.isPending}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={rejectMutation.isPending || !rejectTarget?.id}
                  onClick={() => rejectTarget?.id && rejectMutation.mutate({ proofId: rejectTarget.id, reason: rejectReason || undefined })}
                >
                  {rejectMutation.isPending ? 'Rejecting…' : 'Reject receipt'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminManualPayments;
