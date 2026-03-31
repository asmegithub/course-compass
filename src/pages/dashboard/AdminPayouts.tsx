import { useMemo, useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetchBlob } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, ImageIcon, RefreshCw, GraduationCap, Banknote } from 'lucide-react';
import {
  getPendingInstructorPayoutRequests,
  approveInstructorPayoutRequest,
  rejectInstructorPayoutRequest,
  getPendingReferralWithdrawals,
  approveReferralWithdrawal,
  rejectReferralWithdrawal,
  type AdminPayoutRequest,
  type AdminReferralWithdrawalRequest,
} from '@/lib/admin-api';

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

const AdminPayouts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'instructors' | 'students'>('instructors');
  const [search, setSearch] = useState('');

  const pendingInstructorQuery = useQuery({
    queryKey: ['admin-instructor-payout-requests', 'pending'],
    queryFn: getPendingInstructorPayoutRequests,
  });

  const pendingStudentQuery = useQuery({
    queryKey: ['admin-referral-withdrawals', 'pending'],
    queryFn: getPendingReferralWithdrawals,
  });

  const approveInstructorMutation = useMutation({
    mutationFn: (payload: { requestId: string; file: File }) => approveInstructorPayoutRequest(payload),
    onSuccess: () => {
      toast({ title: 'Payout approved', description: 'Receipt saved and instructor balance updated.' });
      queryClient.invalidateQueries({ queryKey: ['admin-instructor-payout-requests', 'pending'] });
    },
    onError: (err: unknown) => {
      toast({ title: 'Approval failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
    },
  });

  const rejectInstructorMutation = useMutation({
    mutationFn: (payload: { requestId: string; reason?: string }) => rejectInstructorPayoutRequest(payload),
    onSuccess: () => {
      toast({ title: 'Payout rejected' });
      queryClient.invalidateQueries({ queryKey: ['admin-instructor-payout-requests', 'pending'] });
    },
    onError: (err: unknown) => {
      toast({ title: 'Rejection failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
    },
  });

  const approveStudentMutation = useMutation({
    mutationFn: (payload: { requestId: string; file: File }) => approveReferralWithdrawal(payload),
    onSuccess: () => {
      toast({ title: 'Withdrawal approved', description: 'Receipt saved and student referral balance updated.' });
      queryClient.invalidateQueries({ queryKey: ['admin-referral-withdrawals', 'pending'] });
    },
    onError: (err: unknown) => {
      toast({ title: 'Approval failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
    },
  });

  const rejectStudentMutation = useMutation({
    mutationFn: (payload: { requestId: string; reason?: string }) => rejectReferralWithdrawal(payload),
    onSuccess: () => {
      toast({ title: 'Withdrawal rejected' });
      queryClient.invalidateQueries({ queryKey: ['admin-referral-withdrawals', 'pending'] });
    },
    onError: (err: unknown) => {
      toast({ title: 'Rejection failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
    },
  });

  const instructorList = pendingInstructorQuery.data ?? [];
  const studentList = pendingStudentQuery.data ?? [];

  const filteredInstructors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return instructorList;
    return instructorList.filter((r) => {
      const instructor = r.instructorName ?? r.instructorEmail ?? r.instructorProfileId ?? '';
      const method = r.methodName ?? r.methodType ?? '';
      return instructor.toLowerCase().includes(q) || method.toLowerCase().includes(q) || (r.id ?? '').toLowerCase().includes(q);
    });
  }, [instructorList, search]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return studentList;
    return studentList.filter((r) => {
      const s = r.student?.email ?? `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`;
      const method = r.methodOption?.name ?? r.methodOption?.type ?? '';
      return s.toLowerCase().includes(q) || method.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    });
  }, [studentList, search]);

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'instructor' | 'student'>('instructor');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
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
    const endpoint =
      previewType === 'student'
        ? `/api/referral-balance/withdrawals/${previewId}/receipt`
        : `/api/instructor-payouts/${previewId}/receipt`;
    apiFetchBlob(endpoint)
      .then((blob) => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        const u = URL.createObjectURL(blob);
        urlRef.current = u;
        setPreviewUrl(u);
        setPreviewMime(blob.type || null);
      })
      .catch(() => {
        toast({ title: 'Could not load receipt', variant: 'destructive' });
      })
      .finally(() => setPreviewLoading(false));
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    };
  }, [previewId, previewType, toast]);

  const [approveInstructorTarget, setApproveInstructorTarget] = useState<AdminPayoutRequest | null>(null);
  const [approveInstructorFile, setApproveInstructorFile] = useState<File | null>(null);
  const [approveInstructorPreviewUrl, setApproveInstructorPreviewUrl] = useState<string | null>(null);
  const [approveInstructorPreviewMime, setApproveInstructorPreviewMime] = useState<string | null>(null);
  const approveInstructorPreviewRef = useRef<string | null>(null);
  const [rejectInstructorTarget, setRejectInstructorTarget] = useState<AdminPayoutRequest | null>(null);
  const [rejectInstructorReason, setRejectInstructorReason] = useState('');

  const [approveStudentTarget, setApproveStudentTarget] = useState<AdminReferralWithdrawalRequest | null>(null);
  const [approveStudentFile, setApproveStudentFile] = useState<File | null>(null);
  const [approveStudentPreviewUrl, setApproveStudentPreviewUrl] = useState<string | null>(null);
  const [approveStudentPreviewMime, setApproveStudentPreviewMime] = useState<string | null>(null);
  const approveStudentPreviewRef = useRef<string | null>(null);
  const [rejectStudentTarget, setRejectStudentTarget] = useState<AdminReferralWithdrawalRequest | null>(null);
  const [rejectStudentReason, setRejectStudentReason] = useState('');

  useEffect(() => {
    if (!approveInstructorFile) {
      if (approveInstructorPreviewRef.current) URL.revokeObjectURL(approveInstructorPreviewRef.current);
      approveInstructorPreviewRef.current = null;
      setApproveInstructorPreviewUrl(null);
      setApproveInstructorPreviewMime(null);
      return;
    }
    if (approveInstructorPreviewRef.current) URL.revokeObjectURL(approveInstructorPreviewRef.current);
    const url = URL.createObjectURL(approveInstructorFile);
    approveInstructorPreviewRef.current = url;
    setApproveInstructorPreviewUrl(url);
    setApproveInstructorPreviewMime(approveInstructorFile.type || null);
    return () => {
      if (approveInstructorPreviewRef.current) URL.revokeObjectURL(approveInstructorPreviewRef.current);
      approveInstructorPreviewRef.current = null;
    };
  }, [approveInstructorFile]);

  useEffect(() => {
    if (!approveStudentFile) {
      if (approveStudentPreviewRef.current) URL.revokeObjectURL(approveStudentPreviewRef.current);
      approveStudentPreviewRef.current = null;
      setApproveStudentPreviewUrl(null);
      setApproveStudentPreviewMime(null);
      return;
    }
    if (approveStudentPreviewRef.current) URL.revokeObjectURL(approveStudentPreviewRef.current);
    const url = URL.createObjectURL(approveStudentFile);
    approveStudentPreviewRef.current = url;
    setApproveStudentPreviewUrl(url);
    setApproveStudentPreviewMime(approveStudentFile.type || null);
    return () => {
      if (approveStudentPreviewRef.current) URL.revokeObjectURL(approveStudentPreviewRef.current);
      approveStudentPreviewRef.current = null;
    };
  }, [approveStudentFile]);

  const handleApproveInstructor = () => {
    if (!approveInstructorTarget?.id) return;
    if (!approveInstructorFile) {
      toast({ title: 'Receipt required', description: 'Upload the transfer receipt before approving.', variant: 'destructive' });
      return;
    }
    approveInstructorMutation.mutate({ requestId: approveInstructorTarget.id, file: approveInstructorFile });
    setApproveInstructorTarget(null);
    setApproveInstructorFile(null);
  };

  const handleApproveStudent = () => {
    if (!approveStudentTarget?.id) return;
    if (!approveStudentFile && !approveStudentTarget.receiptUrl) {
      toast({ title: 'Receipt required', variant: 'destructive' });
      return;
    }
    approveStudentMutation.mutate({ requestId: approveStudentTarget.id, file: approveStudentFile });
    setApproveStudentTarget(null);
    setApproveStudentFile(null);
  };

  const pendingAny =
    approveInstructorMutation.isPending ||
    rejectInstructorMutation.isPending ||
    approveStudentMutation.isPending ||
    rejectStudentMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Payouts</h1>
            <p className="text-muted-foreground mt-1">Process instructor earnings withdrawals and student referral balance withdrawals.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              pendingInstructorQuery.refetch();
              pendingStudentQuery.refetch();
            }}
            disabled={pendingInstructorQuery.isFetching || pendingStudentQuery.isFetching}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'instructors' | 'students')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="instructors" className="gap-2"><GraduationCap className="h-4 w-4" /> Instructors</TabsTrigger>
            <TabsTrigger value="students" className="gap-2"><Banknote className="h-4 w-4" /> Students (referral)</TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Input
                placeholder={tab === 'instructors' ? 'Search instructor, method…' : 'Search student email, method…'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Badge variant="outline" className="w-fit self-start sm:self-center">
              {tab === 'instructors' ? `${filteredInstructors.length} pending` : `${filteredStudents.length} pending`}
            </Badge>
          </div>

          <TabsContent value="instructors" className="mt-4 space-y-3">
            {pendingInstructorQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {pendingInstructorQuery.isError && <p className="text-sm text-destructive">Failed to load payout requests.</p>}
            {!pendingInstructorQuery.isLoading && !pendingInstructorQuery.isError && filteredInstructors.length === 0 && (
              <Card><CardContent className="py-10 text-center text-muted-foreground">No pending instructor payout requests.</CardContent></Card>
            )}
            {filteredInstructors.map((r) => (
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
                  {toDetailEntries(r.payoutDetailsJson).length > 0 && (
                    <div className="rounded-md border bg-muted/20 p-3 space-y-1">
                      {toDetailEntries(r.payoutDetailsJson).map((entry) => (
                        <div key={entry.key} className="flex justify-between gap-3 text-xs">
                          <span className="text-muted-foreground">{entry.key}</span>
                          <span className="font-medium text-right break-all">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {r.hasReceipt && (
                      <Button variant="outline" size="sm" onClick={() => setPreviewId(r.id)}>
                        <ImageIcon className="h-4 w-4 mr-2" /> View receipt
                      </Button>
                    )}
                    <Button variant="accent" size="sm" disabled={pendingAny} onClick={() => setApproveInstructorTarget(r)}>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                    </Button>
                    <Button variant="destructive" size="sm" disabled={pendingAny} onClick={() => setRejectInstructorTarget(r)}>
                      <XCircle className="h-4 w-4 mr-2" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="students" className="mt-4 space-y-3">
            {pendingStudentQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {pendingStudentQuery.isError && <p className="text-sm text-destructive">Failed to load student withdrawals.</p>}
            {!pendingStudentQuery.isLoading && !pendingStudentQuery.isError && filteredStudents.length === 0 && (
              <Card><CardContent className="py-10 text-center text-muted-foreground">No pending student referral withdrawals.</CardContent></Card>
            )}
            {filteredStudents.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {r.student?.email ?? ([r.student?.firstName, r.student?.lastName].filter(Boolean).join(' ') || 'Student')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.methodOption?.name ?? r.methodOption?.type ?? 'Method'} · ETB {r.amount.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={r.status === 'RECEIPT_ISSUE' ? 'destructive' : 'secondary'} className="w-fit">
                      {r.status ?? 'PENDING'}
                    </Badge>
                  </div>
                  {r.status === 'RECEIPT_ISSUE' && (
                    <p className="text-xs text-destructive">
                      Student reported receipt issue. Please upload corrected receipt and approve again.
                    </p>
                  )}
                  {r.receiptIssueMessage && (
                    <p className="text-xs text-muted-foreground">
                      Reported issue: {r.receiptIssueMessage}
                    </p>
                  )}
                  {toDetailEntries(r.payoutDetailsJson).length > 0 && (
                    <div className="rounded-md border bg-muted/20 p-3 space-y-1">
                      {toDetailEntries(r.payoutDetailsJson).map((entry) => (
                        <div key={entry.key} className="flex justify-between gap-3 text-xs">
                          <span className="text-muted-foreground">{entry.key}</span>
                          <span className="font-medium text-right break-all">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {r.receiptUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pendingAny}
                        onClick={() => {
                          setPreviewType('student');
                          setPreviewId(r.id);
                        }}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" /> View current receipt
                      </Button>
                    )}
                    <Button variant="accent" size="sm" disabled={pendingAny} onClick={() => setApproveStudentTarget(r)}>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Approve & upload receipt
                    </Button>
                    <Button variant="destructive" size="sm" disabled={pendingAny} onClick={() => setRejectStudentTarget(r)}>
                      <XCircle className="h-4 w-4 mr-2" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <Dialog open={!!previewId} onOpenChange={(open) => !open && setPreviewId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader><DialogTitle>{previewType === 'student' ? 'Receipt preview (student withdrawal)' : 'Receipt preview (instructor)'}</DialogTitle></DialogHeader>
            <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/30 rounded-md p-4">
              {previewLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {!previewLoading && previewUrl && (
                previewMime?.includes('pdf') ? (
                  <iframe title="Receipt preview" src={previewUrl} className="w-full h-[70vh] rounded border bg-background" />
                ) : (
                  <img src={previewUrl} alt="Receipt" className="max-w-full max-h-[70vh] object-contain rounded border" />
                )
              )}
              {!previewLoading && !previewUrl && previewId && <p className="text-sm text-muted-foreground">Could not load receipt.</p>}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!approveInstructorTarget} onOpenChange={(open) => !open && setApproveInstructorTarget(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Approve instructor payout</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Upload the transfer receipt after you pay the instructor.</p>
              <Input type="file" accept="image/*,application/pdf" onChange={(e) => setApproveInstructorFile(e.target.files?.[0] ?? null)} />
              {approveInstructorFile && (
                <div className="rounded-md border p-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate">{approveInstructorFile.name}</p>
                    <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => setApproveInstructorFile(null)}>
                      Remove
                    </Button>
                  </div>
                  {approveInstructorPreviewUrl && (
                    approveInstructorPreviewMime?.includes('pdf') ? (
                      <iframe title="Instructor receipt preview" src={approveInstructorPreviewUrl} className="w-full h-40 rounded border bg-background" />
                    ) : (
                      <img src={approveInstructorPreviewUrl} alt="Instructor receipt preview" className="max-h-40 w-full object-contain rounded border" />
                    )
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setApproveInstructorTarget(null)} disabled={approveInstructorMutation.isPending}>Cancel</Button>
                <Button variant="accent" onClick={handleApproveInstructor} disabled={approveInstructorMutation.isPending}>
                  {approveInstructorMutation.isPending ? 'Approving…' : 'Approve'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!rejectInstructorTarget} onOpenChange={(open) => !open && setRejectInstructorTarget(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Reject instructor payout</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={rejectInstructorReason} onChange={(e) => setRejectInstructorReason(e.target.value)} placeholder="Reason (optional)" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRejectInstructorTarget(null)} disabled={rejectInstructorMutation.isPending}>Cancel</Button>
                <Button
                  variant="destructive"
                  disabled={rejectInstructorMutation.isPending || !rejectInstructorTarget}
                  onClick={() => {
                    if (rejectInstructorTarget) {
                      rejectInstructorMutation.mutate({ requestId: rejectInstructorTarget.id, reason: rejectInstructorReason || undefined });
                      setRejectInstructorTarget(null);
                      setRejectInstructorReason('');
                    }
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!approveStudentTarget} onOpenChange={(open) => !open && setApproveStudentTarget(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Approve student referral withdrawal</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Pay the student using their selected method, then upload a corrected receipt. If current receipt is already correct, you can approve without uploading a new one.
              </p>
              {approveStudentTarget?.receiptUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (approveStudentTarget) {
                      setPreviewType('student');
                      setPreviewId(approveStudentTarget.id);
                    }
                  }}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Preview current receipt
                </Button>
              )}
              <Input type="file" accept="image/*,application/pdf" onChange={(e) => setApproveStudentFile(e.target.files?.[0] ?? null)} />
              {approveStudentFile && (
                <div className="rounded-md border p-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate">{approveStudentFile.name}</p>
                    <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => setApproveStudentFile(null)}>
                      Remove
                    </Button>
                  </div>
                  {approveStudentPreviewUrl && (
                    approveStudentPreviewMime?.includes('pdf') ? (
                      <iframe title="Student receipt preview" src={approveStudentPreviewUrl} className="w-full h-40 rounded border bg-background" />
                    ) : (
                      <img src={approveStudentPreviewUrl} alt="Student receipt preview" className="max-h-40 w-full object-contain rounded border" />
                    )
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setApproveStudentTarget(null)} disabled={approveStudentMutation.isPending}>Cancel</Button>
                <Button variant="accent" onClick={handleApproveStudent} disabled={approveStudentMutation.isPending}>
                  {approveStudentMutation.isPending ? 'Approving…' : 'Approve'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!rejectStudentTarget} onOpenChange={(open) => !open && setRejectStudentTarget(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Reject student withdrawal</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={rejectStudentReason} onChange={(e) => setRejectStudentReason(e.target.value)} placeholder="Reason (optional)" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRejectStudentTarget(null)} disabled={rejectStudentMutation.isPending}>Cancel</Button>
                <Button
                  variant="destructive"
                  disabled={rejectStudentMutation.isPending || !rejectStudentTarget}
                  onClick={() => {
                    if (rejectStudentTarget) {
                      rejectStudentMutation.mutate({ requestId: rejectStudentTarget.id, reason: rejectStudentReason || undefined });
                      setRejectStudentTarget(null);
                      setRejectStudentReason('');
                    }
                  }}
                >
                  Reject
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
