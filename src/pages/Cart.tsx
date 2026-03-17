import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { createManualCartOrder, getActivePaymentAccounts, getApprovedCourses, initializeChapaPayment, submitPaymentProofForOrder } from '@/lib/course-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, ArrowLeft, ShoppingCart } from 'lucide-react';
import type { Course } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const Cart = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cartSlugs, removeFromCart, setCartSlugs } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'CHAPA' | 'MANUAL'>('CHAPA');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [note, setNote] = useState<string>('');

  const coursesQuery = useQuery({
    queryKey: ['courses', 'approved'],
    queryFn: getApprovedCourses,
  });

  const paymentAccountsQuery = useQuery({
    queryKey: ['payment-accounts', 'active'],
    queryFn: getActivePaymentAccounts,
  });

  const cartCourses: Course[] = useMemo(() => {
    const all = coursesQuery.data || [];
    if (!cartSlugs.length) return [];
    // Preserve order of slugs in cart
    const bySlug = new Map(all.map((c) => [c.slug, c]));
    return cartSlugs
      .map((slug) => bySlug.get(slug))
      .filter((c): c is Course => Boolean(c));
  }, [coursesQuery.data, cartSlugs]);

  const handleRemove = (slug: string) => {
    removeFromCart(slug);
  };

  const handleGoToCheckout = (slug: string) => {
    navigate(`/courses/${slug}/checkout`);
  };

  const checkoutAllMutation = useMutation({
    mutationFn: async () => {
      const courseIds = cartCourses.map((c) => c.id);
      if (courseIds.length === 0) throw new Error('Cart is empty');
      return initializeChapaPayment({
        courseIds,
        slug: 'cart',
        referrerId: undefined,
      });
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: (err: Error) => {
      toast({ title: 'Checkout failed', description: err.message, variant: 'destructive' });
    },
  });

  const manualSubmitMutation = useMutation({
    mutationFn: async () => {
      const courseIds = cartCourses.map((c) => c.id);
      if (courseIds.length === 0) throw new Error('Cart is empty');
      if (!selectedAccountId) throw new Error('Please select an account');
      if (!receiptFile) throw new Error('Please upload a receipt screenshot');

      const order = await createManualCartOrder({ courseIds });
      if (!order.id) throw new Error('Failed to create order');

      return submitPaymentProofForOrder({
        orderId: order.id,
        paymentAccountId: selectedAccountId,
        amount: String(total),
        currency,
        note: note || undefined,
        file: receiptFile,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Receipt submitted',
        description: 'Your enrollment will be approved by admin after verification.',
      });
      setCartSlugs([]);
      setReceiptFile(null);
      setSelectedAccountId('');
      setNote('');
      navigate('/dashboard/payments');
    },
    onError: (err: Error) => {
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    },
  });

  const total = cartCourses.reduce((sum, course) => {
    const price = Number(course.discountPrice ?? course.price ?? 0);
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  const currency = cartCourses[0]?.currency ?? 'ETB';

  const isStudent = isLoggedIn && (user?.role === 'STUDENT' || user?.role === 'ROLE_STUDENT');

  if (!isLoggedIn || !isStudent) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-16">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to="/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to courses
            </Link>
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Cart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Please sign in as a student to manage your cart and proceed to checkout.
              </p>
              <Button onClick={() => navigate('/auth?redirect=/cart')}>Sign in</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const loading = coursesQuery.isLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-6 lg:py-8 max-w-5xl">
        <Button variant="ghost" className="mb-4" asChild>
          <Link to="/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to courses
          </Link>
        </Button>

        <h1 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Your Cart
        </h1>

        {loading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading your cart...</span>
          </div>
        )}

        {!loading && cartCourses.length === 0 && (
          <Card>
            <CardContent className="py-10 flex flex-col items-center gap-3">
              <ShoppingCart className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Your cart is empty.</p>
              <Button asChild>
                <Link to="/courses">Browse courses</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && cartCourses.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(360px,2fr)]">
            <div className="space-y-4">
              {cartCourses.map((course) => {
                const price = Number(course.discountPrice ?? course.price ?? 0);
                return (
                  <Card key={course.id} className="overflow-hidden">
                    <div className="flex gap-4 p-4 sm:p-5">
                      {course.thumbnail && (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-28 h-20 rounded-md object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="font-display text-base font-semibold line-clamp-2">
                          {course.title}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-display text-base font-bold">
                            {formatPrice(price, course.currency ?? 'ETB')}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => course.slug && handleGoToCheckout(course.slug)}
                              disabled={!course.slug}
                            >
                              Checkout
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => course.slug && handleRemove(course.slug)}
                              disabled={!course.slug}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="h-fit lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Courses</span>
                  <span>{cartCourses.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Total</span>
                  <span>{formatPrice(total, currency)}</span>
                </div>
                <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'CHAPA' | 'MANUAL')} className="space-y-3">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="CHAPA" className="px-2 text-xs sm:text-sm">
                      Pay with Chapa
                    </TabsTrigger>
                    <TabsTrigger value="MANUAL" className="px-2 text-xs sm:text-sm">
                      Manual (Receipt)
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="CHAPA" className="space-y-3">
                    <Button
                      className="w-full"
                      disabled={cartCourses.length === 0 || checkoutAllMutation.isPending}
                      onClick={() => checkoutAllMutation.mutate()}
                    >
                      {checkoutAllMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redirecting to payment…
                        </>
                      ) : cartCourses.length === 1 ? (
                        'Checkout'
                      ) : (
                        'Pay for all courses'
                      )}
                    </Button>
                    {cartCourses.length > 1 && (
                      <p className="text-xs text-muted-foreground">
                        Pay once for all {cartCourses.length} courses in a single transaction.
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="MANUAL" className="space-y-3">
                    <div className="space-y-3 rounded-lg border p-3 sm:p-4">
                      <p className="text-sm text-muted-foreground">
                        Transfer <span className="font-medium">{formatPrice(total, currency)}</span> to one of the accounts below, then upload your receipt screenshot.
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
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                        />
                        <p className="text-xs text-muted-foreground">Upload a clear screenshot/photo of the transfer receipt.</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Note (optional)</Label>
                        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Sender name / reference number" />
                      </div>

                      <Button
                        className="w-full"
                        variant="accent"
                        disabled={manualSubmitMutation.isPending || cartCourses.length === 0 || (paymentAccountsQuery.data ?? []).length === 0}
                        onClick={() => manualSubmitMutation.mutate()}
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
                        Enrollment is granted after admin verifies your receipt.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cart;

