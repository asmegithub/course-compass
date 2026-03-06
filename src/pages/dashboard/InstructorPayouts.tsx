import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Landmark, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  getMyInstructorEarning,
  getMyInstructorBankDetails,
  getMyInstructorPayoutRequests,
  requestInstructorPayout,
} from '@/lib/course-api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { createPayout, getInstructorEarnings, getPayouts } from '@/lib/course-api';
import { formatPrice } from '@/lib/formatters';

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

const InstructorPayouts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [payoutMethod, setPayoutMethod] = useState('BANK_TRANSFER');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string>('');

  const earningQuery = useQuery({ queryKey: ['instructor-earning'], queryFn: getMyInstructorEarning });
  const bankDetailsQuery = useQuery({ queryKey: ['instructor-bank-details'], queryFn: getMyInstructorBankDetails });
  const payoutRequestsQuery = useQuery({ queryKey: ['instructor-payout-requests'], queryFn: getMyInstructorPayoutRequests });

  const requestPayoutMutation = useMutation({
    mutationFn: () => requestInstructorPayout(Number(payoutAmount), selectedBankId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-earning'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-payout-requests'] });
      toast({ title: 'Payout requested', description: 'Your request will be processed within 3-5 business days.' });
      setPayoutAmount('');
      setSelectedBankId('');
    },
    onError: (err: Error) => {
      toast({ title: 'Request failed', description: err.message, variant: 'destructive' });
    },
  });

  const earning = earningQuery.data ?? null;
  const bankDetails = bankDetailsQuery.data ?? [];
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
      const [bankName, setBankName] = useState('Commercial Bank of Ethiopia');
  const [accountNumber, setAccountNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const { data: earningRows = [], isLoading: isEarningsLoading } = useQuery({
    queryKey: ['instructor-earnings'],
    queryFn: getInstructorEarnings,
    enabled: Boolean(user?.id),
  });

  const { data: payouts = [], isLoading: isPayoutsLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: getPayouts,
    enabled: Boolean(user?.id),
  });

  const earningRow = earningRows.find((row) => row.instructorUserId === user?.id) || null;
  const availableBalance = earningRow?.currentBalance || 0;

  const myPayouts = payouts
    .filter((payout) => {
      if (!user?.id) return false;
      if (payout.instructorUserId === user.id) return true;
      if (earningRow?.instructorProfileId && payout.instructorProfileId === earningRow.instructorProfileId) return true;
      return false;
    })
    .sort((left, right) => new Date(right.requestedAt || right.createdAt || 0).getTime() - new Date(left.requestedAt || left.createdAt || 0).getTime());

  const pendingAmount = myPayouts
    .filter((payout) => payout.status === 'PENDING')
    .reduce((sum, payout) => sum + payout.amount, 0);
  const totalWithdrawn = earningRow?.totalWithdrawn || myPayouts
    .filter((payout) => payout.status === 'COMPLETED')
    .reduce((sum, payout) => sum + payout.amount, 0);

  const payoutMutation = useMutation({
    mutationFn: createPayout,
    onSuccess: () => {
      toast({
        title: 'Payout requested',
        description: `Your payout request of ${formatPrice(Number(payoutAmount || 0))} was submitted successfully.`,
      });
      setPayoutAmount('');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-earnings'] });
    },
    onError: (error) => {
      toast({
        title: 'Payout request failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });
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
    if (payoutMethod === 'bank' && bankDetails.length > 0 && !selectedBankId) {
      toast({ title: 'Please select a bank account', variant: 'destructive' });
      return;
    }
     if (Number(payoutAmount) < 100) {
      toast({ title: 'Invalid amount', description: 'Minimum withdrawal amount is ETB 100.', variant: 'destructive' });
      return;
    }
    if (Number(payoutAmount) > availableBalance) {
      toast({ title: 'Insufficient balance', description: `Your available balance is ${formatPrice(availableBalance)}.`, variant: 'destructive' });
      return;
    }
    if (!earningRow?.instructorProfileId) {
      toast({
        title: 'Instructor profile not ready',
        description: 'Your instructor earnings profile is not available yet. Please contact support.',
        variant: 'destructive',
      });
      return;
    }
    if (payoutMethod === 'BANK_TRANSFER' && (!bankName || !accountNumber)) {
      toast({ title: 'Missing bank details', description: 'Please provide bank name and account number.', variant: 'destructive' });
      return;
    }
    if (payoutMethod === 'MOBILE_MONEY' && !phoneNumber) {
      toast({ title: 'Missing phone number', description: 'Please provide your mobile money number.', variant: 'destructive' });
      return;
    }

    const paymentDetails = payoutMethod === 'BANK_TRANSFER'
      ? JSON.stringify({ bankName, accountNumber })
      : JSON.stringify({ provider: 'Telebirr', phoneNumber });

    payoutMutation.mutate({
      instructorProfileId: earningRow.instructorProfileId,
      amount: Number(payoutAmount),
      currency: 'ETB',
      paymentMethod: payoutMethod,
      paymentDetails,
    });
    requestPayoutMutation.mutate();
  };

  const isLoading = earningQuery.isLoading || bankDetailsQuery.isLoading;

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
                    <Label>Payout Method</Label>
                    <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="mobile">Mobile Money (Telebirr)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {payoutMethod === 'bank' && bankDetails.length > 0 && (
                    <div className="space-y-2">
                      <Label>Bank Account</Label>
                      <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankDetails.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.bankName ?? 'Bank'} · {b.accountNumber ?? b.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {payoutMethod === 'bank' && bankDetails.length === 0 && (
                    <p className="text-sm text-muted-foreground">Add a bank account in Settings to request payouts.</p>
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
                    disabled={requestPayoutMutation.isPending || (payoutMethod === 'bank' && bankDetails.length > 0 && !selectedBankId)}
                  >
                    {requestPayoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request Payout'}
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
                      <div key={p.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                        <div>
                          <p className="font-semibold text-sm">ETB {p.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {p.bankDetail?.bankName ?? 'Bank'} · {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                          </p>
                        </div>
                        <Badge variant={p.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-xs">
                          {p.status === 'COMPLETED' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                          {p.status}
                        </Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorPayouts;
