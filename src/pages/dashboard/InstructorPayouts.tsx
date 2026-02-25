import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Landmark, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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

  const handleRequestPayout = () => {
    if (!payoutAmount || Number(payoutAmount) <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
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
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Payouts</h1>
          <p className="text-muted-foreground text-sm mt-1">Request withdrawals and view payout history.</p>
        </div>

        {/* Balance cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Available Balance', value: formatPrice(availableBalance), icon: DollarSign },
            { label: 'Pending Payouts', value: formatPrice(pendingAmount), icon: Clock },
            { label: 'Total Withdrawn', value: formatPrice(totalWithdrawn), icon: CheckCircle },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-5 pb-4">
                <s.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-2xl font-bold font-display">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Request payout form */}
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="MOBILE_MONEY">Mobile Money (Telebirr)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {payoutMethod === 'BANK_TRANSFER' && (
                <>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Select value={bankName} onValueChange={setBankName}>
                      <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Commercial Bank of Ethiopia">Commercial Bank of Ethiopia</SelectItem>
                        <SelectItem value="Awash Bank">Awash Bank</SelectItem>
                        <SelectItem value="Dashen Bank">Dashen Bank</SelectItem>
                        <SelectItem value="Bank of Abyssinia">Bank of Abyssinia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input placeholder="Enter account number" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} />
                  </div>
                </>
              )}
              {payoutMethod === 'MOBILE_MONEY' && (
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+251 9XX XXX XXXX" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Amount (ETB)</Label>
                <Input type="number" min={100} placeholder="Min. 100 ETB" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} />
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Payouts are processed within 3-5 business days. Minimum withdrawal is ETB 100.</span>
              </div>
              <Button className="w-full" onClick={handleRequestPayout} disabled={payoutMutation.isPending || isEarningsLoading}>
                {payoutMutation.isPending ? 'Requesting...' : 'Request Payout'}
              </Button>
            </CardContent>
          </Card>

          {/* Payout history */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Payout History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isPayoutsLoading && <p className="text-sm text-muted-foreground">Loading payout history...</p>}
              {!isPayoutsLoading && myPayouts.length === 0 && <p className="text-sm text-muted-foreground">No payout history yet.</p>}
              {!isPayoutsLoading && myPayouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div>
                    <p className="font-semibold text-sm">{formatPrice(p.amount)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.paymentMethod.replace(/_/g, ' ')} · {formatDate(p.requestedAt || p.createdAt)}</p>
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
      </div>
    </DashboardLayout>
  );
};

export default InstructorPayouts;
