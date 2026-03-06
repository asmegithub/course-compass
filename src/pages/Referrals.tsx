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

const Referrals = () => {
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.referralCode || '';
  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = referralCode ? `${siteOrigin}/auth?ref=${referralCode}` : '';

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Your referral link
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Share this link. When someone signs up using it, you may earn rewards (when the program is active).
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
