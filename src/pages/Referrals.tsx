import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Gift, Copy, Check, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getReferralBalance, getMyWithdrawals } from '@/lib/course-api';

const Referrals = () => {
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.referralCode || '';
  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = referralCode ? `${siteOrigin}/auth?ref=${referralCode}` : '';

  const balanceQuery = useQuery({
    queryKey: ['referral-balance'],
    queryFn: getReferralBalance,
    enabled: Boolean(isLoggedIn),
  });

  const withdrawalsQuery = useQuery({
    queryKey: ['referral-withdrawals'],
    queryFn: getMyWithdrawals,
    enabled: Boolean(isLoggedIn),
  });

  const balance = balanceQuery.data?.balance ?? 0;
  const totalEarned = balanceQuery.data?.totalEarned ?? 0;
  const totalWithdrawn = balanceQuery.data?.totalWithdrawn ?? 0;
  const withdrawals = withdrawalsQuery.data ?? [];

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Referral link copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy failed', description: 'Please copy the link manually.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-12 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold text-foreground">Refer & Earn</h1>
          <p className="text-muted-foreground mt-2">
            Share BeteGubae with friends. When they sign up with your link, you both benefit.
          </p>
        </div>

        {isLoggedIn && referralCode ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Your referral link
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Share this link. When someone signs up using it, you may earn rewards.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input readOnly value={referralLink} className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Your code: <strong>{referralCode}</strong></p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="py-5">
                  <p className="text-xs text-muted-foreground">Current balance</p>
                  <p className="text-xl font-display font-bold mt-1">
                    {balanceQuery.isLoading ? '...' : `ETB ${balance.toFixed(2)}`}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-5">
                  <p className="text-xs text-muted-foreground">Total earned</p>
                  <p className="text-xl font-display font-bold mt-1">
                    {balanceQuery.isLoading ? '...' : `ETB ${totalEarned.toFixed(2)}`}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-5">
                  <p className="text-xs text-muted-foreground">Total withdrawn</p>
                  <p className="text-xl font-display font-bold mt-1">
                    {balanceQuery.isLoading ? '...' : `ETB ${totalWithdrawn.toFixed(2)}`}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent referral withdrawals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {withdrawalsQuery.isLoading && (
                  <p className="text-sm text-muted-foreground">Loading withdrawals...</p>
                )}
                {!withdrawalsQuery.isLoading && withdrawals.length === 0 && (
                  <p className="text-sm text-muted-foreground">No withdrawals yet.</p>
                )}
                {!withdrawalsQuery.isLoading && withdrawals.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">ETB {Number(request.amount || 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {request.createdAt ? new Date(request.createdAt).toLocaleString() : '—'}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted">{request.status || 'PENDING'}</span>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full mt-2">
                  <Link to="/dashboard/referral-withdrawals">Manage withdrawals</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : isLoggedIn ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">You don’t have a referral code yet. Contact support or check back later.</p>
              <Button asChild variant="accent" className="mt-4">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Sign in to get your personal referral link and start earning.</p>
              <Button asChild variant="accent" className="mt-4">
                <Link to="/auth">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <p><strong>How it works:</strong> Share your link with friends. When they create an account and enroll in a course, referral rewards may apply. Terms and conditions apply.
        </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Referrals;
