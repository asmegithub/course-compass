import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { getApprovedCourses, getCourseById, createEnrollment, getReferralBalance, initializeChapaPayment, getActivePaymentAccounts, submitPaymentProofForCourse, getMyCourseEnrollment } from '@/lib/course-api';
import { formatPrice } from '@/lib/formatters';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Banknote, Loader2, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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
  const [paymentMethod, setPaymentMethod] = useState<'CHAPA' | 'MANUAL'>('CHAPA');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [receiptPreviewMime, setReceiptPreviewMime] = useState<string | null>(null);
  const [note, setNote] = useState<string>('');
  const receiptPreviewRef = useRef<string | null>(null);

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
  const isStudent = isLoggedIn && (user?.role === 'STUDENT' || user?.role === 'ROLE_STUDENT');

  const referralBalanceQuery = useQuery({
    queryKey: ['referral-balance'],
    queryFn: getReferralBalance,
    enabled: Boolean(isLoggedIn && user?.role === 'STUDENT'),
  });
  const paymentAccountsQuery = useQuery({
    queryKey: ['payment-accounts', 'active'],
    queryFn: getActivePaymentAccounts,
  });

  const myEnrollmentQuery = useQuery({
    queryKey: ['my-course-enrollment', course?.id, user?.id],
    queryFn: () => getMyCourseEnrollment(course!.id),
    enabled: Boolean(course?.id) && isStudent,
  });

  const referralBalance = referralBalanceQuery.data?.balance ?? 0;
  const coursePrice = course ? Number(course.discountPrice ?? course.price ?? 0) : 0;
  const isAlreadyEnrolled = Boolean(myEnrollmentQuery.data?.id);
  const canUseBalance = isStudent && !isAlreadyEnrolled && referralBalance >= coursePrice && coursePrice > 0;

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

  const payWithChapaMutation = useMutation({
    mutationFn: async () => {
      if (!isStudent) {
        throw new Error('Instructor accounts can add to cart/wishlist, but cannot enroll in courses.');
      }
      if (myEnrollmentQuery.data?.id) {
        throw new Error('You are already enrolled in this course.');
      }
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
      {
        if (!isStudent) {
          throw new Error('Instructor accounts can add to cart/wishlist, but cannot enroll in courses.');
        }
        if (myEnrollmentQuery.data?.id) {
          throw new Error('You are already enrolled in this course.');
        }
        return createEnrollment({
          courseId: course!.id,
          useBalance: true,
          referrerId: referrerId ?? undefined,
        });
      },
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

  const manualSubmitMutation = useMutation({
    mutationFn: async () => {
      if (!isStudent) throw new Error('Only student accounts can enroll in courses.');
      if (myEnrollmentQuery.data?.id) throw new Error('You are already enrolled in this course.');
      if (!course?.id) throw new Error('Course not found');
      if (!selectedAccountId) throw new Error('Please select a payment account');
      if (!receiptFile) throw new Error('Please upload your receipt');
      return submitPaymentProofForCourse({
        courseId: course.id,
        paymentAccountId: selectedAccountId,
        amount: String(coursePrice),
        currency: course.currency ?? 'ETB',
        note: note || undefined,
        file: receiptFile,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Receipt submitted',
        description: 'Your receipt is pending admin review. You will be enrolled after approval.',
      });
      setReceiptFile(null);
      setSelectedAccountId('');
      setNote('');
      navigate('/dashboard/payments');
    },
    onError: (err: Error) => {
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (!receiptFile) {
      if (receiptPreviewRef.current) URL.revokeObjectURL(receiptPreviewRef.current);
      receiptPreviewRef.current = null;
      setReceiptPreviewUrl(null);
      setReceiptPreviewMime(null);
      return;
    }
    if (receiptPreviewRef.current) URL.revokeObjectURL(receiptPreviewRef.current);
    const url = URL.createObjectURL(receiptFile);
    receiptPreviewRef.current = url;
    setReceiptPreviewUrl(url);
    setReceiptPreviewMime(receiptFile.type || null);
    return () => {
      if (receiptPreviewRef.current) URL.revokeObjectURL(receiptPreviewRef.current);
      receiptPreviewRef.current = null;
    };
  }, [receiptFile]);

  function clearReferralStorage() {
    try {
      if (localStorage.getItem(REFERRAL_COURSE_KEY) === course?.id) {
        localStorage.removeItem(REFERRAL_STORAGE_KEY);
        localStorage.removeItem(REFERRAL_COURSE_KEY);
      }
    } catch (_) {}
  }

  const isLoading = courseByIdQuery.isLoading || coursesQuery.isLoading || myEnrollmentQuery.isLoading;
  const notFound = !isLoading && !course;
  const mustLogin = !isLoggedIn;

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
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              const redirectTo = `/courses/${slugValue}/checkout${location.search}`;
              try {
                localStorage.setItem('postLoginRedirect', redirectTo);
              } catch {
                // ignore storage errors
              }
              navigate(`/auth?redirect=${encodeURIComponent(redirectTo)}`);
            }}
          >
            Sign in
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (isAlreadyEnrolled) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-16">
          <p className="text-muted-foreground">You are already enrolled in this course.</p>
          <Button className="mt-4" onClick={() => navigate(`/courses/${slugValue}/learn`, { replace: true })}>
            Continue learning
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const pending = useBalanceMutation.isPending || payWithChapaMutation.isPending || manualSubmitMutation.isPending;

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
                  onClick={() => {
                    if (!isStudent) {
                      toast({
                        title: 'Enrollment not allowed',
                        description: 'Instructor accounts can add to cart/wishlist, but cannot enroll in courses.',
                        variant: 'destructive',
                      });
                      return;
                    }
                    useBalanceMutation.mutate();
                  }}
              >
                {useBalanceMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Banknote className="h-4 w-4 mr-2" />
                )}
                Complete with referral balance
              </Button>
            ) : (
              <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'CHAPA' | 'MANUAL')} className="space-y-3">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="CHAPA">Pay with Chapa</TabsTrigger>
                  <TabsTrigger value="MANUAL">Manual Payment</TabsTrigger>
                </TabsList>

                <TabsContent value="CHAPA" className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={pending}
                    onClick={() => {
                      if (!isStudent) {
                        toast({
                          title: 'Enrollment not allowed',
                          description: 'Instructor accounts can add to cart/wishlist, but cannot enroll in courses.',
                          variant: 'destructive',
                        });
                        return;
                      }
                      payWithChapaMutation.mutate();
                    }}
                  >
                    {payWithChapaMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Pay with Chapa (card, mobile money, etc.)
                  </Button>
                </TabsContent>

                <TabsContent value="MANUAL" className="space-y-3">
                  <div className="space-y-3 rounded-lg border p-3 sm:p-4">
                    <p className="text-sm text-muted-foreground">
                      Transfer <span className="font-medium">{formatPrice(coursePrice, course.currency ?? 'ETB')}</span> to one of the accounts below, then upload receipt.
                    </p>
                    <div className="space-y-2">
                      <Label>Select account</Label>
                      {paymentAccountsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading accounts…</p>}
                      {!paymentAccountsQuery.isLoading && (paymentAccountsQuery.data ?? []).length === 0 && (
                        <p className="text-sm text-muted-foreground">No active payment accounts available right now.</p>
                      )}
                      <div className="space-y-2">
                        {(paymentAccountsQuery.data ?? []).map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => setSelectedAccountId(acc.id)}
                            className={[
                              "w-full text-left rounded-md border p-3 hover:bg-muted/50 transition",
                              selectedAccountId === acc.id ? "border-primary bg-muted/40" : "border-border",
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium truncate">{acc.providerName}</p>
                                <p className="text-xs text-muted-foreground">{acc.type}</p>
                              </div>
                              <div className="text-right">
                                {acc.accountNumber && <p className="text-sm font-mono">{acc.accountNumber}</p>}
                                {acc.ussdCode && <p className="text-xs text-muted-foreground">{acc.ussdCode}</p>}
                              </div>
                            </div>
                            {(acc.accountName || acc.instructions) && (
                              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                {acc.accountName && <p><span className="font-medium">Name:</span> {acc.accountName}</p>}
                                {acc.instructions && <p>{acc.instructions}</p>}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Receipt screenshot</Label>
                      <Input type="file" accept="image/*,application/pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)} />
                      {receiptFile && (
                        <div className="rounded-md border p-2 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground truncate">{receiptFile.name}</p>
                            <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => setReceiptFile(null)}>
                              Remove
                            </Button>
                          </div>
                          {receiptPreviewUrl && (
                            receiptPreviewMime?.includes('pdf') ? (
                              <iframe title="Selected receipt preview" src={receiptPreviewUrl} className="w-full h-40 rounded border bg-background" />
                            ) : (
                              <img src={receiptPreviewUrl} alt="Selected receipt preview" className="max-h-40 w-full object-contain rounded border" />
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Note (optional)</Label>
                      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Sender name / reference number" />
                    </div>

                    <Button
                      className="w-full"
                      variant="accent"
                      disabled={manualSubmitMutation.isPending || (paymentAccountsQuery.data ?? []).length === 0}
                      onClick={() => {
                        if (!isStudent) {
                          toast({
                            title: 'Enrollment not allowed',
                            description: 'Instructor accounts can add to cart/wishlist, but cannot enroll in courses.',
                            variant: 'destructive',
                          });
                          return;
                        }
                        manualSubmitMutation.mutate();
                      }}
                    >
                      {manualSubmitMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        'Submit receipt for approval'
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Admin will approve/reject your receipt. If rejected, you can resubmit from Payment History.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Chapa: pay online instantly. Manual: transfer and upload receipt for admin approval.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
