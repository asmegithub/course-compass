import { useSearchParams, useParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getPayment } from '@/lib/course-api';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';

const CheckoutSuccess = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const slugValue = slug || '';

  const paymentQuery = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => getPayment(paymentId!),
    enabled: Boolean(paymentId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED') return false;
      return 2000;
    },
    refetchIntervalInBackground: true,
  });

  const payment = paymentQuery.data;
  const isCompleted = payment?.status === 'COMPLETED';
  const isLoading = paymentQuery.isLoading || (Boolean(paymentId) && !payment && !paymentQuery.isError);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container max-w-lg py-12">
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            {isLoading && !payment && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Confirming your payment...</p>
              </div>
            )}
            {(isCompleted || (payment && payment.status !== 'PENDING')) && (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h1 className="text-xl font-semibold mb-2">Payment successful</h1>
                <p className="text-muted-foreground mb-6">
                  You are enrolled. You can start learning now.
                </p>
                <Button asChild size="lg">
                  <Link to={`/courses/${slugValue}/learn`}>Go to course</Link>
                </Button>
              </>
            )}
            {!paymentId && !isLoading && (
              <>
                <p className="text-muted-foreground mb-4">No payment information found.</p>
                <Button variant="outline" asChild>
                  <Link to="/courses">Browse courses</Link>
                </Button>
              </>
            )}
            {paymentQuery.isError && paymentId && !payment && (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h1 className="text-xl font-semibold mb-2">Thank you</h1>
                <p className="text-muted-foreground mb-6">
                  If you completed payment, you should be enrolled. Check your dashboard or go to the course.
                </p>
                <Button asChild size="lg">
                  <Link to={`/courses/${slugValue}/learn`}>Go to course</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutSuccess;
