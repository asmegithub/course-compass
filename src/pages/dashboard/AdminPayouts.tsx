import { useMemo, useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetchBlob } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, ImageIcon, RefreshCw } from 'lucide-react';
import { getPendingInstructorPayoutRequests, approveInstructorPayoutRequest, rejectInstructorPayoutRequest, type AdminPayoutRequest } from '@/lib/admin-api';

const AdminPayouts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const pendingQuery = useQuery({
    queryKey: ['admin-instructor-payout-requests', 'pending'],
    queryFn: getPendingInstructorPayoutRequests,
  });

  const approveMutation = useMutation({
    mutationFn: (payload: { requestId: string; file: File }) => approveInstructorPayoutRequest(payload),
    onSuccess: () => {
      toast({ title: 'Payout approved', description: 'Receipt saved and instructor balance updated.' });
      queryClient.invalidateQueries({ queryKey: ['admin-instructor-payout-requests', 'pending'] });
    },
    onError: (err: unknown) => {
      toast({ title: 'Approval failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { requestId: string; reason?: string }) => rejectInstructorPayoutRequest(payload),
    onSuccess: () => {
      toast({ title: 'Payout rejected' });
      queryClient.invalidateQueries({ queryKey: ['admin-instructor-payout-requests', 'pending'] });
    },
    onError: (err: unknown) => {
      toast({ title: 'Rejection failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
    },
  });

  const list = pendingQuery.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const instructor = r.instructorName ?? r.instructorEmail ?? r.instructorProfileId ?? '';
      const method = r.methodName ?? r.methodType ?? '';
      return instructor.toLowerCase().includes(q) || method.toLowerCase().includes(q) || (r.id ?? '').toLowerCase().includes(q);
    });
  }, [list, search]);

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!previewId) {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
      setPreviewUrl(null);
      return;
    }
    setPreviewLoading(true);
    apiFetchBlob(`/api/instructor-payouts/${previewId}/receipt`)
      .then((blob) => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        const u = URL.createObjectURL(blob);
        urlRef.current = u;
        setPreviewUrl(u);
      })
      .catch(() => {
        toast({ title: 'Could not load receipt', variant: 'destructive' });
      })
      .finally(() => setPreviewLoading(false));
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    };
  }, [previewId, toast]);

  const [approveTarget, setApproveTarget] = useState<AdminPayoutRequest | null>(null);
  const [approveFile, setApproveFile] = useState<File | null>(null);

  const handleApprove = () => {
    if (!approveTarget?.id) return;
    if (!approveFile) {
      toast({ title: 'Receipt required', description: 'Upload the transfer receipt before approving.', variant: 'destructive' });
      return;
    }
    approveMutation.mutate({ requestId: approveTarget.id, file: approveFile });
    setApproveTarget(null);
    setApproveFile(null);
  };

  const handleReject = (r: AdminPayoutRequest) => {
    const reason = window.prompt('Rejection reason (visible to instructor):');
    if (reason === null) return;
    rejectMutation.mutate({ requestId: r.id, reason: reason || undefined });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Instructor Payouts</h1>
            <p className="text-muted-foreground mt-1">Approve or reject instructor withdrawal requests.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => pendingQuery.refetch()} disabled={pendingQuery.isFetching}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Input placeholder="Search instructor, method, request id..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Badge variant="outline" className="w-fit self-start sm:self-center">
            {filtered.length} pending
          </Badge>
        </div>

        {pendingQuery.isLoading && <p className="text-sm text-muted-foreground">Loading pending payout requests...</p>}
        {pendingQuery.isError && <p className="text-sm text-destructive">Failed to load payout requests.</p>}

        {!pendingQuery.isLoading && !pendingQuery.isError && filtered.length === 0 && (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No pending payout requests.</CardContent></Card>
        )}

        {!pendingQuery.isLoading && !pendingQuery.isError && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {r.instructorName ?? r.instructorEmail ?? r.instructorProfileId ?? 'Instructor'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.methodName ?? r.methodType ?? 'Method'} · ETB {r.amount.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="w-fit">PENDING</Badge>
                  </div>

                  {r.payoutDetailsJson && (
                    <pre className="text-xs bg-muted/30 border rounded-md p-3 overflow-auto max-h-40">
                      {r.payoutDetailsJson}
                    </pre>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {r.hasReceipt && (
                      <Button variant="outline" size="sm" onClick={() => setPreviewId(r.id)}>
                        <ImageIcon className="h-4 w-4 mr-2" /> View receipt
                      </Button>
                    )}
                    <Button variant="accent" size="sm" onClick={() => setApproveTarget(r)}>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleReject(r)}>
                      <XCircle className="h-4 w-4 mr-2" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!previewId} onOpenChange={(open) => !open && setPreviewId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader><DialogTitle>Receipt preview</DialogTitle></DialogHeader>
            <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/30 rounded-md p-4">
              {previewLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {!previewLoading && previewUrl && <img src={previewUrl} alt="Receipt" className="max-w-full max-h-[70vh] object-contain rounded border" />}
              {!previewLoading && !previewUrl && previewId && <p className="text-sm text-muted-foreground">Could not load receipt.</p>}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Approve payout</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Upload the transfer receipt to complete this payout.
              </p>
              <Input type="file" accept="image/*,application/pdf" onChange={(e) => setApproveFile(e.target.files?.[0] ?? null)} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setApproveTarget(null)} disabled={approveMutation.isPending}>Cancel</Button>
                <Button variant="accent" onClick={handleApprove} disabled={approveMutation.isPending}>
                  {approveMutation.isPending ? 'Approving…' : 'Approve'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminPayouts;

