import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { getApprovedCourses, getCourseById, createPayment, createEnrollment, getReferralBalance, initializeChapaPayment } from '@/lib/course-api';
import { formatPrice } from '@/lib/formatters';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Banknote, Loader2, ArrowLeft } from 'lucide-react';

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const REFERRAL_STORAGE_KEY = 'referralRef';
const REFERRAL_COURSE_KEY = 'referralCourseId';

const Checkout = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const slugValue = slug || '';
  const isUuidSlug = isUuid(slugValue);

  const [useBalance, setUseBalance] = useState(false);

  const courseByIdQuery = useQuery({
    queryKey: ['course', slugValue],
    queryFn: () => getCourseById(slugValue),
    enabled: Boolean(slugValue) && isUuidSlug,
  });

  const coursesQuery = useQuery({
    queryKey: ['courses', 'approved'],
    queryFn: getApprovedCourses,
    enabled: Boolean(slugValue) && !isUuidSlug,
  });

  const course = isUuidSlug ? courseByIdQuery.data : coursesQuery.data?.find((c) => c.slug === slugValue);

  const referralBalanceQuery = useQuery({
    queryKey: ['referral-balance'],
    queryFn: getReferralBalance,
    enabled: Boolean(isLoggedIn && user?.role === 'STUDENT'),
  });

  const referralBalance = referralBalanceQuery.data?.balance ?? 0;
  const coursePrice = course ? Number(course.discountPrice ?? course.price ?? 0) : 0;
  const canUseBalance = isLoggedIn && user?.role === 'STUDENT' && referralBalance >= coursePrice && coursePrice > 0;

  const referrerId = useMemo(() => {
    if (!course?.id) return null;
    const fromUrl = searchParams.get('ref');
    try {
      const fromStorage = localStorage.getItem(REFERRAL_STORAGE_KEY);
      const storedCourse = localStorage.getItem(REFERRAL_COURSE_KEY);
      const id = fromUrl || (storedCourse === course.id ? fromStorage : null);
      return id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
    } catch {
      return fromUrl && /^[0-9a-f-]{36}$/i.test(fromUrl) ? fromUrl : null;
    }
  }, [searchParams, course?.id]);

  const payWithTestMutation = useMutation({
    mutationFn: async () => {
      if (!course?.id) throw new Error('Course not found');
      const payment = await createPayment({
        courseId: course.id,
        amount: coursePrice,
        currency: course.currency ?? 'ETB',
        gateway: 'TEST',
        status: 'COMPLETED',
      });
      return createEnrollment({
        courseId: course.id,
        paymentId: payment.id,
        referrerId: referrerId ?? undefined,
      });
    },
    onSuccess: () => {
      clearReferralStorage();
      queryClient.invalidateQueries({ queryKey: ['referral-balance'] });
      queryClient.invalidateQueries({ queryKey: ['my-course-enrollment', course?.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'approved'] });
      toast({ title: 'Enrollment successful!', description: 'You can now start learning.' });
      navigate(`/courses/${slugValue}/learn`, { replace: true });
    },
    onError: (err: Error) => {
      toast({ title: 'Checkout failed', description: err.message, variant: 'destructive' });
    },
  });

  const payWithChapaMutation = useMutation({
    mutationFn: async () => {
      if (!course?.id) throw new Error('Course not found');
      const res = await initializeChapaPayment({
        courseId: course.id,
        slug: slugValue,
        referrerId: referrerId ?? undefined,
      });
      return res;
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: (err: Error) => {
      toast({ title: 'Chapa payment failed', description: err.message, variant: 'destructive' });
    },
  });

  const useBalanceMutation = useMutation({
    mutationFn: () =>
      createEnrollment({
        courseId: course!.id,
        useBalance: true,
        referrerId: referrerId ?? undefined,
      }),
    onSuccess: () => {
      clearReferralStorage();
      queryClient.invalidateQueries({ queryKey: ['referral-balance'] });
      queryClient.invalidateQueries({ queryKey: ['my-course-enrollment', course?.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'approved'] });
      toast({ title: 'Enrolled with referral balance!', description: 'You can now start learning.' });
      navigate(`/courses/${slugValue}/learn`, { replace: true });
    },
    onError: (err: Error) => {
      toast({ title: 'Enrollment failed', description: err.message, variant: 'destructive' });
    },
  });

  function clearReferralStorage() {
    try {
      if (localStorage.getItem(REFERRAL_COURSE_KEY) === course?.id) {
        localStorage.removeItem(REFERRAL_STORAGE_KEY);
        localStorage.removeItem(REFERRAL_COURSE_KEY);
      }
    } catch (_) {}
  }

  const isLoading = courseByIdQuery.isLoading || coursesQuery.isLoading;
  const notFound = !isLoading && !course;
  const mustLogin = !isLoggedIn || user?.role !== 'STUDENT';

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading checkout...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-16">
          <p className="text-muted-foreground">Course not found.</p>
          <Button variant="outline" asChild className="mt-4">
            <Link to="/courses">Browse courses</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (mustLogin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-16">
          <p className="text-muted-foreground">Please sign in as a student to enroll.</p>
          <Button variant="outline" asChild className="mt-4">
            <Link to={`/auth?redirect=${encodeURIComponent(`/courses/${slugValue}/checkout`)}`}>Sign in</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const pending = payWithTestMutation.isPending || useBalanceMutation.isPending || payWithChapaMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-2xl py-8">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
          <Link to={`/courses/${slugValue}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to course
          </Link>
        </Button>

        <h1 className="font-display text-2xl font-bold mb-6">Checkout</h1>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-24 h-16 object-cover rounded-lg shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{course.title}</p>
                <p className="text-lg font-bold mt-1">
                  {formatPrice(coursePrice, course.currency)}
                </p>
              </div>
            </div>

            {canUseBalance && (
              <label className="flex items-center gap-2 cursor-pointer text-sm border rounded-lg p-3">
                <Checkbox
                  checked={useBalance}
                  onCheckedChange={(c) => setUseBalance(Boolean(c))}
                />
                <span>Use my referral balance ({formatPrice(referralBalance, course.currency)})</span>
              </label>
            )}

            {useBalance ? (
              <Button
                className="w-full"
                size="lg"
                disabled={pending}
                onClick={() => useBalanceMutation.mutate()}
              >
                {useBalanceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Banknote className="h-4 w-4 mr-2" />
                )}
                Complete with referral balance
              </Button>
            ) : (
              <>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={pending}
                  onClick={() => payWithChapaMutation.mutate()}
                >
                  {payWithChapaMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Pay with Chapa (card, mobile money, etc.)
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  disabled={pending}
                  onClick={() => payWithTestMutation.mutate()}
                >
                  {payWithTestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Pay with Test (no real charge)
                </Button>
              </>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Chapa: pay with card or mobile money. Test mode: no real charge, enrollment created immediately.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
