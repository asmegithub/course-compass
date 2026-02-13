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

const payoutHistory = [
  { id: '1', amount: 15200, method: 'Bank Transfer', bank: 'CBE', date: '2026-01-15', status: 'COMPLETED' },
  { id: '2', amount: 12500, method: 'Bank Transfer', bank: 'Awash Bank', date: '2026-01-01', status: 'COMPLETED' },
  { id: '3', amount: 8700, method: 'Bank Transfer', bank: 'CBE', date: '2026-02-01', status: 'PENDING' },
  { id: '4', amount: 5000, method: 'Mobile Money', bank: 'Telebirr', date: '2025-12-15', status: 'COMPLETED' },
  { id: '5', amount: 9200, method: 'Bank Transfer', bank: 'CBE', date: '2025-12-01', status: 'COMPLETED' },
];

const InstructorPayouts = () => {
  const [payoutMethod, setPayoutMethod] = useState('bank');
  const [payoutAmount, setPayoutAmount] = useState('');

  const handleRequestPayout = () => {
    if (!payoutAmount || Number(payoutAmount) <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }
    if (Number(payoutAmount) > 26500) {
      toast({ title: 'Insufficient balance', description: 'Your available balance is ETB 26,500.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Payout requested', description: `ETB ${Number(payoutAmount).toLocaleString()} will be processed within 3-5 business days.` });
    setPayoutAmount('');
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
            { label: 'Available Balance', value: 'ETB 26,500', icon: DollarSign, color: 'text-primary' },
            { label: 'Pending Payouts', value: 'ETB 8,700', icon: Clock, color: 'text-yellow-600' },
            { label: 'Total Withdrawn', value: 'ETB 98,500', icon: CheckCircle, color: 'text-green-600' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-5 pb-4">
                <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
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
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="mobile">Mobile Money (Telebirr)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {payoutMethod === 'bank' && (
                <>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Select defaultValue="cbe">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cbe">Commercial Bank of Ethiopia</SelectItem>
                        <SelectItem value="awash">Awash Bank</SelectItem>
                        <SelectItem value="dashen">Dashen Bank</SelectItem>
                        <SelectItem value="abyssinia">Bank of Abyssinia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input placeholder="Enter account number" />
                  </div>
                </>
              )}
              {payoutMethod === 'mobile' && (
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+251 9XX XXX XXXX" />
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
              <Button className="w-full" onClick={handleRequestPayout}>Request Payout</Button>
            </CardContent>
          </Card>

          {/* Payout history */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Payout History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payoutHistory.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div>
                    <p className="font-semibold text-sm">ETB {p.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.method} · {p.bank} · {p.date}</p>
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
